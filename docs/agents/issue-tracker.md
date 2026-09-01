# Issue tracker — convenções

Ferramenta: **issue tracker do time** (Jira, Linear, GitHub Issues ou equivalente — definir abaixo).

## Projeto

| Campo | Valor |
|-------|-------|
| Ferramenta | *(preencher)* |
| Projeto / board | *(preencher)* |
| URL base | *(preencher)* |

## Estados (workflow)

Ajustar nomes e IDs conforme a ferramenta escolhida:

| Estado (nome) | Quando usar |
|---------------|-------------|
| Backlog | Ticket criado, não iniciado |
| Em andamento | Dev pegou o ticket (`implement`) |
| Em revisão | PR aberta — incluir link na descrição |
| Concluído | Merge na `main` |
| Bloqueado | Dependência externa ou outra PR |

## Labels / tipos

| Label | Uso |
|-------|-----|
| `FEATURE` | Epic / feature do `/to-spec` |
| `BACK-END` | Subticket Worker / Supabase |
| `FRONT-END` | Subticket React |
| `FULL-STACK` | Quando inseparável |

## Convenções de branch

```text
feat/<ticket-id-kebab>-<slug-curto>
fix/<ticket-id-kebab>-<slug-curto>
```

Exemplo: `feat-vendas-42-filtro-pedidos-admin`

## Convenções de commit

Conventional Commits:

```text
feat(orders): descrição curta
fix(checkout): descrição
docs(PRD): descrição
```

## Integração com a IDE (opcional)

Se o time usar MCP ou extensão do tracker na IDE, documentar aqui:

- Nome da integração
- Como autenticar
- Convenção de IDs usada nas branches

## Fluxo documentação → código

Ver [`padrões/06-Fluxo-Desenvolvimento-Codigo.md`](../padrões/06-Fluxo-Desenvolvimento-Codigo.md):

`/to-us` → `/to-spec` → `/to-tickets` → `implement` → `to-commit` → `to-pr`

## Bloqueios conhecidos

- Não mergear branch de PR aberta de outro dev — esperar cair na `main`
- 1 PR = 1 ticket (exceto tickets formalmente inseparáveis)

## Backlog RBAC / usuários

Checklist acionável: [`checklist-usuarios-rbac.md`](checklist-usuarios-rbac.md).
