# Arquitetura do Projeto — SaaS Multitenant

Este documento descreve como o **tenant** é identificado e como os **dados fluem** entre frontend, Worker e bancos, para que qualquer dev (ou você daqui a 6 meses) saiba onde está cada “parafuso”.

---

## 1. Identificação do Tenant (Loja)

O sistema é **multi-tenant**: um único código atende várias lojas. Cada request precisa saber **de qual loja** é.

### Fluxo: Slug → Supabase → UUID

1. **Slug**  
   O frontend envia em toda requisição o header **`x-store-slug`** (ex.: `natfoods`). O valor vem de `VITE_STORE_SLUG` (build/deploy por loja).

2. **Supabase (stores)**  
   O **storeMiddleware** (`src/worker/middlewares/storeFromSlug.ts`) recebe o request, lê o slug e consulta a tabela **`stores`** no Supabase (loja ativa):
   - Se não achar → responde `404` (loja não encontrada ou inativa).
   - Se achar → monta o objeto **Store** (camelCase) e faz `c.set("store", store)`.

3. **UUID da loja**  
   O objeto `store` no contexto tem `store.id` (UUID). Todas as operações no **Supabase** usam esse `store.id` para filtrar dados (**isolamento por `store_id`**).

Resumo: **Slug (header) → validação em `stores` → Store no contexto → `store.id` em todas as queries.**

---

## 2. Fluxo de Dados

### 2.1 Frontend (React)

- **API:** Todas as chamadas passam por `apiFetch` (`src/react-app/services/api.ts`), que:
  - Adiciona `Content-Type: application/json` e **`x-store-slug`**
  - Interpreta o padrão de resposta: `{ success, data?, error? }`
  - Em sucesso retorna `data`; em erro lança `Error(error)`.

- **Tipos:** O frontend usa os mesmos tipos do Worker (Source of Truth):
  - Definidos em `src/worker/core/schema.ts` (camelCase)
  - Re-exportados em `src/react-app/types/index.ts` para import no app.

- **Carrinho:** Estado e lógica em **Context** (`CartContext`) + hook **`useCart()`** (`src/react-app/contexts/CartContext.tsx`). Não fica espalhado em página.

- **Layout:** Componentes de estrutura em **`src/react-app/components/layout/`** (ex.: `Navbar`, `Footer`). Componentes genéricos de UI em **`src/react-app/components/common/`**.

### 2.2 Worker (Hono + Cloudflare)

- **Orquestração:** `src/worker/index.ts` só registra middlewares e rotas; não contém lógica de negócio.

- **Middleware:**  
  - `storeMiddleware` em `/api/*`: valida o tenant no **Supabase** (`stores` / `store_domains`) e injeta `store`.  
  - **verifyAuth** (`src/worker/middlewares/verifyAuth.ts`) em `/api/admin/*`: valida JWT no header `Authorization: Bearer <token>`, verifica se o usuário é membro ativo da loja em **store_members** e injeta `c.set('user', user)` (id, role). Bloqueia requisições não autorizadas (401/403).

- **Respostas padronizadas:**
  - Sucesso: `c.json({ success: true, data: ... })`
  - Erro: `c.json({ success: false, error: "mensagem" }, 4xx/5xx)`

- **Camada de dados:** Toda interação com Supabase fica em **`src/worker/core/database.ts`** (Repository Pattern):
  - Funções como `getProductsByStore(env, storeId)`, `createOrder(env, params)`, `getOrdersByUserAndStore(...)`, etc.
  - Conversão **snake_case (Supabase) ↔ camelCase (schema)** feita só aqui; rotas e frontend trabalham só com camelCase.

- **Schema:** `src/worker/core/schema.ts` define as interfaces (Store, Product, Order, OrderItem, **OrderDetail**, etc.) em **camelCase**, alinhadas ao uso no código. O banco (PostgreSQL/Supabase) segue **snake_case** (ex.: `store_id`, `created_at`).

- **Gestão de pedidos (Admin):**
  - Rotas em **`src/worker/routes/admin.ts`**: `GET /api/admin/orders` (lista), `GET /api/admin/orders/:id` (detalhe com itens), `PATCH /api/admin/orders/:id/status` (atualiza status). Todas usam **storeMiddleware** (x-store-slug) para isolamento.
  - Repositório: **getAllOrdersByStore**, **getOrderWithItems** (pedido + itens com nome do produto), **updateOrderStatus** (atualiza `payment_status` com checagem de `store_id`).
  - Frontend: página **AdminOrders** (`/admin/pedidos`) lista pedidos; ao clicar em uma linha abre **OrderDetailsModal** (componente em `components/admin/`), que exibe itens e formulário de alteração de status. A página só controla estado aberto/fechado e id do pedido selecionado.

### 2.3 Bancos

- **Supabase (PostgreSQL):**  
  - **products**, **orders**, **order_items**: todas com **`store_id`**.  
  - **store_members**: id, user_id (FK auth.users), store_id, role (admin/editor). Vincula usuários do Supabase Auth às lojas para acesso ao painel admin. Ver `docs/supabase-store-members.sql`.  
  - Nenhuma query de negócio é feita sem filtrar por `store_id` (evita vazamento entre lojas).

