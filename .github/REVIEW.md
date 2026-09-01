# Critérios de code review — vendas

Fontes: [`AGENTS.md`](../AGENTS.md), [`docs/PRD.md`](../docs/PRD.md), [`.agents/docs/`](../.agents/docs/).

---

## Checklist universal (toda PR)

- [ ] Escopo fechado em **um ticket**
- [ ] Sem secrets, `.env`, `.dev.vars` ou PII em log
- [ ] Validação Zod nas bordas HTTP novas/alteradas
- [ ] Erros com status HTTP correto; 500 sem vazar stack
- [ ] Sem `any` ou `catch` vazio
- [ ] Nomes alinhados ao PRD e `src/contracts/`

---

## Worker / API (Hono)

Aplicar quando mudar `src/worker/`:

- [ ] Rota fina; lógica em `core/db/*Repo`
- [ ] `store_id` em toda operação multi-tenant
- [ ] Envelope `{ success, data }` / `{ success, false, error }`
- [ ] `logServerError` em falhas inesperadas
- [ ] `docs/api-contract.md` atualizado se contrato mudou

---

## Frontend (React)

Aplicar quando mudar `src/react-app/`:

- [ ] Chamadas via `apiFetch` / hooks — não `fetch` solto na page
- [ ] Tipos de `@/contracts/`
- [ ] Estados loading / vazio / erro
- [ ] UI: tokens em [`docs/padroes-ui.md`](../docs/padroes-ui.md)
- [ ] Componente &lt; ~200 linhas ou justificativa

---

## Segurança

- [ ] Auth admin: JWT + `store_members`
- [ ] Plataforma: `PLATFORM_OPERATOR_EMAILS`
- [ ] Webhook MP: assinatura quando exigida em produção

---

## Testes

- [ ] `npm run lint:check && npm run typecheck && npm run build` verdes
- [ ] Testes automatizados quando suíte existir

---

## Resultado

| Resultado | Quando |
|-----------|--------|
| **Approve** | Checklists ok |
| **Request changes** | Bug, segurança, contrato quebrado |
| **Comment** | Sugestão não bloqueante |

DoD completo: [`padrões/11-Definition-of-Done.md`](../padrões/11-Definition-of-Done.md).
