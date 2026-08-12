import { ZOOM_MAX, ZOOM_MIN } from "@/react-app/components/admin/media/imageCoverFramingConfig";

type ImageCoverFramingControlsProps = {
  zoom: number;
  panX: number;
  panY: number;
  onZoom: (value: number) => void;
  onPanX: (value: number) => void;
  onPanY: (value: number) => void;
  onReset: () => void;
};

export function ImageCoverFramingControls({
  zoom,
  panX,
  panY,
  onZoom,
  onPanX,
  onPanY,
  onReset,
}: ImageCoverFramingControlsProps) {
  const sliderClass = "w-full accent-brand-primary";

  return (
    <details className="mx-auto mt-4 max-w-xl rounded-xl border border-brand-primary/15 bg-surface-muted/50 px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-content">Ajuste fino (sliders)</summary>
      <div className="mt-4 space-y-4 pb-2">
        <div>
          <label className="mb-2 flex justify-between text-sm font-medium text-content">
            <span>Zoom</span>
            <span className="tabular-nums text-content-muted">{zoom.toFixed(2)}×</span>
          </label>
          <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.02} value={zoom} onChange={(e) => onZoom(Number(e.target.value))} className={sliderClass} />
        </div>
        <div>
          <label className="mb-2 flex justify-between text-sm font-medium text-content">
            <span>Horizontal</span>
            <span className="tabular-nums text-content-muted">{panX >= 0 ? "+" : ""}{panX.toFixed(2)}</span>
          </label>
          <input type="range" min={-1} max={1} step={0.02} value={panX} onChange={(e) => onPanX(Number(e.target.value))} className={sliderClass} />
        </div>
        <div>
          <label className="mb-2 flex justify-between text-sm font-medium text-content">
            <span>Vertical</span>
            <span className="tabular-nums text-content-muted">{panY >= 0 ? "+" : ""}{panY.toFixed(2)}</span>
          </label>
          <input type="range" min={-1} max={1} step={0.02} value={panY} onChange={(e) => onPanY(Number(e.target.value))} className={sliderClass} />
        </div>
        <button type="button" onClick={onReset} className="text-sm font-medium text-brand-primary underline decoration-brand-primary/30 underline-offset-2">
          Repor zoom e posição
        </button>
      </div>
    </details>
  );
}
