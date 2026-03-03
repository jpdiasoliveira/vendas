# Schema do banco (Supabase) — referência

Documento gerado a partir da listagem das tabelas/colunas do projeto. Padrão: **snake_case** em colunas.

---

## audit_logs
| coluna        | tipo                     | aceita_nulo |
|---------------|--------------------------|-------------|
| id            | uuid                     | NO          |
| store_id      | uuid                     | NO          |
| user_id       | uuid                     | YES         |
| action        | text                     | NO          |
| resource_type | text                     | NO          |
| resource_id   | text                     | YES         |
| details       | jsonb                    | YES         |
| created_at    | timestamp with time zone | NO          |

---

## categories
| coluna     | tipo                     | aceita_nulo |
|------------|--------------------------|-------------|
| id         | uuid                     | NO          |
| store_id   | uuid                     | NO          |
| slug       | text                     | NO          |
| name       | text                     | NO          |
| created_at | timestamp with time zone | NO          |

---

## delivery_addresses
| coluna       | tipo                     | aceita_nulo |
|--------------|--------------------------|-------------|
| id           | uuid                     | NO          |
| order_id     | uuid                     | YES         |
| store_id     | uuid                     | NO          |
| street       | text                     | NO          |
| number       | text                     | NO          |
| complement   | text                     | YES         |
| neighborhood | text                     | NO          |
| city         | text                     | NO          |
| state_code   | text                     | NO          |
| zip_code     | text                     | NO          |

---

## order_items
| coluna       | tipo    | aceita_nulo |
|--------------|---------|-------------|
| id           | uuid    | NO          |
| order_id     | uuid    | NO          |
| store_id     | uuid    | NO          |
| product_id   | uuid    | NO          |
| product_name | text    | NO          |
| quantity     | integer | NO          |
| price        | numeric | NO          |

---

## orders
| coluna          | tipo                     | aceita_nulo |
|-----------------|--------------------------|-------------|
| id              | uuid                     | NO          |
| store_id        | uuid                     | NO          |
| user_id         | uuid                     | YES         |
| status          | text                     | NO          |
| total           | numeric                  | NO          |
| payment_method  | text                     | YES         |
| payment_status  | text                     | YES         |
| payment_id      | text                     | YES         |
| created_at      | timestamp with time zone | NO          |
| customer_email  | text                     | YES         |
| customer_name   | text                     | YES         |
| customer_phone  | text                     | YES         |

---

## products
| coluna                  | tipo                     | aceita_nulo |
|-------------------------|--------------------------|-------------|
| id                      | uuid                     | NO          |
| store_id                | uuid                     | NO          |
| category_id             | uuid                     | YES         |
| name                    | text                     | NO          |
| description             | text                     | YES         |
| price                   | numeric                  | NO          |
| image_url               | text                     | YES         |
| stock                   | integer                  | YES         |
| status                  | text                     | NO          |
| created_at              | timestamp with time zone | NO          |
| updated_at              | timestamp with time zone | YES         |
| price_wholesale          | numeric                  | YES         |
| min_quantity_wholesale   | integer                  | YES         |
| slug                    | text                     | NO          |

---

## store_members
| coluna     | tipo                     | aceita_nulo |
|------------|--------------------------|-------------|
| id         | uuid                     | NO          |
| user_id    | uuid                     | NO          |
| store_id   | uuid                     | NO          |
| role       | text                     | NO          |
| created_at | timestamp with time zone | YES         |

---

## store_settings
| coluna               | tipo                     | aceita_nulo |
|----------------------|--------------------------|-------------|
| store_id             | uuid                     | NO          |
| primary_color        | text                     | YES         |
| secondary_color      | text                     | YES         |
| navbar_bg            | text                     | YES         |
| logo_url             | text                     | YES         |
| mp_access_token      | text                     | YES         |
| mp_public_key        | text                     | YES         |
| minimum_order_value  | numeric                  | YES         |
| updated_at           | timestamp with time zone | YES         |

---

## stores
| coluna       | tipo                     | aceita_nulo |
|--------------|--------------------------|-------------|
| id           | uuid                     | NO          |
| slug         | text                     | NO          |
| display_name | text                     | NO          |
| status       | text                     | YES         |
| created_at   | timestamp with time zone | YES         |
| updated_at   | timestamp with time zone | YES         |

---

## view_audit_report (view)

A view do histórico precisa expor as colunas que o Worker usa. Hoje no banco você tem: `id`, `store_id`, `action_key`, `created_at`, `user_email`, `action_description`, `type`, `details`. O código do Worker espera ainda: `user_id`, `action`, `resource_type`, `resource_id`, `nome_recurso`. Use o script em **docs/supabase-view-audit-report-fix.sql** para recriar a view alinhada.

---

*Última atualização: fev/2026 — conferir no Supabase (information_schema) se alterar tabelas.*
