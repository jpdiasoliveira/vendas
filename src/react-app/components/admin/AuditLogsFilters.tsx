import { Search } from "lucide-react";
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
      ? "bg-[#1B4332] text-white shadow-sm"
      : "border border-[#1B4332]/15 bg-white/80 text-[#6D4C41] hover:border-[#1B4332]/25 hover:bg-white"
  }`;

export const AuditLogsFilters = ({
  searchInput,
  setSearchInput,
  actionFilter,
  setActionFilter,
}: AuditLogsFiltersProps) => {
  const selectValue = isMoreFilterValue(actionFilter) ? actionFilter : "";

  return (
    <div className="mb-6 rounded-2xl border border-[#1B4332]/15 bg-[#FAF8F3]/90 p-4 font-inter shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6D4C41]/60 sm:left-4 sm:h-5 sm:w-5"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar por nome do produto ou pedido…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-[#1B4332]/20 bg-white py-3 pl-11 pr-4 text-base text-[#1B4332] transition-colors placeholder:text-[#6D4C41]/55 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 sm:py-3.5 sm:pl-12 sm:text-[1.05rem]"
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
            onChange={(e) => {
              const v = e.target.value;
              setActionFilter(v);
            }}
            className="w-full cursor-pointer rounded-xl border border-[#1B4332]/20 bg-white px-3 py-3 text-sm font-medium text-[#1B4332] shadow-sm focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 sm:min-w-[12.5rem] sm:py-3.5"
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
        <button
          type="button"
          onClick={() => setActionFilter("")}
          className={chipClass(actionFilter === "")}
          aria-pressed={actionFilter === ""}
        >
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
