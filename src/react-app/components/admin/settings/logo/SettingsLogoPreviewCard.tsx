import { Image as ImageIcon } from "lucide-react";
import { clampStoreLogoHeightPx } from "@/react-app/utils/storeLogoDisplay";

type SettingsLogoPreviewCardProps = {
  src: string;
  previewFailed: boolean;
  knockout: boolean;
  logoHeightPx: number;
  onPreviewError: () => void;
};

export function SettingsLogoPreviewCard({
  src,
  previewFailed,
  knockout,
  logoHeightPx,
  onPreviewError,
}: SettingsLogoPreviewCardProps) {
  const h = Math.min(clampStoreLogoHeightPx(logoHeightPx), 72);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-content-muted">Pré-visualização</span>
      <div className="relative flex min-h-[12.5rem] flex-col items-center justify-center rounded-2xl border border-brand-primary/10 bg-surface-muted px-4 py-5">
        <div
          className={`relative flex h-[7.25rem] w-full max-w-[240px] items-center justify-center rounded-xl px-3 py-2.5 ring-1 ring-brand-primary/10 ${
            knockout ? "bg-brand-primary/10" : "bg-surface-elevated"
          }`}
        >
          {src.trim() ? (
            previewFailed ? (
              <div className="flex flex-col items-center gap-1 px-2 text-center text-content-muted">
                <ImageIcon className="h-8 w-8 opacity-60" />
                <span className="text-[11px]">Não foi possível carregar esta URL.</span>
              </div>
            ) : (
              <img
                src={src}
                alt=""
                style={{ height: `${h}px`, width: "auto" }}
                className={`max-h-[4.5rem] w-auto object-contain ${knockout ? "mix-blend-multiply" : ""}`}
                onError={onPreviewError}
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-content-muted">
              <ImageIcon className="h-11 w-11 opacity-45" />
              <span className="text-[11px]">Nenhuma imagem ainda</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
