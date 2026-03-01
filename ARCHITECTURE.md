# Arquitetura do Projeto — SaaS Multitenant

Este documento descreve como o **tenant** é identificado e como os **dados fluem** entre frontend, Worker e bancos, para que qualquer dev (ou você daqui a 6 meses) saiba onde está cada “parafuso”.

---

## 1. Identificação do Tenant (Loja)

O sistema é **multi-tenant**: um único código atende várias lojas. Cada request precisa saber **de qual loja** é.

### Fluxo: Slug → D1 → UUID

1. **Slug**  
   O frontend envia em toda requisição o header **`x-store-slug`** (ex.: `natfoods`). O valor vem de `VITE_STORE_SLUG` (build/deploy por loja).

2. **D1 (Edge)**  
   O **storeMiddleware** (`src/worker/middleware/store.ts`) recebe o request, lê o slug e consulta o **D1** (SQLite na borda):
   - Query: `SELECT * FROM stores WHERE slug = ? AND status = 'active'`
   - Se não achar → responde `404` (loja não encontrada ou inativa).
   - Se achar → transforma a linha (snake_case) em objeto **Store** (camelCase) e faz `c.set("store", store)`.

3. **UUID da loja**  
   O objeto `store` no contexto tem `store.id` (UUID no D1, usado como chave estrangeira no Supabase). Todas as operações no **Supabase** usam esse `store.id` para filtrar dados (**isolamento por `store_id`**).

Resumo: **Slug (header) → validação no D1 → Store no contexto → `store.id` em todas as queries Supabase.**

---

## 2. Fluxo de Dados

### 2.1 Frontend (React)

- **API:** Todas as chamadas passam por `apiFetch` (`src/react-app/lib/api.ts`), que:
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
  - `storeMiddleware` em `/api/*`: valida o tenant (D1) e injeta `store`.  
  - Rotas de pedidos usam ainda o **authMiddleware** (Mocha) para garantir usuário logado.

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

- **D1 (Cloudflare):**  
  - Tabela **`stores`**: id, slug, display_name, status, created_at, updated_at.  
  - Uso: validar slug e obter o `store` (id e metadados) por request.

- **Supabase (PostgreSQL):**  
  - **products**, **orders**, **order_items**: todas com **`store_id`**.  
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
│   ├── middleware/
│   │   └── store.ts         # Tenant: slug → D1 → store
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
│   │   ├── common/          # Botões, inputs, etc.
│   │   ├── layout/          # Navbar, Footer
│   │   ├── home/            # Seções da home
│   │   ├── checkout/        # Carrinho, modais de pagamento
│   │   └── admin/           # StatusBadge, OrderDetailsModal
│   ├── contexts/            # CartContext (carrinho)
│   ├── hooks/               # useProducts, useOrders, useCheckout
│   ├── lib/
│   │   └── api.ts           # apiFetch (x-store-slug + envelope success/data/error)
│   └── types/
│       └── index.ts         # Re-export do schema do Worker
│
└── shared/                  # Código compartilhado (ex.: tipos) se necessário
```

---

## 4. Convenções

| Aspecto           | Padrão                          |
|------------------|----------------------------------|
| **Banco (DB)**   | snake_case (`store_id`, `created_at`) |
| **Código (TS)**  | camelCase (`storeId`, `createdAt`)   |
| **Resposta API** | `{ success: boolean, data?: T, error?: string }` |
| **Tenant**       | Header `x-store-slug` → D1 → `store` no contexto |
| **Dados**        | Acesso só via `database.ts`; rotas não chamam Supabase direto |

Com isso, o projeto fica previsível, escalável e fácil de retomar (por exemplo, ao subir uma nova “loja” ou outra marca no mesmo código).
