import { useEffect, useState } from "react";
import { Loader2, Palette } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { extractLogoPaletteFromSrc } from "@/react-app/utils/extractLogoPalette";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";

type SettingsLogoPalettePanelProps = {
  logoSrc: string;
  previewFailed: boolean;
};

export function SettingsLogoPalettePanel({ logoSrc, previewFailed }: SettingsLogoPalettePanelProps) {
  const { setValue } = useFormContext<AdminSettingsFormValues>();
  const [palette, setPalette] = useState<{ dominant: string; vibrant: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!logoSrc.trim() || previewFailed) {
      setPalette(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPalette(null);
    void extractLogoPaletteFromSrc(logoSrc).then((p) => {
      if (cancelled) return;
      setPalette(p);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [logoSrc, previewFailed]);

  if (!logoSrc.trim() || previewFailed) return null;

  return (
    <div className="rounded-xl border border-brand-primary/10 bg-surface-muted/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Palette className="h-4 w-4 shrink-0 text-content-muted" aria-hidden />
        <span className="text-xs font-medium text-content-muted">Cores sugeridas a partir do logo</span>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-brand-primary" aria-label="A extrair cores" /> : null}
        {palette ? (
          <>
            <div className="flex items-center gap-2" role="group" aria-label="Amostras de cor">
              <span className="h-8 w-8 rounded-lg border border-brand-primary/20 shadow-sm" style={{ backgroundColor: palette.dominant }} />
              <span className="h-8 w-8 rounded-lg border border-brand-primary/20 shadow-sm" style={{ backgroundColor: palette.vibrant }} />
            </div>
            <button
              type="button"
              onClick={() => {
                setValue("primaryColor", palette.dominant, { shouldDirty: true, shouldValidate: true });
                setValue("publicProfile.accentColor", palette.vibrant, { shouldDirty: true, shouldValidate: true });
              }}
              className="ml-auto rounded-lg border border-brand-primary/20 bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface-muted"
            >
              Aplicar cor do logo ao tema
            </button>
          </>
        ) : null}
      </div>
      {!loading && !palette ? (
        <p className="mt-2 text-[11px] text-content-muted">
          Não foi possível ler as cores desta imagem. Envie o ficheiro ou use uma URL com permissão CORS.
        </p>
      ) : null}
    </div>
  );
}
