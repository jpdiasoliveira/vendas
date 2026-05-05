/** Alinhado aos blocos da vitrine: hero 16:9, logo quadrado, história/lifestyle 4:3, produto 4:5 (cartão). */
export type ImageCoverFramingKind =
  | "banner"
  | "logo"
  | "story"
  | "lifestyleLeft"
  | "lifestyleRight"
  | "product";

const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v));

export type CoverFramedLayout = {
  drawW: number;
  drawH: number;
  left: number;
  top: number;
};

/** Geometria «object-fit: cover» + zoom + pan (pan ∈ [-1, 1]). */
export const computeCoverFramedLayout = (
  iw: number,
  ih: number,
  cw: number,
  ch: number,
  zoom: number,
  panX: number,
  panY: number
): CoverFramedLayout | null => {
  if (!iw || !ih) return null;
  const w = Math.max(1, Math.round(cw));
  const h = Math.max(1, Math.round(ch));
  const z = Math.max(1, zoom);
  const s0 = Math.max(w / iw, h / ih);
  const scale = s0 * z;
  const drawW = iw * scale;
  const drawH = ih * scale;
  const left = (w - drawW) / 2 + panX * ((drawW - w) / 2);
  const top = (h - drawH) / 2 + panY * ((drawH - h) / 2);
  return { drawW, drawH, left, top };
};

/**
 * Atualiza pan após arrastar na pré-visualização (delta em px no ecrã).
 * Mesma convenção que `computeCoverFramedLayout`: arrastar para a direita move a imagem para a direita.
 */
export const panAfterDragPixels = (
  iw: number,
  ih: number,
  cw: number,
  ch: number,
  zoom: number,
  panX: number,
  panY: number,
  dClientX: number,
  dClientY: number
): { panX: number; panY: number } => {
  const z = Math.max(1, zoom);
  const w = Math.max(1, Math.round(cw));
  const h = Math.max(1, Math.round(ch));
  const s0 = Math.max(w / iw, h / ih);
  const scale = s0 * z;
  const drawW = iw * scale;
  const drawH = ih * scale;
  let nx = panX;
  let ny = panY;
  const rx = drawW - w;
  const ry = drawH - h;
  if (rx > 0.001) nx = clamp(-1, 1, panX + (2 * dClientX) / rx);
  if (ry > 0.001) ny = clamp(-1, 1, panY + (2 * dClientY) / ry);
  return { panX: nx, panY: ny };
};

/**
 * Desenha a imagem em modo "cover" (como object-fit: cover) com zoom e pan,
 * num canvas de tamanho fixo (cw×ch). panX/panY ∈ [-1, 1]: 0 = centrado.
 */
export const renderCoverFramedToCanvas = (
  img: HTMLImageElement,
  cw: number,
  ch: number,
  zoom: number,
  panX: number,
  panY: number
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(cw));
  const h = Math.max(1, Math.round(ch));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const layout = computeCoverFramedLayout(iw, ih, cw, ch, zoom, panX, panY);
  if (!layout) return canvas;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, layout.left, layout.top, layout.drawW, layout.drawH);
  return canvas;
};

export const canvasToJpegFile = (canvas: HTMLCanvasElement, baseName: string, quality = 0.92): Promise<File> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível gerar a imagem."));
          return;
        }
        const safe = baseName.replace(/[^\w.-]+/g, "_").replace(/\.[^.]+$/, "") || "imagem";
        resolve(new File([blob], `${safe}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      quality
    );
  });
