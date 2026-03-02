# Code Review — Clean Architecture e Tipos

Revisão focada em **acoplamento Worker ↔ Frontend** e em **clareza das interfaces** para que outro desenvolvedor entenda o formato dos dados sem depender da lógica.

---

## 1. Acoplamento entre Worker e Frontend

### 1.1 Dependência direta do Frontend no Worker

| Onde | O que acontece |
|------|----------------|
| `src/react-app/types/index.ts` | Re-exporta tipos de `@/worker/core/schema` e usa `OrderWithItems` com `import("@/worker/core/schema")`. |

**Problema (Clean Architecture):**  
A camada de apresentação (React) **importa** a camada de backend (Worker). Na Clean Architecture, a regra de dependência é: **camadas externas dependem das internas**, não o contrário. O ideal é o **contrato da API** (tipos de request/response) ser estável e pertencer a um núcleo compartilhado ou ao menos não forçar o frontend a “conhecer” o caminho do Worker.

**Impacto hoje:**  
- Build do app inclui `src/worker/core/schema.ts` (veja `tsconfig.app.json` → `include`).  
- Qualquer mudança em `schema.ts` (ex.: renomear campo, quebrar compatibilidade) afeta o frontend.  
- Um novo cliente da API (outro app, mobile) não tem um único “contrato” explícito; teria que importar do Worker ou duplicar tipos.

### 1.2 Worker não depende do Frontend

Não há imports do React ou de `react-app` no Worker. **Bom:** o backend não conhece a UI.

### 1.3 Resumo do acoplamento

- **Frontend → Worker:** existe (tipos em `types/index.ts` e `include` do schema no app).  
- **Worker → Frontend:** não existe.  
- **Conclusão:** o acoplamento é **unidirecional** e concentrado nos **tipos de domínio** que o frontend reutiliza. O problema não é “tudo acoplado”, e sim **onde vive o contrato** (hoje no Worker) e **falta de uma camada de contrato de API** explícita e estável.

---

## 2. Interfaces (Types) — estão bem definidas?

### 2.1 Pontos positivos

- **`src/worker/core/schema.ts`** é a fonte única de entidades (Store, Product, Order, OrderItem, OrderDetail, CartItemPayload).  
- Uso consistente de **camelCase** no código e **snake_case** no banco, com mapeamento em `database.ts`.  
- Comentários em campos não óbvios (ex.: `priceWholesale`, `minQuantityWholesale`, `customerName`, “Pedido com itens”, “Payload do carrinho”).  
- Contrato de resposta da API definido: `ApiSuccess<T>`, `ApiError`, `ApiResponse<T>`.

### 2.2 Pontos a melhorar

| Ponto | Situação | Sugestão |
|-------|----------|----------|
| **Contrato por rota** | Não existe um único lugar que diga “GET /api/products retorna `Product[]` dentro de `data`”. Quem lê o código precisa abrir as rotas e o schema. | Criar um arquivo de **contrato de API** (ex.: `api-contract.d.ts` ou doc) listando método, path, body (se houver) e tipo de `data`. |
| **Auth /users/me** | Retorna `user` ou `null` direto, **sem** envelope `{ success, data }`. Inconsistente com o resto da API. | Documentar no contrato; idealmente padronizar para `{ success, data }` ou deixar explícito que essa rota é “legada”/Mocha. |
| **Respostas de pagamento PIX** | Em `useCheckout.ts` o tipo do retorno de payment tem vários nomes possíveis (`pixCode`, `qr_code`, `copyPaste`, etc.). | Ter um tipo único no contrato (ex.: `PixPaymentResponse`) com campos canônicos e comentários (ex.: “QR Code em base64”, “Copia e Cola”). |
| **OrderWithItems** | Definido no frontend como `Order & { items?: OrderItem[] }`, enquanto o Worker já expõe `OrderDetail` (pedido + itens). | Preferir **um único tipo** no contrato (ex.: usar `OrderDetail` como tipo de “pedido com itens”) e reutilizar no frontend. |
| **Variáveis do Hono** | `Variables.user` está como `AuthUser | unknown`; em rotas de orders usa-se `c.get("user") as { id: string }`. | Tipar melhor por “tipo de rota” ou documentar no Worker que em `/api/orders` o `user` vem do Mocha e em `/api/admin` do verifyAuth. |

### 2.3 Autodocumentação para outro desenvolvedor

- **Só com os tipos atuais:** uma pessoa consegue entender a **forma** dos dados (campos, nomes).  
- **Sem ler a lógica:** ainda fica em aberto **qual rota retorna o quê** e **qual é o formato exato da resposta** (envelope vs body direto).  
- **Conclusão:** as interfaces de **entidades** estão bem definidas; falta um **mapa rota → tipo de resposta/request** (contrato de API) para não precisar ler handlers.

---

## 3. Recomendações (Clean Architecture)

### 3.1 Curto prazo (sem mover pasta)

1. **Criar um contrato de API** (um único arquivo, ex.: `src/shared/api-contract.ts` ou `docs/api-contract.md`):
   - Listar cada endpoint (método + path).
   - Para cada um: tipo do body (se POST/PUT/PATCH) e tipo de `data` na resposta (ou “body direto” para /users/me).
   - Referenciar os tipos já existentes em `schema.ts` (Product, Order, OrderDetail, etc.) em vez de duplicar.

2. **Unificar “pedido com itens”** no tipo `OrderDetail` e usar esse tipo no frontend (remover `OrderWithItems` duplicado ou defini-lo como alias de `OrderDetail`).

3. **Documentar exceções ao envelope** no contrato (ex.: “GET /api/users/me retorna `User | null` direto, sem `{ success, data }`”).

### 3.2 Médio prazo (desacoplamento)

1. **Mover o “contrato” para um núcleo compartilhado:**
   - Opção A: pasta `src/shared/` com apenas tipos (interfaces de API + entidades que a API expõe). Worker e Frontend **ambos** importam de `shared`. Assim o frontend não importa mais de `worker/`.
   - Opção B: manter tipos em `worker/core/schema.ts` mas o frontend importar de um alias estável (ex.: `@/shared/schema`) que no build aponte para o mesmo arquivo; o importante é não depender do path “worker” no código do app.

2. **Padronizar todas as respostas JSON** do Worker em `{ success, data? }` ou `{ success, error }`, incluindo auth, para o frontend sempre fazer o mesmo parse.

---

## 4. Checklist rápido

| Pergunta | Resposta |
|----------|----------|
| Existe acoplamento desnecessário entre Worker e Frontend? | Sim: frontend importa tipos do Worker. Reduzível com camada `shared` ou contrato explícito. |
| Worker depende do Frontend? | Não. |
| As interfaces permitem entender o formato dos dados sem ler a lógica? | Parcialmente: entidades sim; “qual rota devolve o quê” não está explícito. |
| Contrato de API (rota → tipo) está documentado em um só lugar? | Não. |
| Há inconsistência de envelope (success/data vs body direto)? | Sim: /api/users/me e possivelmente outros retornam body direto. |

Com as melhorias sugeridas (contrato de API + uso consistente de tipos como `OrderDetail` e, se desejado, camada `shared`), o projeto fica mais alinhado à Clean Architecture e mais fácil para outro desenvolvedor entender o formato dos dados sem depender da lógica das rotas.
