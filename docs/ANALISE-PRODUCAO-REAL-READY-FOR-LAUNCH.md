# Análise: O que falta para o sistema ser "Produção Real" (Ready for Launch)

Com base na arquitetura atual e no Manual de Voo, segue o **levantamento técnico por pilar** e os **gaps** a fechar para o Samuel começar a vender sem sustos.

---

## 1. Pagamentos (Mercado Pago)

### Estado atual
- **PIX:** Integração real com a API do Mercado Pago (`api.mercadopago.com`). O token vem de `MERCADO_PAGO_ACCESS_TOKEN` (env). **Não está hardcoded como sandbox** — depende do token que você configurar (sandbox ou produção).
- **Boleto:** URL de redirecionamento **hardcoded em sandbox:**  
  `https://www.mercadopago.com.br/sandbox/payments/ticket`  
  → Em produção deve ser a URL real de boleto do MP (ex.: checkout pro).
- **Cartão:** URL genérica de redirect: `https://www.mercadopago.com.br/checkout/v1/redirect` (não sandbox explícito, mas fluxo não está completo como PIX).
- **Webhook:** Existe `POST /api/webhooks/mercadopago`. Só trata status **`approved`** (atualiza pedido e baixa estoque). Responde 200 para não aprovar também (evita retentativas em excesso).

### Gaps
| Gap | Severidade | O que fazer |
|-----|------------|-------------|
| Boleto em produção | Alta | Trocar URL do boleto para a de produção (ou usar SDK/Checkout Pro do MP) quando for go-live. |
| Credenciais MP | Média | Garantir que em produção se use **Access Token de produção** no `MERCADO_PAGO_ACCESS_TOKEN` (`.dev.vars` / secrets do Cloudflare). |
| Status recusado/expirado/estornado | Média | Webhook hoje **não** atualiza o pedido para `rejected`, `cancelled` ou `refunded`. O frontend mostra "Pendente" e o Samuel não vê "Recusado" ou "Estornado" de forma automática. **Sugestão:** no webhook, para `rejected`/`cancelled`/`refunded`, atualizar `orders.status` (e, se estava pago, chamar estorno de estoque). |
| payment_status no banco | Baixa | O webhook atualiza só `orders.status`. O schema tem `payment_status`; para relatórios e consistência, considerar atualizar também `payment_status` (e `paid_at` quando aprovado). |

---

## 2. Notificações (novo pedido / lojista)

### Estado atual
- **Webhook MP:** Só notifica o **nosso backend** (atualiza pedido). Não notifica o Samuel.
- **Painel admin:** Lista de pedidos é carregada ao abrir a página e ao clicar em **"Atualizar"**. **Não há polling, SSE nem push.** O Samuel **precisa dar refresh** para ver pedido novo.
- **E-mail/WhatsApp/Push:** Não há integração. Nenhum envio de "Você tem um novo pedido" para o lojista.

### Gaps
| Gap | Severidade | O que fazer |
|-----|------------|-------------|
| Samuel não sabe de pedido novo sem refresh | Alta | Implementar **polling** (ex.: a cada 30–60 s na aba Pedidos) ou **Supabase Realtime** em `orders` para a loja; ou notificação push no browser (com permissão). |
| Sem aviso por e-mail/WhatsApp | Média | Opcional para v1: ao criar pedido (ou ao webhook `approved`), disparar e-mail (Resend, SendGrid, etc.) ou WhatsApp Business API para o lojista. Depende de configuração (e-mail da loja em `store_settings` ou env). |

---

## 3. Configurações de loja (store_settings)

### Estado atual
- **Nome da loja:** Vem da tabela **`stores`** (`display_name`), via `getStoreBySlug` no middleware. **Não** vem de `store_settings`.
- **Logo, valor mínimo, horário:** A tabela **`store_settings`** existe no schema (primary_color, logo_url, minimum_order_value, etc.), mas **não há nenhuma rota ou tela** que leia/grave essas colunas. Tudo que depende disso está **hardcoded** (cores, textos, valor mínimo não validado no checkout).

### Gaps
| Gap | Severidade | O que fazer |
|-----|------------|-------------|
| Samuel não altera nome/logo/valor mínimo/horário | Alta | Criar **GET/PATCH** (ou PUT) para `store_settings` (por store_id) e uma tela **Configurações da loja** no admin: Nome (ou manter em `stores`), Logo URL, Valor mínimo de pedido. Usar esses dados no frontend e validar valor mínimo no carrinho/checkout. |
| Horário de funcionamento | Média | Se quiser "aberto/fechado" ou mensagem por horário: guardar em `store_settings` (ex.: JSON ou colunas) e exibir/bloquear checkout no site. |

---

## 4. Segurança e variáveis de ambiente

