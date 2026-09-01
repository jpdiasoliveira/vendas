# Contrato da API (Worker)

Referência alinhada ao código em `src/worker/`. Produto: [`PRD.md`](PRD.md). Autorização por papel: [`agents/roles-matrix.md`](agents/roles-matrix.md).

**Envelope padrão (JSON):**

```json
{ "success": true, "data": <T> }
{ "success": false, "error": "mensagem" }
```

**Exceções:** `GET /api/admin/newsletter-subscribers/export.csv` retorna `text/csv` (sem envelope). Webhook MP retorna JSON próprio.

**Tipos:** `src/contracts/schema.ts`, `src/contracts/storePublicProfile.ts`. Schemas Zod: `src/schemas/`, `src/worker/schemas/`.

---

## Headers

| Header | Obrigatório | Uso |
|--------|-------------|-----|
| `x-store-slug` | Sim*, exceto rotas listadas abaixo | Identifica o tenant (loja). Em produção também pode vir de subdomínio ou domínio customizado. |
| `Content-Type` | Sim em POST/PATCH/PUT com body | `application/json` |
| `Authorization` | Rotas admin, `/api/me/*`, `/api/platform/*`, pedidos do cliente logado | `Bearer <JWT Supabase>` |
| `Idempotency-Key` | **Obrigatório** em `POST /api/orders` | UUID — evita pedidos duplicados (também aceito no body como `idempotencyKey` ou header `X-Idempotency-Key`) |
| `x-platform-create-store-secret` | Opcional | Se `PLATFORM_CREATE_STORE_SECRET` estiver definido no Worker, obrigatório em `POST /api/platform/stores` |

\*Rotas **sem** `x-store-slug`: `/api/health`, `/api/login`, `/api/webhooks/*`, `/api/platform/*`, `/api/me/*`.

---

## Globais

| Método | Path | Auth | Resposta `data` |
|--------|------|------|-----------------|
| GET | `/api/health` | — | `{ ok: true, timestamp: number }` |

---

## Auth

| Método | Path | Body | Resposta `data` | Notas |
|--------|------|------|-----------------|-------|
| POST | `/api/login` | `{ email, password }` | `{ access_token, refresh_token, user? }` | Proxy Supabase; rate limit 20/min/IP; **sem** store |

---

## Sessão (staff)

| Método | Path | Auth | Resposta `data` |
|--------|------|------|-----------------|
| GET | `/api/me/staff-stores` | Bearer JWT | `{ stores: Array<{ storeId, slug, displayName, role }> }` |

Usado após login para listar lojas do usuário (painel admin). Não exige `x-store-slug`.

---

## Vitrine — produtos

| Método | Path | Resposta `data` |
|--------|------|-----------------|
| GET | `/api/products` | `Product[]` |
| GET | `/api/products/trending` | `string[]` (IDs dos produtos mais vendidos) |

---

## Vitrine — loja pública

| Método | Path | Body | Resposta `data` |
|--------|------|------|-----------------|
| GET | `/api/store/settings` | — | `StoreSettings` (nome, logo, tema, `publicProfile`, `capabilities`, etc.) |
| POST | `/api/store/newsletter/subscribe` | `{ email }` | `{ ok: true }` |

---

## Vitrine — frete e cupom

| Método | Path | Body | Resposta `data` |
|--------|------|------|-----------------|
| POST | `/api/shipping/quote` | `{ cep?: string }` | `{ deliverable: boolean, cep?, fee?, label?, message? }` |
| POST | `/api/coupons/validate` | `{ code?, items: CartItemPayload[] }` | `{ valid: boolean, subtotal, discountAmount?, code?, error? }` |

Preços do cupom usam o **mesmo** cálculo de subtotal do `POST /api/orders`.

---

## Vitrine — pedidos (cliente)

Auth: `GET /api/orders` exige JWT. `POST /api/orders` e pagamento aceitam guest conforme `publicProfile.requireLoginToCheckout`.

### `POST /api/orders`

