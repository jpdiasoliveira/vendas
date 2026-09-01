# Matriz de papéis — rotas × permissões

Referência de **autorização** alinhada ao Worker (`src/worker/`) e ao contrato HTTP [`api-contract.md`](../api-contract.md).

Personas de negócio: [`escopo-negocio.md`](../escopo-negocio.md) e PRD §3 em [`PRD.md`](../PRD.md).

**Persona ≠ role de login.** Ser `owner` de uma loja não concede acesso à Central plataforma; operador plataforma não herda permissões de `store_members`.

---

## Papéis considerados

| Papel | Onde é definido | Escopo |
|-------|-----------------|--------|
| **Guest** | Sem JWT na vitrine | Compra/consulta pedido guest (se loja permitir) |
| **Cliente** | JWT Supabase, sem `store_members` na loja | Vitrine + pedidos do próprio `user_id` |
| **Staff** | `store_members.role = 'staff'` | Admin da loja — operação (catálogo, pedidos) |
| **Admin** | `store_members.role = 'admin'` | Admin da loja — settings, newsletter, auditoria |
| **Owner** | `store_members.role = 'owner'` | Admin da loja — inclui credenciais Mercado Pago |
| **Operador** | E-mail em `PLATFORM_OPERATOR_EMAILS` | `/api/platform/*` (global, sem tenant) |

Middlewares principais: `verifyAuth` (admin), `verifyCustomerAuth` / `optionalCustomerAuth` (pedidos), `verifyPlatformOperator` (plataforma). Ver [`.agents/docs/security.md`](../../.agents/docs/security.md).

---

## Legenda das tabelas

| Símbolo | Significado |
|---------|-------------|
| **Pub** | Público — só `x-store-slug` (loja válida) |
| **✓** | Permitido |
| **—** | Bloqueado (401/403) |
| **◐** | Condicional — ver nota da seção |

**Regra global admin:** `/api/admin/*` exige `Authorization` + `x-store-slug` + linha em `store_members`. Sem membro → **403** “Você não tem acesso a esta loja”.

**UI ≠ API:** rotas sensíveis (settings, newsletter, auditoria) permanecem só no menu de **admin/owner**. **Staff** vê Frete e Cupons no menu (`useAdminNav`), alinhado à API.

---

## 1. Globais e auth

| Rota | Guest | Cliente | Staff | Admin | Owner | Operador |
|------|:-----:|:-------:|:-----:|:-----:|:-----:|:--------:|
| `GET /api/health` | Pub | Pub | Pub | Pub | Pub | Pub |
| `POST /api/login` | Pub | Pub | Pub | Pub | Pub | Pub |
| `GET /api/me/staff-stores` | — | ◐ | ◐ | ◐ | ◐ | ◐ |
| `POST /api/webhooks/mercadopago` | MP* | MP* | MP* | MP* | MP* | MP* |

\* Chamado pelo Mercado Pago (assinatura quando configurada), não por usuário humano.

◐ `/api/me/staff-stores`: JWT válido; retorna lojas em que o usuário é membro (pode ser `[]`).

---

## 2. Vitrine — catálogo, loja, frete, cupom

Todas exigem `x-store-slug` (ou subdomínio/domínio mapeado).

| Rota | Guest | Cliente | Staff | Admin | Owner | Operador |
|------|:-----:|:-------:|:-----:|:-----:|:-----:|:--------:|
| `GET /api/products` | Pub | Pub | Pub | Pub | Pub | Pub |
| `GET /api/products/trending` | Pub | Pub | Pub | Pub | Pub | Pub |
| `GET /api/products/by-slug/:slug` | Pub | Pub | Pub | Pub | Pub | Pub |
| `GET /api/store/settings` | Pub | Pub | Pub | Pub | Pub | Pub |
| `POST /api/store/newsletter/subscribe` | Pub | Pub | Pub | Pub | Pub | Pub |
| `POST /api/shipping/quote` | Pub | Pub | Pub | Pub | Pub | Pub |
| `POST /api/coupons/validate` | Pub | Pub | Pub | Pub | Pub | Pub |

