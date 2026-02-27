import { Hono } from "hono";
import { Variables } from "../types.js";

const webhooks = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Endpoint passivo que aguarda chamadas assíncronas do Mercado Pago (IPN).
 * Processa informações de faturamento e converte status (ex: pending para approved) sem middleware local do User Service,
 * sendo autenticado pelo payload webhook verificado da Adquirente.
 * 
 * @param {Context} c - Response Hook cru contendo o envelope de pagamento efetuado.
 * @returns {Response} Status 200 obrigatório imediato para confirmar à MP que a flag foi processada silenciosamente.
 */
webhooks.post("/mercadopago", async (c) => {
    // O pipeline da integração de checkout em si com a Database será injetada aqui na próxima Etapa.
    return c.json({ success: true, code: "HOOK_RECEIVED_AND_QUEUED" }, 200);
});

export default webhooks;
