import { Search } from "lucide-react";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import {
  AUDIT_FILTER_QUICK_CREATE,
  AUDIT_FILTER_QUICK_DELETE,
  AUDIT_MORE_FILTER_OPTIONS,
} from "@/react-app/utils/auditLogDisplay";

type AuditLogsFiltersProps = {
  searchInput: string;
  setSearchInput: (v: string) => void;
  actionFilter: string;
  setActionFilter: (v: string) => void;
};

const isMoreFilterValue = (v: string) =>
  v !== "" && v !== AUDIT_FILTER_QUICK_CREATE && v !== AUDIT_FILTER_QUICK_DELETE;

const chipClass = (active: boolean) =>
  `inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-brand-primary text-white shadow-sm"
      : "border border-brand-primary/15 bg-surface-elevated text-content-muted hover:border-brand-primary/25 hover:bg-surface-muted hover:text-content"
  }`;

export const AuditLogsFilters = ({
  searchInput,
  setSearchInput,
  actionFilter,
  setActionFilter,
}: AuditLogsFiltersProps) => {
  const selectValue = isMoreFilterValue(actionFilter) ? actionFilter : "";

  return (
    <div className="mb-6 rounded-2xl border border-brand-primary/10 bg-surface-elevated p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-muted sm:left-4"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar por nome do produto ou pedido…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`${storefrontInputClass} min-w-0 py-3 pl-11 sm:pl-12`}
            aria-label="Busca por recurso"
          />
        </div>
        <div className="flex w-full shrink-0 sm:w-auto sm:max-w-[min(100%,14rem)]">
          <label htmlFor="audit-more-filters" className="sr-only">
            Mais filtros por tipo de evento
          </label>
          <select
            id="audit-more-filters"
            value={selectValue}
            onChange={(e) => setActionFilter(e.target.value)}
            className={`${storefrontInputClass} cursor-pointer py-3 text-sm font-medium sm:min-w-[12.5rem]`}
          >
            <option value="">Mais filtros…</option>
            {AUDIT_MORE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtros rápidos">
        <button type="button" onClick={() => setActionFilter("")} className={chipClass(actionFilter === "")} aria-pressed={actionFilter === ""}>
          Todas as ações
        </button>
        <button
          type="button"
          onClick={() => setActionFilter(AUDIT_FILTER_QUICK_CREATE)}
          className={chipClass(actionFilter === AUDIT_FILTER_QUICK_CREATE)}
          aria-pressed={actionFilter === AUDIT_FILTER_QUICK_CREATE}
        >
          Criação
        </button>
        <button
          type="button"
          onClick={() => setActionFilter(AUDIT_FILTER_QUICK_DELETE)}
          className={chipClass(actionFilter === AUDIT_FILTER_QUICK_DELETE)}
          aria-pressed={actionFilter === AUDIT_FILTER_QUICK_DELETE}
        >
          Exclusão
        </button>
      </div>
    </div>
  );
};
