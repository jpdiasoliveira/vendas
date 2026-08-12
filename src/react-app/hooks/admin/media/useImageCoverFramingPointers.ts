import { useRef, type MutableRefObject } from "react";
import { panAfterDragPixels } from "@/react-app/utils/imageCoverFraming";
import { PREVIEW_W, ZOOM_MAX, ZOOM_MIN } from "@/react-app/components/admin/media/imageCoverFramingConfig";

type Point = { x: number; y: number };

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function useImageCoverFramingPointers(
  previewH: number,
  framingStateRef: MutableRefObject<{ zoom: number; panX: number; panY: number }>,
  imgRef: MutableRefObject<HTMLImageElement | null>,
  setZoom: (z: number) => void,
  setPanX: (x: number) => void,
  setPanY: (y: number) => void,
) {
  const pointersRef = useRef(new Map<number, Point>());
  const pinchRef = useRef<{ dist0: number; zoom0: number } | null>(null);
  const panDragRef = useRef<{ lastX: number; lastY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ids = [...pointersRef.current.keys()];
    if (ids.length === 2) {
      const p0 = pointersRef.current.get(ids[0])!;
      const p1 = pointersRef.current.get(ids[1])!;
      pinchRef.current = { dist0: dist(p0, p1), zoom0: framingStateRef.current.zoom };
      panDragRef.current = null;
    } else if (ids.length === 1) {
      pinchRef.current = null;
      panDragRef.current = { lastX: e.clientX, lastY: e.clientY };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const m = pointersRef.current;
    if (!m.has(e.pointerId)) return;
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    const ids = [...m.keys()];
    if (ids.length >= 2 && pinchRef.current) {
      const d = dist(m.get(ids[0])!, m.get(ids[1])!);
      const { dist0, zoom0 } = pinchRef.current;
      if (dist0 > 8) setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (zoom0 * d) / dist0)));
      return;
    }
    if (ids.length === 1 && panDragRef.current) {
      const { lastX, lastY } = panDragRef.current;
      const { zoom: z, panX: px, panY: py } = framingStateRef.current;
      const next = panAfterDragPixels(img.naturalWidth, img.naturalHeight, PREVIEW_W, previewH, z, px, py, e.clientX - lastX, e.clientY - lastY);
      panDragRef.current = { lastX: e.clientX, lastY: e.clientY };
      setPanX(next.panX);
      setPanY(next.panY);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) panDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const clearPointers = () => {
    pointersRef.current.clear();
  };

  return { onPointerDown, onPointerMove, onPointerUp, clearPointers };
}
