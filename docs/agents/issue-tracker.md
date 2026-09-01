# Issue tracker — convenções

Ferramenta: **GitHub Issues** no repositório [`jpdiasoliveira/vendas`](https://github.com/jpdiasoliveira/vendas).

## Projeto

| Campo | Valor |
|-------|-------|
| Ferramenta | GitHub Issues |
| Repositório | `jpdiasoliveira/vendas` |
| URL base | https://github.com/jpdiasoliveira/vendas/issues |

## Estados (workflow)

GitHub Issues não tem workflow customizado neste repo — usar **labels + assignee + milestone** (quando aplicável):

| Estado (nome) | Como marcar | Quando usar |
|---------------|-------------|-------------|
| Backlog | Issue aberta, sem assignee | Ticket criado, não iniciado |
| Em andamento | Assignee definido + label `in-progress` (opcional) | Dev pegou o ticket (`implement`) |
| Em revisão | PR aberta — link na descrição da issue (`Closes #N`) | Aguardando review |
| Concluído | Issue fechada (manual ou via PR) | Merge na `main` |
| Bloqueado | Label `blocked` + comentário com motivo | Dependência externa ou outra PR |

## Labels / tipos

Criar no GitHub conforme necessidade (sugestão inicial):

| Label | Uso |
|-------|-----|
| `feature` | Nova funcionalidade / epic do escopo |
| `bug` | Correção de comportamento incorreto |
| `backend` | Worker, Supabase, contratos API |
| `frontend` | React (vitrine, admin, plataforma) |
| `full-stack` | Quando inseparável (ex.: checkout) |
| `docs` | PRD, contrato HTTP, governança |
| `blocked` | Aguardando dependência |

## Convenções de branch

```text
feat/<issue-num>-<slug-curto>
fix/<issue-num>-<slug-curto>
chore/<issue-num>-<slug-curto>
```

Exemplo: `feat/42-pagina-produto-slug` (issue `#42`).

Sem issue rastreável: evitar branch de feature — abrir issue mínima antes do `implement` (ver [`AGENTS.md`](../../AGENTS.md)).

## Convenções de commit

Conventional Commits com escopo de domínio:

```text
feat(storefront): descrição curta
fix(checkout): descrição
test(e2e): descrição
docs(PRD): descrição
```

Corpo do commit: foco no **porquê**, não só no que mudou.

## Integração com PR

- Título da PR: mesmo padrão do commit ou `feat(scope): resumo (#N)`
- Corpo: checklist de teste por persona (vitrine / admin / plataforma)
- Fechar issue: `Closes #N` ou `Fixes #N` na descrição da PR

Template: [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md)

## Integração com a IDE (opcional)

MCP ou extensão do tracker: **não configurado** neste repositório. Se o time adotar ferramenta externa (Linear, Jira), atualizar a tabela **Projeto** acima e manter as convenções de branch/commit.

## Fluxo documentação → código

Ver [`padrões/06-Fluxo-Desenvolvimento-Codigo.md`](../../padrões/06-Fluxo-Desenvolvimento-Codigo.md):

escopo em [`docs/PRD.md`](../PRD.md) → ticket → `implement` → `to-commit` → `to-pr`

## Bloqueios conhecidos

- **1 ticket = 1 branch = 1 PR** — não misturar módulos na mesma branch
- Não mergear branch de PR aberta de outro dev — esperar cair na `main`
- E2E na CI exige secrets Supabase + loja `demo-store` seedada (sem isso, testes fazem skip — ver [`.agents/docs/testing.md`](../../.agents/docs/testing.md))
