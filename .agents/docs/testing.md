# Testes

## Estado atual

| Suíte | Status | Comando |
|-------|--------|---------|
| Lint | Ativo | `npm run lint:check` |
| Typecheck | Ativo | `npm run typecheck` |
| Build | Ativo | `npm run build` |
| Unit (`*.spec.ts`) | Ativo (local) | `npm test` |
| E2E | **A implementar** | `npm run test:e2e` (futuro) |

Padrão alvo: [`padrões/08-Padroes-Testes-E2E.md`](../../padrões/08-Padroes-Testes-E2E.md).

## Checks obrigatórios antes de PR

```bash
npm run lint:check
npm run typecheck
npm run build
npm test
```

Se mudou API, auth ou persistência: adicionar/rodar testes quando a suíte existir.

## Testes manuais / operacionais

| Script | Uso |
|--------|-----|
| `npm run fire-test:probe` | Sonda endpoints básicos |
| `npm run webhook-stress` | Stress de webhook MP (dev) |

Diretrizes locais: [`docs/LOCAL-TESTING-GUIDELINES.md`](../../docs/LOCAL-TESTING-GUIDELINES.md).

## Quando adicionar testes automatizados

Prioridade sugerida:

1. Utils puros (`checkoutFlowUtils`, mappers, validação Zod).
2. Repos com lógica (mocks do cliente Supabase).
3. E2E: checkout guest, login admin, criar pedido — com prefixo de fixture `e2e-test` e teardown seletivo.

## E2E (futuro) — regras

- Prefixo fixo em fixtures: `e2e-test`, emails via helper `uniqueEmail()`.
- **Nunca** `TRUNCATE` ou delete sem filtro por prefixo/id criado no teste.
- Bootstrap do app de teste deve espelhar middlewares globais do Worker.

## Descrições

- `it('...')` em **PT-BR**; código do teste em inglês (alinhado ao restante do repo).
