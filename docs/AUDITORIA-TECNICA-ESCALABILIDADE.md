# Relatório de Auditoria Técnica e Mapa de Escalabilidade

**Stack:** React, Hono, Cloudflare Workers, Supabase, D1  
**Objetivo:** Projeto replicável, atacado/varejo, integração Mercado Pago  
**Data:** 28/02/2025  

---

## 1. Análise de Modularização

### O index.ts do Worker ainda está agindo como um monolito?

**Não.** O `src/worker/index.ts` está enxuto e atua apenas como orquestrador:

- **Middlewares:** `storeMiddleware` aplicado em `/api/*`.
- **Rotas:** Delegação para módulos em `/routes` — `products`, `orders`, `auth`, `webhooks`.
- **Healthcheck:** `/api/health` fora do middleware de loja (correto).

Não há lógica de negócio no `index.ts`; funções já estão em `/core` (ex.: `getSupabase`) e em `/routes`. Nada crítico precisa ser extraído para `/core` ou `/routes` no estado atual.

### Arquivos estáticos (assets) na pasta correta?

- **wrangler.json** está correto: `"directory": "./dist/client"`, `"binding": "ASSETS"`, `"not_found_handling": "single-page-application"`.
- **env.d.ts** declara `ASSETS: Fetcher`.
- No **index.ts do Worker** não há uso explícito de `c.env.ASSETS.fetch()`. O fluxo típico com `@cloudflare/vite-plugin` é o plugin injetar o fallback para assets em tempo de build. **Recomendação:** Confirmar no build (ex.: `npm run build`) se o worker exportado inclui o fallback para ASSETS; se não houver, adicionar um `app.all('*', ...)` que encaminhe para `c.env.ASSETS.fetch(c.req.raw)` quando não for rota de API.

**Resumo:** Configuração de assets está correta no wrangler; falta apenas garantir que o Worker encaminhe requisições não-API para ASSETS (se o plugin não fizer isso).

---

## 2. Segurança e Isolamento (Multi-tenant)

### Todas as queries ao Supabase possuem filtro por `store_id`?

**Sim.** Todas as operações Supabase que tocam dados por loja usam `store_id`:

| Arquivo        | Operação              | Filtro / uso de store_id |
|----------------|-----------------------|---------------------------|
| products.ts    | GET lista produtos    | `.eq('store_id', store.id)` |
| orders.ts      | POST criar pedido     | `store_id: store.id` no insert (orders e order_items) |
| orders.ts      | POST payment          | `.eq('store_id', store.id)` no select e no update |
| orders.ts      | GET lista pedidos     | `.eq('store_id', store.id)` |
| orders.ts      | GET pedido por id     | `.eq('store_id', store.id)` em orders e order_items |

Não foi encontrada nenhuma query Supabase que liste ou altere dados sem amarrar à loja. **Risco de vazamento entre lojas:** baixo, desde que novas rotas continuem usando sempre `c.get('store')` e aplicando `store_id`.

### storeMiddleware valida slug no D1 antes do Supabase?

**Sim.** O `storeMiddleware`:

1. Exige header `x-store-slug`.
2. Consulta D1: `SELECT * FROM stores WHERE slug = ? AND status = 'active'`.
3. Se não encontrar, retorna 404 (loja não encontrada ou inativa).
4. Seta `c.set("store", store)` e só então chama `next()`.

Todas as rotas em `/api/*` (exceto health) passam por esse middleware; portanto o acesso ao Supabase só ocorre após validar o tenant no D1. **OK.**

---

## 3. Lacunas de Regra de Negócio (Wholesale vs Retail)

### O esquema suporta preços diferenciados (atacado x varejo)?

**Não.** Hoje:

- **Tipos (frontend):** `Product` tem apenas `price: number`.
- **Migrações D1 (referência):** tabela `products` com um único `price REAL`.
- Supabase é usado para produtos/pedidos; não há evidência de colunas `price_wholesale`, `price_retail` ou equivalente no código.

**O que precisa ser alterado (recomendação):**

- Na tabela **products** (Supabase): incluir, por exemplo, `price_retail`, `price_wholesale` e `min_quantity_wholesale` (quantidade mínima para preço de atacado).
- Atualizar tipos em `src/react-app/types/index.ts` e payloads da API (lista de produtos, carrinho, criação de pedido) para refletir o tipo de cliente (varejo/atacado) e a quantidade, e aplicar o preço correto no backend.

### Existe lógica de “quantidade mínima” no backend ou frontend?

**Não.** Não há:

- Campos no schema de produtos para quantidade mínima (atacado ou geral).
- Validação no Worker (ex.: em POST `/api/orders`) de quantidade mínima por item ou por tipo de preço.
- Regra no frontend (ex.: aviso ou bloqueio no carrinho por quantidade mínima).

Isso é uma **lacuna de regra de negócio** para atacado.

---

## 4. Status da Integração Financeira

### O checkout está gerando pedidos no Supabase com sucesso?

**Sim.** O fluxo está implementado e isolado por tenant:

1. Frontend envia POST `/api/orders` com `{ items: [...] }` (itens com id, name, price, quantity, image).
2. Worker valida usuário (authMiddleware), loja (storeMiddleware), calcula total e:
   - Insere em `orders` com `store_id`, `user_id`, `total`, `status: 'pending'`.
   - Insere em `order_items` com `order_id`, `store_id`, `product_id`, quantity, price, etc.
3. Retorna `orderId` e o frontend abre o modal de pagamento.

**Observação:** O payload do carrinho envia `image`; o backend espera `image_url` para gravar `product_image`. Hoje o backend usa `item.image_url || null`, então a imagem do item no pedido fica sempre `null`. **Correção sugerida:** no backend aceitar também `item.image` e mapear para `product_image`.

