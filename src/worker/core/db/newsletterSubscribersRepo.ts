import type { NewsletterSubscriberListItem } from "../../../contracts/schema.js";
import { getSupabase } from "../supabase.js";

type DbRow = { email: string; status: string; created_at: string };

function rowToItem(row: DbRow): NewsletterSubscriberListItem {
  return {
    email: row.email,
    status: row.status,
    subscribedAt: row.created_at,
  };
}

/**
 * Insere inscrição na newsletter. E-mail normalizado em minúsculas.
 * Duplicata (mesmo store_id + email): trata como sucesso idempotente (não expõe se já existia).
 */
export async function insertNewsletterSubscriber(
  env: Env,
  storeId: string,
  email: string
): Promise<{ inserted: boolean }> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .insert({ store_id: storeId, email, status: "active" })
    .select("id");

  if (!error && Array.isArray(data) && data.length > 0) {
    return { inserted: true };
  }

  if (error?.code === "23505") {
    return { inserted: false };
  }

  throw new Error(error?.message ?? "Erro ao gravar inscrição");
}

/**
 * Lista paginada **só** para `store_id` (isolamento por loja).
 */
export async function listNewsletterSubscribersPage(
  env: Env,
  storeId: string,
  opts: { limit: number; offset: number }
): Promise<{ items: NewsletterSubscriberListItem[]; total: number }> {
  const supabase = getSupabase(env);
  const { limit, offset } = opts;
  const from = offset;
  const to = offset + limit - 1;

  const { data, error, count } = await supabase
    .from("newsletter_subscribers")
    .select("email, status, created_at", { count: "exact" })
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as DbRow[];
  return {
    items: rows.map(rowToItem),
    total: typeof count === "number" ? count : rows.length,
  };
}

/**
 * Exportação CSV: todas as linhas da loja, em lotes (teto de segurança).
 */
export async function listAllNewsletterSubscribersForExport(
  env: Env,
  storeId: string,
  maxRows = 10_000
): Promise<DbRow[]> {
  const supabase = getSupabase(env);
  const pageSize = 500;
  const out: DbRow[] = [];
  let offset = 0;

  while (out.length < maxRows) {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("email, status, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as DbRow[];
    out.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return out.slice(0, maxRows);
}

function csvEscape(field: string): string {
  if (/[",\n\r]/.test(field)) return `"${field.replace(/"/g, '""')}"`;
  return field;
}

/** CSV com BOM UTF-8 para Excel. */
export function buildNewsletterSubscribersCsv(rows: DbRow[]): string {
  const header = ["email", "status", "subscribed_at"].join(",");
  const lines = [header];
  for (const r of rows) {
    lines.push([csvEscape(r.email), csvEscape(r.status), csvEscape(r.created_at)].join(","));
  }
  return `\uFEFF${lines.join("\n")}`;
}
