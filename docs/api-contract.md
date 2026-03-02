# Contrato da API (Worker)

Referência rápida: **método**, **path**, **headers obrigatórios**, **body** (quando aplicável) e **tipo da resposta**. Todas as respostas de sucesso do tipo padrão vêm no envelope `{ success: true, data: T }`; em erro, `{ success: false, error: string }`. Exceções indicadas abaixo.

---

## Headers comuns

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `x-store-slug` | Sim (exceto rotas em "Sem store") | Slug da loja (ex.: `natfoods`). |
| `Content-Type` | Sim (POST/PUT/PATCH) | `application/json`. |
| `Authorization` | Sim (apenas `/api/admin/*`) | `Bearer <JWT>` (Supabase Auth). |

---

## Rotas

### Produtos

| Método | Path | Resposta `data` | Observação |
|--------|------|------------------|------------|
| GET | `/api/products` | `Product[]` | Lista produtos da loja. |

### Pedidos (cliente)

| Método | Path | Body | Resposta `data` | Observação |
|--------|------|------|------------------|------------|
| POST | `/api/orders` | `{ items: CartItemPayload[] }` | `{ orderId: number, status: string, total: number }` | Cria pedido. |
| GET | `/api/orders` | — | `Order[]` | Lista pedidos do usuário na loja. |
| GET | `/api/orders/:id` | — | `Order` + `items: OrderItem[]` | Pedido com itens (equivalente a `OrderDetail`). |
| POST | `/api/orders/:id/payment` | `{ payment_method: string }` | Objeto com campos PIX (ex.: `qr_code`, `qr_code_base64`, `copy_paste`, etc.) | Inicia pagamento; método `pix` retorna QR/Copia e Cola. |

### Admin (requer `Authorization: Bearer <token>`)

| Método | Path | Body | Resposta `data` | Observação |
|--------|------|------|------------------|------------|
| GET | `/api/admin/products` | — | `Product[]` | Lista produtos. |
| PUT | `/api/admin/products/:id` | `{ price?, priceWholesale?, minQuantityWholesale?, stock? }` | `{ id: string }` | Atualiza produto. |
| GET | `/api/admin/orders` | — | `Order[]` | Lista pedidos da loja. |
| GET | `/api/admin/orders/:id` | — | `OrderDetail` | Pedido com itens. |
| PATCH | `/api/admin/orders/:id/status` | `{ status: string }` | `{ status: string }` | Atualiza status do pedido. |

### Auth (Mocha) — Sem store

| Método | Path | Resposta | Observação |
|--------|------|----------|------------|
| GET | `/api/oauth/google/redirect_url` | `{ success: true, data: { redirectUrl: string } }` | Padrão envelope. |
| POST | `/api/sessions` | `{ success: true, data: { ok: true } }` | Body: `{ code: string }`. |
| GET | `/api/users/me` | **Body direto:** `User \| null` (não usa envelope `{ success, data }`). | Exceção ao padrão. |
| GET | `/api/logout` | `{ success: true, data: { ok: true } }` | — |

### Outros

| Método | Path | Resposta `data` |
|--------|------|------------------|
| GET | `/api/health` | `{ ok: true, timestamp: number }` |
| POST | `/api/webhooks/mercadopago` | `{ received: true }` (chamado pelo Mercado Pago) |

---

## Tipos de domínio (schema)

Definidos em `src/worker/core/schema.ts` (e re-exportados em `src/react-app/types/index.ts`):

- **Store** — id, slug, displayName, status, createdAt, updatedAt  
- **Product** — id, storeId, name, description?, price, priceWholesale?, minQuantityWholesale?, imageUrl?, category?, stock?, createdAt?, updatedAt?  
- **Order** — id, storeId, userId, customerName?, status, total, paymentMethod?, paymentStatus?, createdAt, updatedAt?  
- **OrderItem** — id?, orderId, storeId, productId, productName, productImage?, quantity, price  
- **OrderDetail** — Order + `items: OrderItem[]`  
- **CartItemPayload** — id, name, price, quantity, image?, imageUrl?

Qualquer nova rota ou mudança de tipo deve ser refletida aqui e, se possível, nos tipos em `schema.ts`.
