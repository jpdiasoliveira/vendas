export const DEFAULT_CATEGORIES = ["Salgados", "Doces", "Combos"];

export const displayStock = (stock: number | null | undefined) => stock ?? 0;

export const isStockCritical = (stock: number | null | undefined) => displayStock(stock) <= 5;

export const QR_TOOLTIP =
  "Gere um QR Code para colar na prateleira. Ao escanear, você abre a edição deste produto instantaneamente.";
