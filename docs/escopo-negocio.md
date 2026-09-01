# Escopo de negócio — Vendas

Documento de negócio **estável** do produto. O escopo do **release em curso** (o que implementar agora) está em [`PRD.md`](PRD.md).

---

## 1. Visão do produto

**Nome do produto:** Vendas

**Uma frase:** Plataforma SaaS para lojistas operarem vitrine online, pedidos e pagamentos em lojas isoladas, com central de operação para onboarding e planos.

**Objetivos principais:** vender online (B2C), operar pedidos, medir performance da plataforma, integrar Mercado Pago e Supabase.

---

## 2. Personas

| Persona | Papel | Dor principal |
|---------|-------|----------------|
| Cliente final | Compra na vitrine da loja | Checkout simples, confiança no pagamento, rastreio do pedido |
| Lojista / equipe | Opera o painel da loja (`staff`, `admin` ou `owner`) | Cadastrar produtos, pedidos, MP e vitrine sem depender de dev |
| Operador plataforma | Time que opera o SaaS | Criar lojas, planos, suporte, visão agregada |

**Nota:** persona ≠ role técnico. Membro da loja: `store_members.role` = `staff` | `admin` | `owner` (Supabase JWT).

---

## 3. Regras críticas (backend/banco)

1. Estoque não pode ficar negativo por corrida de checkout — usar RPC com lock.
2. Toda leitura/escrita de catálogo e pedidos respeita `store_id` do tenant atual.
3. Pagamento confirmado só via webhook/fluxo MP idempotente — não confiar só no frontend.

---

## 4. Diretrizes de produto

**MVP inclui:**

- Vitrine + carrinho + checkout (PIX e cartão MP)
- Atacado por quantidade mínima
- Painel admin da loja (pedidos, catálogo, settings, newsletter, auditoria)
- Central plataforma (lojas, planos, analytics)
- Mercado Pago por loja + webhook
- Multi-loja (tenant) + entitlements por plano

**MVP não inclui:**

- UI admin para faixas de frete e cupons (hoje: SQL/seed; checkout já consome)
- White-label completo por loja (além de tema/cores/logo)
- Faturamento automático de assinatura fora do escopo SQL já documentado
- App nativo

**Integrações obrigatórias no beta:**

- Supabase (Auth + DB + Storage imagens)
- Mercado Pago
- Cloudflare (Worker + hospedagem front)

**Segurança:**

- JWT para admin; RLS no Supabase; secrets só no Worker
- LGPD: minimizar PII em logs; política de retenção a definir com jurídico

---

## 5. Escalabilidade e restrições

- Edge Worker para API — stateless; estado no Supabase.
- Picos de checkout: dependem de RPC e limites do MP/Supabase.
- Imagens de produto: Supabase Storage com RLS.

---

## 6. Links

| Artefato | Caminho |
|----------|---------|
| PRD release | [`PRD.md`](PRD.md) |
| Schema | [`SCHEMA-SUPABASE.md`](SCHEMA-SUPABASE.md) |
| Mockups | `mockups/` *(a criar quando houver design formal)* |
| Metodologia | [`padrões/README.md`](../padrões/README.md) |
