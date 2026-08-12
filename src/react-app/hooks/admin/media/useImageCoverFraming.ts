import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  canvasToJpegFile,
  renderCoverFramedToCanvas,
  type ImageCoverFramingKind,
} from "@/react-app/utils/imageCoverFraming";
import {
  exportSize,
  framingRatio,
  PREVIEW_W,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/react-app/components/admin/media/imageCoverFramingConfig";
import { useImageCoverFramingPointers } from "@/react-app/hooks/admin/media/useImageCoverFramingPointers";

export function useImageCoverFraming(open: boolean, imageSrc: string, kind: ImageCoverFramingKind) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const framingStateRef = useRef({ zoom: 1, panX: 0, panY: 0 });

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [imgReady, setImgReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  framingStateRef.current = { zoom, panX, panY };
  const previewH = Math.round(PREVIEW_W / framingRatio(kind));

  const { onPointerDown, onPointerMove, onPointerUp, clearPointers } = useImageCoverFramingPointers(
    previewH,
    framingStateRef,
    imgRef,
    setZoom,
    setPanX,
    setPanY,
  );

  const redrawPreview = useCallback(() => {
    const canvas = previewRef.current;
    const img = imgRef.current;
    if (!canvas || !img?.naturalWidth) return;
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
    clearPointers();
    const img = new Image();
    if (/^https?:\/\//i.test(imageSrc)) img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgReady(true);
    };
    img.onerror = () => setLoadError("Não foi possível carregar a imagem.");
    img.src = imageSrc;
    return () => {
      imgRef.current = null;
    };
  }, [open, imageSrc, clearPointers]);

  useLayoutEffect(() => {
    if (open && imgReady) redrawPreview();
  }, [open, imgReady, redrawPreview]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !open || !imgReady) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z - e.deltaY * 0.0018)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, imgReady]);

  const resetFraming = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const exportFile = async (originalFileName: string): Promise<File> => {
    const img = imgRef.current;
    if (!img?.naturalWidth) throw new Error("Imagem não carregada.");
    const { w, h } = exportSize(kind);
    const canvas = renderCoverFramedToCanvas(img, w, h, zoom, panX, panY);
    return canvasToJpegFile(canvas, originalFileName);
  };

  return {
    previewRef,
    viewportRef,
    previewH,
    zoom,
    setZoom,
    panX,
    setPanX,
    panY,
    setPanY,
    imgReady,
    busy,
    setBusy,
    loadError,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    resetFraming,
    exportFile,
  };
}
