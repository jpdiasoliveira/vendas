/**
 * Helpers de **domínio** (hostname / URL) e deteção de erros do Postgres relacionados a `store_domains`.
 *
 * Por que ficheiro separado do `storeReadRepo` / `storeWriteRepo`?
 * - Estas funções são **puras ou quase puras** (sem `getSupabase`): fáceis de testar e de reutilizar.
 * - Evita duplicar a mesma lógica em leitura (resolver loja por host) e escrita (normalizar domínios ao gravar).
 * - Um repositório “único” misturava SQL + normalização de strings + interpretação de erros — violava o SRP.
 */

/**
 * Para que serve: detetar se o erro do Supabase indica que a tabela `store_domains` ainda não existe no projeto.
 * Útil em ambientes de migração parcial: em vez de falhar a app inteira, alguns fluxos retornam `null` ou ignoram o vínculo.
 *
 * O que significa cada ramo:
 * - `code === "42P01"`: código SQL standard “undefined_table” no PostgreSQL.
 * - regex em `message`: alguns drivers devolvem só texto humano com o nome da tabela.
 */
export function isMissingStoreDomainsTable(err: unknown): boolean {
  const code =
    typeof err === "object" && err != null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const message =
    typeof err === "object" && err != null && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";
  return code === "42P01" || /store_domains/i.test(message);
}

/**
 * Para que serve: normalizar o que o operador escreveu no painel (URL completa, maiúsculas, barras) para **uma chave de domínio** consistente na tabela.
 * Usado antes de `insert` / `upsert` em `store_domains`.
 *
 * O que faz cada `.replace`:
 * - remove esquema `http(s)://` para comparar só host;
 * - remove barra final e ponto final (FQDN com trailing dot).
 */
export function normalizeStoreDomainInput(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/\.$/, "");
}
