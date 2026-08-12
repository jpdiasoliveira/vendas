/** Fallback visual enquanto o Canvas / GLTF carrega. */
export function HeroCanvasLoader() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-muted/40">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"
        aria-hidden
      />
      <p className="font-body text-[10px] uppercase tracking-[0.2em] text-content-muted">Carregando 3D</p>
    </div>
  );
}
