import { Building2, RefreshCw } from "lucide-react";
import { PlatformStoreRow } from "@/react-app/components/platform/stores/PlatformStoreRow";
import type { PlatformStoreOverview, PlatformStoreRankingRowDto } from "@/react-app/services/api";

type PlatformStoresTableProps = {
  stores: PlatformStoreOverview[];
  totalCount: number;
  gmvByStoreId: Map<string, PlatformStoreRankingRowDto>;
  isLoading: boolean;
};

export function PlatformStoresTable({
  stores,
  totalCount,
  gmvByStoreId,
  isLoading,
}: PlatformStoresTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-primary/15 bg-surface-elevated shadow-md">
      <div className="flex items-center gap-2 border-b border-brand-primary/10 bg-surface-muted/40 px-4 py-3 sm:px-6">
        <Building2 className="h-5 w-5 text-brand-primary" aria-hidden />
        <span className="font-semibold text-content">Lojas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm sm:text-base">
          <thead className="border-b border-brand-primary/10 bg-surface-muted/30 font-semibold text-content">
            <tr>
              <th className="px-4 py-3 sm:px-5">Loja</th>
              <th className="px-4 py-3 sm:px-5">Link da Loja</th>
              <th className="px-4 py-3 sm:px-5">Proprietário</th>
              <th className="px-4 py-3 sm:px-5">Status</th>
              <th className="px-4 py-3 sm:px-5">Vendas pagas (30 dias)</th>
              <th className="px-4 py-3 sm:px-5">Pedidos pagos (30 dias)</th>
              <th className="px-4 py-3 text-right sm:px-5">Ação</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-sm text-content-muted">
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-brand-primary" aria-hidden />
                    A carregar…
                  </span>
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <PlatformStoreRow key={store.id} store={store} ranking={gmvByStoreId.get(store.id)} />
              ))
            )}
          </tbody>
        </table>
        {!isLoading && stores.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-content-muted">
            {totalCount === 0 ? "Nenhuma loja cadastrada." : "Nenhum resultado para esta busca."}
          </p>
        ) : null}
      </div>
      <div className="border-t border-brand-primary/10 px-4 py-3 text-xs text-content-muted sm:px-6">
        Para criar uma loja nova, usa o botão <strong className="text-content">Nova Loja</strong> na barra lateral.
        Domínios personalizados podem ser associados durante a criação ou depois, com apoio da equipa técnica.
      </div>
    </div>
  );
}
