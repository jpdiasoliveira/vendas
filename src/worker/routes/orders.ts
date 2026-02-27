import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { getSupabase } from "../core/supabase.js";
import { Variables } from "../types.js";

const orders = new Hono<{ Bindings: Env; Variables: Variables }>();

// Garante que todas as rotas neste módulo precisam de usuário autenticado
orders.use("*", authMiddleware);

/**
 * Cria um novo pedido transacional com os itens do carrinho em uma tabela relacional.
 * Opera isolado pelas chaves estrangeiras `user_id` da conta autenticada e `store_id` do Tenant.
 * 
 * @param {Context} c - O Payload do Request recebendo um Array de produtos via JSON.
 * @returns {Response} Código 201 indicando Pedido Gerado (Created) junto com o UUID nativo do pedido. Erro 500 para colisão transacional.
 */
orders.post("/", async (c) => {
    const user = c.get("user");
    const store = c.get("store");
    const body = await c.req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return c.json({ error: "Items array is required", code: "EMPTY_CART_PAYLOAD" }, 400);
    }

    // Precalcula o total - O ideal em produção é refazer o fetch da source of truth da listagem de preços.
    const total = body.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const supabase = getSupabase(c.env);

    try {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id: store.id,
                user_id: user.id,
                total: total,
                payment_method: body.payment_method || null,
                status: 'pending'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const mappedItems = body.items.map((item: any) => ({
            order_id: order.id,
            store_id: store.id,
            product_id: item.id,
            product_name: item.name || 'Produto',
            product_image: item.image_url || null,
            quantity: item.quantity,
            price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(mappedItems);

        if (itemsError) throw itemsError;

        return c.json({ orderId: order.id, status: "pending", total }, 201);
    } catch (error: any) {
        console.error("Order Creation Logic Error:", error);
        return c.json({ error: error.message || "Failed to create order", code: "DATABASE_INSERTION_FAILURE" }, 500);
    }
});

/**
 * Rota para confirmar processamento da seleção de checkout de um usuário.
 * Simula a renderização de instâncias ou redirects para o Checkout Transparente.
 * 
 * @param {Context} c - Recebe por query parameter (param id) com o id exato gerado na fase superior (`/api/orders/`).
 * @returns {Response} Parâmetros da adquirente (ex: qr_code do PIX/Boleto Link).
 */
orders.post("/:id/payment", async (c) => {
    const user = c.get("user");
    const store = c.get("store");
    const orderId = c.req.param("id");
    const body = await c.req.json();

    if (!body.payment_method) {
        return c.json({ error: "Payment method required", code: "MISSING_PAYMENT_ID" }, 400);
    }

    const supabase = getSupabase(c.env);

    const { data: order, error: findError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .single();

    if (findError || !order) return c.json({ error: "Pedido não encontrado", code: "ORDER_NOT_FOUND" }, 404);

    let qrCode = null;
    let qrCodeBase64 = null;
    let ticketUrl = null;
    let initPoint = null;

    if (body.payment_method === 'pix') {
        qrCode = "00020126440014br.gov.bcb.pix0122natfoods@example.com5204000053039865802BR5916NATFOODS ORG6009SAO PAULO62140510NATFOODSA16304EE89";
        qrCodeBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    } else if (body.payment_method === 'boleto') {
        ticketUrl = "https://www.mercadopago.com.br/sandbox/payments/123456789/ticket";
    } else if (body.payment_method === 'credit_card') {
        initPoint = "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123-456";
    }

    const { error: updateError } = await supabase
        .from('orders')
        .update({
            payment_method: body.payment_method,
            payment_status: 'pending',
            updated_at: new Date().toISOString()
        })
        .match({ id: orderId, store_id: store.id });

    if (updateError) {
        return c.json({ error: "Incapaz de registrar o método de pagamento", code: "PAYMENT_METHOD_SYNC_FAILED" }, 500);
    }

    return c.json({
        success: true,
        payment_method: body.payment_method,
        status: "pending",
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        init_point: initPoint
    }, 200);
});

/**
 * Resgata histórico de pedidos completo de um Consumidor naquela loja específica.
 * @param {Context} c - Fetch Contextualizado via Middleware.
 * @returns {Response} Código 200 com a Array retroativa dos pedidos mais antigos para os mais recentes.
 */
orders.get("/", async (c) => {
    const user = c.get("user");
    const store = c.get("store");
    const supabase = getSupabase(c.env);

    const { data: results, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

    if (error) {
        return c.json({ error: error.message, code: "HISTORY_FETCH_ERROR" }, 500);
    }

    return c.json(results, 200);
});

/**
 * Obtém atributos cirúrgicos e o array de items cruzados com um recibo em específico de uma store.
 * Valida a hierarquia combinando as Primary Keys e Foreign Keys para evitar vazamentos de informações por UUIDs paralelos.
 * 
 * @param {Context} c - Path param `:id`.
 * @returns {Response} Retorna chaves compostas injetadas de um único pedido ({...order, items[]}).
 */
orders.get("/:id", async (c) => {
    const user = c.get("user");
    const store = c.get("store");
    const orderId = c.req.param("id");
    const supabase = getSupabase(c.env);

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .single();

    if (orderError || !order) {
        return c.json({ error: "Order not found", code: "RECEIPT_NOT_FOUND" }, 404);
    }

    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .eq('store_id', store.id);

    if (itemsError) {
        return c.json({ error: "Order Items lookup corrupted", code: "RECEIPT_ITEMS_CORRUPTED" }, 500);
    }

    return c.json({ ...order, items }, 200);
});

export default orders;
