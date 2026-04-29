/**
 * Leituras agregadas para a **Central da Plataforma** (lista de lojas + domínios).
 *
 * Por que ficheiro dedicado?
 * - É um caso de uso “operador global”, não vitrine nem onboarding — evita misturar com `getStoreBySlug`.
 * - O join em memória (`domainsByStore`) é específico desta listagem; manter isolado clarifica onde otimizar paginação mais tarde.
 */

import { getSupabase } from "../../supabase.js";
import { isMissingStoreDomainsTable } from "./storeDomainHelpers.js";

export type PlatformStoreOverview = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
  /** E-mail do owner em `store_members` (via Auth Admin); vazio se indisponível. */
  ownerEmail: string;
  domains: { domain: string; status: string; isPrimary: boolean }[];
};

/**
 * Para que serve: alimentar o dashboard `/admin/platform` com até 250 lojas e os respetivos domínios.
 * O segundo query `.in("store_id", ids)`: uma ida ao servidor para todos os domínios — evita N+1 queries por loja.
 */
export async function listPlatformStores(env: Env): Promise<PlatformStoreOverview[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("stores")
    .select("id, slug, display_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) throw new Error(error.message);
  const stores = rows ?? [];
  if (stores.length === 0) return [];

  const ids = stores.map((s) => String(s.id));
  const { data: domainRows, error: domainErr } = await supabase
    .from("store_domains")
    .select("store_id, domain, status, is_primary")
    .in("store_id", ids)
    .order("is_primary", { ascending: false });
  if (domainErr && !isMissingStoreDomainsTable(domainErr)) throw new Error(domainErr.message);

  const domainsByStore = new Map<string, { domain: string; status: string; isPrimary: boolean }[]>();
  for (const row of domainRows ?? []) {
    const key = String(row.store_id);
    const list = domainsByStore.get(key) ?? [];
    list.push({
      domain: String(row.domain ?? ""),
      status: String(row.status ?? ""),
      isPrimary: row.is_primary === true,
    });
    domainsByStore.set(key, list);
  }

  const ownerByStore = new Map<string, string>();
  const { data: memberRows, error: memErr } = await supabase
    .from("store_members")
    .select("store_id, user_id")
    .in("store_id", ids)
    .eq("role", "owner");
  if (!memErr && memberRows) {
    for (const m of memberRows) {
      const sid = String(m.store_id);
      if (!ownerByStore.has(sid)) ownerByStore.set(sid, String(m.user_id ?? ""));
    }
  }

  const ownerEmailByStore = new Map<string, string>();

  let rpcOk = false;
  if (ids.length > 0) {
    const { data: rpcRows, error: rpcErr } = await supabase.rpc("platform_owner_emails_for_store_ids", {
      p_store_ids: ids,
    });
    if (!rpcErr && Array.isArray(rpcRows)) {
      rpcOk = true;
      for (const row of rpcRows as { store_id?: string; owner_email?: string | null }[]) {
        const sid = String(row.store_id ?? "");
        if (sid) ownerEmailByStore.set(sid, String(row.owner_email ?? ""));
      }
    }
  }

  const ownerIdsNeedingAuth = new Set<string>();
  for (const [sid, uid] of ownerByStore) {
    if (!uid) continue;
    const rpcEmail = (ownerEmailByStore.get(sid) ?? "").trim();
    if (!rpcOk || !rpcEmail) ownerIdsNeedingAuth.add(uid);
  }

  const emailByUserId = new Map<string, string>();
  if (ownerIdsNeedingAuth.size > 0) {
    const toFetch = [...ownerIdsNeedingAuth];
    const chunkSize = 12;
    for (let i = 0; i < toFetch.length; i += chunkSize) {
      const slice = toFetch.slice(i, i + chunkSize);
      await Promise.all(
        slice.map(async (uid) => {
          try {
            const { data, error } = await supabase.auth.admin.getUserById(uid);
            if (!error && data?.user?.email) emailByUserId.set(uid, String(data.user.email));
          } catch {
            /* ignore */
          }
        })
      );
    }
  }

  return stores.map((row) => {
    const sid = String(row.id);
    const ownerId = ownerByStore.get(sid) ?? "";
    const fromRpc = (ownerEmailByStore.get(sid) ?? "").trim();
    const ownerEmail =
      fromRpc || (ownerId ? emailByUserId.get(ownerId) ?? "" : "");
    return {
      id: sid,
      slug: String(row.slug ?? ""),
      displayName: String(row.display_name ?? ""),
      status: String(row.status ?? ""),
      createdAt: String(row.created_at ?? ""),
      ownerEmail,
      domains: domainsByStore.get(sid) ?? [],
    };
  });
}
