# Segurança

## Autenticação

| Contexto | Mecanismo |
|----------|-----------|
| Vitrine / cliente | Supabase Auth (sessão no browser); pedidos ligados ao `user_id` quando logado |
| Admin loja | JWT `Authorization: Bearer` + membro em `store_members` para o `store_id` da requisição |
| Plataforma SaaS | JWT + e-mail em `PLATFORM_OPERATOR_EMAILS` (+ secret opcional `PLATFORM_CREATE_STORE_SECRET`) |

Middlewares: `verifyAuth`, `verifyPlatformOperator`, `supabaseJwt`.

## Multi-tenant

- Isolamento por `store_id` em **todas** as queries de negócio.
- `x-store-slug` validado antes de qualquer dado de loja.
- Admin só acessa lojas em que é membro (`store_members`).

## Secrets

| Variável | Onde |
|----------|------|
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` | Worker apenas (`.dev.vars` / secrets CF) |
| `MERCADO_PAGO_*`, `MERCADO_PAGO_WEBHOOK_SECRET` | Worker |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Frontend (público) |
| `VITE_PLATFORM_CREATE_STORE_SECRET` | Frontend — só se habilitar criação de loja na UI |

Nunca commitar `.env`, `.dev.vars` ou tokens em logs.

## Logs

- `redactSecrets()` em `safeApiError.ts` antes de logar.
- Resposta 500 genérica ao cliente; detalhe só no log do Worker.

## CORS

- Lista explícita em `CORS_ORIGIN` — **nunca** `*` em produção.

## Webhooks Mercado Pago

- Validar assinatura quando `REQUIRE_MP_WEBHOOK_SECRET=true`.
- Idempotência em handlers de pagamento (ver RPCs em `docs/`).

## RLS (Supabase)

- Políticas por `store_members` em tabelas sensíveis (catálogo, pedidos, newsletter).
- Scripts: `docs/supabase-rls-*.sql`, migrations `5.sql`–`9.sql`.

## O que nunca fazer

- Confiar só em esconder botão na UI para autorização.
- Logar JWT, senha, PIX completo ou PII desnecessária.
- Query sem `store_id` em dados de tenant.

Personas de negócio ≠ roles de login — ver `docs/escopo-negocio.md` e PRD.

Matriz rota × papel (staff / admin / owner / operador / vitrine): [`docs/agents/roles-matrix.md`](../../docs/agents/roles-matrix.md).

Checklist de tarefas por papel: [`docs/agents/checklist-usuarios-rbac.md`](../../docs/agents/checklist-usuarios-rbac.md).
