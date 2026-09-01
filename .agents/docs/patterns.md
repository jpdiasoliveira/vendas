# Padrões de código

## API (Worker / Hono)

### Envelope de resposta

```typescript
// Sucesso
return c.json({ success: true, data: payload });

// Erro de regra / cliente
return c.json({ success: false, error: "mensagem clara" }, 400);

// Erro interno — usar logServerError + mensagem genérica
```

Exceções documentadas em [`docs/api-contract.md`](../../docs/api-contract.md).

### Validação

- Body/query: `@hono/zod-validator` ou parse manual com Zod.
- Schemas em `src/worker/schemas/` ou `src/schemas/` (compartilhado quando fizer sentido).
- Status de pedido e enums de domínio em **inglês** no banco/API: `pending`, `paid`, `shipped`, `cancelled`.

### Rotas

- Um arquivo por domínio em `src/worker/routes/`.
- Admin agrupado em `routes/admin.ts` (mount) + subpastas `admin/`.
- Rotas **não** chamam Supabase diretamente — delegam a `core/db/*Repo.ts`.

### Repositórios

- Funções async que recebem `env: Env` e `storeId` quando multi-tenant.
- Mapeamento snake_case ↔ camelCase em `core/db/mappers.ts` ou no próprio repo.
- Batch/IN para evitar N+1.

### Erros

- `logServerError(context, err)` para 500 — nunca vazar stack ao cliente.
- Erros de negócio com mensagem estável em português (UX) e status HTTP correto.

---

## Frontend (React)

### HTTP

- Todas as chamadas via `apiFetch` / `adminApiFetch` em `src/react-app/services/api.ts`.
- TanStack Query para cache; keys em `src/react-app/query/queryKeys.ts`.
- Tipos de resposta de `@/contracts/schema`.

### Hooks

- Um hook por fluxo (`useAdminOrders`, `useCheckoutFlow`, etc.).
- Páginas importam hooks e compõem UI — sem `fetch` + regra de negócio na page.

### Formulários

- `react-hook-form` + Zod resolver quando aplicável.
- Erros de API: feedback visível (toast, banner, estado de erro).

### Componentes

- Alvo: **&lt; 200 linhas** por arquivo; extrair subcomponentes por aba/seção.
- Admin: `components/admin/<domínio>/`.
- Storefront: `components/storefront/<domínio>/`.

---

## Contrato compartilhado

- Entidades e `ApiResponse<T>`: `src/contracts/schema.ts`.
- Perfil público da loja: `src/contracts/storePublicProfile.ts`.
- Mudou campo exposto na API → atualizar contracts + `docs/api-contract.md`.

---

## Commits e branches

- Branch: `feat/<ticket-id>-<slug>` ou `fix/<ticket-id>-<slug>`.
- Conventional Commits: `feat(orders): …`, `fix(checkout): …`.
