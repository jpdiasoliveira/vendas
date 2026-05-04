# Schema do banco (Supabase) — Fonte única da verdade

Documento alinhado à auditoria. **Não invente colunas:** use apenas as listadas aqui. Padrão: **snake_case** nas colunas.

---

## orders

| Coluna                  | Tipo                     | Valor Padrão       | Aceita Vazio? |
| ----------------------- | ------------------------ | ------------------ | ------------- |
| id                      | uuid                     | uuid_generate_v4() | NO            |
| store_id                | uuid                     | null               | NO            |
| user_id                 | uuid                     | null               | YES           |
| status                  | text                     | 'pending'::text    | NO            |
| total                   | numeric                  | null               | NO            |
| payment_method          | text                     | null               | YES           |
| payment_status          | text                     | 'pending'::text    | YES           |
| payment_id              | text                     | null               | YES           |
| created_at              | timestamp with time zone | now()              | NO            |
| customer_email          | text                     | null               | YES           |
| customer_name           | text                     | null               | YES           |
| customer_phone          | text                     | null               | YES           |
| tracking_code           | text                     | null               | YES           |
| shipping_method         | text                     | 'standard'::text   | YES           |
| shipping_cost           | numeric                  | 0.00               | YES           |
| estimated_delivery_date  | timestamp with time zone | null               | YES           |
| cancellation_reason     | text                     | null               | YES           |
| paid_at                 | timestamp with time zone | null               | YES           |
| delivered_at            | timestamp with time zone | null               | YES           |
| updated_at              | timestamp with time zone | now()              | YES           |
| delivery_address        | text                     | null               | YES           |
| items                   | jsonb                    | '[]'::jsonb        | YES           |

**Uso (Manual de Voo):** Dados do cliente em `customer_name`, `customer_phone`, `delivery_address`. Itens do pedido em `items` (JSONB). Rastreabilidade em `paid_at`, `delivered_at`, `updated_at`. Ignore a tabela `delivery_addresses` para dados principais.

---

## audit_logs

| Coluna      | Tipo                     |
| ----------- | ------------------------ |
| id          | uuid                     |
| store_id    | uuid                     |
| admin_id    | uuid                     |
| action      | text                     |
| entity_type | text                     |
| entity_id   | text                     |
| details     | jsonb                    |
| created_at  | timestamp with time zone |
| action_key  | text                     |
| resource_id | uuid                     |

---

## categories

| Coluna     | Tipo                     |
| ---------- | ------------------------ |
| id         | uuid                     |
| store_id   | uuid                     |
| slug       | text                     |
| name       | text                     |
| created_at | timestamp with time zone |

---

## delivery_addresses

*(Tabela externa; para dados principais do pedido use `orders.delivery_address`.)*

| Coluna       | Tipo                     |
| ------------ | ------------------------ |
| id           | uuid                     |
| order_id     | uuid                     |
| store_id     | uuid                     |
| street       | text                     |
| number       | text                     |
| complement   | text                     |
| neighborhood | text                     |
| city         | text                     |
| state_code   | text                     |
| zip_code     | text                     |

---

## order_items

| Coluna       | Tipo                     |
| ------------ | ------------------------ |
| id           | uuid                     |
| order_id     | uuid                     |
| store_id     | uuid                     |
| product_id   | uuid                     |
| product_name | text                     |
| quantity     | integer                  |
| price        | numeric                  |

---

## products

| Coluna                 | Tipo                     |
| ---------------------- | ------------------------ |
| id                     | uuid                     |
| store_id               | uuid                     |
| category_id            | uuid                     |
| name                   | text                     |
| description            | text                     |
| price                  | numeric                  |
| image_url              | text                     |
| stock                  | integer                  |
| status                 | text                     |
| created_at             | timestamp with time zone |
| updated_at             | timestamp with time zone |
| price_wholesale        | numeric                  |
| min_quantity_wholesale | integer                  |
| slug                   | text                     |
| weight_g               | integer                  |
| length_cm               | integer                  |
| width_cm                | integer                  |
| height_cm               | integer                  |

---

## store_members

| Coluna     | Tipo                     |
| ---------- | ------------------------ |
| id         | uuid                     |
| user_id    | uuid                     |
| store_id   | uuid                     |
| role       | text                     |
| created_at | timestamp with time zone |

---

## store_settings

| Coluna               | Tipo                     |
| -------------------- | ------------------------ |
| store_id             | uuid                     |
| primary_color        | text                     |
| secondary_color      | text                     |
| navbar_bg            | text                     |
| logo_url             | text                     |
| mp_access_token      | text                     |
| mp_public_key        | text                     |
| minimum_order_value  | numeric                  |
| updated_at           | timestamp with time zone |

---

## stores

| Coluna       | Tipo                     |
| ------------ | ------------------------ |
| id           | uuid                     |
| slug         | text                     |
| display_name | text                     |
| status       | text                     |
| created_at   | timestamp with time zone |
| updated_at   | timestamp with time zone |

---

## newsletter_subscribers

Inscrições do formulário **Newsletter** na vitrine (`POST /api/store/newsletter/subscribe`). E-mail guardado em minúsculas; **único por par** `(store_id, email)`.

| Coluna     | Tipo                     | Valor padrão | Notas        |
| ---------- | ------------------------ | ------------ | ------------ |
| id         | uuid                     | gen_random_uuid() | PK   |
| store_id   | uuid                     | —            | FK → stores(id), ON DELETE CASCADE |
| email      | text                     | —            | 3–320 chars  |
| status     | text                     | `active`     | Reservado (ex.: opt-out futuro) |
| created_at | timestamp with time zone | now()      | —            |

**Admin (Worker):** listagem paginada `GET /api/admin/newsletter-subscribers?limit=&offset=`; exportação `GET /api/admin/newsletter-subscribers/export.csv` — sempre filtrado por `store_id` da loja do contexto.

---

## view_audit_report

| Coluna     | Tipo                     |
| ---------- | ------------------------ |
| id         | uuid                     |
| created_at | timestamp with time zone |
| store_id   | uuid                     |
| action     | text                     |
| action_key | text                     |
| entity_type| text                     |

---

## view_top_sellers

*(Usada para GET /api/products/trending. Pode expor product_id além de store_id — conferir na view no Supabase.)*

| Coluna   | Tipo |
| -------- | ---- |
| store_id | uuid |
