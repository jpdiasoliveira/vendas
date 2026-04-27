import { Search } from "lucide-react";
import { ACTION_OPTIONS } from "@/react-app/utils/auditLogDisplay";

type AuditLogsFiltersProps = {
  searchInput: string;
  setSearchInput: (v: string) => void;
  actionFilter: string;
  setActionFilter: (v: string) => void;
};

export const AuditLogsFilters = ({
  searchInput,
  setSearchInput,
  actionFilter,
  setActionFilter,
}: AuditLogsFiltersProps) => (
  <div className="mb-6 rounded-2xl border border-[#1B4332]/15 bg-[#FAF8F3]/90 p-4 font-inter shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6D4C41]/70" />
        <input
          type="search"
          placeholder="Buscar por nome do produto ou pedido..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-xl border border-[#1B4332]/20 bg-white/80 py-2.5 pl-10 pr-4 text-[#1B4332] transition-colors placeholder:text-[#6D4C41]/60 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          aria-label="Busca por recurso"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {ACTION_OPTIONS.map((opt) => {
          const isActive = actionFilter === opt.value;
          return (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => setActionFilter(opt.value)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#1B4332] text-white"
                  : "border border-[#1B4332]/10 bg-white/60 text-[#6D4C41] hover:bg-white hover:text-[#1B4332]"
              }`}
              aria-pressed={isActive}
              aria-label={opt.label}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
