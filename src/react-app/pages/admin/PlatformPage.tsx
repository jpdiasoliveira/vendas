import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Building2,
  Home,
  Plus,
  X,
  CheckCircle2,
  RefreshCw,
  Globe,
  Shield,
  TestTube2,
  Eraser,
} from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import {
  clearStoreSlugOverride,
  getStoreSlugOverride,
  platformApiFetch,
  setStoreSlugOverride,
  type CreatedPlatformStore,
  type PlatformStoreOverview,
} from "@/react-app/services/api";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";

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

  useEffect(() => {
    if (!allowed) return;
    setOverrideSlug(getStoreSlugOverride());
    void loadStores();
  }, [allowed, loadStores]);

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
        }),
      });
      setCreated(data);
      await loadStores();
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

  const switchToStoreContext = (storeSlug: string) => {
    setStoreSlugOverride(storeSlug);
    setOverrideSlug(storeSlug);
    window.location.href = "/";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1B4332]/10 bg-white/60 text-[#6D4C41] shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-[#1B4332]"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-[#1B4332]" />
              <div>
                <h1 className="font-playfair text-2xl font-bold text-[#1B4332]">Plataforma</h1>
                <p className="font-inter text-sm text-[#6D4C41]">Criar novas lojas (tenants) sem SQL</p>
              </div>
            </div>
          </div>
          <AdminNav />
        </div>

        <div className="rounded-3xl border border-[color:var(--brand-primary)]/10 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
          <p className="mb-6 font-inter text-sm text-[#6D4C41]">
            Cada loja nasce com dados iniciais (catálogo base + configurações padrão) e você como proprietário. Se
            quiser, já cadastre domínios customizados no onboarding.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 font-inter font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus className="h-5 w-5" />
              Nova Loja
            </button>
            <button
              type="button"
              onClick={() => void loadStores()}
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--brand-primary)]/20 bg-white px-5 py-3 font-inter font-semibold text-[var(--brand-primary)] shadow-sm transition hover:bg-[#FAF8F3]"
            >
              <RefreshCw className={`h-5 w-5 ${loadingStores ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={clearOverride}
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--brand-primary)]/20 bg-white px-5 py-3 font-inter font-semibold text-[#6D4C41] shadow-sm transition hover:bg-[#FAF8F3]"
            >
              <Eraser className="h-5 w-5" />
              Limpar override
            </button>
          </div>
          <p className="mt-4 text-xs text-[#6D4C41]">
            Override atual neste navegador:{" "}
            <span className="font-mono text-[var(--brand-primary)]">{overrideSlug ?? "(nenhum)"}</span>
          </p>
        </div>

        <div className="mt-6 space-y-3 rounded-3xl border border-[color:var(--brand-primary)]/10 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-[var(--brand-primary)]">
            <TestTube2 className="h-5 w-5" />
            <h2 className="font-playfair text-lg font-bold">Troca de contexto (simulação)</h2>
          </div>
          <p className="text-sm text-[#6D4C41]">
            Use esta lista para abrir a vitrine como se fosse qualquer loja, sem editar URL manualmente.
          </p>
          <div className="grid gap-3">
            {stores.map((storeRow) => (
              <div
                key={storeRow.id}
                className="rounded-2xl border border-[color:var(--brand-primary)]/10 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--brand-primary)]">{storeRow.displayName}</p>
                    <p className="font-mono text-xs text-[#6D4C41]">slug: {storeRow.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchToStoreContext(storeRow.slug)}
                    className="rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    Usar contexto
                  </button>
                </div>
                {storeRow.domains.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {storeRow.domains.map((d) => (
                      <p key={`${storeRow.id}-${d.domain}`} className="text-xs text-[#6D4C41]">
                        <Globe className="mr-1 inline h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        {d.domain}{" "}
                        <span className="rounded bg-[var(--brand-primary)]/10 px-1.5 py-0.5 text-[var(--brand-primary)]">
                          {d.status}
                        </span>
                        {d.isPrimary ? (
                          <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">principal</span>
                        ) : null}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[#6D4C41]/70">Sem domínio customizado cadastrado.</p>
                )}
              </div>
            ))}
            {!loadingStores && stores.length === 0 ? (
              <p className="text-sm text-[#6D4C41]">Nenhuma loja cadastrada ainda.</p>
            ) : null}
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
            <p className="mb-6 font-inter text-sm text-[#6D4C41]">
              Nome, slug e domínios iniciais em um único fluxo de onboarding.
            </p>

            {created ? (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-emerald-900">{created.displayName}</p>
                    <p className="mt-1 font-mono text-sm text-emerald-800">Slug: {created.slug}</p>
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
