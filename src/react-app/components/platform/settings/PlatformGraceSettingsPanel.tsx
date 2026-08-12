import { useState } from "react";
import { CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { PlatformConfirmDialog } from "@/react-app/components/platform/shared/PlatformConfirmDialog";
import { PlatformGraceSettingsForm } from "@/react-app/components/platform/settings/PlatformGraceSettingsForm";
import { usePlatformRuntimeSettings } from "@/react-app/hooks/platform/usePlatformRuntimeSettings";
import type { PlatformGraceSettingsFormValues } from "@/schemas/platformRuntimeSettings";

export function PlatformGraceSettingsPanel() {
  const settings = usePlatformRuntimeSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PlatformGraceSettingsFormValues | null>(null);

  const handleSubmit = (values: PlatformGraceSettingsFormValues) => {
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingValues) return;
    await settings.saveGraceDays(pendingValues.subscriptionGraceDays);
    setConfirmOpen(false);
    setPendingValues(null);
  };

  return (
    <div className="rounded-3xl border border-brand-primary/15 bg-surface shadow-sm">
      <div className="border-b border-brand-primary/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-brand-primary">
          <CalendarClock className="h-5 w-5 shrink-0" aria-hidden />
          <h2 className="font-display text-xl font-semibold text-content sm:text-2xl">Carência de assinatura</h2>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-content-muted">
          Dias de tolerância após fim do período de teste ou de uma fatura em atraso, antes da loja ser suspensa. Afeta{" "}
          <strong className="text-content">todas</strong> as lojas.
        </p>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {settings.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-content-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
          </p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <PlatformGraceSettingsForm
              defaultGraceDays={settings.subscriptionGraceDays}
              isSaving={settings.isSaving}
              onSubmit={handleSubmit}
            />
            <button
              type="button"
              disabled={settings.isLoading || settings.isSaving}
              onClick={() => void settings.refetch()}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-brand-primary/25 bg-surface-elevated px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-surface-muted disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Recarregar
            </button>
          </div>
        )}
      </div>

      <PlatformConfirmDialog
        open={confirmOpen}
        title="Alterar carência global?"
        loading={settings.isSaving}
        confirmLabel="Confirmar"
        onClose={() => {
          if (settings.isSaving) return;
          setConfirmOpen(false);
          setPendingValues(null);
        }}
        onConfirm={() => void handleConfirm()}
      >
        <p className="text-center">
          O valor passa a ser usado em todo o motor de suspensão e benefícios da plataforma.
        </p>
      </PlatformConfirmDialog>
    </div>
  );
}
