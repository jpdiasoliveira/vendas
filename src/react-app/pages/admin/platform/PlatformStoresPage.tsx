import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, RefreshCw, Search, UserCog } from "lucide-react";
import { StoreStatusBadge } from "@/react-app/components/admin/StoreStatusBadge";
import { usePlatformShell } from "@/react-app/contexts/PlatformShellContext";
import {
  platformApiFetch,
  setStoreSlugOverride,
  type PlatformStoreOverview,
  type PlatformStoreRankingRowDto,
} from "@/react-app/services/api";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);

const PlatformStoresPage = () => {
  const { storesListVersion } = usePlatformShell();
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState<PlatformStoreOverview[]>([]);
  const [rankingRows, setRankingRows] = useState<PlatformStoreRankingRowDto[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingRank, setLoadingRank] = useState(true);

  const gmvByStoreId = useMemo(() => {
    const m = new Map<string, PlatformStoreRankingRowDto>();
    for (const r of rankingRows) m.set(r.storeId, r);
    return m;
  }, [rankingRows]);

  const loadStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const data = await platformApiFetch<PlatformStoreOverview[]>("/api/platform/stores");
      setStores(data);
    } catch (e) {
      console.error("[PlatformStoresPage]", e);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  }, []);

  const loadRanking = useCallback(async () => {
    setLoadingRank(true);
    try {
      const ranking = await platformApiFetch<PlatformStoreRankingRowDto[]>(
        "/api/platform/analytics/store-ranking?limit=50"
      );
      setRankingRows(ranking);
    } catch {
      setRankingRows([]);
    } finally {
      setLoadingRank(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadStores(), loadRanking()]);
  }, [loadStores, loadRanking]);

  useEffect(() => {
    void refresh();
  }, [refresh, storesListVersion]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return stores;
    return stores.filter((s) => {
      const email = (s.ownerEmail ?? "").toLowerCase();
      return (
        s.displayName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        email.includes(q)
      );
    });
  }, [stores, q]);

  const manageStoreAsAdmin = (storeSlug: string) => {
    setStoreSlugOverride(storeSlug);
    window.location.href = "/admin/pedidos";
  };

  const busy = loadingStores || loadingRank;

  return (
    <div className="w-full max-w-none px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-800/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Gestor de Lojas
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
            Visão consolidada de todas as lojas da plataforma. Em <strong className="text-[#1B4332]">Gerenciar loja</strong>{" "}
            abres o painel dessa loja como se estivesses no dia a dia dela (precisas de permissão nessa loja).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[color:var(--brand-primary)]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] shadow-sm transition hover:bg-[#FAF8F3] lg:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden />
          Atualizar lista
        </button>
      </div>

      <div className="sticky top-0 z-20 mb-6 border-b border-slate-800/10 bg-gradient-to-b from-[#FAF8F3]/98 to-[#FAF8F3]/90 py-3 backdrop-blur-sm">
        <label className="relative mx-auto block max-w-3xl">
          <span className="sr-only">Buscar lojas</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome da loja, endereço ou e-mail do proprietário…"
            className="w-full rounded-2xl border border-slate-800/15 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            autoComplete="off"
          />
        </label>
        {q ? (
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-400">
            {filtered.length} de {stores.length} loja(s)
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/95 shadow-md">
        <div className="flex items-center gap-2 border-b border-[color:var(--brand-primary)]/10 bg-[#1B4332]/5 px-4 py-3 sm:px-6">
          <Building2 className="h-5 w-5 text-[var(--brand-primary)]" aria-hidden />
          <span className="font-semibold text-[#1B4332]">Lojas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm sm:text-base">
            <thead className="border-b border-[color:var(--brand-primary)]/10 bg-white/95 font-semibold text-[#1B4332]">
              <tr>
                <th className="px-4 py-3 sm:px-5">Loja</th>
                <th className="px-4 py-3 sm:px-5">Endereço da Loja</th>
                <th className="px-4 py-3 sm:px-5">Proprietário</th>
                <th className="px-4 py-3 sm:px-5">Status</th>
                <th className="px-4 py-3 sm:px-5">Vendas pagas (30 dias)</th>
                <th className="px-4 py-3 sm:px-5">Pedidos pagos (30 dias)</th>
                <th className="px-4 py-3 text-right sm:px-5">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loadingStores ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-[var(--brand-primary)]" aria-hidden />
                      A carregar…
                    </span>
                  </td>
                </tr>
              ) : (
                filtered.map((storeRow) => {
                  const rank = gmvByStoreId.get(storeRow.id);
                  return (
                    <tr
                      key={storeRow.id}
                      className="border-b border-[color:var(--brand-primary)]/5 last:border-0 hover:bg-[#FAF8F3]/60"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--brand-primary)] sm:px-5">
                        {storeRow.displayName}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-600 sm:px-5">{storeRow.slug}</td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-sm text-slate-600 sm:px-5">
                        {storeRow.ownerEmail?.trim() ? (
                          <span className="font-mono">{storeRow.ownerEmail}</span>
                        ) : (
                          <span className="italic text-slate-400">Sem proprietário</span>
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <StoreStatusBadge status={storeRow.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs sm:px-5 sm:text-sm">
                        {brl(rank?.gmvPaidBrlLast30d ?? 0)}
                      </td>
                      <td className="px-4 py-3 sm:px-5">{rank?.paidOrdersLast30d ?? 0}</td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        <button
                          type="button"
                          onClick={() => manageStoreAsAdmin(storeRow.slug)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 sm:text-sm"
                        >
                          <UserCog className="h-3.5 w-3.5" aria-hidden />
                          Gerenciar loja
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {!loadingStores && filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              {stores.length === 0 ? "Nenhuma loja cadastrada." : "Nenhum resultado para esta busca."}
            </p>
          ) : null}
        </div>
        <div className="border-t border-[color:var(--brand-primary)]/10 px-4 py-3 text-xs text-slate-400 sm:px-6">
          Para criar uma loja nova, usa o botão <strong className="text-[#1B4332]">Nova Loja</strong> na barra lateral.
          Domínios personalizados podem ser associados durante a criação ou depois, com apoio da equipa técnica.
        </div>
      </div>
    </div>
  );
};

export default PlatformStoresPage;
