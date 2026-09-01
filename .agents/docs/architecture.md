# Arquitetura — vendas (monorepo)

Stack: **React 19 + Vite** (vitrine/admin/plataforma) · **Hono** no **Cloudflare Worker** · **Supabase** (PostgreSQL + Auth + Storage).

Visão geral legada (pode divergir em detalhes): [`ARCHITECTURE.md`](../../ARCHITECTURE.md). Este arquivo é a referência atual para agentes.

---

## Camadas

```text
src/
├── contracts/          # Tipos e contrato compartilhado (Worker + React)
├── schemas/            # Zod — validação compartilhada quando aplicável
├── worker/             # API edge (Hono)
│   ├── index.ts        # Orquestração: CORS, middlewares, rotas
│   ├── middlewares/    # Tenant, JWT, operador plataforma
│   ├── routes/         # Handlers por domínio (finos)
│   ├── core/db/        # Repositories (único lugar de SQL/Supabase)
│   ├── services/       # Integrações (e-mail, Mercado Pago, etc.)
│   └── schemas/        # Zod específico do Worker
└── react-app/          # SPA
    ├── pages/          # Rotas/telas
    ├── components/     # UI por domínio (storefront, admin, platform)
    ├── hooks/          # Lógica de estado e orquestração
    ├── services/       # api.ts, auth, supabase client
    ├── contexts/       # Carrinho, auth, settings
    └── query/          # TanStack Query (keys, client)
```

**Regra de dependência:** `react-app` → `contracts` | `schemas`. `worker` → `contracts` | `schemas`. Nunca `react-app` → `worker`.

---

## Multi-tenant (loja)

1. Cliente envia **`x-store-slug`** (ou slug inferido por subdomínio / `VITE_DEFAULT_STORE_SLUG` em dev).
2. `storeMiddleware` resolve loja ativa em `stores` (e domínios customizados quando configurado).
3. `c.set("store", store)` — todas as operações usam `store.id` (`store_id` no banco).

Rotas **`/api/platform/*`** e algumas rotas globais **não** usam tenant de loja; exigem operador da plataforma (`verifyPlatformOperator`).

---

## Fluxo de request (vitrine / admin loja)

```text
Browser → apiFetch (React) → Worker route → middleware store → middleware auth (admin)
       → repository (core/db) → Supabase → map snake_case → JSON { success, data }
```

---

## Módulos principais

| Área | Worker | Frontend |
|------|--------|----------|
| Catálogo | `routes/products.ts`, repos `productsRepo` | `hooks/storefront/`, vitrine |
| Pedidos | `routes/orders.ts`, `core/db/orders/` | checkout, confirmação |
| Admin loja | `routes/admin/*` | `pages/Admin*`, `hooks/admin/` |
| Plataforma SaaS | `routes/platform.ts` | `pages/admin/platform/` |
| Auth | `routes/auth.ts`, JWT middlewares | `contexts/AuthContext`, login |
| Webhooks MP | `routes/webhooks.ts` | — |

**Módulo referência** para features novas no admin: pedidos — `routes/admin/orders.ts` + `hooks/admin/useAdminOrders.ts` + `components/admin/orders/`.

---

## Banco e migrations

- Schema documentado: `docs/SCHEMA-SUPABASE.md`, scripts `docs/supabase-*.sql`.
- Migrations numeradas: `migrations/*.sql`.
- RLS e RPCs críticos (estoque, expiração pedidos) em `docs/` — aplicar no Supabase conforme README das migrations.

Manual operacional de colunas `orders`: `docs/MANUAL-DE-VOO-ARQUITETURA-SCHEMA.md`.

---

## Deploy

- Frontend: build Vite → assets estáticos.
- API: Cloudflare Worker (`wrangler`), cron para expirar pedidos pendentes.
- Secrets: `.dev.vars` (local), secrets do Worker (produção) — nunca no git.
