## Vendas — SaaS multi-loja

Plataforma multi-loja com vitrine, painel do lojista e central da plataforma.

### Setup local

```bash
npm install
cp .env.example .env.local    # ajustar VITE_DEFAULT_STORE_SLUG, Supabase
cp .dev.vars.example .dev.vars  # secrets do Worker
npm run dev                     # Vite :5173
npx wrangler dev                # Worker :8787 — rotas /api/*
```

### Documentação

| Documento | Descrição |
|-----------|-----------|
| [`AGENTS.md`](AGENTS.md) | Regras para IAs e devs |
| [`docs/PRD.md`](docs/PRD.md) | Escopo do release atual |
| [`.agents/docs/`](.agents/docs/) | Arquitetura, padrões, segurança, dados, testes |
| [`padrões/`](padrões/) | Metodologia da empresa (copiável) |

### Validação (= CI)

```bash
npm run lint:check
npm run typecheck
npm run build
```
