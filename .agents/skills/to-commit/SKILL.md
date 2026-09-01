---
name: to-commit
description: Checklist de commit atômico no padrão Vendas (Conventional Commits por domínio).
---

# Skill — to-commit

**Objetivo:** um commit = uma intenção clara, com escopo que reflete a superfície do produto.

## Quando usar

Usuário pediu commitar.

## Escopos sugeridos (Conventional Commits)

Use o escopo que melhor descreve **onde** o usuário sente a mudança:

| Escopo | Quando |
|--------|--------|
| `storefront` | Vitrine, catálogo, home, layout público |
| `checkout` | Carrinho, pagamento, confirmação de pedido |
| `admin` | Painel do lojista (produtos, pedidos, settings) |
| `platform` | Central SaaS (lojas, planos, analytics) |
| `orders` | Regra de pedido/estoque (Worker + contrato) |
| `worker` | API genérica, middlewares, cron |
| `webhooks` | Mercado Pago |
| `contracts` | Tipos compartilhados |
| `docs` | PRD, api-contract, migrations doc |

Exemplos:

```text
feat(checkout): permite frete por faixa de CEP na vitrine
fix(admin): corrige listagem de pedidos sem store_id
feat(platform): limite de produtos por plano na criação de loja
```

## Checklist

1. `git status` + `git diff` — uma fatia coerente (idealmente uma superfície ou um fluxo ponta a ponta).
2. Sem `.env`, `.dev.vars`, secrets, seeds com PII real.
3. Mensagem: **porquê** + escopo do domínio.
4. Commit criado; `git status` limpo do que deveria entrar.

## O que NÃO fazer

- Push ou PR
- Commit misturando vitrine + plataforma sem relação
- `--no-verify` sem pedido explícito