**Headers:** `Idempotency-Key` (UUID) **obrigatório** (ou `idempotencyKey` no body / `X-Idempotency-Key`).

**Body (campos principais):**

```json
{
  "items": [{ "id", "name", "price", "quantity", "image?", "imageUrl?" }],
  "customerName": "string | null",
  "customerPhone": "string (obrigatório)",
  "deliveryAddress": "string (obrigatório)",
  "shippingPostalCode": "string CEP (obrigatório)",
  "couponCode": "string | null",
  "guestEmail": "string (obrigatório se guest checkout)"
}
```

Aliases aceitos: `customer_phone`, `delivery_address`, `shipping_postal_code`, `coupon_code`, `guest_email`.

**Resposta `data`:** `{ orderId, status: "pending", total, idempotent?: boolean }` — `201` ou `200` se idempotente.

**Regras:** preços validados no servidor; pedido mínimo; estoque via RPC.

### `POST /api/orders/:id/payment`

**Body:** `{ payment_method: "pix" | "credit_card", guestEmail? }`

| Método | Resposta `data` (PIX) |
|--------|------------------------|
| `pix` | `{ orderId, pixCode, qrCodeBase64, copyPaste, payment_method: "pix", status }` |

| Método | Resposta `data` (cartão) |
|--------|---------------------------|
| `credit_card` | `{ orderId, payment_method: "credit_card", init_point }` (URL Checkout Pro) |

Só pedidos com `status === "pending"`. `409` se pagamento MP já iniciado.

### `GET /api/orders`

**Auth:** JWT obrigatório. **Resposta:** `Order[]` do usuário na loja.

### `GET /api/orders/:id`

**Auth:** JWT opcional; guest usa `?guestEmail=` (ou `guest_email`).

**Resposta:** `Order` + `items: OrderItem[]` (equivalente a `OrderDetail`).

---

## Webhooks

| Método | Path | Auth | Resposta |
|--------|------|------|----------|
| POST | `/api/webhooks/mercadopago` | Assinatura MP (quando configurado) | `{ received: true }` — chamado pelo Mercado Pago |

---

## Admin da loja

Todas exigem `Authorization` + `x-store-slug` + membro em `store_members`.

Legenda de gate: **staff** = qualquer membro; **admin/owner** = role `admin` ou `owner`; **owner** = só `owner`.

### Sessão e settings

| Método | Path | Gate | Body / query | Resposta `data` |
|--------|------|------|--------------|-----------------|
| GET | `/api/admin/me` | staff | — | `{ id, role }` |
| GET | `/api/admin/settings` | admin/owner | — | `StoreSettings` |
| PATCH | `/api/admin/settings` | admin/owner | `displayName?, logoUrl?, bannerUrl?, primaryColor?, minimumOrderValue?, theme?, publicProfile?` | `StoreSettings` |
| POST | `/api/admin/upload` | admin/owner | `multipart/form-data` (`file` / `image`) | `{ publicUrl }` |
| GET | `/api/admin/audit-logs` | admin/owner | `?search=&action=&actions=` (csv) | `AuditLog[]` |

### Mercado Pago da loja

| Método | Path | Gate | Body | Resposta `data` |
|--------|------|------|------|-----------------|
| GET | `/api/admin/store/payments` | owner | — | flags (token configurado, etc.) |
| PATCH | `/api/admin/store/payments` | owner | `{ mpAccessToken?, mpPublicKey? }` | flags |
| POST | `/api/admin/store/payments/test` | owner | `{ mpAccessToken? }` | `{ ok: true, mpUserId?, nickname? }` |

### Categorias

| Método | Path | Gate | Body | Resposta `data` |
|--------|------|------|------|-----------------|
| GET | `/api/admin/categories` | staff | — | `Category[]` |
| POST | `/api/admin/categories` | staff | `{ name, slug?, sort_order? }` | `Category` |
| PATCH | `/api/admin/categories/:id` | staff | `{ name?, slug?, sort_order? }` | `Category` |
| DELETE | `/api/admin/categories/:id` | staff | — | `{ id }` |

