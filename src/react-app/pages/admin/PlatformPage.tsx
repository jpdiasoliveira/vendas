import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Building2,
  Home,
  Plus,
  X,
  CheckCircle2,
  RefreshCw,
  Shield,
  CalendarClock,
  LayoutDashboard,
  CircleDollarSign,
  Store,
  BarChart3,
  Trophy,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { PlatformGlobalCommandBar } from "@/react-app/components/admin/PlatformGlobalCommandBar";
import {
  clearStoreSlugOverride,
  getStoreSlugOverride,
  platformApiFetch,
  setStoreSlugOverride,
  type CreatedPlatformStore,
  type PlatformAnalyticsOverviewDto,
  type PlatformStoreOverview,
  type PlatformStoreRankingRowDto,
} from "@/react-app/services/api";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);

const slugify = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const PlatformPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const allowed = isPlatformOperatorEmail(user?.email);

  const [modalOpen, setModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedPlatformStore | null>(null);
  const [stores, setStores] = useState<PlatformStoreOverview[]>([]);
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [overrideSlug, setOverrideSlug] = useState<string | null>(null);
  const [graceDaysInput, setGraceDaysInput] = useState("7");
  const [graceLoading, setGraceLoading] = useState(false);
  const [graceSaving, setGraceSaving] = useState(false);
  const [graceMessage, setGraceMessage] = useState<string | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<PlatformAnalyticsOverviewDto | null>(null);
  const [rankingRows, setRankingRows] = useState<PlatformStoreRankingRowDto[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const gmvByStoreId = useMemo(() => {
    const m = new Map<string, PlatformStoreRankingRowDto>();
    for (const r of rankingRows) m.set(r.storeId, r);
    return m;
  }, [rankingRows]);

  useEffect(() => {
    if (loading) return;
    if (user && !allowed) navigate("/admin/pedidos", { replace: true });
  }, [loading, user, allowed, navigate]);

  const loadStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const data = await platformApiFetch<PlatformStoreOverview[]>("/api/platform/stores");
      setStores(data);
    } catch (err) {
      console.error("[PlatformPage.loadStores]", err);
      setError(err instanceof Error ? err.message : "Não foi possível carregar as lojas.");
    } finally {
      setLoadingStores(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const [overview, ranking] = await Promise.all([
        platformApiFetch<PlatformAnalyticsOverviewDto>("/api/platform/analytics/overview"),
        platformApiFetch<PlatformStoreRankingRowDto[]>("/api/platform/analytics/store-ranking?limit=10"),
      ]);
      setAnalyticsOverview(overview);
      setRankingRows(ranking);
    } catch (err) {
      console.error("[PlatformPage.loadAnalytics]", err);
      setAnalyticsOverview({
        mrrBrlEstimated: 0,
        payingOrTrialingSubscriptions: 0,
        activeStoresCount: 0,
        gmvPaidBrlLast30d: 0,
      });
      setRankingRows([]);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadRuntimeSettings = useCallback(async () => {
    setGraceLoading(true);
    setGraceMessage(null);
    try {
      const data = await platformApiFetch<{ subscriptionGraceDays: number }>(
        "/api/platform/runtime-settings"
      );
      setGraceDaysInput(String(data.subscriptionGraceDays));
    } catch (err) {
      console.error("[PlatformPage.loadRuntimeSettings]", err);
      setGraceMessage(
        err instanceof Error ? err.message : "Não foi possível carregar as configurações da plataforma."
      );
    } finally {
      setGraceLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadStores(), loadRuntimeSettings(), loadAnalytics()]);
  }, [loadStores, loadRuntimeSettings, loadAnalytics]);

  useEffect(() => {
    if (!allowed) return;
    setOverrideSlug(getStoreSlugOverride());
    void refreshAll();
  }, [allowed, refreshAll]);

  const saveGraceDays = async () => {
    const n = Number(graceDaysInput);
    if (!Number.isFinite(n) || n < 0 || n > 90 || !Number.isInteger(n)) {
      setGraceMessage("Use um número inteiro entre 0 e 90 dias.");
      return;
    }
    setGraceSaving(true);
    setGraceMessage(null);
    try {
      const data = await platformApiFetch<{ subscriptionGraceDays: number }>(
        "/api/platform/runtime-settings",
        { method: "PATCH", body: JSON.stringify({ subscriptionGraceDays: n }) }
      );
      setGraceDaysInput(String(data.subscriptionGraceDays));
      setGraceMessage("Carência atualizada. O Postgres (suspend/entitlements) passa a usar este valor.");
    } catch (err) {
      setGraceMessage(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setGraceSaving(false);
    }
  };

  const onDisplayBlur = useCallback(() => {
    if (slugTouched || !displayName.trim()) return;
    const s = slugify(displayName);
    if (s.length >= 2) setSlug(s);
  }, [displayName, slugTouched]);

  const closeModal = () => {
    setModalOpen(false);
    setError(null);
    setCreated(null);
    setCustomDomainInput("");
    setDisplayName("");
    setSlug("");
    setSlugTouched(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setCreated(null);
    try {
      const normalized = slugify(slug || displayName);
      const customDomains = customDomainInput
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const data = await platformApiFetch<CreatedPlatformStore>("/api/platform/stores", {
        method: "POST",
        body: JSON.stringify({
          slug: normalized,
          display_name: displayName.trim(),
          custom_domains: customDomains,
          planSlug: "tier_base",
        }),
      });
      setCreated(data);
      await refreshAll();
    } catch (err: unknown) {
      console.error("[PlatformPage.handleSubmit]", err);
      setError(err instanceof Error ? err.message : "Não foi possível criar a loja.");
    } finally {
      setSaving(false);
    }
  };

  const useThisStore = () => {
    if (!created?.slug) return;
    try {
      setStoreSlugOverride(created.slug);
      setOverrideSlug(created.slug);
    } catch {
      console.error("[PlatformPage.useThisStore] localStorage");
    }
    window.location.href = "/";
  };

  /** Impersonação: só o browser do operador; o Worker continua exigindo JWT + papel na loja de destino. */
  const manageStoreAsAdmin = (storeSlug: string) => {
    setStoreSlugOverride(storeSlug);
    setOverrideSlug(storeSlug);
    window.location.href = "/admin/pedidos";
  };

  const clearOverride = () => {
    clearStoreSlugOverride();
    setOverrideSlug(null);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] font-inter text-[#6D4C41]">
        Carregando…
      </div>
    );
  }

  if (!allowed) return null;

  const overview = analyticsOverview ?? {
    mrrBrlEstimated: 0,
    payingOrTrialingSubscriptions: 0,
    activeStoresCount: 0,
    gmvPaidBrlLast30d: 0,
  };
  const busy = loadingStores || analyticsLoading || graceLoading;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-100/90 via-[#F5F1E8] to-[#FAF8F3] font-inter text-[#6D4C41]">
      <PlatformGlobalCommandBar storeOverrideSlug={overrideSlug} onClearStoreOverride={clearOverride} />

      <div className="flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 border-b border-slate-800/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => navigate("/admin/pedidos")}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-800/15 bg-white/80 text-[#6D4C41] shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-[#1B4332]"
                aria-label="Voltar ao painel da loja"
              >
                <Home className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-9 w-9 shrink-0 text-slate-800" />
                <div>
                  <h1 className="font-playfair text-2xl font-bold text-slate-900 sm:text-3xl">
                    Central de Comando
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-[#6D4C41]">
                    Planos, direitos, ciclo de vida e rollups consolidados. Criação de tenants e leitura de métricas
                    globais.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800/10 bg-white/70 p-1 shadow-sm backdrop-blur-sm">
              <AdminNav>
                <button
                  type="button"
                  onClick={() => void refreshAll()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--brand-primary)]/20 bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-primary)] shadow-sm transition hover:bg-[#FAF8F3]"
                >
                  <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                  Atualizar dados
                </button>
              </AdminNav>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-slate-800/10 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <p className="mb-4 text-sm text-[#6D4C41]">
              Novas lojas nascem com catálogo base, <strong className="text-[#1B4332]">plano Base (tier_base)</strong>{" "}
              no billing da plataforma (trial conforme catálogo) e você como proprietário.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus className="h-5 w-5" />
              Nova Loja
            </button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/95 p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6D4C41]/80">
                <CircleDollarSign className="h-4 w-4 text-[var(--brand-primary)]" />
                MRR estimado
              </div>
              <p className="font-playfair text-2xl font-bold text-[#1B4332]">{brl(overview.mrrBrlEstimated)}</p>
              <p className="mt-1 text-xs text-[#6D4C41]/80">
                {overview.payingOrTrialingSubscriptions} linha(s) de assinatura ativa/trial/past_due
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/95 p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6D4C41]/80">
                <Store className="h-4 w-4 text-[var(--brand-primary)]" />
                Lojas ativas
              </div>
              <p className="font-playfair text-2xl font-bold text-[#1B4332]">{overview.activeStoresCount}</p>
              <p className="mt-1 text-xs text-[#6D4C41]/80">Contagem em stores.status = active</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/95 p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6D4C41]/80">
                <BarChart3 className="h-4 w-4 text-[var(--brand-primary)]" />
                GMV pago (30d)
              </div>
              <p className="font-playfair text-2xl font-bold text-[#1B4332]">{brl(overview.gmvPaidBrlLast30d)}</p>
              <p className="mt-1 text-xs text-[#6D4C41]/80">Soma dos rollups diários (UTC), Bloco 4</p>
            </div>
            <div className="rounded-2xl border border-slate-800/15 bg-slate-900 p-5 text-amber-50 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200/80">
                <Trophy className="h-4 w-4 text-amber-400" />
                Top lojas (GMV 30d)
              </div>
              <ol className="mt-2 space-y-1.5 text-sm">
                {rankingRows.slice(0, 5).map((r, i) => (
                  <li key={r.storeId} className="flex justify-between gap-2 border-b border-white/10 pb-1 last:border-0">
                    <span className="truncate text-amber-100/95">
                      {i + 1}. {r.displayName || r.slug}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-amber-200/90">{brl(r.gmvPaidBrlLast30d)}</span>
                  </li>
                ))}
                {rankingRows.length === 0 ? (
                  <li className="text-xs text-amber-200/70">Sem dados de ranking (execute o SQL do Bloco 4).</li>
                ) : null}
              </ol>
            </div>
          </div>

        <div className="mt-6 rounded-3xl border border-[color:var(--brand-primary)]/10 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 text-[var(--brand-primary)]">
            <CalendarClock className="h-5 w-5" />
            <h2 className="font-playfair text-lg font-bold">Carência de assinatura</h2>
          </div>
          <p className="mb-4 text-sm text-[#6D4C41]">
            Dias extras após o fim do trial ou do período pago antes de suspender a loja e cortar benefícios
            (alinhado às funções <span className="font-mono text-xs">resolve_store_entitlements</span> e{" "}
            <span className="font-mono text-xs">platform_suspend_expired_store_subscriptions</span> no banco).
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[8rem]">
              <label htmlFor="pf-grace-days" className="mb-1 block text-xs font-medium text-[#1B4332]">
                Dias (0 a 90)
              </label>
              <input
                id="pf-grace-days"
                type="number"
                min={0}
                max={90}
                step={1}
                disabled={graceLoading || graceSaving}
                value={graceDaysInput}
                onChange={(e) => setGraceDaysInput(e.target.value)}
                className="w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 font-mono text-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 disabled:opacity-60"
              />
            </div>
            <button
              type="button"
              disabled={graceLoading || graceSaving}
              onClick={() => void saveGraceDays()}
              className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 font-inter text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {graceSaving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              disabled={graceLoading}
              onClick={() => void loadRuntimeSettings()}
              className="rounded-xl border border-[color:var(--brand-primary)]/20 bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[#FAF8F3] disabled:opacity-60"
            >
              Recarregar
            </button>
          </div>
          {graceMessage ? (
            <p
              className={`mt-3 text-sm ${graceMessage.includes("atualizada") ? "text-emerald-700" : "text-red-700"}`}
            >
              {graceMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-[color:var(--brand-primary)]/10 bg-white/90 shadow-sm backdrop-blur-sm">
          <div className="border-b border-[color:var(--brand-primary)]/10 bg-[#1B4332]/5 px-6 py-4">
            <div className="flex items-center gap-2 text-[var(--brand-primary)]">
              <Building2 className="h-5 w-5" />
              <h2 className="font-playfair text-lg font-bold">Gestor de lojas</h2>
            </div>
            <p className="mt-1 text-sm text-[#6D4C41]">
              <strong className="text-[#1B4332]">Gerenciar</strong> grava{" "}
              <code className="rounded bg-white/80 px-1 font-mono text-xs">saas_store_slug_override</code> neste
              navegador e abre o admin da loja — útil para suporte (você precisa ser membro da loja para ver dados).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[color:var(--brand-primary)]/10 bg-white/80 font-semibold text-[#1B4332]">
                <tr>
                  <th className="px-4 py-3">Loja</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">GMV 30d (pago)</th>
                  <th className="px-4 py-3">Pedidos pagos 30d</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((storeRow) => {
                  const rank = gmvByStoreId.get(storeRow.id);
                  return (
                    <tr key={storeRow.id} className="border-b border-[color:var(--brand-primary)]/5 last:border-0">
                      <td className="px-4 py-3 font-medium text-[var(--brand-primary)]">{storeRow.displayName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#6D4C41]">{storeRow.slug}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">{storeRow.status}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{brl(rank?.gmvPaidBrlLast30d ?? 0)}</td>
                      <td className="px-4 py-3">{rank?.paidOrdersLast30d ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => manageStoreAsAdmin(storeRow.slug)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                        >
                          <UserCog className="h-3.5 w-3.5" aria-hidden />
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loadingStores && stores.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-[#6D4C41]">Nenhuma loja cadastrada ainda.</p>
            ) : null}
          </div>
          <div className="border-t border-[color:var(--brand-primary)]/10 px-6 py-4 text-xs text-[#6D4C41]/85">
            Domínios customizados continuam disponíveis no fluxo de criação ou via API{" "}
            <code className="font-mono">POST /api/platform/stores/:id/domains</code>.
          </div>
        </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm" onClick={closeModal} aria-hidden />
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/50 bg-white/95 p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="platform-new-store-title"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 text-[#6D4C41] transition hover:text-[#1B4332]"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 id="platform-new-store-title" className="mb-2 font-playfair text-xl font-bold text-[#1B4332]">
              Nova loja
            </h2>
            <p className="mb-2 font-inter text-sm text-[#6D4C41]">
              Nome, slug e domínios iniciais. A loja será vinculada ao plano{" "}
              <strong className="text-[#1B4332]">Base (tier_base)</strong> no catálogo da plataforma.
            </p>

            {created ? (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-emerald-900">{created.displayName}</p>
                    <p className="mt-1 font-mono text-sm text-emerald-800">Slug: {created.slug}</p>
                    {created.subscriptionWarning ? (
                      <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
                        Assinatura da plataforma: {created.subscriptionWarning}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={useThisStore}
                  className="w-full rounded-xl bg-[#1B4332] py-2.5 font-medium text-white hover:bg-[#2D5F4A]"
                >
                  Usar esta loja neste navegador
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-xl border border-[#1B4332]/20 py-2.5 font-medium text-[#6D4C41] hover:bg-[#FAF8F3]"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label htmlFor="pf-name" className="mb-1 block text-sm font-medium text-[#1B4332]">
                    Nome da loja
                  </label>
                  <input
                    id="pf-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={onDisplayBlur}
                    placeholder="Ex: Barbearia do João"
                    required
                    className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2.5 text-[#1B4332] placeholder:text-[#6D4C41]/50 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25"
                  />
                </div>
                <div>
                  <label htmlFor="pf-slug" className="mb-1 block text-sm font-medium text-[#1B4332]">
                    Slug
                  </label>
                  <input
                    id="pf-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    onBlur={() => setSlug((s) => slugify(s))}
                    placeholder="barbearia-do-joao"
                    className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2.5 text-[#1B4332] placeholder:text-[#6D4C41]/50 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25"
                  />
                </div>
                <div>
                  <label htmlFor="pf-domains" className="mb-1 flex items-center gap-2 text-sm font-medium text-[#1B4332]">
                    <Shield className="h-4 w-4" />
                    Domínios customizados (opcional)
                  </label>
                  <input
                    id="pf-domains"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="ex.: lojaexemplo.com.br, www.lojaexemplo.com.br"
                    className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2.5 text-[#1B4332] placeholder:text-[#6D4C41]/50 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25"
                  />
                  <p className="mt-1 text-xs text-[#6D4C41]">
                    Separe múltiplos domínios por vírgula.
                  </p>
                </div>
                {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-[#1B4332]/20 py-2.5 font-medium text-[#6D4C41] hover:bg-[#FAF8F3]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-[#1B4332] py-2.5 font-medium text-white hover:bg-[#2D5F4A] disabled:opacity-60"
                  >
                    {saving ? "Criando…" : "Criar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformPage;
