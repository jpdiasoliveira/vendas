import { Search, Plus, AlertTriangle } from "lucide-react";

type AdminProductsToolbarProps = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  categoryOptions: string[];
  criticalCount: number;
  onNewProduct: () => void;
};

export const AdminProductsToolbar = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  categoryOptions,
  criticalCount,
  onNewProduct,
}: AdminProductsToolbarProps) => (
  <>
    <div className="mb-4 flex flex-nowrap items-center gap-4 font-inter">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full rounded-xl border border-[#1B4332]/20 bg-white/80 py-2 pl-9 pr-3 text-sm text-[#1B4332] shadow-sm focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
          aria-label="Buscar produto por nome"
        />
      </div>
      <div className="w-44 shrink-0">
        <select
          id="category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full rounded-xl border border-[#1B4332]/20 bg-white/80 px-3 py-2 text-sm text-[#1B4332] shadow-sm focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onNewProduct}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#1B4332]/10 bg-[#EAD7BB] px-4 py-2.5 font-medium text-[#6D4C41] shadow-sm transition-colors hover:bg-[#EAD7BB]/90"
      >
        <Plus className="h-5 w-5" />
        Novo Produto
      </button>
    </div>
    {criticalCount > 0 && (
      <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 font-inter text-red-800">
        <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" aria-hidden />
        <span className="font-semibold">
          {criticalCount} produto(s) com estoque crítico (≤ 5 unidades) — priorize a reposição.
        </span>
      </div>
    )}
  </>
);
