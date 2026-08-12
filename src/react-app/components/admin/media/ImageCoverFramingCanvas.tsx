import { PREVIEW_W } from "@/react-app/components/admin/media/imageCoverFramingConfig";

type ImageCoverFramingCanvasProps = {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  previewRef: React.RefObject<HTMLCanvasElement | null>;
  previewH: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
};

export function ImageCoverFramingCanvas({
  viewportRef,
  previewRef,
  previewH,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ImageCoverFramingCanvasProps) {
  return (
    <div
      ref={viewportRef}
      className="relative mx-auto w-full max-w-[720px] touch-none select-none overflow-hidden rounded-xl border-2 border-brand-primary/25 bg-black/80 shadow-inner"
      style={{ aspectRatio: `${PREVIEW_W} / ${previewH}` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
    >
      <canvas ref={previewRef} className="pointer-events-none block h-full w-full object-contain" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/55 to-transparent px-3 pb-2 pt-8">
        <p className="text-center text-[11px] font-medium text-white/95">Arrastar · zoom com roda ou pinça</p>
      </div>
    </div>
  );
}
