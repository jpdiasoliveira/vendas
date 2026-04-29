import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { platformApiFetch } from "@/react-app/services/api";

type PlatformGraceSettingsPanelProps = {
  onSaved?: () => void;
};

/**
 * Parâmetro global `subscription_grace_days` (runtime da plataforma).
 * Separado dos planos para manter “Configurações” focada em política temporal.
 */
export const PlatformGraceSettingsPanel = ({ onSaved }: PlatformGraceSettingsPanelProps) => {
  const [graceDaysInput, setGraceDaysInput] = useState("7");
  const [baseline, setBaseline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await platformApiFetch<{ subscriptionGraceDays: number }>("/api/platform/runtime-settings");
      const g = String(data.subscriptionGraceDays);
      setGraceDaysInput(g);
      setBaseline(g);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = baseline != null && graceDaysInput !== baseline;

  const persist = async () => {
    const n = Number(graceDaysInput);
    if (!Number.isInteger(n) || n < 0 || n > 90) {
      setMessage("Use um inteiro entre 0 e 90 dias.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const data = await platformApiFetch<{ subscriptionGraceDays: number }>("/api/platform/runtime-settings", {
        method: "PATCH",
        body: JSON.stringify({ subscriptionGraceDays: n }),
      });
      const g = String(data.subscriptionGraceDays);
      setGraceDaysInput(g);
      setBaseline(g);
      setConfirmOpen(false);
      onSaved?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[color:var(--brand-primary)]/15 bg-white/95 shadow-sm">
      <div className="border-b border-[#1B4332]/10 bg-white/90 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-[var(--brand-primary)]">
          <CalendarClock className="h-5 w-5 shrink-0" aria-hidden />
          <h2 className="font-playfair text-xl font-semibold text-[#1B4332] sm:text-2xl">Carência de assinatura</h2>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Dias de tolerância após fim do período de teste ou de uma fatura em atraso, antes da loja ser suspensa. Afeta{" "}
          <strong className="text-[#1B4332]">todas</strong> as lojas.
        </p>
      </div>
      <div className="px-5 py-5 sm:px-6">
        {loading ? (
          <p className="text-sm text-slate-400">A carregar…</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="grace-days-field" className="mb-1 block text-xs font-medium text-[#1B4332]">
                Dias (0 a 90)
              </label>
              <input
                id="grace-days-field"
                type="number"
                min={0}
                max={90}
                step={1}
                value={graceDaysInput}
                onChange={(e) => setGraceDaysInput(e.target.value)}
                className="w-28 rounded-xl border border-[#1B4332]/20 px-3 py-2 font-mono text-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25"
              />
            </div>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => setConfirmOpen(true)}
              className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => void load()}
              className="rounded-xl border border-[color:var(--brand-primary)]/25 bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[#FAF8F3] disabled:opacity-50"
            >
              Recarregar
            </button>
          </div>
        )}
        {message ? (
          <p className={`mt-3 text-sm ${message.includes("inteiro") || message.includes("carregar") ? "text-red-700" : "text-emerald-700"}`}>
            {message}
          </p>
        ) : null}
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setConfirmOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl border border-white/50 bg-white p-6 shadow-2xl" role="alertdialog">
            <div className="mb-3 flex justify-center">
              <div className="rounded-full bg-amber-100 p-3">
                <AlertTriangle className="h-8 w-8 text-amber-700" aria-hidden />
              </div>
            </div>
            <h3 className="text-center font-playfair text-lg font-semibold text-[#1B4332]">Alterar carência global?</h3>
            <p className="mt-3 text-center text-sm text-slate-400">
              O valor passa a ser usado em todo o motor de suspensão e benefícios da plataforma.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-[#1B4332]/20 py-2.5 text-sm font-medium text-slate-600 hover:bg-[#FAF8F3] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void persist()}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? "A gravar…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