---

## 3. Estrutura de Pastas (resumo)

```
src/
├── worker/                 # Backend (Hono + Cloudflare Workers)
│   ├── core/
│   │   ├── schema.ts        # Tipos globais (Source of Truth)
│   │   ├── database.ts      # Acesso a dados (Repository)
│   │   └── supabase.ts      # Cliente Supabase
│   ├── middlewares/
│   │   ├── storeFromSlug.ts # Tenant: slug/host → Supabase → store
│   │   └── verifyAuth.ts    # Proteção admin: JWT + store_members, c.set('user')
│   ├── routes/              # Rotas por domínio
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── auth.ts
│   │   ├── webhooks.ts
│   │   └── admin.ts         # Painel admin (pedidos, detalhe, status)
│   └── index.ts             # Só orquestração
│
├── react-app/
│   ├── components/
│   │   ├── auth/            # AdminGuard (rotas protegidas)
│   │   ├── common/          # Botões, inputs, etc.
│   │   ├── layout/          # Navbar, Footer
│   │   ├── home/            # Seções da home
│   │   ├── checkout/        # Carrinho, modais de pagamento
│   │   └── admin/           # StatusBadge, OrderDetailsModal, AdminNav
│   ├── contexts/            # CartContext, AuthContext (UserContext)
│   ├── hooks/               # useProducts, useOrders, useCheckout
│   ├── lib/
│   │   ├── api.ts           # apiFetch, adminApiFetch (Bearer token)
│   │   └── supabase.ts      # Cliente Supabase (sessões em localStorage)
│   ├── pages/
│   │   └── auth/
│   │       └── Login.tsx    # Interface de login (dark, minimalista)
│   ├── services/
│   │   └── auth.service.ts  # Lógica: login, logout, getCurrentUser, getSession, getAccessToken
│   └── types/
│       └── index.ts         # Re-export do schema do Worker
│
└── shared/                  # Código compartilhado (ex.: tipos) se necessário
```

---

## 4. Convenções

### Autenticação do Painel Admin (SaaS)

- **Separação:** `auth.service.ts` (lógica pura), `verifyAuth.ts` (segurança no Worker), `Login.tsx` (interface).
- **Contexto:** `AuthContext` expõe `UserContext` (id, email) e `useAuth()` em toda a aplicação (tipagem estrita).
- **Sessões:** Supabase Auth gerencia sessões em **localStorage** (padrão do cliente JS).
- **Login:** Página `/login` (`pages/auth/Login.tsx`): email/senha, redireciona para `/admin/pedidos`.
- **Proteção:** `AdminGuard` (`components/auth/AdminGuard.tsx`) envolve rotas `/admin/*`; sem sessão → redirecionamento suave para `/login`.
- **API admin:** `adminApiFetch` envia `Authorization: Bearer <token>`; Worker usa **verifyAuth** (JWT + store_members).
- **Env:** Worker: `SUPABASE_JWT_SECRET`. Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### Isolamento Multi-tenant (Auth → Store)

O acesso a dados por loja é garantido pela cadeia **Auth User → Store Member → Store ID**:

1. **Auth User** — O usuário se autentica via Supabase Auth (email/senha). O frontend envia o **JWT** (access_token) no header `Authorization` em toda requisição ao `/api/admin/*`.

2. **Store Member** — O middleware **verifyAuth** no Worker valida o JWT e obtém o `user_id` (claim `sub`). Em seguida consulta a tabela **store_members** no Supabase: só há linha se esse `user_id` estiver vinculado ao **store_id** da loja que está sendo acessada (o `store_id` vem do **storeMiddleware**, que já validou o `x-store-slug` / host contra **stores**). Se não existir membro ativo para aquela loja, a requisição é bloqueada (403).

3. **Store ID** — Todas as operações de dados (pedidos, produtos) usam o `store.id` já injetado no contexto. Assim, um usuário nunca acessa dados de outra loja: ele só é “membro” de lojas nas quais foi explicitamente cadastrado em **store_members**, e as queries filtram sempre por `store_id`.

Resumo: **JWT (user_id) + store_members (user_id, store_id) + store (do slug)** garantem isolamento multi-tenant no painel admin.

| Aspecto           | Padrão                          |
|------------------|----------------------------------|
| **Banco (DB)**   | snake_case (`store_id`, `created_at`) |
| **Código (TS)**  | camelCase (`storeId`, `createdAt`)   |
| **Resposta API** | `{ success: boolean, data?: T, error?: string }` |
| **Tenant**       | Header `x-store-slug` (ou host) → Supabase → `store` no contexto |
| **Dados**        | Acesso só via `database.ts`; rotas não chamam Supabase direto |

Com isso, o projeto fica previsível, escalável e fácil de retomar (por exemplo, ao subir uma nova “loja” ou outra marca no mesmo código).