`GET /api/products/by-slug/:slug`: produto inativo ou ausente → **404**.

---

## 3. Vitrine — pedidos (cliente)

| Rota | Guest | Cliente | Staff | Admin | Owner | Operador |
|------|:-----:|:-------:|:-----:|:-----:|:-----:|:--------:|
| `POST /api/orders` | ◐ | ✓ | ✓* | ✓* | ✓* | ✓* |
| `POST /api/orders/:id/payment` | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ |
| `GET /api/orders` | — | ✓ | —** | —** | —** | —** |
| `GET /api/orders/:id` | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ |

### Condições

| Rota | Regra |
|------|--------|
| `POST /api/orders` | Se `publicProfile.requireLoginToCheckout = true` → só cliente logado. Se `false` → guest com `guestEmail` válido. |
| `POST …/payment` | Dono do pedido: JWT do `user_id` **ou** `guestEmail` no body igual ao do pedido guest. |
| `GET /api/orders` | JWT obrigatório; lista pedidos do `user_id` na loja (não usa role admin). |
| `GET /api/orders/:id` | JWT do dono **ou** `?guestEmail=` correspondente ao pedido. |

\* Membro da loja logado na vitrine compra como cliente; para todos os pedidos da loja use `/api/admin/orders`.

\** Listagem administrativa → seção Admin — pedidos.

---

## 4. Admin — sessão, settings, Mercado Pago

JWT + `store_members` + `x-store-slug`.

| Rota | Staff | Admin | Owner |
|------|:-----:|:-----:|:-----:|
| `GET /api/admin/me` | ✓ | ✓ | ✓ |
| `GET /api/admin/settings` | — | ✓ | ✓ |
| `PATCH /api/admin/settings` | — | ✓ | ✓ |
| `POST /api/admin/upload` | — | ✓ | ✓ |
| `GET /api/admin/audit-logs` | — | ✓ | ✓ |
| `GET /api/admin/store/payments` | — | — | ✓ |
| `PATCH /api/admin/store/payments` | — | — | ✓ |
| `POST /api/admin/store/payments/test` | — | — | ✓ |

**UI:** rotas `/admin/loja/*` e `/admin/historico` aparecem no menu só para **admin/owner**.

---

## 5. Admin — catálogo

| Rota | Staff | Admin | Owner | Nota |
|------|:-----:|:-----:|:-----:|------|
| `GET/POST/PATCH/DELETE /api/admin/categories` | ✓ | ✓ | ✓ | |
| `GET /api/admin/products` | ✓ | ✓ | ✓ | |
| `POST /api/admin/products` | ✓ | ✓ | ✓ | **403** se limite do plano |
| `PUT /api/admin/products/:id` | ✓ | ✓ | ✓ | |
| `DELETE /api/admin/products/:id` | — | ✓ | ✓ | `requireAdminOrOwner` |

---

## 6. Admin — pedidos

| Rota | Staff | Admin | Owner | Nota |
|------|:-----:|:-----:|:-----:|------|
| `GET /api/admin/orders` | ✓ | ✓ | ✓ | |
| `GET /api/admin/orders/:id` | ✓ | ✓ | ✓ | |
| `PATCH /api/admin/orders/:id/status` | ◐ | ◐ | ◐ | Cancelar pedido já pago/enviado → só **admin/owner** + `cancellationReason` |
| `PATCH /api/admin/orders/:id/tracking` | ✓ | ✓ | ✓ | |
| `POST /api/admin/orders/:id/sync-payment` | — | ✓ | ✓ | Reconcilia com Mercado Pago |

---

## 7. Admin — newsletter, frete, cupons

