import type { OrderDetail } from "@/react-app/types";
import { formatCurrency } from "@/react-app/utils/format";

type AdminOrderItemsPanelProps = {
  items: OrderDetail["items"];
};

export function AdminOrderItemsPanel({ items }: AdminOrderItemsPanelProps) {
  const list = Array.isArray(items) ? items : [];

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-brand-primary/10 bg-surface-muted/40 px-3 py-4 text-sm text-content-muted">
        Nenhum item encontrado para este pedido.
      </p>
    );
  }

  return (
    <>
      <ul className="mb-4 space-y-2 md:hidden">
        {list.map((item, idx) => (
          <li
            key={item.id ?? item.productId ?? idx}
            className="rounded-xl border border-brand-primary/10 bg-surface-muted/40 px-3 py-3"
          >
            <div className="flex justify-between gap-2">
              <span className="break-words font-medium text-content">{item.productName}</span>
              <span className="shrink-0 font-semibold text-content">×{item.quantity}</span>
            </div>
            <div className="mt-2 flex justify-between gap-2 text-sm text-content-muted">
              <span>{formatCurrency(item.price)} / un.</span>
              <span className="font-semibold text-content">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-brand-primary/10 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-muted/60">
              <th className="px-3 py-2 text-left text-content">Produto</th>
              <th className="px-3 py-2 text-right text-content">Qtd</th>
              <th className="px-3 py-2 text-right text-content">Preço</th>
              <th className="px-3 py-2 text-right text-content">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, idx) => (
              <tr key={item.id ?? item.productId ?? idx} className="border-t border-brand-primary/5">
                <td className="px-3 py-2 text-content-muted">{item.productName}</td>
                <td className="px-3 py-2 text-right text-content">{item.quantity}</td>
                <td className="px-3 py-2 text-right text-content">{formatCurrency(item.price)}</td>
                <td className="px-3 py-2 text-right font-medium text-content">
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
