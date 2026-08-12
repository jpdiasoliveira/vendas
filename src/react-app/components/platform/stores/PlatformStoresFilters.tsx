import { Search } from "lucide-react";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type PlatformStoresFiltersProps = {
  search: string;
  totalCount: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
};

export function PlatformStoresFilters({
  search,
  totalCount,
  filteredCount,
  onSearchChange,
}: PlatformStoresFiltersProps) {
  const hasQuery = search.trim().length > 0;

  return (
    <div className="sticky top-0 z-20 mb-6 border-b border-brand-primary/10 bg-surface/95 py-3 backdrop-blur-sm">
      <label className="relative mx-auto block max-w-3xl">
        <span className="sr-only">Buscar lojas</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome, link da loja ou e-mail do proprietário…"
          className={`${storefrontInputClass} rounded-2xl py-3 pl-11 pr-4 text-sm shadow-sm`}
          autoComplete="off"
        />
      </label>
      {hasQuery ? (
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-content-muted">
          {filteredCount} de {totalCount} loja(s)
        </p>
      ) : null}
    </div>
  );
}
