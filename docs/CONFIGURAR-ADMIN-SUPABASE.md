# Configurar painel admin (Supabase + Worker)

Se o login funciona no frontend mas o painel redireciona ou mostra "Token inválido ou expirado" / "Você não tem acesso a esta loja", siga estes passos.

---

## 1. Tabela `stores` e loja Natfoods

O Worker usa o header `x-store-slug` (ex.: `natfoods` do `.env` **VITE_STORE_SLUG**) e busca a loja na tabela `stores`. A loja precisa existir e ter `status = 'active'`.

No **SQL Editor** do Supabase, execute (ajuste o `id` se quiser outro UUID):

```sql
-- Inserir loja Natfoods (se ainda não existir)
INSERT INTO stores (id, slug, display_name, status, created_at, updated_at)
VALUES (
  'a0000001-0001-0001-0001-000000000001',
  'natfoods',
  'Natfoods - Chips da Amazônia',
  'active',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  status = 'active',
  updated_at = now();
```

---

## 2. Tabela `store_members` — vincular seu usuário à loja

O Worker só aceita acesso às rotas `/api/admin/*` se o usuário (do JWT) estiver na tabela **store_members** para essa loja.

### 2.1. Pegar seu `user_id` (UUID do Auth)

- No Supabase: **Authentication** → **Users** → clique no seu usuário (o que você usa para fazer login).
- Copie o **UUID** (ex.: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### 2.2. Inserir você como admin da loja

Use o **mesmo `store_id`** que você usou na loja (no exemplo acima: `a0000001-0001-0001-0001-000000000001`). Substitua `SEU_USER_ID_AQUI` pelo UUID do passo 2.1:

```sql
-- Vincular seu usuário à loja Natfoods como admin
INSERT INTO store_members (user_id, store_id, role, created_at, updated_at)
VALUES (
  'SEU_USER_ID_AQUI',
  'a0000001-0001-0001-0001-000000000001',
  'admin',
  now(),
  now()
)
ON CONFLICT (user_id, store_id) DO UPDATE SET
  role = 'admin',
  updated_at = now();
```

Se a tabela `store_members` ainda não existir, execute antes o script em **docs/supabase-store-members.sql**.

---

## 3. JWT Secret (token inválido ou expirado)

Se a mensagem for **"Token inválido ou expirado"**, o Worker não está conseguindo validar o JWT com o **SUPABASE_JWT_SECRET** do `.dev.vars`.

### Onde pegar o JWT Secret

1. Supabase → **Project Settings** (ícone de engrenagem).
2. Menu **API** (ou **Auth**).
3. Seção **JWT Settings**.
4. Copie o valor de **JWT Secret** (não use "anon key" nem "service role key").

### Colar no `.dev.vars`

No arquivo **.dev.vars** na raiz do projeto:

```
SUPABASE_JWT_SECRET=valor_colado_sem_aspas
```

- Sem aspas, sem espaço no início/fim, uma linha só.
- Reinicie o Worker (`Ctrl+C` e de novo `npx wrangler dev`).

### Se ainda falhar: gerar novo JWT Secret (avançado)

No Supabase, às vezes o valor mostrado é “gerado” e você pode precisar de um novo:

- Em **Project Settings** → **API** → **JWT Settings** pode haver opção para **regenerar** o secret (depende da versão do dashboard).
- Se regenerar, **atualize o `.dev.vars`** com o novo valor e reinicie o Worker.
- **Atenção:** isso invalida tokens antigos; os usuários precisam fazer login de novo.

---

## 4. Conferir `.env` no frontend

No **.env** (ou variáveis de ambiente do frontend), confira:

- **VITE_STORE_SLUG=natfoods** (ou o mesmo `slug` que você usou na tabela `stores`).
- **VITE_SUPABASE_URL** e **VITE_SUPABASE_ANON_KEY** (para o cliente Supabase no frontend).

---

## Resumo rápido

| Sintoma                         | O que fazer                                                                 |
|---------------------------------|-----------------------------------------------------------------------------|
| "Token inválido ou expirado"    | Ajustar **SUPABASE_JWT_SECRET** no `.dev.vars` (ver item 3) e reiniciar Worker. |
| "Você não tem acesso a esta loja" | Inserir seu usuário em **store_members** (item 2) e garantir que a loja existe (item 1). |
| 400 "x-store-slug é obrigatória" | Definir **VITE_STORE_SLUG** no `.env` do frontend.                          |

Depois de qualquer alteração no `.dev.vars` ou no banco, reinicie o Worker e, se mudar de loja/usuário, faça logout e login de novo.