| Rota | Staff | Admin | Owner | Menu UI |
|------|:-----:|:-----:|:-----:|---------|
| `GET /api/admin/newsletter-subscribers` | — | ✓ | ✓ | admin/owner |
| `GET /api/admin/newsletter-subscribers/export.csv` | — | ✓ | ✓ | admin/owner |
| `GET/POST/PATCH/DELETE /api/admin/shipping-fare-bands` | ✓ | ✓ | ✓ | staff+ |
| `GET/POST/PATCH/DELETE /api/admin/coupons` | ✓ | ✓ | ✓ | staff+ |

\* Staff: links Frete e Cupons no menu principal; demais abas de `/admin/loja/*` só admin/owner.

---

## 8. Central plataforma (`/api/platform/*`)

Sem `x-store-slug`. Todas exigem **Operador** (`verifyPlatformOperator`).

| Rota | Operador | Demais |
|------|:--------:|:------:|
| `GET/PATCH /api/platform/runtime-settings` | ✓ | — |
| `GET/POST /api/platform/stores` | ✓ | — |
| `POST /api/platform/stores/:storeId/domains` | ✓ | — |
| `GET /api/platform/analytics/overview` | ✓ | — |
| `GET /api/platform/analytics/store-ranking` | ✓ | — |
| `GET /api/platform/analytics/new-stores-weekly` | ✓ | — |
| `GET /api/platform/plans-catalog` | ✓ | — |
| `PUT /api/platform/plan-price-versions/:versionId/entitlements` | ✓ | — |

`POST /api/platform/stores` pode exigir header `x-platform-create-store-secret` quando `PLATFORM_CREATE_STORE_SECRET` está definido no Worker.

---

## 9. Rotas React × papel

| Área | Guest | Cliente | Staff | Admin | Owner | Operador |
|------|:-----:|:-------:|:-----:|:-----:|:-----:|:--------:|
| `/` vitrine, carrinho, checkout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/produto/:slug` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/pedidos`, `/login` | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/admin/pedidos`, `/admin/produtos/*` | — | — | ✓ | ✓ | ✓ | ✓* |
| `/admin/loja/*`, `/admin/historico` | — | — | ◐ | ✓ | ✓ | ✓* |
| `/admin/platform/*` | — | — | — | — | — | ✓ |

\* Operador precisa JWT + membro da loja para admin; Central plataforma é gate separado por e-mail.

◐ Staff: menu com Frete e Cupons; settings/checkout/newsletter/histórico só admin/owner (API retorna **403**).

Guards: `AdminGuard` (login Supabase), `useAdminNav` (menu por role), `PlatformLayout` + `isPlatformOperatorEmail`.

---

## 10. Hierarquia resumida

```text
Operador plataforma     →  escopo global (lojas, planos, analytics)
        │
        │  (independente de store_members)
        ▼
Owner da loja           →  tudo na loja + credenciais MP
        │
Admin                   →  settings, newsletter, auditoria, cancelamento sensível, delete produto
        │
Staff                   →  catálogo, pedidos (operação), frete/cupons (API)
        │
Cliente / Guest         →  vitrine e pedidos próprios (não admin)
```

---

## 11. Onde cada gate é aplicado

| Camada | Arquivo / função |
|--------|------------------|
| Admin JWT + membro | `src/worker/middlewares/verifyAuth.ts` |
| Admin ou owner | `src/worker/routes/admin/helpers.ts` → `requireAdminOrOwner` |
| Só owner (MP) | `requireOwner` |
| Pedidos cliente | `verifyCustomerAuth`, `optionalCustomerAuth` |
| Plataforma | `src/worker/middlewares/verifyPlatformOperator.ts` |
| Menu admin UI | `src/react-app/hooks/admin/useAdminNav.ts` |
| Shell plataforma UI | `src/react-app/components/platform/layout/PlatformLayout.tsx` |

---

## Manutenção

Ao adicionar rota protegida:

1. Implementar gate no Worker (não só esconder botão na UI).
2. Atualizar [`api-contract.md`](../api-contract.md) (coluna Gate).
3. Atualizar **este arquivo** se mudar matriz de papéis.

Última revisão: alinhada ao Worker e PRD do sistema Vendas (multi-loja).
