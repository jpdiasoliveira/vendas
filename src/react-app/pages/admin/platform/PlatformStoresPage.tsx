import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { PlatformStoresFilters } from "@/react-app/components/platform/stores/PlatformStoresFilters";
import { PlatformStoresTable } from "@/react-app/components/platform/stores/PlatformStoresTable";
import { usePlatformStores } from "@/react-app/hooks/platform/usePlatformStores";

const PlatformStoresPage = () => {
  const [search, setSearch] = useState("");
  const { stores, totalCount, gmvByStoreId, isLoading, isRefetching, refetch } = usePlatformStores(search);
  const busy = isLoading || isRefetching;

  return (
    <div className="w-full max-w-none px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-brand-primary/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-content sm:text-3xl">
            Gestor de Lojas
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-content-muted">
            Visão consolidada de todas as lojas da plataforma. Em{" "}
            <strong className="text-content">Gerenciar loja</strong> abres o painel dessa loja como se estivesses no dia
            a dia dela (precisas de permissão nessa loja).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={busy}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-brand-primary/25 bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-brand-primary shadow-sm transition hover:bg-surface-muted disabled:opacity-60 lg:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden />
          Atualizar lista
        </button>
      </div>

      <PlatformStoresFilters
        search={search}
        totalCount={totalCount}
        filteredCount={stores.length}
        onSearchChange={setSearch}
      />

      <PlatformStoresTable
        stores={stores}
        totalCount={totalCount}
        gmvByStoreId={gmvByStoreId}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PlatformStoresPage;