### Produtos

| Método | Path | Gate | Body | Resposta `data` |
|--------|------|------|------|-----------------|
| GET | `/api/admin/products` | staff | — | `Product[]` |
| POST | `/api/admin/products` | staff | `{ title, price, description?, image_url?, category_id?, stock?, status?, priceWholesale?, minQuantityWholesale? }` | `Product` — `403` se limite do plano |
| PUT | `/api/admin/products/:id` | staff | campos parciais + `featured_on_home?` | `{ id }` |
| DELETE | `/api/admin/products/:id` | admin/owner | — | `{ id }` |

### Pedidos

| Método | Path | Gate | Body | Resposta `data` |
|--------|------|------|------|-----------------|
| GET | `/api/admin/orders` | staff | — | `Order[]` |
| GET | `/api/admin/orders/:id` | staff | — | `OrderDetail` |
| PATCH | `/api/admin/orders/:id/status` | staff* | `{ status, cancellationReason? }` | `{ status }` |
| PATCH | `/api/admin/orders/:id/tracking` | staff | `{ trackingCode?, shippingMethod? }` | `{ ok: true }` |
| POST | `/api/admin/orders/:id/sync-payment` | admin/owner | — | `{ message, mpStatus, resultKind, order?, outcome? }` |

\*Cancelar pedido já pago/enviado: **admin/owner** + `cancellationReason` obrigatório.

**Status aceitos:** `pending`, `paid`, `approved`, `shipped`, `delivered`, `cancelled`.

### Newsletter (admin)

| Método | Path | Gate | Query | Resposta |
|--------|------|------|-------|----------|
| GET | `/api/admin/newsletter-subscribers` | admin/owner | `limit`, `offset` | `{ items, total, limit, offset }` |
| GET | `/api/admin/newsletter-subscribers/export.csv` | admin/owner | — | arquivo CSV (não JSON) |

### Frete — faixas de CEP

| Método | Path | Gate | Body | Resposta `data` |
|--------|------|------|------|-----------------|
| GET | `/api/admin/shipping-fare-bands` | staff | — | `ShippingFareBand[]` |
| POST | `/api/admin/shipping-fare-bands` | staff | `{ cep_from, cep_to, amount_brl, label? }` | `ShippingFareBand` |
| PATCH | `/api/admin/shipping-fare-bands/:id` | staff | campos parciais | `ShippingFareBand` |
| DELETE | `/api/admin/shipping-fare-bands/:id` | staff | — | `{ id }` |

`cep_from` / `cep_to`: CEP com 8 dígitos (string mascarada ou número). Faixas sobrepostas retornam `400`.

### Cupons

| Método | Path | Gate | Body | Resposta `data` |
|--------|------|------|------|-----------------|
| GET | `/api/admin/coupons` | staff | — | `StoreCoupon[]` |
| POST | `/api/admin/coupons` | staff | `{ code, discount_type, discount_value, valid_from?, valid_until, active? }` | `StoreCoupon` |
| PATCH | `/api/admin/coupons/:id` | staff | campos parciais | `StoreCoupon` |
| DELETE | `/api/admin/coupons/:id` | staff | — | `{ id }` |

`discount_type`: `percent` \| `fixed`. Código único por loja (case-insensitive). Duplicata → `409`.

---

## Central plataforma

Todas exigem `Authorization` + e-mail em `PLATFORM_OPERATOR_EMAILS`. **Sem** `x-store-slug`.

