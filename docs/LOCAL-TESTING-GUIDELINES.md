# Diretrizes de Desenvolvimento: Testes Locais e Banco de Dados

## 1. Abordagem de Desenvolvimento (Local First)

Neste projeto, adotamos a abordagem **Local First** para novas funcionalidades que envolvem armazenamento de dados (como captura de e-mails, preferências do usuário, carrinho não logado, etc.).

**O que isso significa?**
1. **Prova de Conceito (PoC) Local:** Antes de criar tabelas no banco de dados (Supabase/D1), implementamos a funcionalidade salvando os dados localmente no navegador do usuário (usando `localStorage` ou estado em memória).
2. **Validação de Fluxo:** Validamos se o fluxo da interface de usuário (UI) e a experiência (UX) estão funcionando conforme o esperado.
3. **Preparação para o Backend:** Todo o código é estruturado de forma a facilitar a futura substituição do armazenamento local por chamadas de API reais. Isolamos a lógica de armazenamento em funções ou hooks específicos.

## 2. Transição para o Banco de Dados (Ready for DB)

Quando a funcionalidade local estiver homologada e aprovada para produção, seguimos o fluxo abaixo para integrá-la ao banco de dados:

1. **Definição de Schema:**
   - Adicionamos a nova tabela ao documento oficial de schema (`docs/SCHEMA-SUPABASE.md` ou `ARCHITECTURE.md`).
   - Definimos os tipos de dados (TypeScript) em `src/worker/core/schema.ts` seguindo o padrão `camelCase` para o frontend e `snake_case` para o banco.

2. **Implementação no Backend (Worker):**
   - Criamos o repositório em `src/worker/core/database.ts` para interagir com o Supabase.
   - Criamos as rotas de API em `src/worker/routes/` (ex: `POST /api/newsletter/subscribe`).

3. **Substituição no Frontend:**
   - Trocamos as chamadas de `localStorage` pelas chamadas de API reais usando `apiFetch` (definido em `src/react-app/services/api.ts`).
   - Mantemos a estrutura do componente UI intacta.

## 3. Registro de Funcionalidades em Teste Local

Funcionalidades que já migraram para o Supabase + Worker:

- **Newsletter:** tabela `newsletter_subscribers` (ver `migrations/5.sql` e `docs/SCHEMA-SUPABASE.md`); API `POST /api/store/newsletter/subscribe` (vitrine envia `x-store-slug`).

*(Mantenha esta lista atualizada conforme novas funcionalidades forem desenvolvidas nesta abordagem).*
