import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Home, LayoutDashboard, Save, Image as ImageIcon, ImagePlus, Loader2 } from "lucide-react";
import { adminApiFetch, adminUploadImage } from "@/react-app/services/api";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import type { StoreSettingsData } from "@/react-app/contexts/StoreSettingsContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import type { StorePublicProfile } from "@/react-app/types";
import { parsePublicProfile } from "@/worker/core/storePublicProfile";

function formatBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return value.toFixed(2).replace(".", ",");
}

function parseBRL(str: string): number | null {
  const cleaned = str.replace(/\D/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned) / 100;
  return Number.isNaN(value) ? null : value;
}

const emptyProfile = (): StorePublicProfile => parsePublicProfile({});

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { refetch: refetchStoreSettings } = useStoreSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [minimumOrderValue, setMinimumOrderValue] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1B4332");
  const [publicProfile, setPublicProfile] = useState<StorePublicProfile>(emptyProfile);

  useEffect(() => {
    let mounted = true;
    adminApiFetch<StoreSettingsData>("/api/admin/settings")
      .then((data) => {
        if (!mounted) return;
        setDisplayName(data?.displayName ?? "");
        setLogoUrl(data?.logoUrl ?? "");
        setMinimumOrderValue(data?.minimumOrderValue != null ? formatBRL(data.minimumOrderValue) : "");
        setPrimaryColor(
          data?.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.primaryColor) ? data.primaryColor : "#1B4332"
        );
        setPublicProfile(parsePublicProfile(data?.publicProfile ?? {}));
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Erro ao carregar configurações");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setImageFile(file ?? null);
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-[#1B4332]/20 bg-white text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let logoUrlFinal = logoUrl.trim();
      if (imageFile) {
        setUploadingImage(true);
        try {
          const { publicUrl } = await adminUploadImage(imageFile);
          logoUrlFinal = publicUrl;
        } finally {
          setUploadingImage(false);
        }
      }

      await adminApiFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          logoUrl: logoUrlFinal || null,
          minimumOrderValue: parseBRL(minimumOrderValue),
          primaryColor: primaryColor.trim() || null,
          publicProfile: {
            ...publicProfile,
            requireLoginToCheckout: publicProfile.requireLoginToCheckout !== false,
          },
        }),
      });
      setImageFile(null);
      setImagePreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
      if (logoUrlFinal) setLogoUrl(logoUrlFinal);
      setSuccess(true);
      await refetchStoreSettings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
            <p className="text-[#6D4C41] font-inter">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
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
        {success && (
          <div className="bg-green-50 text-green-800 border border-green-200 rounded-2xl p-4 mb-6 font-inter">
            Configurações salvas com sucesso.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="w-full bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-[#1B4332]/10 p-6 space-y-8 font-inter"
        >
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
                placeholder="Ex: Natfoods"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6D4C41] mb-1">Logomarca</label>
              <p className="text-xs text-[#6D4C41]/80 mb-2">
                Envie um arquivo ou informe a URL pública da imagem.
              </p>
              <label className="flex items-center justify-center gap-2 w-full max-w-md py-3 px-4 border-2 border-dashed border-[#1B4332]/20 rounded-xl cursor-pointer hover:border-[#1B4332]/40 hover:bg-[#1B4332]/5 transition-colors mb-3">
                <input type="file" accept="image/*" className="sr-only" onChange={handleLogoFile} />
                <ImagePlus className="h-5 w-5 text-[#6D4C41]" />
                <span className="text-sm text-[#6D4C41]">Enviar imagem do logo</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <input
                  id="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 w-full ${inputCls}`}
                />
                <div className="flex-shrink-0 w-24 h-24 rounded-xl border border-[#1B4332]/20 bg-[#FAF8F3] flex items-center justify-center overflow-hidden">
                  {imagePreview || logoUrl.trim() ? (
                    <img
                      src={imagePreview ?? logoUrl}
                      alt="Preview logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-[#6D4C41]/40" />
                  )}
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
                />
              </div>
            </div>

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
                onChange={(e) =>
                  setPublicProfile((p) => ({
                    ...p,
                    requireLoginToCheckout: e.target.checked,
                  }))
                }
              />
              <span>
                <span className="font-medium text-[#1B4332]">Exigir login para comprar</span>
                <span className="block text-sm text-[#6D4C41] mt-0.5">
                  Desmarcado: o cliente pode finalizar informando e-mail, telefone e endereço (sem conta).
                  O e-mail é usado para segurança no pagamento e consulta do pedido.
                </span>
              </span>
            </label>
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
                  value={publicProfile.contactWhatsapp ?? ""}
                  onChange={(e) =>
                    setPublicProfile((p) => ({ ...p, contactWhatsapp: e.target.value || null }))
                  }
                  placeholder="61999990000 ou link wa.me"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6D4C41] mb-1">Telefone fixo / outro</label>
                <input
                  type="text"
                  value={publicProfile.contactPhone ?? ""}
                  onChange={(e) =>
                    setPublicProfile((p) => ({ ...p, contactPhone: e.target.value || null }))
                  }
                  placeholder="(61) 3333-0000"
                  className={inputCls}
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
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving || uploadingImage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {uploadingImage ? "Enviando logo..." : saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </div>
    </div>
  );
}
