import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ImageCoverFramingKind } from "@/react-app/utils/imageCoverFraming";
import { useImageCoverFraming } from "@/react-app/hooks/admin/media/useImageCoverFraming";
import { framingHint, framingTitle } from "@/react-app/components/admin/media/imageCoverFramingConfig";
import { ImageCoverFramingCanvas } from "@/react-app/components/admin/media/ImageCoverFramingCanvas";
import { ImageCoverFramingControls } from "@/react-app/components/admin/media/ImageCoverFramingControls";
import { useToast } from "@/react-app/providers/ToastProvider";

type ImageCoverFramingDrawerProps = {
  open: boolean;
  kind: ImageCoverFramingKind;
  imageSrc: string;
  originalFileName: string;
  onClose: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

export function ImageCoverFramingDrawer({
  open,
  kind,
  imageSrc,
  originalFileName,
  onClose,
  onConfirm,
}: ImageCoverFramingDrawerProps) {
  const f = useImageCoverFraming(open, imageSrc, kind);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const handleConfirm = async () => {
    f.setBusy(true);
    try {
      const file = await f.exportFile(originalFileName);
      await Promise.resolve(onConfirm(file));
    } catch (err: unknown) {
      showToast({
        type: "error",
        message: err instanceof Error ? err.message : "Não foi possível processar a imagem.",
      });
    } finally {
      f.setBusy(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button type="button" aria-label="Fechar enquadramento" className="fixed inset-0 z-[200] bg-surface/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside role="dialog" aria-modal="true" aria-label={framingTitle(kind)} className="fixed right-0 top-0 z-[201] flex h-[100dvh] w-full max-w-[100vw] flex-col border-l border-brand-primary/15 bg-surface shadow-2xl sm:max-w-xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 360, damping: 36 }}>
            <div className="flex items-start justify-between gap-3 border-b border-brand-primary/10 px-4 py-3 sm:px-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-content">{framingTitle(kind)}</h2>
                <p className="mt-1 text-sm text-content-muted">{framingHint(kind)}</p>
              </div>
              <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-content-muted hover:bg-surface-muted hover:text-content" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {f.loadError ? (
                <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{f.loadError}</p>
              ) : (
                <>
                  <ImageCoverFramingCanvas viewportRef={f.viewportRef} previewRef={f.previewRef} previewH={f.previewH} onPointerDown={f.onPointerDown} onPointerMove={f.onPointerMove} onPointerUp={f.onPointerUp} />
                  <ImageCoverFramingControls zoom={f.zoom} panX={f.panX} panY={f.panY} onZoom={f.setZoom} onPanX={f.setPanX} onPanY={f.setPanY} onReset={f.resetFraming} />
                </>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-brand-primary/10 px-4 py-3 sm:px-5">
              <button type="button" onClick={onClose} disabled={f.busy} className="rounded-xl border border-brand-primary/15 bg-surface-elevated px-4 py-2.5 text-sm font-medium text-content-muted hover:bg-surface-muted disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={() => void handleConfirm()} disabled={f.busy || !f.imgReady || !!f.loadError} className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{f.busy ? "A gerar…" : "Usar este enquadramento"}</button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