| Método | Path | Body / query | Resposta `data` |
|--------|------|--------------|-----------------|
| GET | `/api/platform/runtime-settings` | — | `{ subscriptionGraceDays }` |
| PATCH | `/api/platform/runtime-settings` | `{ subscriptionGraceDays }` | `{ subscriptionGraceDays }` |
| GET | `/api/platform/stores` | — | lista de lojas |
| POST | `/api/platform/stores` | ver abaixo | `{ id, slug, displayName, subscriptionWarning? }` |
| POST | `/api/platform/stores/:storeId/domains` | `{ domains: string[], setPrimaryFirst? }` | `{ ok: true }` |
| GET | `/api/platform/analytics/overview` | — | métricas agregadas (MRR, GMV, etc.) |
| GET | `/api/platform/analytics/store-ranking` | `?limit=` (default 15) | ranking de lojas |
| GET | `/api/platform/analytics/new-stores-weekly` | `?weeks=` (default 8) | séries semanais |
| GET | `/api/platform/plans-catalog` | — | catálogo de planos e versões |
| PUT | `/api/platform/plan-price-versions/:versionId/entitlements` | `{ entitlements: [...] }` | `{ ok: true }` |

### `POST /api/platform/stores` — body

```json
{
  "slug": "minha-loja",
  "displayName": "Minha Loja",
  "ownerAdminName": "Nome",
  "ownerAdminEmail": "admin@example.com",
  "planSlug": "tier_base | tier_standard | tier_unlimited",
  "customDomains": ["loja.exemplo.com"],
  "sendPasswordSetupLink": false,
  "initialPassword": "opcional"
}
```

Cria loja, `store_settings`, membro `owner`, assinatura e opcionalmente domínios. `409` se slug ou e-mail duplicado.

---

## Tipos de domínio (resumo)

Definidos em `src/contracts/schema.ts`:

| Tipo | Uso |
|------|-----|
| `Product` | Catálogo |
| `Category` | Categorias admin |
| `ShippingFareBand` | Faixa de frete por CEP (admin) |
| `StoreCoupon` | Cupom de desconto (admin) |
| `Order` | Pedido (campos `customer*`, `guestCheckoutEmail`, frete, cupom, pagamento MP) |
| `OrderItem` | Linha do pedido |
| `OrderDetail` | `Order` + `items[]` |
| `CartItemPayload` | Item do carrinho no checkout |
| `StoreSettings` | Config da loja + `publicProfile` + `capabilities` |
| `StoreCapabilities` | Limites do plano (`maxProducts`, etc.) |
| `NewsletterSubscribersPage` | Lista paginada admin |
| `ApiSuccess<T>` / `ApiError` | Envelope TypeScript |

Perfil público da vitrine: `StorePublicProfile` em `src/contracts/storePublicProfile.ts`.

---

## Status HTTP comuns

| Código | Quando |
|--------|--------|
| 400 | Validação Zod, regra de negócio, CEP inválido |
| 401 | JWT ausente/inválido, login obrigatório no checkout |
| 403 | Sem membro na loja, role insuficiente, limite do plano |
| 404 | Pedido/produto/loja não encontrado no tenant |
| 409 | Conflito (slug duplicado, pagamento já iniciado) |
| 429 | Rate limit em `/api/login` |
| 500 | Erro interno (mensagem genérica ao cliente) |

---

## Exemplos curl (teste manual)

Pré-requisitos locais:

```bash
npm run dev          # Vite :5173 (proxy /api → Worker)
npx wrangler dev     # Worker :8787
```

Use a URL do Worker (`8787`) ou do Vite (`5173`) — ambas funcionam para `/api/*` em dev.

### Variáveis (bash / Git Bash)

```bash
BASE="http://localhost:8787"
STORE="demo-store"                    # mesmo valor de VITE_DEFAULT_STORE_SLUG
EMAIL="admin@example.com"             # usuário com acesso à loja demo
PASSWORD="sua-senha"
PRODUCT_ID=""                         # preencher após GET /api/products
ORDER_ID=""                           # preencher após POST /api/orders
TOKEN=""                              # preencher após login
```

### Variáveis (PowerShell)

```powershell
$BASE = "http://localhost:8787"
$STORE = "demo-store"
$EMAIL = "admin@example.com"
$PASSWORD = "sua-senha"
```

