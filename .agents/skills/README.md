# Skills — padrão de trabalho (Vendas)

Checklists para manter o **mesmo padrão** em tarefas repetidas. Não são integrações com ferramentas externas.

## Modelo de negócio (contexto)

SaaS **multi-loja**. Três superfícies distintas — ao implementar ou revisar, identifique **qual(is)** é(são) afetada(s):

| Superfície | Persona | O que é |
|------------|---------|---------|
| **Vitrine** (`storefront`) | Cliente final | Catálogo, carrinho, checkout, confirmação de pedido |
| **Admin loja** (`admin`) | Lojista (`store_members`) | Produtos, pedidos, settings, newsletter, Mercado Pago da loja |
| **Plataforma** (`platform`) | Operador SaaS | Criar lojas, planos, entitlements, analytics agregados |

**Worker** atende as três: rotas com `x-store-slug` (vitrine + admin) vs `/api/platform/*` (sem tenant de loja).

Regras que valem em **qualquer** fatia: isolamento por `store_id`, estoque via RPC, pagamento MP idempotente, status de pedido em inglês no banco/API.

Docs: [`docs/PRD.md`](../../docs/PRD.md), [`docs/escopo-negocio.md`](../../docs/escopo-negocio.md).

## Skills

| Skill | Padroniza |
|-------|-----------|
| [`implement`](implement/SKILL.md) | Escopo por superfície + módulo referência + checks |
| [`to-commit`](to-commit/SKILL.md) | Commit atômico com escopo do domínio |
| [`to-pr`](to-pr/SKILL.md) | PR + como testar por persona |
| [`code-review`](code-review/SKILL.md) | Review com foco multi-tenant e negócio |

Rodar **somente** quando o usuário pedir. Não encadear automaticamente.
