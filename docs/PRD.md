# PRD — Release atual (sistema Vendas)

Documento de **produto** alinhado ao que está implementado no repositório.  
Negócio estável (visão, personas): [`escopo-negocio.md`](escopo-negocio.md).  
Contrato HTTP: [`api-contract.md`](api-contract.md) *(parcial — ver §9)*.

**Stack:** React (Vite) + Cloudflare Worker (Hono) + Supabase (Auth, Postgres, Storage) + Mercado Pago.

---

## 1. O que é o sistema

**Vendas** é um SaaS **multi-loja**: cada tenant (`store`) tem vitrine pública, painel do lojista e dados isolados por `store_id`. Um time de **operadores** usa a **Central plataforma** para criar lojas, definir planos/limites e ver métricas agregadas.

**Identificação da loja:** header `x-store-slug`, subdomínio ou domínio customizado (`store_domains`).

---

## 2. Três superfícies (como no código)

| Superfície | Rotas React (principais) | API Worker |
|------------|--------------------------|------------|
| **Vitrine** | `/`, `/pedidos`, `/order/:id/confirmation`, `/pedido/acompanhar`, `/login` | `/api/products`, `/api/orders`, `/api/shipping`, `/api/coupons`, `/api/store/*` |
| **Admin da loja** | `/admin/pedidos`, `/admin/produtos/*`, `/admin/loja/*`, `/admin/historico` | `/api/admin/*` |
| **Central plataforma** | `/admin/platform/dashboard`, `lojas`, `planos`, `configuracoes` | `/api/platform/*` |

```text
Operador ──► Central plataforma ──► cria/gerencia lojas e planos
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Loja A       Loja B       Loja C   ← tenants (store_id)
        │           │           │
   vitrine+admin  vitrine+admin  ...
        └───────────┴───────────┘
              clientes finais
```

---

## 3. Personas e papéis (implementados)

| Persona | Auth | Papel técnico | Onde |
|---------|------|---------------|------|
| Cliente final | Supabase (opcional) ou guest | — | Vitrine |
| Equipe da loja | Supabase JWT + `store_members` | `staff`, `admin`, `owner` | Admin da loja |
| Operador SaaS | JWT + e-mail em `PLATFORM_OPERATOR_EMAILS` | operador plataforma | `/admin/platform/*` |

### Permissões por role (`store_members`)

| Capacidade | `staff` | `admin` | `owner` |
|------------|---------|---------|---------|
| Produtos, categorias, pedidos (leitura/edição básica) | ✓ | ✓ | ✓ |
| Settings vitrine/checkout, newsletter, auditoria | — | ✓ | ✓ |
| Credenciais Mercado Pago da loja | — | — | ✓ |
| Excluir produto | — | ✓ | ✓ |
| Cancelar pedido já pago | — | ✓ | ✓ |

Persona de negócio **≠** role de login. Lojista não herda permissões de operador plataforma.

Matriz completa rota × papel: [`agents/roles-matrix.md`](agents/roles-matrix.md).

---

## 4. Vitrine — funcionalidades (release)

### Catálogo e experiência
- Listagem de produtos (`GET /api/products`)
- Produtos em destaque / trending (`GET /api/products/trending`, view `view_top_sellers`)
- Filtro por categoria, modal de produto (home single-page)
- Hero 3D (GLTF) + fundo animado
- Tema da loja: cores, logo, banner, textos (`GET /api/store/settings` → `StoreSettingsContext`)

### Carrinho e checkout
- Carrinho por loja (`localStorage` com chave por slug)
- Preço **atacado** quando quantidade ≥ `minQuantityWholesale`
- Checkout em etapas: cliente → frete (CEP) → pagamento
- **Guest checkout** quando `requireLoginToCheckout = false`
- Cupom: validação (`POST /api/coupons/validate`) — aplica no criar pedido
- Frete: cotação por CEP (`POST /api/shipping/quote`) — faixas em `store_shipping_fare_bands`
- Pedido mínimo (`minimum_order_value` em settings)
- Criação de pedido com **`Idempotency-Key`** (anti-duplicata)
- Preços, frete e cupom recalculados **no servidor** (não confia só no front)

### Pagamento
- **PIX** — QR e copia-e-cola (`POST /api/orders/:id/payment`, método `pix`)
- **Cartão** — Mercado Pago Checkout Pro (`credit_card` → `init_point`)
- Webhook MP idempotente (`POST /api/webhooks/mercadopago`)
- Polling de status PIX na página de confirmação

### Pós-compra
- Confirmação: `/order/:orderId/confirmation`
- Histórico logado: `/pedidos`
- Rastreio guest: `/pedido/acompanhar` (+ e-mail)
- Login e-mail/senha (`POST /api/login`) e **Google OAuth** (Supabase)

### Outros
- Newsletter no rodapé (`POST /api/store/newsletter/subscribe`)

---

## 5. Admin da loja — funcionalidades (release)

| Módulo | Rota UI | Destaques |
|--------|---------|-----------|
| **Pedidos** | `/admin/pedidos` | Lista, drawer de detalhe, alterar status, código de rastreio, sync manual MP |
| | | Export **PDF fechamento de vendas** (client-side) |
| **Produtos** | `/admin/produtos/catalogo` | CRUD, estoque, atacado, upload imagem, enquadramento de capa |
| **Categorias** | `/admin/produtos/categorias` | CRUD |
| **Vitrine** | `/admin/loja/vitrine` | Tema, hero, story, benefícios, preview ao vivo |
| **Checkout** | `/admin/loja/checkout` | Pedido mínimo, obrigar login, regras de checkout |
| **Frete** | `/admin/loja/frete` | CRUD faixas de CEP (`store_shipping_fare_bands`) |
| **Cupons** | `/admin/loja/cupons` | CRUD cupons percent/fixed (`store_coupons`) |
| **Mercado Pago** | (aba em checkout/settings) | Credenciais por loja (owner), teste de conexão |
| **Newsletter** | `/admin/loja/newsletter` | Lista inscritos, export CSV |
| **Auditoria** | `/admin/historico` | `audit_logs` por loja |

