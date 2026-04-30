import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Shield, X } from "lucide-react";
import {
  platformCreateStoreBodySchema,
  normalizeStoreSlugInput,
  PLATFORM_PLAN_LABELS,
  type PlatformPlanSlug,
} from "@/schemas/platformCreateStore";
import {
  platformApiFetch,
  setStoreSlugOverride,
  type CreatedPlatformStore,
} from "@/react-app/services/api";
import { zodErrorToMessage } from "@/react-app/utils/zodErrorMessage";

type PlatformNewStoreModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const planOptions: { slug: PlatformPlanSlug; hint: string }[] = [
  { slug: "tier_base", hint: "Entrada com funcionalidades essenciais." },
  { slug: "tier_standard", hint: "Mais capacidade para lojas em crescimento." },
  { slug: "tier_unlimited", hint: "Máxima flexibilidade e limites alargados." },
];

export const PlatformNewStoreModal = ({ isOpen, onClose, onCreated }: PlatformNewStoreModalProps) => {
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [ownerAdminName, setOwnerAdminName] = useState("");
  const [ownerAdminEmail, setOwnerAdminEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [sendPasswordSetupLink, setSendPasswordSetupLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [planSlug, setPlanSlug] = useState<PlatformPlanSlug>("tier_base");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedPlatformStore | null>(null);
  const [customDomainInput, setCustomDomainInput] = useState("");

  const slugPreview = useMemo(() => normalizeStoreSlugInput(slug), [slug]);

  const reset = () => {
    setError(null);
    setCreated(null);
    setCustomDomainInput("");
    setDisplayName("");
    setSlug("");
    setSlugTouched(false);
    setOwnerAdminName("");
    setOwnerAdminEmail("");
    setInitialPassword("");
    setSendPasswordSetupLink(false);
    setShowPassword(false);
    setPlanSlug("tier_base");
  };

  const closeModal = () => {
    reset();
    onClose();
  };

  const onDisplayBlur = useCallback(() => {
    if (slugTouched || !displayName.trim()) return;
    const s = normalizeStoreSlugInput(displayName);
    if (s.length >= 2) setSlug(s);
  }, [displayName, slugTouched]);

  const onSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    let v = e.target.value.toLowerCase();
    v = v.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    v = v.replace(/[^a-z0-9-]/g, "");
    setSlug(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setCreated(null);

    const customDomains = customDomainInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    const payload = {
      slug: slug || normalizeStoreSlugInput(displayName),
      displayName: displayName.trim(),
      customDomains,
      ownerAdminName: ownerAdminName.trim(),
      ownerAdminEmail: ownerAdminEmail.trim(),
      sendPasswordSetupLink,
      initialPassword: sendPasswordSetupLink ? "" : initialPassword,
      planSlug,
    };

    const parsed = platformCreateStoreBodySchema.safeParse(payload);
    if (!parsed.success) {
      setError(zodErrorToMessage(parsed.error));
      setSaving(false);
      return;
    }

    try {
      const data = await platformApiFetch<CreatedPlatformStore>("/api/platform/stores", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setCreated(data);
      onCreated?.();
    } catch (err: unknown) {
      console.error("[PlatformNewStoreModal.handleSubmit]", err);
      setError(err instanceof Error ? err.message : "Não foi possível criar a loja.");
    } finally {
      setSaving(false);
    }
  };

  const useThisStore = () => {
    if (!created?.slug) return;
    try {
      setStoreSlugOverride(created.slug);
    } catch {
      console.error("[PlatformNewStoreModal.useThisStore] localStorage");
    }
    window.location.href = "/";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} aria-hidden />
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-new-store-title"
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Fechar"
        >
          <X className="h-6 w-6" aria-hidden />
        </button>

        <h2 id="platform-new-store-title" className="pr-10 font-playfair text-2xl font-semibold tracking-tight text-[#1B4332]">
          Nova loja
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Cria a loja, define o dono no Auth e escolhe o plano inicial — os campos estão agrupados por contexto.
        </p>

        {created ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
              <div>
                <p className="font-semibold text-emerald-900">{created.displayName}</p>
                <p className="mt-1 text-sm text-emerald-800">
                  Link da loja: <span className="font-mono">{created.slug}</span>
                </p>
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
              className="w-full rounded-xl bg-[color:var(--brand-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-accent)]"
            >
              Usar esta loja neste navegador
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
              <fieldset className="min-w-0 space-y-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 sm:p-6">
                <legend className="sr-only">Dados do dono</legend>
                <h3 className="border-b border-slate-200 pb-2 font-playfair text-lg font-semibold text-[#1B4332]">
                  Dados do dono
                </h3>

                <div>
                  <p className="text-sm font-semibold text-slate-700">Administrador</p>
                  <p className="mt-0.5 text-xs text-slate-400">O e-mail será o login principal desta loja.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <label htmlFor="pf-owner-name" className="mb-1 block text-sm font-medium text-slate-700">
                        Nome
                      </label>
                      <input
                        id="pf-owner-name"
                        value={ownerAdminName}
                        onChange={(e) => setOwnerAdminName(e.target.value)}
                        placeholder="Ex: João Silva"
                        required
                        autoComplete="name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1B4332]/40 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label htmlFor="pf-owner-email" className="mb-1 block text-sm font-medium text-slate-700">
                        E-mail
                      </label>
                      <input
                        id="pf-owner-email"
                        type="email"
                        value={ownerAdminEmail}
                        onChange={(e) => setOwnerAdminEmail(e.target.value)}
                        placeholder="admin@loja.com"
                        required
                        autoComplete="email"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1B4332]/40 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700">Acesso</p>
                  <p className="mt-0.5 text-xs text-slate-400">Senha agora ou convite por e-mail.</p>
                  <div className="mt-3 space-y-3">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={sendPasswordSetupLink}
                        onChange={(e) => {
                          setSendPasswordSetupLink(e.target.checked);
                          if (e.target.checked) setInitialPassword("");
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1B4332] focus:ring-[#1B4332]/30"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-800">Enviar link para definir senha</span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          Requer e-mail configurado no Supabase.
                        </span>
                      </span>
                    </label>
                    <div>
                      <label htmlFor="pf-password" className="mb-1 block text-sm font-medium text-slate-700">
                        Senha inicial
                      </label>
                      <div className="relative">
                        <input
                          id="pf-password"
                          type={showPassword ? "text" : "password"}
                          value={initialPassword}
                          onChange={(e) => setInitialPassword(e.target.value)}
                          disabled={sendPasswordSetupLink}
                          autoComplete="new-password"
                          placeholder={sendPasswordSetupLink ? "Desativado" : "Mínimo 8 caracteres"}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1B4332]/40 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          disabled={sendPasswordSetupLink}
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700">Plano inicial</p>
                  <div className="mt-3 grid gap-2">
                    {planOptions.map((opt) => {
                      const selected = planSlug === opt.slug;
                      return (
                        <label
                          key={opt.slug}
                          className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition ${
                            selected
                              ? "border-[#1B4332] bg-[#1B4332]/5 ring-1 ring-[#1B4332]/30"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="planSlug"
                            value={opt.slug}
                            checked={selected}
                            onChange={() => setPlanSlug(opt.slug)}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold text-slate-900">{PLATFORM_PLAN_LABELS[opt.slug]}</span>
                          <span className="text-xs text-slate-400">{opt.hint}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </fieldset>

              <fieldset className="min-w-0 space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
                <legend className="sr-only">Dados da loja</legend>
                <h3 className="border-b border-slate-200 pb-2 font-playfair text-lg font-semibold text-[#1B4332]">
                  Dados da loja
                </h3>
                <p className="text-xs text-slate-400">Nome público, link na plataforma e domínios opcionais.</p>

                <div>
                  <label htmlFor="pf-name" className="mb-1 block text-sm font-medium text-slate-700">
                    Nome da loja
                  </label>
                  <input
                    id="pf-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={onDisplayBlur}
                    placeholder="Ex: Barbearia do João"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1B4332]/40 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                  />
                </div>

                <div>
                  <label htmlFor="pf-slug" className="mb-1 block text-sm font-medium text-slate-700">
                    Link da loja (URL)
                  </label>
                  <input
                    id="pf-slug"
                    value={slug}
                    onChange={onSlugChange}
                    onBlur={() => setSlug((s) => normalizeStoreSlugInput(s))}
                    placeholder="barbearia-do-joao"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1B4332]/40 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Só letras minúsculas, números e hífens. Pré-visualização:{" "}
                    <span className="font-mono text-slate-600">{slugPreview || "—"}</span>
                  </p>
                </div>

                <div>
                  <label htmlFor="pf-domains" className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Shield className="h-4 w-4 text-slate-500" aria-hidden />
                    Domínios customizados (opcional)
                  </label>
                  <input
                    id="pf-domains"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="lojaexemplo.com.br, www.lojaexemplo.com.br"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1B4332]/40 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                  />
                  <p className="mt-1 text-xs text-slate-400">Vários domínios separados por vírgula.</p>
                </div>
              </fieldset>
            </div>

            {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:min-w-[8rem]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[color:var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-accent)] disabled:opacity-60 sm:min-w-[8rem]"
              >
                {saving ? "A criar…" : "Criar loja"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/** Alias pedido para integrações e documentação. */
export const CreateStoreModal = PlatformNewStoreModal;
