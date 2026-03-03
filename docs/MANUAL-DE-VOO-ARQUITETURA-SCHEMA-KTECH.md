# Manual de Voo — Alinhamento de Arquitetura e Schema (Padrão Ktech)

Este documento é a **fonte única de verdade** para o Cursor e para qualquer agente/desenvolvedor. Seguir estas diretrizes evita colunas fantasmas e inconsistências após a auditoria e refatoração do projeto.

---

## 1. Schema da Tabela `orders` (Fonte Única da Verdade)

- **Dados do Cliente:** Use estritamente `customer_name`, `customer_phone` e `delivery_address` (tipo TEXT na tabela `orders`). **Ignore a tabela externa `delivery_addresses`.**
- **Itens do Pedido:** A coluna principal para inteligência e exibição é **`items`** (tipo JSONB). Sempre salve e leia o array de produtos desta coluna.
- **Rastreabilidade:** Use `paid_at`, `delivered_at` e `updated_at` para controle de tempo.

---

## 2. Inteligência de Vendas (Trending / Mais Vendidos)

- Existe uma **View** chamada **`view_top_sellers`**. Use o endpoint **GET /api/products/trending** para buscar os IDs dos produtos mais populares.
- No **Admin**, use o ícone **Flame** para produtos contidos nessa lista.
- No **Site**, use o badge **'MAIS VENDIDO'**.

---

## 3. Mapeamento de Dados (Data Mapping)

- **Backend (Worker):** Ao ler do banco (snake_case), mapeie para o frontend (camelCase) no `rowToOrder`. Exemplo: `row.delivery_address` → `deliveryAddress`.
- **Frontend:** Use as interfaces centralizadas em **`src/react-app/types/index.ts`**.

---

## 4. Estrutura de Pastas e Clean Code

- **Serviços:** Chamadas de API ficam em **`src/react-app/services/api.ts`**.
- **Hooks:** Lógica de estado fica em **`src/react-app/hooks/`**.
- **Utils:** Formatações e funções puras ficam em **`src/react-app/utils/`**.
- **Logs:** Em caso de erro, use o padrão **`console.error('[contexto.funcao]', error)`**.

---

## 5. Regra de Ouro

- **Não crie colunas novas no banco via código.** Se precisar de um dado novo, peça o SQL ao responsável pelo projeto.
- **Não tente adivinhar nomes de colunas.** Consulte o histórico da última auditoria de schema, que mostra `customer_phone` e `delivery_address` como campos oficiais.
