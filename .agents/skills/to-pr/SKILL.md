---
name: to-pr
description: Checklist de PR no padrão Vendas — validação e teste por persona.
---

# Skill — to-pr

**Objetivo:** PR revisável com instruções de teste alinhadas ao modelo multi-loja.

## Quando usar

Usuário pediu abrir PR.

## Checklist geral

1. Checks verdes:

```bash
npm run lint:check
npm run typecheck
npm run build
```

2. Uma fatia por PR (uma feature/fix rastreável).
3. Push + PR com [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md).
4. Na descrição, indicar **superfície(s)** afetada(s): vitrine | admin loja | plataforma | worker.

Base branch: `main`.

## Como testar — marcar no corpo da PR

Escolha o bloco que se aplica (pode ser mais de um):

### Vitrine (cliente final)

- [ ] `x-store-slug` / subdomínio correto; loja demo ou slug de teste
- [ ] Fluxo: catálogo → carrinho → checkout (guest e/ou logado)
- [ ] PIX ou MP conforme mudança; pedido aparece com status coerente
- [ ] Carrinho isolado por loja (trocar slug não mistura itens)

### Admin loja (lojista)

- [ ] Login Supabase + membro em `store_members` para a loja
- [ ] Rota `/admin/*` relevante (produtos, pedidos, settings, etc.)
- [ ] Sem acesso a dados de outra loja (trocar slug no header/override)

### Plataforma (operador)

- [ ] Usuário em `PLATFORM_OPERATOR_EMAILS` (Worker + `VITE_PLATFORM_OPERATOR_EMAILS`)
- [ ] Menu Plataforma visível; rotas `/api/platform/*` sem vazar tenant
- [ ] Criar/listar loja ou plano conforme escopo da PR

### Worker / integrações

- [ ] `npx wrangler dev` + `npm run dev` em paralelo
- [ ] Webhook MP: idempotência / assinatura se tocado em `webhooks.ts`
- [ ] Cron/pedidos `pending`: se alterou expiração ou estoque

## O que NÃO fazer

- Merge ou force-push em branch alheia
- PR sem indicar como testar a persona impactada
