import { Flame, HelpCircle, House, ImageOff, Pencil, QrCode, Trash2 } from "lucide-react";
import type { Product } from "@/react-app/types";
import { formatCurrency } from "@/react-app/utils/format";
import { displayStock, isStockCritical, QR_TOOLTIP } from "@/react-app/utils/adminProductDisplay";
import { isProductFeaturedOnHome } from "@/react-app/utils/productFeaturedOnHome";
import { AdminProductToggle } from "@/react-app/components/admin/products/AdminProductToggle";

type AdminProductRowProps = {
  product: Product;
  isTrending: boolean;
  togglingId: string | null;
  togglingHomeId: string | null;
  onToggleStatus: (p: Product) => void;
  onToggleHomeFeatured: (p: Product) => void;
  onQr: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
};

export function AdminProductRow({
  product,
  isTrending,
  togglingId,
  togglingHomeId,
  onToggleStatus,
  onToggleHomeFeatured,
  onQr,
  onEdit,
  onDelete,
}: AdminProductRowProps) {
  const critical = isStockCritical(product.stock);
  const isActive = (product.status ?? "active") === "active";
  const featured = isProductFeaturedOnHome(product);
  const busy = togglingId === product.id || togglingHomeId === product.id;

  return (
    <tr className={`border-b border-brand-primary/5 transition-colors ${critical ? "border-l-4 border-l-red-500/60 bg-red-950/20" : "hover:bg-surface-muted/50"}`}>
      <td className="px-4 py-3">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-12 w-12 rounded-full border border-brand-primary/15 object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary/15 bg-surface-muted text-content-muted">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-content">
        <span className="inline-flex items-center gap-1.5">
          {isTrending ? <Flame className="h-4 w-4 text-amber-400" aria-label="Top vendas" /> : null}
          {featured ? <House className="h-4 w-4 text-brand-primary" aria-label="Na home" /> : null}
          {product.name}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-medium text-content">{formatCurrency(product.price)}</td>
      <td className="px-4 py-3 text-right">
        <span className={critical ? "font-bold text-red-300" : "text-content-muted"}>{displayStock(product.stock)}</span>
      </td>
      <td className="px-4 py-3">
        <AdminProductToggle checked={isActive} disabled={busy} onChange={() => onToggleStatus(product)} label={isActive ? "Ativo" : "Inativo"} />
      </td>
      <td className="px-4 py-3">
        <AdminProductToggle checked={featured} disabled={busy} onChange={() => onToggleHomeFeatured(product)} label={featured ? "Sim" : "Não"} activeClassName="bg-amber-500/80" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onQr(product)} className="rounded-lg p-2 text-content-muted hover:bg-surface-muted hover:text-content" title="Gerar QR Code" aria-label={`QR Code ${product.name}`}>
            <QrCode className="h-4 w-4" />
          </button>
          <span className="cursor-help text-content-muted" title={QR_TOOLTIP} aria-label={QR_TOOLTIP}><HelpCircle className="h-4 w-4" /></span>
          <button type="button" onClick={() => onEdit(product)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/10">
            <Pencil className="h-4 w-4" />Editar
          </button>
          <button type="button" onClick={() => onDelete(product)} className="rounded-lg p-2 text-red-300 hover:bg-red-950/30" title="Excluir" aria-label={`Excluir ${product.name}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
