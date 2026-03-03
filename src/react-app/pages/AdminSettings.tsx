import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Home, LayoutDashboard, Save, Image as ImageIcon } from "lucide-react";
import { adminApiFetch } from "@/react-app/services/api";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import type { StoreSettingsData } from "@/react-app/contexts/StoreSettingsContext";

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

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [minimumOrderValue, setMinimumOrderValue] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1B4332");

  useEffect(() => {
    let mounted = true;
    adminApiFetch<StoreSettingsData>("/api/admin/settings")
      .then((data) => {
        if (!mounted) return;
        setDisplayName(data?.displayName ?? "");
        setLogoUrl(data?.logoUrl ?? "");
        setMinimumOrderValue(data?.minimumOrderValue != null ? formatBRL(data.minimumOrderValue) : "");
        setPrimaryColor(data?.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.primaryColor) ? data.primaryColor : "#1B4332");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await adminApiFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          logoUrl: logoUrl.trim() || null,
          minimumOrderValue: parseBRL(minimumOrderValue),
          primaryColor: primaryColor.trim() || null,
        }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
            <p className="text-[#6D4C41] font-inter">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
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
                <p className="text-sm text-[#6D4C41] font-inter">Nome, logo, valor mínimo e cor</p>
              </div>
            </div>
          </div>
          <AdminNav />
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

        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-[#1B4332]/10 p-6 space-y-6 font-inter">
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
              className="w-full px-4 py-2.5 rounded-xl border border-[#1B4332]/20 bg-white text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
            />
          </div>

          <div>
            <label htmlFor="logoUrl" className="block text-sm font-medium text-[#6D4C41] mb-1">
              URL da Logomarca
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 w-full px-4 py-2.5 rounded-xl border border-[#1B4332]/20 bg-white text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
              />
              <div className="flex-shrink-0 w-24 h-24 rounded-xl border border-[#1B4332]/20 bg-[#FAF8F3] flex items-center justify-center overflow-hidden">
                {logoUrl.trim() ? (
                  <img
                    src={logoUrl}
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
              className="w-full px-4 py-2.5 rounded-xl border border-[#1B4332]/20 bg-white text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
            />
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#1B4332]/20 bg-white text-[#1B4332] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </div>
    </div>
  );
}
