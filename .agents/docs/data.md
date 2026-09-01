# Dados — Supabase / PostgreSQL

## Fonte de verdade

| Artefato | Caminho |
|----------|---------|
| Schema documentado | `docs/SCHEMA-SUPABASE.md` |
| Migrations versionadas | `migrations/*.sql` (+ `down.sql` quando existir) |
| Scripts pontuais (RLS, RPC) | `docs/supabase-*.sql` |
| Tipos no código | `src/contracts/schema.ts` |
| Colunas `orders` (regras) | `docs/MANUAL-DE-VOO-ARQUITETURA-SCHEMA.md` |

## Convenções

- Tabelas/colunas: **snake_case** (`store_id`, `created_at`).
- TypeScript: **camelCase** (`storeId`, `createdAt`).
- Mapeamento apenas em `src/worker/core/db/` (repos e `mappers.ts`).

## Tabelas centrais

- `stores` — tenant raiz
- `store_settings`, `store_members`, `store_domains`
- `products`, `categories`, `orders`, `order_items`
- `platform_*` — planos, assinaturas, billing SaaS
- `newsletter_subscribers`, `audit_logs`

Todas as entidades de negócio da loja carregam `store_id`.

## Migrations

Ordem sugerida: `migrations/README.md`.

Aplicar no Supabase SQL Editor ou via CLI do projeto. Não editar migration já aplicada em produção — criar nova.

## RPCs críticas (estoque / pedidos)

Documentadas em `docs/`:

- `create_order_with_stock_lock`
- `decrement_stock_for_order` / `restore_stock_for_order`
- `expire_old_orders`
- `apply_mp_approval_with_order_lock`

## Seed / demo

- Loja demo: `docs/supabase-setup-admin-demo-store.sql` (slug `demo-store`)
- Catálogo demo: `docs/seed-demo-catalog-and-history.sql`

## Regra de ouro

**Não criar colunas novas só no código.** Alteração de schema → SQL revisado + migration + atualizar `contracts` e docs.
