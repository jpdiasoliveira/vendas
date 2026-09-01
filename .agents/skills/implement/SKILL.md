---
name: implement
description: Checklist para implementar uma fatia no Vendas (multi-loja). Não faz commit, push nem PR.
---

# Skill — implement

**Objetivo:** codar no padrão do produto — superfície certa, tenant isolado, regras de pedido/estoque/MP.

## 1. Classificar a tarefa

Antes de codar, marque a(s) superfície(s) afetada(s):

| Superfície | Pergunta-guia |
|------------|----------------|
| **Vitrine** | Cliente final vê ou interage? (catálogo, carrinho, checkout, rastreio) |
| **Admin loja** | Lojista autenticado gerencia **uma** loja? |
| **Plataforma** | Operador SaaS age sobre **várias** lojas ou planos? |
| **Worker only** | Só API/webhook/cron, sem tela? |

Ler [`docs/PRD.md`](../../docs/PRD.md) — escopo do release, sem marketplace multi-loja nem ERP.

## 2. Módulo referência (copiar estrutura)

| Superfície | Worker | Frontend |
|------------|--------|----------|
| **Admin loja** | `src/worker/routes/admin/orders.ts` | `hooks/admin/useAdminOrders.ts`, `components/admin/orders/` |
| **Vitrine / checkout** | `src/worker/routes/orders.ts`, `core/db/orders/` | `hooks/storefront/checkout/`, `components/storefront/cart/` |
| **Plataforma** | `src/worker/routes/platform.ts` | `pages/admin/platform/`, `hooks/platform/` |
| **Catálogo vitrine** | `src/worker/routes/products.ts` | `hooks/storefront/useCatalogSection.ts` |
| **Webhook MP** | `src/worker/routes/webhooks.ts` | — |

## 3. Regras de negócio (não pular)

- **Tenant:** rotas de loja exigem `x-store-slug` → `store_id` em toda query; nunca misturar dados entre lojas.
- **Admin:** JWT + `store_members` — persona lojista ≠ operador plataforma.
- **Plataforma:** `/api/platform/*` — `verifyPlatformOperator`; não usar slug de loja como autorização.
- **Pedido/estoque:** criar/alterar estoque → RPC documentada em `docs/`; sem update otimista cego de `stock`.
- **Pagamento:** confirmação via MP/webhook idempotente; frontend não é fonte de verdade de `paid`.
- **Status pedido:** `pending`, `paid`, `shipped`, `cancelled` (inglês no banco/API).
- **Pedidos:** dados do cliente em `orders` (`customer_name`, `customer_phone`, `delivery_address`); itens em JSONB `items` — ver `docs/MANUAL-DE-VOO-ARQUITETURA-SCHEMA.md`.
- **Schema:** migration/SQL em `migrations/` ou `docs/supabase-*.sql` — não inventar coluna só no TS.

## 4. Checklist técnico

1. Ler [`AGENTS.md`](../../AGENTS.md) + doc em [`.agents/docs/`](../docs/) da área (architecture, patterns, security, data).
2. Branch `feat/<id>-<slug>` ou `fix/<id>-<slug>` a partir de `main`.
3. Tipos em `src/contracts/`; frontend **não** importa `src/worker/`.
4. Validação Zod nas bordas HTTP.
5. UI: lógica em hooks; tokens em [`docs/padroes-ui.md`](../../docs/padroes-ui.md).
6. Contrato mudou → `docs/api-contract.md`.
7. Rodar:

```bash
npm run lint:check
npm run typecheck
npm run build
```

8. Resumir: superfície afetada, checks rodados, risco (tenant, estoque, MP).

## O que NÃO fazer

- Commit / push / PR sem o usuário pedir.
- Carrinho único entre lojas diferentes (fora de escopo).
- Confiar só na UI para marcar pedido como pago.
- Ampliar escopo além do pedido/PRD.
