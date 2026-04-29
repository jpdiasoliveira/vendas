import { useCallback, useMemo } from "react";
import { Home, LayoutDashboard, Save, Image as ImageIcon, ImagePlus, Loader2, CheckCircle2 } from "lucide-react";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { AdminPreviewLinkHint } from "@/react-app/components/admin/AdminPreviewLinkHint";
import { AdminSettingsHomeBlocksForm } from "@/react-app/components/admin/AdminSettingsHomeBlocksForm";
import { AdminStorefrontPreviewPanel } from "@/react-app/components/admin/AdminStorefrontPreviewPanel";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import { useStorefrontPreviewFocus } from "@/react-app/components/admin/useStorefrontPreviewFocus";
import { formatBrazilPhoneInput } from "@/react-app/utils/phoneBr";
import { parseBRL } from "@/react-app/utils/adminSettingsBrl";
import type { AdminSettingsViewModel } from "@/react-app/hooks/useAdminSettings";
import type { StoreSettingsData } from "@/react-app/contexts/StoreSettingsContext";

export const AdminSettingsFormBody = ({ m }: { m: AdminSettingsViewModel }) => {
  const { activeSection, previewFocus, previewBlur } = useStorefrontPreviewFocus();
  const fp = useCallback(
    (id: StorefrontPreviewSectionId) => ({
      onFocus: () => previewFocus(id),
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
    setMinimumOrderValue,
    primaryColor,
    setPrimaryColor,
    publicProfile,
    setPublicProfile,
    checkoutLoginAck,
    setCheckoutLoginAck,
    bannerUrl,
    setBannerUrl,
    bannerPreview,
    handleLogoFile,
    handleBannerFile,
    handleProfileImageFile,
    handleSubmit,
    inputCls,
    saveSuccessRef,
  } = m;

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
    [displayName, logoUrl, imagePreview, bannerUrl, bannerPreview, primaryColor, minimumOrderValue, publicProfile]
  );

  return (
    <div className="relative w-full">
      <div className="mx-auto w-full max-w-[min(100%,1920px)] lg:mx-0 lg:max-w-[calc(50vw-12px)] lg:pr-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 bg-white/60 backdrop-blur-sm rounded-full text-[#6D4C41] hover:text-[#1B4332] hover:bg-white transition-all shadow-sm border border-[#1B4332]/10"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-[#1B4332]" />
              <div>
                <h1 className="text-2xl font-bold text-[#1B4332] font-playfair">Configurações da Loja</h1>
                <p className="text-sm text-[#6D4C41] font-inter">
                  Aparência, contato, textos institucionais e regras de checkout
                </p>
              </div>
            </div>
          </div>
          <div className="w-full min-w-0 sm:w-auto">
            <AdminNav />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 mb-6 font-inter">
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-[#1B4332]/10 p-4 sm:p-5 font-inter"
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
              <p className="text-xs text-[#6D4C41]/80 -mt-1">
                Envie um arquivo ou informe a URL pública da imagem. A pré-visualização mostra como o logo tende a aparecer na barra do site.
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
                        className="pointer-events-none absolute inset-x-0 top-0 h-9 rounded-t-[0.9rem] bg-[#1B4332]/[0.07]"
                        aria-hidden
                      />
                      <div className="relative flex h-[7.25rem] w-full max-w-[240px] items-center justify-center rounded-xl bg-white/95 px-3 py-2.5 shadow-sm ring-1 ring-[#1B4332]/10">
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
                              className="max-h-full max-w-full object-contain"
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
                        Área aproximada na barra. PNG ou SVG com fundo transparente costumam funcionar melhor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="primaryColor" className="block text-sm font-medium text-[#6D4C41] mb-1">
                Cor Principal
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
                Botões e detalhes da vitrine usam esta cor; se estiver vazia ou inválida, o site usa o verde padrão.
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

            <div>
              <label htmlFor="minimumOrderValue" className="block text-sm font-medium text-[#6D4C41] mb-1">
                Valor Mínimo de Pedido (R$)
              </label>
              <input
                id="minimumOrderValue"
                type="text"
                inputMode="decimal"
                value={minimumOrderValue}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (v === "") {
                    setMinimumOrderValue("");
                    return;
                  }
                  const n = Number(v) / 100;
                  setMinimumOrderValue(n.toFixed(2).replace(".", ","));
                }}
                placeholder="0,00"
                className={inputCls}
                {...fp("footerEnd")}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1B4332] border-b border-[#1B4332]/15 pb-2">
              Checkout na loja
            </h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-[#1B4332]/30 text-[#1B4332] focus:ring-[#1B4332]/30"
                checked={publicProfile.requireLoginToCheckout !== false}
                {...fp("footerEnd")}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPublicProfile((p) => ({
                    ...p,
                    requireLoginToCheckout: checked,
                  }));
                  setCheckoutLoginAck(
                    checked
                      ? "Opção registrada: a loja exigirá login para finalizar a compra. Clique em «Salvar configurações» abaixo para publicar."
                      : "Opção registrada: visitantes poderão comprar sem conta (e-mail, telefone e endereço). Clique em «Salvar configurações» abaixo para publicar."
                  );
                }}
              />
              <span>
                <span className="font-medium text-[#1B4332]">Exigir login para comprar</span>
                <span className="block text-sm text-[#6D4C41] mt-0.5">
                  Desmarcado: o cliente pode finalizar informando e-mail, telefone e endereço (sem conta).
                  O e-mail é usado para segurança no pagamento e consulta do pedido.
                </span>
              </span>
            </label>
            {checkoutLoginAck ? (
              <div
                className="flex gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950 font-inter"
                role="status"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
                <p>{checkoutLoginAck}</p>
              </div>
            ) : null}
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
                {...fp("footerPolicies")}
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
                {...fp("footerPolicies")}
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
                {...fp("footerPolicies")}
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={saving || uploadingImage || uploadingBanner || uploadingProfileImage != null}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

          {success ? (
            <div
              ref={saveSuccessRef}
              className="mt-4 flex gap-3 rounded-2xl border border-green-200 bg-green-50/95 px-4 py-4 text-green-900 shadow-sm"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 mt-0.5" aria-hidden />
              <div className="min-w-0 font-inter">
                <p className="font-semibold text-green-900">Configurações salvas com sucesso</p>
                <p className="mt-1 text-sm text-green-800/90">
                  As alterações já estão aplicadas na vitrine e no checkout desta loja.
                </p>
              </div>
            </div>
          ) : null}
          </div>
        </form>
      </div>

      <div
        className="mt-10 flex flex-col border-t border-[#1B4332]/15 pt-8 lg:fixed lg:bottom-0 lg:right-0 lg:top-24 lg:z-[100] lg:mt-0 lg:w-1/2 lg:overflow-hidden lg:border-l lg:border-t-0 lg:border-[#1B4332]/20 lg:bg-[#FAF8F3]/98 lg:pt-0 lg:shadow-[-8px_0_32px_rgba(27,67,50,0.07)]"
        role="complementary"
        aria-label="Pré-visualização da vitrine"
      >
        <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-10 sm:px-3 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:px-2 lg:pb-2">
          <div className="mb-3 shrink-0 lg:hidden">
            <h2 className="text-lg font-semibold text-[#1B4332] font-playfair">Pré-visualização da home</h2>
            <p className="mt-1 text-xs text-[#6D4C41]">
              No computador esta área fica <strong className="text-[#1B4332]">fixa à direita</strong> enquanto desce o
              formulário — vê sempre o bloco que está a editar.
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AdminStorefrontPreviewPanel merge={previewMerge} activeSection={activeSection} />
          </div>
        </div>
      </div>
    </div>
  );
};
