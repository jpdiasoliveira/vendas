import { UserCog } from "lucide-react";
import { StoreStatusBadge } from "@/react-app/components/admin/StoreStatusBadge";
import { setStoreSlugOverride, type PlatformStoreOverview, type PlatformStoreRankingRowDto } from "@/react-app/services/api";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);

type PlatformStoreRowProps = {
  store: PlatformStoreOverview;
  ranking?: PlatformStoreRankingRowDto;
};

export function PlatformStoreRow({ store, ranking }: PlatformStoreRowProps) {
  const manageStore = () => {
    setStoreSlugOverride(store.slug);
    window.location.href = "/admin/pedidos";
  };

  return (
    <tr className="border-b border-brand-primary/5 last:border-0 transition hover:bg-surface-muted/50">
      <td className="px-4 py-3 font-medium text-brand-primary sm:px-5">{store.displayName}</td>
      <td className="px-4 py-3 font-mono text-sm text-content-muted sm:px-5">{store.slug}</td>
      <td className="max-w-[14rem] truncate px-4 py-3 text-sm text-content-muted sm:px-5">
        {store.ownerEmail?.trim() ? (
          <span className="font-mono">{store.ownerEmail}</span>
        ) : (
          <span className="italic text-content-muted">Sem proprietário</span>
        )}
      </td>
      <td className="px-4 py-3 sm:px-5">
        <StoreStatusBadge status={store.status} />
      </td>
      <td className="px-4 py-3 font-mono text-sm sm:px-5">{brl(ranking?.gmvPaidBrlLast30d ?? 0)}</td>
      <td className="px-4 py-3 sm:px-5">{ranking?.paidOrdersLast30d ?? 0}</td>
      <td className="px-4 py-3 text-right sm:px-5">
        <button
          type="button"
          onClick={manageStore}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 sm:text-sm"
        >
          <UserCog className="h-3.5 w-3.5" aria-hidden />
          Gerenciar loja
        </button>
      </td>
    </tr>
  );
}
