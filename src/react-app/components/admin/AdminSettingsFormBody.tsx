import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Home,
  LayoutDashboard,
  Save,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  CheckCircle2,
  Palette,
} from "lucide-react";
import { AdminPreviewLinkHint } from "@/react-app/components/admin/AdminPreviewLinkHint";
import { AdminSettingsHomeBlocksForm } from "@/react-app/components/admin/AdminSettingsHomeBlocksForm";
import {
  AdminStorefrontPreviewChrome,
  AdminStorefrontPreviewPanel,
} from "@/react-app/components/admin/AdminStorefrontPreviewPanel";
import {
  adminPreviewScrollTargetId,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";
import { useStorefrontPreviewFocus } from "@/react-app/components/admin/useStorefrontPreviewFocus";
import { formatBrazilPhoneInput } from "@/react-app/utils/phoneBr";
import { clampStoreLogoHeightPx } from "@/react-app/utils/storeLogoDisplay";
import { parseBRL } from "@/react-app/utils/adminSettingsBrl";
import type { AdminSettingsViewModel } from "@/react-app/hooks/useAdminSettings";
import type { StoreSettingsData } from "@/react-app/contexts/StoreSettingsContext";
import { extractLogoPaletteFromSrc } from "@/react-app/utils/extractLogoPalette";
import { normalizeStoreAccentColor, normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";

export const AdminSettingsFormBody = ({ m }: { m: AdminSettingsViewModel }) => {
  const { activeSection, previewScrollTick, previewFocus, previewBlur } = useStorefrontPreviewFocus();
  const fp = useCallback(
    (id: StorefrontPreviewSectionId) => ({
      "aria-controls": adminPreviewScrollTargetId(id),
      "data-admin-preview-section": id,
      onPointerDownCapture: () => previewFocus(id),
      onFocus: () => {
        previewFocus(id);
      },
      onBlur: previewBlur,
    }),
    [previewFocus, previewBlur]
  );

  const {
    navigate,
    error,
    success,
    saving,
    uploadingImage,
    uploadingBanner,
    uploadingProfileImage,
    displayName,
    setDisplayName,
    logoUrl,
    setLogoUrl,
    imagePreview,
    logoPreviewFailed,
    setLogoPreviewFailed,
    minimumOrderValue,
    primaryColor,
    setPrimaryColor,
    publicProfile,
    setPublicProfile,
    bannerUrl,
    setBannerUrl,
    bannerPreview,
    handleLogoFile,
    handleBannerFile,
    handleProfileImageFile,
    handleSubmit,
    inputCls,
  } = m;

  const previewLogoH = clampStoreLogoHeightPx(publicProfile.logoHeightPx ?? undefined);
  const previewLogoKnockout = publicProfile.logoKnockoutWhite === true;

  const [logoPalette, setLogoPalette] = useState<{ dominant: string; vibrant: string } | null>(null);
  const [logoPaletteLoading, setLogoPaletteLoading] = useState(false);

  const logoSrcForPalette = (imagePreview ?? logoUrl).trim();

  useEffect(() => {
    if (!logoSrcForPalette || logoPreviewFailed) {
      setLogoPalette(null);
      setLogoPaletteLoading(false);
      return;
    }
    let cancelled = false;
    setLogoPaletteLoading(true);
    setLogoPalette(null);
    void extractLogoPaletteFromSrc(logoSrcForPalette).then((p) => {
      if (cancelled) return;
      setLogoPalette(p);
      setLogoPaletteLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [logoSrcForPalette, logoPreviewFailed]);

  const accentFormValue = normalizeStoreAccentColor(publicProfile.accentColor ?? undefined);

  const previewMerge = useMemo<Partial<StoreSettingsData>>(
    () => ({
      displayName: displayName.trim() || "Sua Loja",
      logoUrl: (() => {
        const v = (imagePreview ?? logoUrl).trim();
        return v || null;
      })(),
      bannerUrl: (() => {
        const v = (bannerPreview ?? bannerUrl).trim();
        return v || null;
      })(),
      primaryColor: primaryColor || null,
      minimumOrderValue: parseBRL(minimumOrderValue),
      publicProfile,
    }),
    [
      displayName,
      logoUrl,
      imagePreview,
      bannerUrl,
      bannerPreview,
      primaryColor,
      minimumOrderValue,
      publicProfile,
    ]
  );

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 bg-white/60 backdrop-blur-sm rounded-full text-[#6D4C41] hover:text-[#1B4332] hover:bg-white transition-all shadow-sm border border-[#1B4332]/10"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-9 w-9 shrink-0 text-[#1B4332] sm:h-10 sm:w-10" />
              <div>
                <h1 className="font-playfair text-3xl font-bold tracking-tight text-[#1B4332] sm:text-4xl">
                  Configurações da Loja
                </h1>
                <p className="mt-0.5 font-inter text-sm text-[#6D4C41]">
                  Aparência, contato, textos institucionais e regras de checkout
                </p>
              </div>
            </div>
          </div>
        </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-red-700">{error}</div>
      )}

      {success ? (
        <div
          className="mb-6 flex gap-3 rounded-2xl border border-green-200 bg-green-50/95 px-4 py-4 text-green-900 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" aria-hidden />
          <div className="min-w-0 font-inter">
            <p className="font-semibold text-green-900">Configurações salvas com sucesso</p>
            <p className="mt-1 text-sm text-green-800/90">
              As alterações já estão aplicadas na vitrine e no checkout desta loja.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex w-full min-w-0 flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-4">
        {/* lg:contents: o <form> passa a ser filho direto do grid — evita wrapper intermédio a interferir com sticky. */}
        <div className="min-w-0 lg:contents">
        <form
          onSubmit={handleSubmit}
          className="min-w-0 w-full rounded-2xl border border-[#1B4332]/10 bg-white/70 p-4 font-inter shadow-sm backdrop-blur-sm sm:p-5"
          style={
            {
              ["--brand-primary"]: normalizeStorePrimaryColor(primaryColor),
              ["--brand-accent"]: normalizeStoreAccentColor(publicProfile.accentColor ?? undefined),
            } as CSSProperties
          }
        >
          <div className="min-w-0 space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1B4332] border-b border-[#1B4332]/15 pb-2">
              Identidade visual
            </h2>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-[#6D4C41] mb-1">
                Nome da Loja
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Sua Loja"
                className={inputCls}
                {...fp("navbar")}
              />
            </div>
            <div>
              <label htmlFor="storeTagline" className="block text-sm font-medium text-[#6D4C41] mb-1">
                Slogan / subtítulo
              </label>
              <input
                id="storeTagline"
                type="text"
                value={publicProfile.tagline ?? ""}
                onChange={(e) =>
                  setPublicProfile((prev) => ({
                    ...prev,
                    tagline: e.target.value.trim() === "" ? undefined : e.target.value,
                  }))
                }
                placeholder="Opcional — aparece abaixo do nome na barra e no rodapé"
                className={inputCls}
                {...fp("navbar")}
              />
              <p className="text-xs text-[#6D4C41]/80 mt-1">Se ficar vazio, a linha extra não é exibida.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#6D4C41]">Logomarca</label>
              <p className="-mt-1 text-xs text-[#6D4C41]/80">
                Envie um arquivo ou informe a URL pública da imagem. A pré-visualização mostra como o logo tende a aparecer na barra do site.
              </p>
              <p className="text-xs leading-snug text-[#6D4C41]/85">
                <strong className="text-[#1B4332]">Dica:</strong> para um acabamento profissional, utilize imagens em formato{" "}
                <strong className="text-[#1B4332]">.PNG</strong> com fundo transparente.
              </p>

              <div className="rounded-2xl border border-[#1B4332]/12 bg-[#FAF8F3]/50 p-4 sm:p-5">
                <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6">
                  <div className="flex min-h-0 min-w-0 flex-col justify-between gap-4 lg:min-h-[12.5rem]">
                    <label
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1B4332]/25 bg-white/80 px-4 py-3.5 transition-colors hover:border-[#1B4332]/45 hover:bg-white"
                      onMouseDown={() => previewFocus("navbar")}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleLogoFile}
                        onFocus={() => previewFocus("navbar")}
                        onBlur={previewBlur}
                      />
                      <ImagePlus className="h-5 w-5 shrink-0 text-[#6D4C41]" />
                      <span className="text-sm font-medium text-[#6D4C41]">Enviar imagem do logo</span>
                    </label>
                    <p className="text-center text-[11px] leading-snug text-[#6D4C41]/75">
                      Para um acabamento profissional, utilize imagens em formato <strong className="text-[#1B4332]">.PNG</strong>{" "}
                      com fundo transparente.
                    </p>
                    <div className="min-w-0">
                      <label htmlFor="logoUrl" className="mb-1 block text-xs font-medium text-[#6D4C41]/90">
                        URL da imagem (opcional se enviar arquivo)
                      </label>
                      <input
                        id="logoUrl"
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className={`w-full ${inputCls} break-all`}
                        {...fp("navbar")}
                      />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6D4C41]/70">
                      Pré-visualização
                    </span>
                    <div
                      className="relative flex min-h-[12.5rem] flex-1 flex-col items-center justify-center rounded-2xl border-2 border-[#1B4332]/12 bg-gradient-to-b from-white to-[#F0EBE0]/90 px-4 py-5 shadow-inner sm:px-5 sm:py-6"
                      aria-live="polite"
                    >
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-9 rounded-t-[0.9rem] bg-gradient-to-b from-[#1B4332]/[0.08] to-transparent"
                        aria-hidden
                      />
                      <div className="relative flex h-[7.25rem] w-full max-w-[240px] items-center justify-center rounded-xl bg-[#FAF8F3]/85 px-3 py-2.5 shadow-inner ring-1 ring-[#1B4332]/12">
                        {imagePreview || logoUrl.trim() ? (
                          logoPreviewFailed ? (
                            <div className="flex flex-col items-center gap-1 px-2 text-center text-[#6D4C41]/70">
                              <ImageIcon className="h-8 w-8 shrink-0 opacity-60" />
                              <span className="text-[11px] leading-snug">
                                Não foi possível carregar esta URL. Confira o link ou envie um arquivo.
                              </span>
                            </div>
                          ) : (
                            <img
                              src={imagePreview ?? logoUrl}
                              alt=""
                              style={{ height: `${Math.min(previewLogoH, 72)}px`, width: "auto" }}
                              className={`max-h-[4.5rem] w-auto object-contain ${
                                previewLogoKnockout ? "mix-blend-multiply" : ""
                              }`}
                              onError={() => setLogoPreviewFailed(true)}
                            />
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 text-center text-[#6D4C41]/50">
                            <ImageIcon className="h-11 w-11 opacity-45" />
                            <span className="text-[11px] leading-snug">Nenhuma imagem ainda</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-3 max-w-[14rem] text-center text-[11px] leading-relaxed text-[#6D4C41]/65">
                        Área aproximada na barra — altura e opção de fundo refletem as definições abaixo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {logoSrcForPalette && !logoPreviewFailed ? (
                <div className="mt-4 rounded-xl border border-[#1B4332]/12 bg-white/70 px-4 py-3 sm:px-4 sm:py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Palette className="h-4 w-4 shrink-0 text-[#6D4C41]" aria-hidden />
                    <span className="text-xs font-medium text-[#6D4C41]">Cores sugeridas a partir do logo</span>
                    {logoPaletteLoading ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#1B4332]" aria-label="A extrair cores" />
                    ) : logoPalette ? (
                      <>
                        <div className="flex items-center gap-2" role="group" aria-label="Amostras de cor">
                          <span
                            className="h-8 w-8 shrink-0 rounded-lg border border-[#1B4332]/20 shadow-sm"
                            style={{ backgroundColor: logoPalette.dominant }}
                            title={`Predominante ${logoPalette.dominant}`}
                          />
                          <span
                            className="h-8 w-8 shrink-0 rounded-lg border border-[#1B4332]/20 shadow-sm"
                            style={{ backgroundColor: logoPalette.vibrant }}
                            title={`Destaque ${logoPalette.vibrant}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPrimaryColor(logoPalette.dominant);
                            setPublicProfile((prev) => ({ ...prev, accentColor: logoPalette.vibrant }));
                          }}
                          className="ml-auto inline-flex min-h-[36px] items-center justify-center gap-2 rounded-lg border border-[#1B4332]/25 bg-[#FAF8F3] px-3 py-1.5 text-xs font-semibold text-[#1B4332] transition-colors hover:bg-[#1B4332]/10"
                        >
                          Aplicar cor do logo ao tema
                        </button>
                      </>
                    ) : null}
                  </div>
                  {!logoPaletteLoading && !logoPalette ? (
                    <p className="mt-2 text-[11px] text-[#6D4C41]/75">
                      Não foi possível ler as cores desta imagem (por exemplo URL externa sem permissão CORS). Envie o
                      ficheiro ou use uma URL que permita leitura.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="logoHeightPx" className="mb-1 block text-sm font-medium text-[#6D4C41]">
                    Altura do Logo (px)
                  </label>
                  <input
                    id="logoHeightPx"
                    type="number"
                    min={20}
                    max={100}
                    step={1}
                    value={previewLogoH}
                    onChange={(e) => {
                      const raw = Number.parseInt(e.target.value, 10);
                      setPublicProfile((prev) => ({
                        ...prev,
                        logoHeightPx: clampStoreLogoHeightPx(Number.isFinite(raw) ? raw : undefined),
                      }));
                    }}
                    className={inputCls}
                    {...fp("navbar")}
                  />
                  <p className="mt-1 text-xs text-[#6D4C41]/75">Entre 20 e 100 px — controla a altura na barra da loja (e no rodapé, proporcionalmente).</p>
                </div>
                <div className="flex flex-col gap-2 rounded-xl border border-[#1B4332]/12 bg-white/60 p-3 sm:p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      {...fp("navbar")}
                      checked={previewLogoKnockout}
                      onChange={(e) =>
                        setPublicProfile((prev) => ({ ...prev, logoKnockoutWhite: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 shrink-0 rounded border-[#1B4332]/30 text-[#1B4332] focus:ring-[#1B4332]/40"
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#1B4332]">Remover fundo branco</span>
                      <span className="mt-0.5 block text-xs leading-snug text-[#6D4C41]/80">
                        Aplica <code className="rounded bg-[#1B4332]/10 px-1 text-[11px]">mix-blend-mode: multiply</code> no logo
                        para atenuar fundos brancos opacos (útil quando não há PNG transparente).
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="primaryColor" className="block text-sm font-medium text-[#6D4C41] mb-1">
                Cor primária
              </label>
              <div className="flex gap-3 items-center">
                <input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-[#1B4332]/20 cursor-pointer bg-white"
                  {...fp("navbar")}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (v === "" || /^#[0-9A-Fa-f]{0,6}$/.test(v) || /^[0-9A-Fa-f]{0,6}$/.test(v)) {
                      setPrimaryColor(v.startsWith("#") ? v : v ? `#${v}` : "#1B4332");
                    }
                  }}
                  placeholder="#1B4332"
                  className={`flex-1 font-mono text-sm ${inputCls}`}
                  {...fp("navbar")}
                />
              </div>
              <p className="text-xs text-[#6D4C41]/80 mt-1">
                Marca, textos e sobreposições na vitrine; o fim dos gradientes nos botões usa a cor abaixo.
              </p>
            </div>

            <div>
              <label htmlFor="accentColor" className="mb-1 block text-sm font-medium text-[#6D4C41]">
                Cor dos botões (gradiente)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="accentColor"
                  type="color"
                  value={accentFormValue}
                  onChange={(e) =>
                    setPublicProfile((prev) => ({ ...prev, accentColor: e.target.value }))
                  }
                  className="h-12 w-12 cursor-pointer rounded-lg border border-[#1B4332]/20 bg-white"
                  {...fp("navbar")}
                />
                <input
                  type="text"
                  value={publicProfile.accentColor?.trim() || ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (v === "") {
                      setPublicProfile((prev) => ({ ...prev, accentColor: undefined }));
                      return;
                    }
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || /^[0-9A-Fa-f]{0,6}$/.test(v)) {
                      setPublicProfile((prev) => ({
                        ...prev,
                        accentColor: v.startsWith("#") ? v : `#${v}`,
                      }));
                    }
                  }}
                  placeholder="#2D5F4A (opcional)"
                  className={`flex-1 font-mono text-sm ${inputCls}`}
                  {...fp("navbar")}
                />
              </div>
              <p className="mt-1 text-xs text-[#6D4C41]/80">
                Segundo tom do gradiente em CTAs e cabeçalhos. Vazio = tom padrão da loja.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#6D4C41]">Banner da página inicial</label>
              <p className="text-xs text-[#6D4C41]/80 -mt-1">
                Imagem larga atrás do texto principal (hero). Envie arquivo ou cole a URL pública.
              </p>
              <AdminPreviewLinkHint section="hero" />
              <label
                className="flex w-full max-w-md cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1B4332]/25 bg-white/80 px-4 py-3.5 transition-colors hover:border-[#1B4332]/45 hover:bg-white"
                onMouseDown={() => previewFocus("hero")}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleBannerFile}
                  {...fp("hero")}
                />
                <ImagePlus className="h-5 w-5 shrink-0 text-[#6D4C41]" />
                <span className="text-sm font-medium text-[#6D4C41]">Enviar imagem do banner</span>
              </label>
              {(bannerPreview ?? bannerUrl.trim()) ? (
                <div className="max-h-40 w-full max-w-xl overflow-hidden rounded-xl border border-[#1B4332]/15">
                  <img
                    src={bannerPreview ?? bannerUrl}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                </div>
              ) : null}
              <input
                id="bannerUrl"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://… (opcional)"
                className={inputCls}
                {...fp("hero")}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-[#1B4332]/12 bg-[#FAF8F3]/40 p-4">
              <h3 className="text-sm font-semibold text-[#1B4332]">Textos da página inicial (hero)</h3>
              <p className="text-xs text-[#6D4C41]/85">
                Estes textos aparecem no bloco grande da home. Deixe em branco para voltar ao texto padrão de
                demonstração.
              </p>
              <p className="text-[11px] text-[#6D4C41]/80 -mt-1">
                O mesmo bloco da pré-visualização inclui o banner acima — tudo é o «hero» no topo da página.
              </p>
              <div>
                <label htmlFor="heroBadge" className="mb-1 block text-xs font-medium text-[#6D4C41]">
                  Selo (linha pequena acima do título)
                </label>
                <input
                  id="heroBadge"
                  type="text"
                  value={publicProfile.heroBadge ?? ""}
                  onChange={(e) =>
                    setPublicProfile((prev) => ({
                      ...prev,
                      heroBadge: e.target.value.trim() === "" ? undefined : e.target.value,
                    }))
                  }
                  placeholder="Ex.: Premium Orgânico"
                  className={inputCls}
                  {...fp("hero")}
                />
              </div>
              <div>
                <label htmlFor="heroTitle" className="mb-1 block text-xs font-medium text-[#6D4C41]">
                  Título principal
                </label>
                <input
                  id="heroTitle"
                  type="text"
                  value={publicProfile.heroTitle ?? ""}
                  onChange={(e) =>
                    setPublicProfile((prev) => ({
                      ...prev,
                      heroTitle: e.target.value.trim() === "" ? undefined : e.target.value,
                    }))
                  }
                  placeholder="Título em destaque"
                  className={inputCls}
                  {...fp("hero")}
                />
              </div>
              <div>
                <label htmlFor="heroSubtitle" className="mb-1 block text-xs font-medium text-[#6D4C41]">
                  Subtítulo
                </label>
                <textarea
                  id="heroSubtitle"
                  rows={2}
                  value={publicProfile.heroSubtitle ?? ""}
                  onChange={(e) =>
                    setPublicProfile((prev) => ({
                      ...prev,
                      heroSubtitle: e.target.value.trim() === "" ? undefined : e.target.value,
                    }))
                  }
                  placeholder="Uma frase que resume a oferta"
                  className={inputCls}
                  {...fp("hero")}
                />
              </div>
              <div>
                <label htmlFor="heroCtaLabel" className="mb-1 block text-xs font-medium text-[#6D4C41]">
                  Texto do botão
                </label>
                <input
                  id="heroCtaLabel"
                  type="text"
                  value={publicProfile.heroCtaLabel ?? ""}
                  onChange={(e) =>
                    setPublicProfile((prev) => ({
                      ...prev,
                      heroCtaLabel: e.target.value.trim() === "" ? undefined : e.target.value,
                    }))
                  }
                  placeholder="Ex.: Compre agora"
                  className={inputCls}
                  {...fp("hero")}
                />
              </div>
            </div>

            <AdminSettingsHomeBlocksForm
              displayName={displayName}
              publicProfile={publicProfile}
              setPublicProfile={setPublicProfile}
              inputCls={inputCls}
              previewFocus={previewFocus}
              previewBlur={previewBlur}
              uploadingProfileImage={uploadingProfileImage}
              onProfileImageFile={handleProfileImageFile}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1B4332] border-b border-[#1B4332]/15 pb-2">
              Contato e redes
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6D4C41] mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  inputMode="tel"
                  autoComplete="tel"
                  value={publicProfile.contactWhatsapp ?? ""}
                  onChange={(e) =>
                    setPublicProfile((p) => ({
                      ...p,
                      contactWhatsapp: formatBrazilPhoneInput(e.target.value) || null,
                    }))
                  }
                  placeholder="(47) 99999-9999 ou link wa.me"
                  className={inputCls}
                  {...fp("footerContact")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6D4C41] mb-1">Telefone fixo / outro</label>
                <input
                  type="text"
                  inputMode="tel"
                  autoComplete="tel"
                  value={publicProfile.contactPhone ?? ""}
                  onChange={(e) =>
                    setPublicProfile((p) => ({
                      ...p,
                      contactPhone: formatBrazilPhoneInput(e.target.value) || null,
                    }))
                  }
                  placeholder="(61) 3333-0000"
                  className={inputCls}
                  {...fp("footerContact")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#6D4C41] mb-1">E-mail de atendimento</label>
                <input
                  type="email"
                  value={publicProfile.contactEmail ?? ""}
                  onChange={(e) =>
                    setPublicProfile((p) => ({ ...p, contactEmail: e.target.value || null }))
                  }
                  placeholder="contato@sualoja.com"
                  className={inputCls}
                  {...fp("footerContact")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6D4C41] mb-1">Instagram (URL)</label>
                <input
                  type="url"
                  value={publicProfile.instagramUrl ?? ""}
                  onChange={(e) =>
                    setPublicProfile((p) => ({ ...p, instagramUrl: e.target.value || null }))
                  }
                  placeholder="https://instagram.com/..."
                  className={inputCls}
                  {...fp("footerContact")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6D4C41] mb-1">Facebook (URL)</label>
                <input
                  type="url"
                  value={publicProfile.facebookUrl ?? ""}
                  onChange={(e) =>
                    setPublicProfile((p) => ({ ...p, facebookUrl: e.target.value || null }))
                  }
                  placeholder="https://facebook.com/..."
                  className={inputCls}
                  {...fp("footerContact")}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1B4332] border-b border-[#1B4332]/15 pb-2">
              Entrega e atendimento
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#6D4C41] mb-1">Horário de atendimento / loja</label>
              <textarea
                value={publicProfile.businessHours ?? ""}
                onChange={(e) =>
                  setPublicProfile((p) => ({ ...p, businessHours: e.target.value || null }))
                }
                rows={3}
                placeholder="Ex.: Seg a Sex 9h–18h"
                className={`${inputCls} resize-y min-h-[80px]`}
                {...fp("footerIntro")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6D4C41] mb-1">Regiões / frete / prazos</label>
              <textarea
                value={publicProfile.shippingInfo ?? ""}
                onChange={(e) =>
                  setPublicProfile((p) => ({ ...p, shippingInfo: e.target.value || null }))
                }
                rows={4}
                placeholder="Onde entregamos, valores de frete se houver, prazo médio..."
                className={`${inputCls} resize-y min-h-[100px]`}
                {...fp("footerIntro")}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1B4332] border-b border-[#1B4332]/15 pb-2">
              Textos legais e institucionais
            </h2>
            <p className="text-xs text-[#6D4C41]/80">
              Exibidos no rodapé da loja quando preenchidos. Use linguagem clara; revise com assessoria jurídica se
              necessário.
            </p>
            <div>
              <label className="block text-sm font-medium text-[#6D4C41] mb-1">Política de entrega</label>
              <textarea
                value={publicProfile.deliveryPolicy ?? ""}
                onChange={(e) =>
                  setPublicProfile((p) => ({ ...p, deliveryPolicy: e.target.value || null }))
                }
                rows={4}
                className={`${inputCls} resize-y min-h-[100px]`}
                {...fp("footerPolicyDelivery")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6D4C41] mb-1">Trocas e devoluções</label>
              <textarea
                value={publicProfile.returnsPolicy ?? ""}
                onChange={(e) =>
                  setPublicProfile((p) => ({ ...p, returnsPolicy: e.target.value || null }))
                }
                rows={4}
                className={`${inputCls} resize-y min-h-[100px]`}
                {...fp("footerPolicyReturns")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6D4C41] mb-1">Privacidade / LGPD</label>
              <textarea
                value={publicProfile.privacyPolicy ?? ""}
                onChange={(e) =>
                  setPublicProfile((p) => ({ ...p, privacyPolicy: e.target.value || null }))
                }
                rows={4}
                className={`${inputCls} resize-y min-h-[100px]`}
                {...fp("footerPolicyPrivacy")}
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={saving || uploadingImage || uploadingBanner || uploadingProfileImage != null}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--brand-primary)] to-[color:var(--brand-accent)] py-4 text-base font-semibold text-white shadow-md transition-[box-shadow,transform] hover:shadow-xl hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
          >
            {saving || uploadingImage || uploadingBanner || uploadingProfileImage != null ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {uploadingImage
              ? "Enviando logo..."
              : uploadingBanner
                ? "Enviando banner..."
                : uploadingProfileImage != null
                  ? "Enviando imagem da home..."
                  : saving
                    ? "Salvando..."
                    : "Salvar configurações"}
          </button>
          </div>
        </form>
        </div>

      <aside
        className="mt-10 flex min-h-[min(42dvh,22rem)] min-w-0 flex-col border-t border-[#1B4332]/10 pt-8 lg:sticky lg:top-[4.75rem] lg:z-30 lg:mt-0 lg:h-[calc(100vh-32px)] lg:min-h-0 lg:self-start lg:border-l lg:border-t-0 lg:border-[#1B4332]/10 lg:pl-0 lg:pt-0"
        role="complementary"
        aria-label="Pré-visualização da vitrine"
      >
        <div className="flex h-full min-h-0 flex-1 flex-col px-0 pb-10 lg:pb-3 lg:pt-0">
          <div className="mb-3 shrink-0 lg:hidden">
            <h2 className="text-lg font-semibold text-[#1B4332] font-playfair">Pré-visualização da home</h2>
            <p className="mt-1 text-xs text-[#6D4C41]">
              No computador esta coluna <strong className="text-[#1B4332]">estica à altura do formulário</strong>{" "}
              para a pré-visualização acompanhar o lado esquerdo enquanto percorres a página.
            </p>
          </div>
          <AdminStorefrontPreviewChrome activeSection={activeSection} />
          <div className="mt-2 flex min-h-0 flex-1 flex-col lg:mt-2">
            <AdminStorefrontPreviewPanel
              merge={previewMerge}
              activeSection={activeSection}
              previewScrollTick={previewScrollTick}
            />
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
};
