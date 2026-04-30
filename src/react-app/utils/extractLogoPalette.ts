/** Quantiza canal para reduzir ruído (buckets ~24 níveis). */
const quantize = (v: number, step = 12) => Math.min(255, Math.max(0, Math.round(v / step) * step));

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}`;

/** Saturação aproximada em [0,1] (HSV simplificado). */
const saturation = (r: number, g: number, b: number) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const mx = Math.max(rn, gn, bn);
  const mn = Math.min(rn, gn, bn);
  if (mx <= 1e-6) return 0;
  return (mx - mn) / mx;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("logo_load_failed"));
    img.src = src;
  });

/**
 * Extrai cor predominante e a mais “vibrante” (alta saturação) a partir de uma URL de imagem.
 * Funciona bem com `blob:` após upload; URLs externas podem falhar por CORS ao ler pixels.
 */
export const extractLogoPaletteFromSrc = async (
  src: string
): Promise<{ dominant: string; vibrant: string } | null> => {
  if (!src.trim()) return null;
  try {
    const img = await loadImage(src);
    const w = 64;
    const h = 64;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    let data: ImageData;
    try {
      data = ctx.getImageData(0, 0, w, h);
    } catch {
      return null;
    }
    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
    for (let i = 0; i < data.data.length; i += 4) {
      const a = data.data[i + 3];
      if (a < 12) continue;
      const r = quantize(data.data[i]!);
      const g = quantize(data.data[i + 1]!);
      const b = quantize(data.data[i + 2]!);
      // Evita branco puro dominar paleta
      if (r > 245 && g > 245 && b > 245) continue;
      const key = `${r},${g},${b}`;
      const cur = buckets.get(key);
      if (cur) cur.n += 1;
      else buckets.set(key, { r, g, b, n: 1 });
    }
    if (buckets.size === 0) return null;
    const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);
    const dominant = sorted[0]!;
    let vibrant = dominant;
    let bestS = -1;
    for (const c of sorted.slice(0, 12)) {
      const s = saturation(c.r, c.g, c.b);
      if (s > bestS) {
        bestS = s;
        vibrant = c;
      }
    }
    if (bestS < 0.08 && sorted[1]) {
      vibrant = sorted[1];
    }
    return {
      dominant: rgbToHex(dominant.r, dominant.g, dominant.b),
      vibrant: rgbToHex(vibrant.r, vibrant.g, vibrant.b),
    };
  } catch {
    return null;
  }
};
