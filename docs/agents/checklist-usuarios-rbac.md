# Checklist — usuários, papéis e RBAC

Rastreio de tarefas por persona/papel. Referências: [`roles-matrix.md`](roles-matrix.md), [`PRD.md`](../PRD.md) §3, [`escopo-negocio.md`](../escopo-negocio.md).

**Como usar:** marque `[x]` ao concluir. Uma tarefa = um ticket/branch/PR quando for código.

---

## Fase 0 — Entregar o que já está em PR (bloqueia o resto)

Ordem de merge: **#1 → (#2 e #3 em paralelo) → #4**

- [ ] Merge [PR #1](https://github.com/jpdiasoliveira/vendas/pull/1) — governança, Vitest, admin frete/cupons, matriz de papéis, menu staff (frete/cupons)
- [ ] Merge [PR #2](https://github.com/jpdiasoliveira/vendas/pull/2) — Playwright E2E checkout guest (local)
- [ ] Merge [PR #3](https://github.com/jpdiasoliveira/vendas/pull/3) — página `/produto/:slug` + API `by-slug`
- [ ] Merge [PR #4](https://github.com/jpdiasoliveira/vendas/pull/4) — CI (`npm test` + job E2E)
- [ ] Atualizar PRD §9 e `escopo-negocio.md` (frete/cupons e E2E na CI — remover texto legado “só SQL”)
- [ ] Configurar secrets `SUPABASE_*` no GitHub Actions para E2E real (opcional mas recomendado)

---

## Fase 1 — Alta prioridade (RBAC completo na prática)

### 1.1 Equipe da loja (owner / admin)

Hoje só o **operador plataforma** cria o owner na Central. Falta o lojista gerir a própria equipe.

- [x] Definir escopo no PRD (rotas UI, API, quem pode convidar/remover)
- [x] API `GET /api/admin/members` — listar membros da loja (`store_id`)
- [x] API `POST /api/admin/members` — convidar (e-mail + role `staff` | `admin`) — owner; admin se PRD permitir
- [x] API `PATCH /api/admin/members/:id` — alterar role — **só owner**
- [x] API `DELETE /api/admin/members/:id` — remover membro — **só owner** (não remover último owner)
- [x] Integrar convite Supabase (`inviteUserByEmail` ou fluxo existente em `provisionStoreOwnerUser`)
- [x] Enforçar `staff_members_limit` do plano (`resolve_store_entitlements`) ao adicionar membro
- [x] UI `/admin/loja/equipe` (ou aba em hub da loja) — lista, convite, editar role, remover
- [x] Atualizar `api-contract.md`, `roles-matrix.md` e `src/contracts/`
- [x] Testes: 403 staff tentando convidar; limite de plano; não remover único owner

### 1.2 Guards de UI admin (alinhar com API)

`AdminGuard` só exige login. Várias telas retornam 403 na API sem feedback amigável na UI.

- [x] Componente ou hook `useAdminRoleGate(minRole)` reutilizável (`staff` | `admin` | `owner`)
- [x] Rotas **admin/owner only**: `/admin/loja/vitrine`, `/admin/loja/checkout`, `/admin/loja/newsletter`, `/admin/historico` — redirect ou tela “Acesso restrito” para staff
- [x] **Staff — produtos**: esconder botão **Excluir** (`AdminProductRow`) — API já exige admin/owner
- [x] **Staff — pedidos**: esconder **Sincronizar pagamento** — API já exige admin/owner
- [x] **Staff — upload**: mensagem clara se `POST /api/admin/upload` retornar 403 (ou esconder upload até ter permissão)
- [ ] Revisar demais ações sensíveis no drawer de pedidos (cancelamento pago já validado na API)

### 1.3 Testes automatizados por papel

- [x] Spec Vitest: `requireAdminOrOwner` / `requireOwner` (helpers admin)
- [ ] E2E (opcional): login como staff → frete/cupons acessível; settings → bloqueado — aguarda merge PR #2 (Playwright)
- [x] Documentar personas de teste (e-mails seed) em `.agents/docs/testing.md`

---

## Fase 2 — Média prioridade (polish por persona)

### 2.1 Staff

- [ ] Confirmar menu Frete + Cupons após merge PR #1 em produção
- [ ] Avaliar se staff deve ver aba **Checkout** (só leitura) ou manter bloqueado
- [ ] PDF fechamento de vendas: confirmar se staff pode exportar (hoje client-side, sem gate)

### 2.2 Admin

- [ ] Transferência de ownership (owner → outro membro) — produto + API — se necessário no release
- [ ] Auditoria: garantir filtros e performance com muitos logs

### 2.3 Owner

- [ ] Onboarding pós-criação: checklist “configure MP, frete, convide equipe” na UI
- [ ] Documentar em `CONFIGURAR-ADMIN-SUPABASE.md` fluxo sem SQL manual quando equipe existir

### 2.4 Cliente (vitrine)

- [ ] Página `/produto/:slug` em produção (PR #3)
- [ ] Revisar fluxo guest → criar conta depois (vincular pedidos antigos) — decidir se entra no release
- [ ] Perfil mínimo (nome, telefone) — **backlog** se fora do MVP

### 2.5 Guest

- [ ] E2E CI verde com checkout real (secrets + demo-store seedada)
- [ ] Validar `requireLoginToCheckout = true` em loja de teste

### 2.6 Operador plataforma

- [ ] Listar membros de uma loja na Central (somente leitura) — suporte operacional
- [ ] Revisar se `custom_domain` / `advanced_analytics` devem bloquear ações na UI da loja
- [ ] Documentar `PLATFORM_OPERATOR_EMAILS` + `VITE_PLATFORM_OPERATOR_EMAILS` no README de setup

---

## Fase 3 — Baixa prioridade / backlog

- [ ] Área “Minha conta” cliente (endereços salvos, histórico unificado)
- [ ] Notificações por e-mail transacional (Resend) — validar em staging
- [ ] Cobrança automática de assinatura — **fora de escopo** release atual (PRD §9)
- [ ] App mobile, marketplace multi-loja — **fora de escopo**

---

## Por papel — resumo rápido

| Papel | Feito no MVP | Próximo passo principal |
|-------|--------------|-------------------------|
| **Guest** | Checkout, rastreio, newsletter | E2E CI com Supabase |
| **Cliente logado** | `/pedidos`, checkout logado | Perfil (backlog) |
| **Staff** | Pedidos, catálogo, frete/cupons (API) | UI guards + merge PR #1 |
| **Admin** | Settings, newsletter, auditoria | Módulo equipe (com owner) |
| **Owner** | Mercado Pago | **Equipe da loja** (convites, roles, limite plano) |
| **Operador** | Central plataforma | Secrets CI + doc operação |

---

## Critérios de “feito” (por tarefa de código)

1. Gate na **API** (não só esconder botão)
2. UX coerente na **UI** (mensagem ou redirect, padrão `AuditLogs` / `MercadoPagoCredentialsForm`)
3. `docs/api-contract.md` + `roles-matrix.md` atualizados se mudou permissão
4. `npm run lint:check`, `typecheck`, `build`, `npm test` verdes
5. Um ticket rastreável (ver [`issue-tracker.md`](issue-tracker.md))

---

## Histórico

| Data | Nota |
|------|------|
| 2026-09-01 | Checklist inicial a partir da auditoria de papéis e PRs #1–#4 abertas |
