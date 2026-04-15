import { useCallback, useEffect, useState } from "react";
import { X, Search, Loader2, Package, CreditCard, Copy, Check } from "lucide-react";
import { apiFetch } from "@/react-app/services/api";
import type { OrderWithItems } from "@/react-app/types";
import CheckoutModal from "@/react-app/components/checkout/CheckoutModal";

type GuestOrderLookupModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const guestEmailOk = (email: string) => {
  const t = email.trim();
  return t.length > 4 && t.includes("@") && !t.includes(" ");
};

const orderIdOk = (id: string) => {
  const t = id.trim();
  return t.length >= 8;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "paid":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "processing":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Aguardando Pagamento";
    case "paid":
      return "Pagamento Aprovado";
    case "processing":
      return "Em Separação";
    case "shipped":
      return "Enviado";
    case "delivered":
      return "Entregue";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
};

const GuestOrderLookupModal = ({ isOpen, onClose }: GuestOrderLookupModalProps) => {
  const [orderIdInput, setOrderIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setOrderIdInput("");
    setEmailInput("");
    setLoading(false);
    setError(null);
    setOrder(null);
    setShowCheckout(false);
    setCopied(false);
  }, []);

  useEffect(() => {
    if (!isOpen && !showCheckout) reset();
  }, [isOpen, showCheckout, reset]);

  const fetchOrder = async () => {
    const oid = orderIdInput.trim();
    const em = emailInput.trim();
    if (!orderIdOk(oid) || !guestEmailOk(em)) {
      setError("Informe o número do pedido e o e-mail usados na compra.");
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const qs = `?guestEmail=${encodeURIComponent(em)}`;
      const data = await apiFetch<OrderWithItems>(`/api/orders/${encodeURIComponent(oid)}${qs}`);
      setOrder(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Não encontramos pedido com estes dados. Confira o número do pedido e o e-mail.";
      setError(message);
      console.error("[GuestOrderLookupModal.fetchOrder]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = async () => {
    if (!order?.id) return;
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("[GuestOrderLookupModal.handleCopyId] clipboard failed");
    }
  };

  const handleCheckoutClose = () => {
    setShowCheckout(false);
    const oid = orderIdInput.trim();
    const em = emailInput.trim();
    if (!oid || !guestEmailOk(em)) return;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = `?guestEmail=${encodeURIComponent(em)}`;
        const data = await apiFetch<OrderWithItems>(`/api/orders/${encodeURIComponent(oid)}${qs}`);
        setOrder(data);
      } catch (err: unknown) {
        console.error("[GuestOrderLookupModal.refreshAfterPay]", err);
      } finally {
        setLoading(false);
      }
    })();
  };

  const keepMounted = isOpen || showCheckout;
  if (!keepMounted) return null;

  const requestCloseLookup = () => {
    if (showCheckout) return;
    onClose();
  };

  const canPay =
    order &&
    order.status === "pending" &&
    (!order.paymentStatus || order.paymentStatus === "pending");

  return (
    <>
      {isOpen && !showCheckout ? (
        <div className="fixed inset-0 z-[102] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-md"
            onClick={requestCloseLookup}
            aria-hidden
          />
          <div
            className="relative max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={order ? "Detalhes do pedido" : "Consultar pedido"}
          >
            <button
              type="button"
              onClick={requestCloseLookup}
              className="absolute right-4 top-4 text-[#6D4C41] transition-colors hover:text-[#1B4332]"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </button>

            {!order ? (
            <>
              <h2
                id="guest-order-lookup-title"
                className="mb-2 pr-10 font-playfair text-2xl font-bold text-[#1B4332] sm:text-3xl"
              >
                Consultar pedido
              </h2>
              <p className="mb-6 font-inter text-sm text-[#6D4C41]">
                Use o mesmo e-mail informado no checkout sem login e o código do pedido (enviado após a finalização).
              </p>

              <div className="space-y-4 font-inter">
                <div>
                  <label htmlFor="guest-order-id" className="mb-1 block text-sm font-medium text-[#6D4C41]">
                    Número do pedido
                  </label>
                  <input
                    id="guest-order-id"
                    type="text"
                    autoComplete="off"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    placeholder="Ex.: a1b2c3d4-..."
                    className="w-full rounded-xl border border-[#1B4332]/20 bg-white px-4 py-3 text-[#1B4332] placeholder:text-[#6D4C41]/50 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                  />
                </div>
                <div>
                  <label htmlFor="guest-order-email" className="mb-1 block text-sm font-medium text-[#6D4C41]">
                    E-mail
                  </label>
                  <input
                    id="guest-order-email"
                    type="email"
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="mesmo e-mail do pedido"
                    className="w-full rounded-xl border border-[#1B4332]/20 bg-white px-4 py-3 text-[#1B4332] placeholder:text-[#6D4C41]/50 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void fetchOrder()}
                  disabled={loading}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] px-6 py-3 font-medium text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 shrink-0" />
                      <span>Buscar pedido</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex items-start justify-between gap-2 pr-8">
                <div>
                  <h2 className="font-playfair text-xl font-bold text-[#1B4332] sm:text-2xl">Pedido encontrado</h2>
                  <p className="mt-1 break-all font-mono text-xs text-[#6D4C41] sm:text-sm">{order.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyId()}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#1B4332]/15 px-2 py-1.5 text-xs text-[#1B4332] hover:bg-[#FAF8F3]"
                  aria-label="Copiar número do pedido"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusColor(order.status)}`}
                >
                  {getStatusText(order.status)}
                </span>
                <span className="font-inter text-sm text-[#6D4C41]">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="mb-4 font-inter text-lg font-bold text-[#1B4332]">
                Total: R$ {order.total.toFixed(2).replace(".", ",")}
              </p>

              {order.deliveryAddress?.trim() ? (
                <p className="mb-4 rounded-xl border border-[#1B4332]/10 bg-[#FAF8F3] p-3 text-sm text-[#6D4C41]">
                  <span className="font-semibold text-[#1B4332]">Entrega: </span>
                  {order.deliveryAddress}
                </p>
              ) : null}

              <div className="mb-4 rounded-xl border border-[#1B4332]/10 bg-white/80 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6D4C41]">Pagamento</p>
                <p className="font-inter text-sm text-[#1B4332]">
                  {order.paymentMethod === "pix"
                    ? "Pix"
                    : order.paymentMethod === "boleto"
                      ? "Boleto"
                      : order.paymentMethod === "credit_card"
                        ? "Cartão de crédito"
                        : order.paymentMethod ?? "—"}
                  {" · "}
                  <span className="text-[#6D4C41]">
                    {order.paymentStatus === "approved"
                      ? "Aprovado"
                      : order.paymentStatus === "rejected"
                        ? "Recusado"
                        : "Pendente"}
                  </span>
                </p>
              </div>

              {order.items && order.items.length > 0 ? (
                <div className="mb-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
                    <Package className="h-4 w-4" />
                    Itens
                  </p>
                  <ul className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[#1B4332]/10 p-3 text-sm">
                    {order.items.map((item, idx) => (
                      <li
                        key={item.id ?? `${item.productId}-${item.productName}-${idx}`}
                        className="flex justify-between gap-2"
                      >
                        <span className="text-[#6D4C41]">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="shrink-0 font-medium text-[#1B4332]">
                          R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                {canPay ? (
                  <button
                    type="button"
                    onClick={() => setShowCheckout(true)}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] px-4 py-3 font-bold text-[#1B4332] shadow-md hover:shadow-lg"
                  >
                    <CreditCard className="h-5 w-5 shrink-0" />
                    Pagar agora
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setOrder(null);
                    setError(null);
                  }}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border-2 border-[#1B4332]/20 px-4 py-3 font-medium text-[#1B4332] hover:bg-[#FAF8F3]"
                >
                  Nova busca
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      ) : null}

      {showCheckout && order ? (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={handleCheckoutClose}
          orderId={order.id}
          total={order.total}
          guestCheckoutEmail={emailInput.trim()}
        />
      ) : null}
    </>
  );
};

export default GuestOrderLookupModal;
