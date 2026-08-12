import { AlertTriangle, Plus, Search } from "lucide-react";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type AdminProductsFiltersProps = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  categoryOptions: string[];
  criticalCount: number;
  onNewProduct: () => void;
  newProductDisabled?: boolean;
  newProductDisabledTitle?: string;
};

export function AdminProductsFilters({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  categoryOptions,
  criticalCount,
  onNewProduct,
  newProductDisabled,
  newProductDisabledTitle,
}: AdminProductsFiltersProps) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por nome..." className={`${storefrontInputClass} py-2 pl-9`} aria-label="Buscar produto" />
        </div>
        <div className="w-full sm:w-44">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={storefrontInputClass} aria-label="Filtrar categoria">
            <option value="">Todas</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={onNewProduct} disabled={newProductDisabled} title={newProductDisabled ? newProductDisabledTitle : undefined} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          <Plus className="h-5 w-5" />
          Novo produto
        </button>
      </div>
      {criticalCount > 0 ? (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/25 px-4 py-3 text-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{criticalCount} produto(s) com estoque crítico (≤ 5).</span>
        </div>
      ) : null}
    </>
  );
}
