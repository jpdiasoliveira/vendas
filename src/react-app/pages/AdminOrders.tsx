import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Home, LayoutDashboard } from "lucide-react";
import { adminApiFetch } from "@/react-app/lib/api";
import type { Order } from "@/react-app/types";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { OrderDetailsModal } from "@/react-app/components/admin/OrderDetailsModal";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiFetch<Order[]>("/api/admin/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openDetail = (id: number) => {
    setSelectedOrderId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 bg-white/60 backdrop-blur-sm rounded-full text-[#6D4C41] hover:text-[#1B4332] hover:bg-white transition-all shadow-sm border border-[#1B4332]/10"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-[#1B4332]" />
              <div>
                <h1 className="text-2xl font-bold text-[#1B4332] font-playfair">Painel de Vendas</h1>
                <p className="text-sm text-[#6D4C41] font-inter">Acompanhe os pedidos da sua loja</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminNav />
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-white/80 hover:bg-white border border-[#1B4332]/20 text-[#1B4332] px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 mb-6 font-inter">
            {error}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center shadow-xl border border-white/50">
            <RefreshCw className="h-12 w-12 text-[#1B4332] animate-spin mx-auto mb-4" />
            <p className="text-[#6D4C41] font-inter">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center shadow-xl border border-white/50">
            <p className="text-[#6D4C41] font-inter">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full font-inter">
                <thead>
                  <tr className="bg-[#1B4332]/5 border-b border-[#1B4332]/10">
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Data</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Cliente</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Total</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => openDetail(order.id)}
                      className="border-b border-[#1B4332]/5 hover:bg-[#FAF8F3]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 text-[#6D4C41] whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-[#1B4332] font-medium">
                        {order.customerName ?? "Cliente"}
                      </td>
                      <td className="py-4 px-4 text-[#1B4332] font-bold">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <OrderDetailsModal
        isOpen={modalOpen}
        orderId={selectedOrderId}
        onClose={closeModal}
        onStatusUpdated={fetchOrders}
      />
    </div>
  );
}