### Estado atual
- **Worker (env.d.ts):** `MERCADO_PAGO_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY?`, `NOTIFICATION_BASE_URL?`. Nada sensível em código.
- **Frontend:** Usa `VITE_STORE_SLUG`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (doc). Valores vêm do `.env` no build.
- **Deploy:** Worker na Cloudflare (wrangler); assets servidos pelo Worker. Domínio real depende de configurar no Cloudflare (custom domain) e apontar o front para a API real.

### Gaps
| Gap | Severidade | O que fazer |
|-----|------------|-------------|
| Documentar .dev.vars e produção | Média | Ter um `.env.example` (ou doc) listando todas as variáveis (Worker + Vite) e, em produção, configurar **secrets** no Wrangler e variáveis de build (VITE_*) no pipeline. |
| Domínio de produção | Média | Configurar domínio da loja no Cloudflare e `VITE_API_URL` apontando para a URL do Worker (ex.: `https://api.seudominio.com`). |
| CORS | Baixa | CORS atual permite `http://localhost:5173`. Em produção, adicionar a origem real (ex.: `https://loja.seudominio.com`). |

---

## 5. Edge cases (casos de erro)

### Estado atual
- **Estoque no meio da compra:** O pedido é **criado** (POST /api/orders) **sem checagem de estoque**. A baixa de estoque só ocorre quando o pagamento é **aprovado** (webhook ou fluxo de pagamento). Ou seja: dois clientes podem “comprar” o último item; ao aprovar os dois, o estoque pode ficar negativo (a baixa usa `Math.max(0, current - quantity)`), então não estoura, mas pode vender mais do que tem.
- **Telefone / endereço no formulário:** Os campos são **opcionais**. O front envia `customerName`, `customerPhone`, `deliveryAddress` só se preenchidos; o backend grava quando fornecidos. **Não há validação** que impeça envio sem telefone ou endereço.

### Gaps
| Gap | Severidade | O que fazer |
|-----|------------|-------------|
| Estoque insuficiente no checkout | Alta | Antes de criar o pedido (ou ao criar): validar estoque por item (comparar quantidade no carrinho com `products.stock`). Se faltar, retornar 400 com mensagem clara e não criar pedido; no front, exibir aviso e bloquear "Finalizar compra" ou remover itens acima do estoque. |
| Obrigar telefone e/ou endereço | Média | Definir regra de negócio (ex.: telefone e endereço obrigatórios). No front, validação antes de submit; no backend, validação no POST /api/orders e retorno 400 se faltar. |

---

## 6. Fluxo de devolução / estorno

### Estado atual
- **Cancelamento pelo Samuel:** Ao mudar status do pedido para **"Cancelado"** (admin), a função **`updateOrderStatus`** verifica se o pedido **estava pago** (`isPaidStatus(oldStatus)`). Se sim, chama **`increaseStockForOrder`** → **estorno de estoque** é feito. Depois atualiza `orders.status` para `cancelled`.
- **Estorno apenas de status:** Só é feita a atualização de status no banco; **não** há chamada à API do Mercado Pago para estorno financeiro (refund). O cliente pode continuar com o dinheiro aprovado no MP até que o estorno seja feito manualmente no painel do MP (ou por outra integração).

### Gaps
| Gap | Severidade | O que fazer |
|-----|------------|-------------|
| Estoque ao cancelar | Ok | Já implementado: pedido pago + cancelado → estorno de estoque. |
| Estorno financeiro no MP | Média | Se o Samuel quiser que, ao cancelar, o valor seja estornado no MP: integrar API de refund do Mercado Pago e chamar ao marcar como cancelado (e, se desejado, só estornar estoque após confirmação do refund). |

---

## Resumo: prioridade para “produção real”

| Prioridade | Pilar | Ação |
|------------|--------|------|
| 1 | Pagamentos | Trocar URL do boleto para produção; tratar no webhook status `rejected`/`cancelled`/`refunded` (atualizar pedido e, se pago, estornar estoque). |
| 2 | Notificações | Implementar polling ou Realtime na aba Pedidos para o Samuel ver novos pedidos sem refresh. |
| 3 | Configurações | Expor store_settings (GET/PATCH) e tela de configurações (nome, logo, valor mínimo); validar valor mínimo no checkout. |
| 4 | Edge cases | Validar estoque antes de criar pedido; tornar telefone e endereço obrigatórios (front + backend) se for a regra. |
| 5 | Segurança/Deploy | Documentar envs; configurar domínio real e CORS; usar token de produção do MP. |
| 6 | Estorno | Opcional: integrar refund no MP ao cancelar pedido. |

Com isso, o sistema fica alinhado ao Manual de Voo e com os principais gaps mapeados para um lançamento controlado.
