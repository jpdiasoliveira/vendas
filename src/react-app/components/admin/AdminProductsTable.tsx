import { Pencil, ImageOff, QrCode, HelpCircle, Trash2, Flame, House } from "lucide-react";
import type { Product } from "@/react-app/types";
import { formatCurrency } from "@/react-app/utils/format";
import { displayStock, isStockCritical, QR_TOOLTIP } from "@/react-app/utils/adminProductDisplay";
import { isProductFeaturedOnHome } from "@/react-app/utils/productFeaturedOnHome";

type AdminProductsTableProps = {
  products: Product[];
  trendingProductIds: string[];
  togglingId: string | null;
  togglingHomeId: string | null;
  onToggleStatus: (p: Product) => void;
  onToggleHomeFeatured: (p: Product) => void;
  onQr: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
};

export const AdminProductsTable = ({
  products,
  trendingProductIds,
  togglingId,
  togglingHomeId,
  onToggleStatus,
  onToggleHomeFeatured,
  onQr,
  onEdit,
  onDelete,
}: AdminProductsTableProps) => (
  <div className="overflow-hidden rounded-2xl border border-[#1B4332]/10 bg-white/70 shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full font-inter">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-100">
            <th className="w-20 px-4 py-3 text-left font-semibold text-slate-700">Foto</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Nome</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700">Preço</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700">Estoque</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            <th className="min-w-[9rem] px-4 py-3 text-left font-semibold text-slate-700" title="Destaque na página inicial da loja">
              <span className="inline-flex items-center gap-1">
                <House className="h-4 w-4 shrink-0 text-[#1B4332]" aria-hidden />
                Na home
              </span>
            </th>
            <th className="w-24 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const critical = isStockCritical(product.stock);
            return (
              <tr
                key={product.id}
                className={`border-b border-slate-200 last:border-b-0 transition-colors ${
                  critical
                    ? "border-l-4 border-l-red-500 bg-red-50/90 hover:bg-red-100/90"
                    : "bg-slate-50 hover:bg-slate-100/50"
                }`}
              >
                <td className="px-4 py-3">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded-full border-2 border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-200 text-slate-400">
                      <ImageOff className="h-6 w-6" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  <span className="inline-flex items-center gap-1.5">
                    {trendingProductIds.includes(product.id) && (
                      <span className="inline-flex shrink-0" title="Top vendas" aria-label="Top vendas">
                        <Flame className="h-4 w-4 text-amber-500" aria-hidden />
                      </span>
                    )}
                    {isProductFeaturedOnHome(product) && (
                      <span className="inline-flex shrink-0" title="Destaque na home" aria-label="Destaque na home">
                        <House className="h-4 w-4 text-[#1B4332]" aria-hidden />
                      </span>
                    )}
                    {product.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(product.price)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={isStockCritical(product.stock) ? "font-bold text-red-600" : "text-slate-700"}>
                    {displayStock(product.stock)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={(product.status ?? "active") === "active"}
                      disabled={togglingId === product.id || togglingHomeId === product.id}
                      onClick={() => onToggleStatus(product)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        (product.status ?? "active") === "active" ? "bg-[#1B4332]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          (product.status ?? "active") === "active" ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-slate-700">
                      {(product.status ?? "active") === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isProductFeaturedOnHome(product)}
                      disabled={togglingHomeId === product.id || togglingId === product.id}
                      onClick={() => onToggleHomeFeatured(product)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        isProductFeaturedOnHome(product) ? "bg-[#FFD166]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isProductFeaturedOnHome(product) ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-slate-700">{isProductFeaturedOnHome(product) ? "Sim" : "Não"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onQr(product)}
                      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      title="Gerar QR Code"
                      aria-label={`Gerar QR Code para ${product.name}`}
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <span className="cursor-help text-slate-400 hover:text-slate-600" title={QR_TOOLTIP} aria-label={QR_TOOLTIP}>
                      <HelpCircle className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-medium text-[#1B4332] transition-colors hover:bg-[#1B4332]/10"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      title="Excluir produto"
                      aria-label={`Excluir ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
