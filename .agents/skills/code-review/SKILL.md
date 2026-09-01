---
name: code-review
description: Review no padrão Vendas — multi-tenant, pedidos, MP e três superfícies do produto.
---

# Skill — code-review

**Objetivo:** mesmo critério de review para SaaS multi-loja — negócio antes de estilo.

## Quando usar

Usuário pediu review de PR, branch ou diff.

## 1. Identificar superfície

| Se o diff mexe em… | Validar principalmente… |
|--------------------|-------------------------|
| `storefront/`, `hooks/storefront/` | UX cliente, carrinho por loja, checkout |
| `admin/`, `hooks/admin/` | Lojista + `store_members` + `x-store-slug` |
| `platform/`, `routes/platform.ts` | Operador; sem confundir com admin de loja |
| `routes/orders`, `core/db/orders/` | Estoque RPC, status, idempotência MP |
| `webhooks.ts` | Assinatura MP, não duplicar pagamento |

## 2. Checklist de negócio (bloqueante se falhar)

- [ ] **Isolamento:** toda query de catálogo/pedido/newsletter filtra `store_id` da loja do request?
- [ ] **Auth:** admin usa JWT + membro da loja; plataforma usa operador — sem atalho só na UI?
- [ ] **Estoque:** sem decremento/restore fora das RPCs acordadas?
- [ ] **Pagamento:** status `paid` não depende só de callback do frontend?
- [ ] **Status:** valores em inglês (`pending`, `paid`, `shipped`, `cancelled`)?
- [ ] **Pedido:** campos oficiais de cliente/endereço; itens coerentes com schema?
- [ ] **Fora de escopo:** não introduz marketplace multi-loja, NF-e, app nativo?

## 3. Checklist técnico

Aplicar [`.github/REVIEW.md`](../../.github/REVIEW.md) + [`AGENTS.md`](../../AGENTS.md):

- Zod nas rotas novas/alteradas
- `src/contracts/` + `api-contract.md` se contrato mudou
- Hooks com lógica; componentes enxutos
- Tokens UI — sem hex solto
- Sem secrets / PII em log
- Sem `any` / `catch` vazio

## 4. Resultado

**Approve** | **Request changes** | **Comment** — com arquivo e linha quando bloquear.

## O que NÃO fazer

- Alterar código do autor
- Aprovar mudança em checkout ou webhook sem olhar tenant e idempotência