Dica: no PowerShell, prefira `curl.exe` (evita o alias `Invoke-WebRequest`). Para JSON em POST, `-d '{...}'` funciona; em bodies grandes use arquivo `@body.json`.

---

### 1. Health

```bash
curl -s "$BASE/api/health" | jq .
```

---

### 2. Login e token

```bash
curl -s -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
```

Resposta esperada: `{ "success": true, "data": { "access_token", "refresh_token", "user" } }`.

Com `jq`:

```bash
TOKEN=$(curl -s -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.data.access_token')
echo "$TOKEN"
```

PowerShell (extrair token manualmente ou com `ConvertFrom-Json`):

```powershell
$r = curl.exe -s -X POST "$BASE/api/login" -H "Content-Type: application/json" -d "{`"email`":`"$EMAIL`",`"password`":`"$PASSWORD`"}"
$TOKEN = ($r | ConvertFrom-Json).data.access_token
```

---

### 3. Lojas do staff (sem `x-store-slug`)

```bash
curl -s "$BASE/api/me/staff-stores" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### 4. Vitrine — catálogo e settings

```bash
# Produtos públicos
curl -s "$BASE/api/products" -H "x-store-slug: $STORE" | jq .

# Mais vendidos (IDs)
curl -s "$BASE/api/products/trending" -H "x-store-slug: $STORE" | jq .

# Configuração da loja (tema, perfil público, capabilities)
curl -s "$BASE/api/store/settings" -H "x-store-slug: $STORE" | jq .
```

Capturar um `PRODUCT_ID` da lista:

```bash
PRODUCT_ID=$(curl -s "$BASE/api/products" -H "x-store-slug: $STORE" | jq -r '.data[0].id')
echo "$PRODUCT_ID"
```

---

### 5. Frete e cupom

```bash
# Cotação de frete por CEP
curl -s -X POST "$BASE/api/shipping/quote" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -d '{"cep":"01310100"}' | jq .

# Validar cupom (preços devem bater com o catálogo)
curl -s -X POST "$BASE/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -d "{
    \"code\": \"PROMO10\",
    \"items\": [{\"id\":\"$PRODUCT_ID\",\"name\":\"Produto demo\",\"price\":29.9,\"quantity\":1}]
  }" | jq .
```

---

### 6. Checkout guest — criar pedido

Substitua `price` pelo valor real retornado em `GET /api/products` (o servidor revalida).

```bash
IDEM=$(uuidgen 2>/dev/null || python -c "import uuid; print(uuid.uuid4())")

curl -s -X POST "$BASE/api/orders" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -H "Idempotency-Key: $IDEM" \
  -d "{
    \"items\": [{
      \"id\": \"$PRODUCT_ID\",
      \"name\": \"Produto demo\",
      \"price\": 29.9,
      \"quantity\": 1
    }],
    \"customerName\": \"Cliente Teste\",
    \"customerPhone\": \"11999990000\",
    \"deliveryAddress\": \"Rua Exemplo, 100 - São Paulo\",
    \"shippingPostalCode\": \"01310100\",
    \"guestEmail\": \"cliente@example.com\"
  }" | jq .
```

```bash
ORDER_ID=$(curl -s -X POST "$BASE/api/orders" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d "{...}" | jq -r '.data.orderId')
```

Repetir o mesmo `Idempotency-Key` deve retornar `200` com `idempotent: true` (sem duplicar pedido).

---

### 7. Pagamento PIX

Requer token MP da loja configurado. Só para pedidos `pending`.

```bash
curl -s -X POST "$BASE/api/orders/$ORDER_ID/payment" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -d '{"payment_method":"pix","guestEmail":"cliente@example.com"}' | jq .
```

Cartão (Checkout Pro):

```bash
curl -s -X POST "$BASE/api/orders/$ORDER_ID/payment" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -d '{"payment_method":"credit_card","guestEmail":"cliente@example.com"}' | jq .
```

---

### 8. Consultar pedido (guest ou logado)