**Limite de plano:** ao criar produto, API verifica `maxProducts` via `resolve_store_entitlements` → 403 se exceder.

---

## 6. Central plataforma — funcionalidades (release)

| Módulo | Rota UI | API |
|--------|---------|-----|
| Dashboard | `/admin/platform/dashboard` | Overview, GMV, MRR estimado, ranking lojas, gráfico novas lojas/semana |
| Lojas | `/admin/platform/lojas` | Listar, criar loja + owner, domínios customizados |
| Planos | `/admin/platform/planos` | Catálogo, versões de preço, editor de entitlements |
| Configurações | `/admin/platform/configuracoes` | Dias de carência pós-assinatura (`subscriptionGraceDays`) |

**Entitlements por plano (exemplos):** `max_products`, `staff_members_limit`, `custom_domain`, `advanced_analytics`.

**Cobrança recorrente automática** da assinatura: fora de escopo deste release (dados em SQL; sem checkout de plano in-app).

**Ferramenta operador:** override de slug da vitrine no browser (impersonação/dev) — banner `AdminImpersonationBanner`.

---

## 7. Integrações

| Sistema | Uso no produto |
|---------|----------------|
| **Supabase Auth** | Login, OAuth Google, JWT admin |
| **Supabase DB** | Multi-tenant, pedidos, catálogo, billing metadata |
| **Supabase Storage** | Imagens de produto (`product-images`) |
| **Mercado Pago** | PIX, Checkout Pro, webhook; token por loja (criptografado) ou fallback global |
| **Resend** *(opcional)* | E-mail transacional (`order_created`, `order_paid`, `order_shipped`) se `RESEND_API_KEY` |
| **Cloudflare Worker** | API edge, cron expiração pedidos `pending` |

---

## 8. Regras de negócio (enforçadas no código)

| ID | Regra |
|----|--------|
| R1 | Estoque: RPC `create_order_with_stock_lock` — sem oversell |
| R2 | Isolamento: toda query de negócio filtra `store_id` do tenant atual |
| R3 | Preço/frete/cupom: calculados no Worker na criação do pedido |
| R4 | Pagamento `paid`/`approved`: webhook MP ou sync manual — não só UI |
| R5 | Status de pedido (inglês): `pending`, `paid`, `approved`, `shipped`, `delivered`, `cancelled` |
| R6 | Cancelar pedido pago: exige `admin`/`owner` + motivo; metadado `manual_refund_required` quando aplicável |
| R7 | Estoque reposto ao cancelar pedido que tinha reserva |
| R8 | Pedidos `pending` antigos: cron → RPC `expire_old_orders` |
| R9 | Plano: `maxProducts` e bloqueio pós-carência via `resolve_store_entitlements` |
| R10 | Dados do pedido: `customer_name`, `customer_phone`, `delivery_address`; itens em `orders.items` (JSONB) |

---

## 9. Lacunas conhecidas (produto vs código)

| Item | Situação |
|------|----------|
| **Frete (faixas CEP)** | Admin em `/admin/loja/frete` — API `GET/POST/PATCH/DELETE /api/admin/shipping-fare-bands` |
| **Cupons** | Admin em `/admin/loja/cupons` — API `GET/POST/PATCH/DELETE /api/admin/coupons` |
| **`api-contract.md`** | Atualizado — ver [`api-contract.md`](api-contract.md); manter em sync ao mudar rotas |
| **Página de produto dedicada** | Só modal na home — sem URL `/produto/:slug` |
| **Testes unitários (Vitest)** | `npm test` na CI (job `check`) |
| **Testes E2E** | Playwright na CI (job `e2e`); executa de verdade com secrets Supabase + `demo-store` seedada; caso contrário, skip |
| **Cobrança automática de assinatura** | Fora de escopo |

---

## 10. Fora de escopo deste release

- App mobile nativo  
- Marketplace (carrinho com lojas diferentes)  
- ERP / NF-e  
- White-label além de tema/logo/cores por loja  

---

## 11. Critérios de pronto (feature neste release)

1. Funciona na superfície correta (vitrine / admin / plataforma) sem quebrar tenant  
2. Respeita R1–R10  
3. Role correto (`staff` / `admin` / `owner` / operador)  
4. Se mudou API: atualizar `src/contracts/` e `api-contract.md`  
5. Se mudou schema: migration/SQL em `migrations/` ou `docs/supabase-*.sql`  
6. `npm run lint:check`, `typecheck`, `build` e `npm test` verdes  

---

## 12. Referências técnicas

| Artefato | Caminho |
|----------|---------|
| Rotas React | `src/react-app/App.tsx` |
| API Worker | `src/worker/index.ts`, `src/worker/routes/` |
| Tipos compartilhados | `src/contracts/schema.ts` |
| Schema DB | `docs/SCHEMA-SUPABASE.md` |
| Colunas `orders` | `docs/MANUAL-DE-VOO-ARQUITETURA-SCHEMA.md` |
| Arquitetura | [`.agents/docs/architecture.md`](../.agents/docs/architecture.md) |
| UI | [`padroes-ui.md`](padroes-ui.md) |
