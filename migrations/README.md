# Migrações SQL (Supabase)

Ordem sugerida para novos ambientes (ajustar se o teu projeto já tiver histórico aplicado):

| Ficheiro   | Conteúdo (resumo) |
|-----------|-------------------|
| `1.sql` … | Schema base (conforme projeto) |
| `5.sql`   | Tabela `newsletter_subscribers` + `ENABLE ROW LEVEL SECURITY` |
| **`6.sql`** | **Políticas RLS** em `newsletter_subscribers` por `store_members` |
| **`7.sql`** | **RPC `restore_stock_for_order`** — repõe estoque por `order_id` + `store_id` numa única transação (cancelamentos) |
| **`8.sql`** | **RPC `expire_old_orders`** — cancela `pending` antigos; repõe estoque só com `stock_reserved_at_create` (requer `7.sql`) |

**Rollback da migração 6:** `6/down.sql` (remove só as políticas; a tabela e o RLS da `5` mantêm-se).

**Estoque atómico (já documentado em `docs/`):** `create_order_with_stock_lock`, `decrement_stock_for_order`, `apply_mp_approval_with_order_lock`; aplicar também **`7.sql`** / `docs/supabase-rpc-restore-order-stock.sql` para repôs segura em cancelamento.

**Pedidos / catálogo multi-tenant:** aplicar também `docs/supabase-rls-multitenant-catalog-orders.sql` no SQL Editor se ainda não estiver na base.

**Aplicar no Supabase:** SQL Editor → colar `6.sql` → executar; ou `apply_migration` via Supabase Dashboard / CLI ligado ao projeto.

**Produção:** a migração remota `rls_newsletter_subscribers_member_policies` foi aplicada com sucesso (políticas RLS ativas). O ficheiro local `6.sql` mantém o mesmo SQL para novos ambientes e revisão em git.
