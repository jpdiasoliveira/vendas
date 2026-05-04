import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  canvasToJpegFile,
  panAfterDragPixels,
  renderCoverFramedToCanvas,
  type ImageCoverFramingKind,
} from "@/react-app/utils/imageCoverFraming";

type ImageCoverFramingModalProps = {
  open: boolean;
  kind: ImageCoverFramingKind;
  imageSrc: string;
  originalFileName: string;
  onClose: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

const PREVIEW_W = 720;
const BANNER_RATIO = 16 / 9;
const LOGO_RATIO = 1;
const BLOCK_RATIO = 4 / 3;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

const framingRatio = (kind: ImageCoverFramingKind): number =>
  kind === "banner" ? BANNER_RATIO : kind === "logo" ? LOGO_RATIO : BLOCK_RATIO;

const exportSize = (kind: ImageCoverFramingKind): { w: number; h: number } => {
  if (kind === "logo") return { w: 1024, h: 1024 };
  if (kind === "banner") return { w: 1920, h: 1080 };
  return { w: 1600, h: 1200 };
};

const framingTitle = (kind: ImageCoverFramingKind): string => {
  switch (kind) {
    case "banner":
      return "Ajustar banner (hero)";
    case "logo":
      return "Ajustar logomarca";
    case "story":
      return "Ajustar imagem — Nossa história";
    case "lifestyleLeft":
      return "Ajustar imagem — Lifestyle (esquerda)";
    case "lifestyleRight":
      return "Ajustar imagem — Lifestyle (direita)";
  }
};

const framingHint = (kind: ImageCoverFramingKind): string => {
  switch (kind) {
    case "banner":
      return "Área fixa 16:9 como no hero (sem animação extra na loja).";
    case "logo":
      return "Área fixa quadrada como no menu.";
    default:
      return "Área fixa 4:3 como nos cartões da home.";
  }
};

export const ImageCoverFramingModal = ({
  open,
  kind,
  imageSrc,
  originalFileName,
  onClose,
  onConfirm,
}: ImageCoverFramingModalProps) => {
  const titleId = useId();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const pointersRef = useRef(
    new Map<number, { x: number; y: number }>()
  );
  const pinchRef = useRef<{ dist0: number; zoom0: number } | null>(null);
  const panDragRef = useRef<{ lastX: number; lastY: number } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [imgReady, setImgReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const framingStateRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  framingStateRef.current = { zoom, panX, panY };

  const ratio = framingRatio(kind);
  const previewH = Math.round(PREVIEW_W / ratio);

  const redrawPreview = useCallback(() => {
    const canvas = previewRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.naturalWidth) return;
    const out = renderCoverFramedToCanvas(img, PREVIEW_W, previewH, zoom, panX, panY);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = out.width;
    canvas.height = out.height;
    ctx.drawImage(out, 0, 0);
  }, [zoom, panX, panY, previewH]);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setImgReady(false);
    setLoadError(null);
    pointersRef.current.clear();
    pinchRef.current = null;
    panDragRef.current = null;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgReady(true);
    };
    img.onerror = () => {
      setLoadError("Não foi possível carregar a imagem.");
    };
    img.src = imageSrc;
    return () => {
      imgRef.current = null;
    };
  }, [open, imageSrc]);

  useLayoutEffect(() => {
    if (!open || !imgReady) return;
    redrawPreview();
  }, [open, imgReady, redrawPreview]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !open || !imgReady) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = -e.deltaY * 0.0018;
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + step)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, imgReady]);

  const pointerDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const m = pointersRef.current;
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ids = [...m.keys()];
    if (ids.length === 2) {
      const p0 = m.get(ids[0])!;
      const p1 = m.get(ids[1])!;
      pinchRef.current = {
        dist0: pointerDistance(p0, p1),
        zoom0: framingStateRef.current.zoom,
      };
      panDragRef.current = null;
    } else if (ids.length === 1) {
      pinchRef.current = null;
      panDragRef.current = { lastX: e.clientX, lastY: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const m = pointersRef.current;
    if (!m.has(e.pointerId)) return;
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const img = imgRef.current;
    if (!img?.naturalWidth) return;

    const ids = [...m.keys()];
    if (ids.length >= 2 && pinchRef.current) {
      const p0 = m.get(ids[0])!;
      const p1 = m.get(ids[1])!;
      const d = pointerDistance(p0, p1);
      const { dist0, zoom0 } = pinchRef.current;
      if (dist0 > 8) {
        const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (zoom0 * d) / dist0));
        framingStateRef.current = { ...framingStateRef.current, zoom: nz };
        setZoom(nz);
      }
      return;
    }

    if (ids.length === 1 && panDragRef.current) {
      const { lastX, lastY } = panDragRef.current;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      panDragRef.current = { lastX: e.clientX, lastY: e.clientY };
      const { zoom: z, panX: px, panY: py } = framingStateRef.current;
      const { panX: nx, panY: ny } = panAfterDragPixels(
        img.naturalWidth,
        img.naturalHeight,
        PREVIEW_W,
        previewH,
        z,
        px,
        py,
        dx,
        dy
      );
      framingStateRef.current = { zoom: z, panX: nx, panY: ny };
      setPanX(nx);
      setPanY(ny);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) panDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    setBusy(true);
    setLoadError(null);
    try {
      const { w, h } = exportSize(kind);
      const canvas = renderCoverFramedToCanvas(img, w, h, zoom, panX, panY);
      const file = await canvasToJpegFile(canvas, originalFileName);
      await Promise.resolve(onConfirm(file));
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Erro ao processar");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(92dvh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#1B4332]/15 bg-[#FAF8F3] shadow-2xl"
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#1B4332]/10 px-5 py-4">
          <div>
            <h2 id={titleId} className="font-playfair text-xl font-semibold text-[#1B4332]">
              {framingTitle(kind)}
            </h2>
            <p className="mt-1 font-inter text-sm text-[#6D4C41]">
              Arraste na foto para posicionar; rode a roda do rato ou use dois dedos no telemóvel para aproximar ou
              afastar. {framingHint(kind)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#6D4C41] transition-colors hover:bg-black/5 hover:text-[#1B4332]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loadError ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
          ) : (
            <>
              <div
                ref={viewportRef}
                className="relative mx-auto w-full max-w-[720px] touch-none select-none overflow-hidden rounded-xl border-2 border-[#1B4332]/25 bg-black/80 shadow-inner ring-2 ring-white/30"
                style={{ aspectRatio: `${PREVIEW_W} / ${previewH}` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handlePointerUp}
              >
                <canvas
                  ref={previewRef}
                  className="pointer-events-none block h-full w-full object-contain"
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/55 to-transparent px-3 pb-2 pt-8">
                  <p className="text-center text-[11px] font-medium text-white/95">
                    Arrastar · zoom com roda ou pinça
                  </p>
                </div>
              </div>

              <details className="mx-auto mt-4 max-w-xl rounded-xl border border-[#1B4332]/12 bg-white/70 px-3 py-2">
                <summary className="cursor-pointer font-inter text-sm font-medium text-[#1B4332]">
                  Ajuste fino (sliders)
                </summary>
                <div className="mt-4 space-y-4 pb-2">
                  <div>
                    <label className="mb-2 flex justify-between font-inter text-sm font-medium text-[#1B4332]">
                      <span>Zoom</span>
                      <span className="tabular-nums text-[#6D4C41]">{zoom.toFixed(2)}×</span>
                    </label>
                    <input
                      type="range"
                      min={ZOOM_MIN}
                      max={ZOOM_MAX}
                      step={0.02}
                      value={zoom}
                      onChange={(ev) => setZoom(Number(ev.target.value))}
                      className="w-full accent-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex justify-between font-inter text-sm font-medium text-[#1B4332]">
                      <span>Horizontal</span>
                      <span className="tabular-nums text-[#6D4C41]">
                        {panX >= 0 ? "+" : ""}
                        {panX.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.02}
                      value={panX}
                      onChange={(ev) => setPanX(Number(ev.target.value))}
                      className="w-full accent-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex justify-between font-inter text-sm font-medium text-[#1B4332]">
                      <span>Vertical</span>
                      <span className="tabular-nums text-[#6D4C41]">
                        {panY >= 0 ? "+" : ""}
                        {panY.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.02}
                      value={panY}
                      onChange={(ev) => setPanY(Number(ev.target.value))}
                      className="w-full accent-[#1B4332]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setPanX(0);
                      setPanY(0);
                    }}
                    className="font-inter text-sm font-medium text-[#1B4332] underline decoration-[#1B4332]/30 underline-offset-2 hover:decoration-[#1B4332]"
                  >
                    Repor zoom e posição
                  </button>
                </div>
              </details>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#1B4332]/10 bg-white/60 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-[#1B4332]/20 bg-white px-4 py-2.5 font-inter text-sm font-medium text-[#6D4C41] transition-colors hover:bg-[#FAF8F3] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || !imgReady || !!loadError}
            className="rounded-xl bg-[#1B4332] px-4 py-2.5 font-inter text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-105 disabled:opacity-50"
          >
            {busy ? "A gerar…" : "Usar este enquadramento"}
          </button>
        </div>
      </div>
    </div>
  );
};