### O que falta para o Webhook do Mercado Pago ser funcional e seguro?

O endpoint atual:

```ts
// src/worker/routes/webhooks.ts
webhooks.post("/mercadopago", async (c) => {
    return c.json({ success: true, code: "HOOK_RECEIVED_AND_QUEUED" }, 200);
});
```

**Lacunas críticas:**

| Item | Status | Ação necessária |
|------|--------|------------------|
| Validação de autenticidade | Não implementada | Validar assinatura/token do Mercado Pago (ex.: header `x-signature` / `x-signature-id`) com o secret configurado no projeto MP, e rejeitar (ex.: 401/403) se inválido. |
| Persistência do evento | Não implementada | Ler body (id do pagamento, status, etc.), identificar o pedido (ex.: `payment_id` ou external_reference = order_id) e atualizar `orders` no Supabase. |
| Atualização de status | Não implementada | Mapear status MP (ex.: `approved`, `rejected`, `pending`) para `orders.payment_status` (e eventualmente `orders.status`) e fazer `.update()` com `store_id` para manter isolamento. |
| Idempotência | Não considerada | Evitar processar o mesmo `id` do webhook duas vezes (ex.: tabela de eventos processados ou checagem de estado antes de atualizar). |

Sem isso, o webhook não é nem funcional nem seguro.

Além disso, a rota **POST `/api/orders/:id/payment`** hoje retorna PIX/boleto/cartão **mock** (strings fixas); não há chamada à API do Mercado Pago para criar preferência/pagamento. Para integração real é necessário:

- Usar `MERCADO_PAGO_ACCESS_TOKEN` (já em `Env`) para criar pagamento/preferência no MP.
- Guardar o `payment_id` (ou link) retornado pelo MP em `orders` e, no webhook, usar esse identificador para atualizar o pedido.

---

## 5. Frontend e Branding Dinâmico

### As variáveis CSS (:root) estão sendo alimentadas por dados da API (store_settings)?

**Não.** Hoje:

- **index.css** define `:root` com valores fixos: `--brand-primary`, `--brand-secondary`, `--brand-surface`, `--brand-text` (ex.: #1B4332, #FFD166, etc.).
- Não existe em nenhum lugar do código:
  - Endpoint ou tipo `store_settings` (ou equivalente) na API.
  - Leitura de tema/cores da loja e aplicação em `document.documentElement.style` ou em classes dinâmicas.
- Nome da loja e identidade visual estão hardcoded (ex.: “Natfoods”, “Chips da Amazônia”, cores nos componentes da Home).

Para um SaaS replicável por loja, o esperado seria:

- Ter em D1 ou Supabase uma tabela/config `store_settings` (por `store_id`) com cores, logo, nome, etc.
- Expor um endpoint (ex.: GET `/api/store` ou `/api/store_settings`) protegido pelo mesmo `storeMiddleware`.
- No frontend, ao carregar a loja (por slug ou por env), buscar essas configurações e aplicar nas variáveis CSS e nos textos.

---

## Resumo: O que está OK

- **Modularização:** Worker enxuto; rotas e core separados; não há monolito no index.
- **Multi-tenant:** Todas as queries Supabase usam `store_id`; storeMiddleware valida slug no D1 antes de seguir.
- **Checkout:** Criação de pedidos (orders + order_items) no Supabase com store_id e user_id funcionando.
- **Configuração de assets:** wrangler aponta para `./dist/client` e ASSETS; SPA configurada.

---

## O que é Crítico

1. **Webhook Mercado Pago:** Sem validação de token/assinatura, sem persistência e sem atualização de status no Supabase — não é seguro nem funcional.
2. **Pagamento real:** POST `/api/orders/:id/payment` retorna dados mock; falta integrar com a API do Mercado Pago e persistir `payment_id`.
3. **Atacado/Varejo:** Schema e regras não suportam preços diferenciados nem quantidade mínima; necessário evoluir modelo e backend/frontend.
4. **Branding dinâmico:** Cores e identidade fixas no código; sem `store_settings` e sem alimentar `:root` pela API, o produto não é replicável por loja do ponto de vista visual.

---

## Lista de Tarefas Prioritárias

| # | Tarefa | Prioridade |
|---|--------|------------|
| 1 | Implementar validação de assinatura no webhook Mercado Pago e persistir evento + atualizar `orders.payment_status` (e status) no Supabase com `store_id`. | Crítica |
| 2 | Substituir mock em POST `/api/orders/:id/payment` por chamada real à API do Mercado Pago (criar preferência/pagamento) e salvar `payment_id` em `orders`. | Crítica |
| 3 | Corrigir mapeamento carrinho → pedido: aceitar `image` no payload e preencher `product_image` em `order_items`. | Alta |
| 4 | Garantir que o Worker sirva o SPA: se o build não injetar fallback, adicionar rota que encaminhe requisições não-API para `c.env.ASSETS.fetch(c.req.raw)`. | Alta |
| 5 | Evoluir schema de produtos (Supabase): adicionar `price_retail`, `price_wholesale`, `min_quantity_wholesale` (ou equivalente) e regras de negócio no backend. | Alta |
| 6 | Implementar no backend (e opcionalmente no frontend) validação de quantidade mínima para atacado. | Média |
| 7 | Criar modelo e endpoint de `store_settings` (cores, nome, logo) e alimentar variáveis `:root` e textos no frontend a partir da API. | Média |

Com isso, o sistema fica alinhado a um padrão profissional, seguro e replicável para múltiplas lojas (atacado/varejo e integração Mercado Pago).