```bash
# Guest — e-mail na query
curl -s "$BASE/api/orders/$ORDER_ID?guestEmail=cliente@example.com" \
  -H "x-store-slug: $STORE" | jq .

# Cliente logado
curl -s "$BASE/api/orders" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" | jq .

curl -s "$BASE/api/orders/$ORDER_ID" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### 9. Newsletter (vitrine)

```bash
curl -s -X POST "$BASE/api/store/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -d '{"email":"newsletter@example.com"}' | jq .
```

---

### 10. Admin da loja

```bash
# Quem sou na loja (role)
curl -s "$BASE/api/admin/me" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Listar pedidos
curl -s "$BASE/api/admin/orders" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Detalhe do pedido
curl -s "$BASE/api/admin/orders/$ORDER_ID" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Atualizar status (ex.: enviado)
curl -s -X PATCH "$BASE/api/admin/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"shipped"}' | jq .

# Rastreio
curl -s -X PATCH "$BASE/api/admin/orders/$ORDER_ID/tracking" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"trackingCode":"BR123456789BR","shippingMethod":"Correios"}' | jq .

# Sincronizar pagamento com Mercado Pago (admin/owner)
curl -s -X POST "$BASE/api/admin/orders/$ORDER_ID/sync-payment" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Criar produto (staff):

```bash
curl -s -X POST "$BASE/api/admin/products" \
  -H "Content-Type: application/json" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Novo produto via API",
    "price": 49.9,
    "description": "Teste manual",
    "stock": 10,
    "status": "active"
  }' | jq .
```

Upload de imagem (multipart):

```bash
curl -s -X POST "$BASE/api/admin/upload" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./public/quadro1.jpg.jpeg" | jq .
```

Newsletter admin (CSV — salva arquivo, não JSON):

```bash
curl -s "$BASE/api/admin/newsletter-subscribers/export.csv" \
  -H "x-store-slug: $STORE" \
  -H "Authorization: Bearer $TOKEN" \
  -o newsletter-subscribers.csv
```

---

### 11. Central plataforma

E-mail do JWT deve estar em `PLATFORM_OPERATOR_EMAILS` no Worker. **Sem** `x-store-slug`.

```bash
# Overview
curl -s "$BASE/api/platform/analytics/overview" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Listar lojas
curl -s "$BASE/api/platform/stores" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Catálogo de planos
curl -s "$BASE/api/platform/plans-catalog" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Criar loja (com secret opcional):

```bash
curl -s -X POST "$BASE/api/platform/stores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-platform-create-store-secret: SEU_SECRET_SE_CONFIGURADO" \
  -d '{
    "slug": "loja-teste-api",
    "displayName": "Loja Teste API",
    "ownerAdminName": "Owner Teste",
    "ownerAdminEmail": "owner-teste@example.com",
    "planSlug": "tier_base",
    "sendPasswordSetupLink": true
  }' | jq .
```

---

### 12. Erros comuns em dev

| Sintoma | Causa provável |
|---------|----------------|
| `Loja não encontrada` / 404 store | `x-store-slug` incorreto ou loja não seedada (`docs/supabase-setup-admin-demo-store.sql`) |
| `Token de acesso ausente` | Falta `Authorization: Bearer` em rota protegida |
| `Telefone é obrigatório` | Body do pedido incompleto |
| `Idempotency-Key` ausente | Header ou `idempotencyKey` UUID obrigatório em `POST /api/orders` |
| `Preço do produto inválido` | `price` no body não bate com o catálogo |
| `403` em plataforma | E-mail não está em `PLATFORM_OPERATOR_EMAILS` |
| Connection refused | `wrangler dev` não está rodando na porta 8787 |

---

## Manutenção

Ao alterar rotas ou payloads:

1. Atualizar **este arquivo**
2. Atualizar `src/contracts/` e schemas Zod
3. Se mudança de produto, revisar [`PRD.md`](PRD.md)

Última revisão: alinhada ao Worker + PRD do sistema Vendas (multi-loja).
