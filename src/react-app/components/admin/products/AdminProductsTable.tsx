import type { Product } from "@/react-app/types";
import { AdminProductRow } from "@/react-app/components/admin/products/AdminProductRow";

type AdminProductsTableProps = {
  products: Product[];
  trendingProductIds: string[];
  togglingId: string | null;
  togglingHomeId: string | null;
  onToggleStatus: (p: Product) => void;
  onToggleHomeFeatured: (p: Product) => void;
  onQr: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  canDelete?: boolean;
};

export function AdminProductsTable(props: AdminProductsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-surface-elevated">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-primary/10 bg-surface-muted/60">
              <th className="w-20 px-4 py-3 text-left text-sm font-semibold text-content">Foto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-content">Nome</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-content">Preço</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-content">Estoque</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-content">Status</th>
              <th className="min-w-[9rem] px-4 py-3 text-left text-sm font-semibold text-content">Na home</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {props.products.map((product) => (
              <AdminProductRow
                key={product.id}
                product={product}
                isTrending={props.trendingProductIds.includes(product.id)}
                togglingId={props.togglingId}
                togglingHomeId={props.togglingHomeId}
                onToggleStatus={props.onToggleStatus}
                onToggleHomeFeatured={props.onToggleHomeFeatured}
                onQr={props.onQr}
                onEdit={props.onEdit}
                onDelete={props.onDelete}
                canDelete={props.canDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
