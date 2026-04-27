import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  CheckCircle2,
  Circle,
  Home,
  Loader2,
  Package,
  Truck,
  ExternalLink,
  Search,
} from "lucide-react";
import { apiFetch } from "@/react-app/services/api";
import type { OrderWithItems } from "@/react-app/types";
import { buildTrackingExternalUrl } from "@/react-app/utils/trackingCarrierUrl";

const POLL_MS = 8000;

const logistics = (status: string) => {
  const s = status.toLowerCase();
  return {
    cancelled: s === "cancelled" || s === "canceled",
    shipped: s === "shipped" || s === "enviado" || s === "delivered" || s === "entregue",
    delivered: s === "delivered" || s === "entregue",
  };
};

/**
 * Consulta pública de pedido: número + e-mail (mesma regra de GET /api/orders/:id com guestEmail).
 * Rota sem login proposital — não expõe dados sem o par id+e-mail que o cliente já recebeu no checkout.
 */
const OrderPublicTrackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get("orderId")?.trim() ?? "";
  const guestEmailFromUrl = searchParams.get("guestEmail")?.trim() ?? "";

  const [orderIdInput, setOrderIdInput] = useState(orderIdFromUrl);
  const [emailInput, setEmailInput] = useState(guestEmailFromUrl);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOrderId = orderIdFromUrl || orderIdInput.trim();
  const activeEmail = guestEmailFromUrl || emailInput.trim();

  const qs = useMemo(() => {
    if (!activeEmail) return "";
    return `?guestEmail=${encodeURIComponent(activeEmail)}`;
  }, [activeEmail]);

  const load = useCallback(async () => {
    const oid = activeOrderId;
    if (!oid) {
      setOrder(null);
      return;
    }
    if (!activeEmail) {
      setOrder(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OrderWithItems>(`/api/orders/${encodeURIComponent(oid)}${qs}`);
      setOrder(data);
    } catch (e: unknown) {
      setOrder(null);
      setError(
        e instanceof Error
          ? e.message
          : "Não encontramos este pedido. Confira o número do pedido e o e-mail usados na compra."
      );
    } finally {
      setLoading(false);
    }
  }, [activeOrderId, activeEmail, qs]);

  useEffect(() => {
    if (orderIdFromUrl && guestEmailFromUrl) {
      setOrderIdInput(orderIdFromUrl);
      setEmailInput(guestEmailFromUrl);
    }
  }, [orderIdFromUrl, guestEmailFromUrl]);

  useEffect(() => {
    if (activeOrderId && activeEmail) void load();
    else {
      setOrder(null);
      setError(null);
    }
  }, [activeOrderId, activeEmail, load]);

  useEffect(() => {
    if (!activeOrderId || !activeEmail) return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load, activeOrderId, activeEmail]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const oid = orderIdInput.trim();
    const em = emailInput.trim();
    if (!oid || !em) {
      setError("Preencha o número do pedido e o e-mail.");
      return;
    }
    navigate(`/pedido/acompanhar?orderId=${encodeURIComponent(oid)}&guestEmail=${encodeURIComponent(em)}`, {
      replace: true,
    });
  };

  const paymentApproved = order?.paymentStatus === "approved";
  const log = order ? logistics(order.status ?? "") : { cancelled: false, shipped: false, delivered: false };
  const rawTracking = order?.trackingCode?.trim() ?? "";
  const trackingUrl = rawTracking ? buildTrackingExternalUrl(rawTracking) : "";
  const preparing = paymentApproved && !log.shipped && !log.cancelled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] px-4 pb-16 pt-24">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#1B4332]/10 bg-white/70 text-[#6D4C41] shadow-sm hover:bg-white"
            aria-label="Início"
          >
            <Home className="h-5 w-5" />
          </Link>
          <h1 className="font-playfair text-2xl font-bold text-[#1B4332]">Acompanhar pedido</h1>
        </div>

        <p className="mb-6 font-inter text-sm text-[#6D4C41]">
          Use o número do pedido e o mesmo e-mail informados no checkout. O status atualiza automaticamente.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-3xl border border-white/50 bg-white/90 p-5 shadow-lg backdrop-blur-sm"
        >
          <div>
            <label htmlFor="track-order-id" className="mb-1 block text-xs font-semibold text-[#1B4332]">
              Número do pedido
            </label>
            <input
              id="track-order-id"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-3 font-mono text-sm text-[#1B4332]"
              placeholder="ex.: UUID do pedido"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="track-email" className="mb-1 block text-xs font-semibold text-[#1B4332]">
              E-mail do pedido
            </label>
            <input
              id="track-email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-3 text-sm text-[#1B4332]"
              placeholder="mesmo e-mail do checkout"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2D5F4A]"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            Consultar
          </button>
        </form>

        {loading && activeOrderId && activeEmail && !order ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/50 bg-white/80 py-12 shadow-xl">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#1B4332]" />
            <p className="font-inter text-[#6D4C41]">Carregando…</p>
          </div>
        ) : null}

        {error && activeOrderId && activeEmail ? (
          <div className="rounded-3xl border border-red-100 bg-red-50/90 p-6 text-center text-red-800 shadow-lg">
            <p className="font-inter text-sm">{error}</p>
          </div>
        ) : null}

        {order ? (
          <div className="space-y-6 rounded-3xl border border-white/50 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
            <div>
              <p className="font-mono text-xs text-[#6D4C41]">#{order.id}</p>
              <p className="mt-1 font-playfair text-xl font-bold text-[#1B4332]">
                Total R$ {order.total.toFixed(2).replace(".", ",")}
              </p>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6D4C41]">Status do envio</p>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                  <div>
                    <p className="font-inter text-sm font-medium text-[#1B4332]">Pedido recebido</p>
                    <p className="text-xs text-[#6D4C41]">Registramos seu pedido.</p>
                  </div>
                  <Package className="ml-auto h-4 w-4 text-[#6D4C41]/35" aria-hidden />
                </li>
                <li className="flex items-start gap-3">
                  {paymentApproved ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]/25" />
                  )}
                  <div>
                    <p
                      className={`font-inter text-sm font-medium ${paymentApproved ? "text-[#1B4332]" : "text-[#6D4C41]/70"}`}
                    >
                      Pago
                    </p>
                    <p className="text-xs text-[#6D4C41]">
                      {paymentApproved ? "Pagamento confirmado." : "Aguardando confirmação do pagamento."}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  {preparing ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                  ) : log.shipped || log.delivered ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]/25" />
                  )}
                  <div>
                    <p
                      className={`font-inter text-sm font-medium ${preparing || log.shipped ? "text-[#1B4332]" : "text-[#6D4C41]/70"}`}
                    >
                      Em preparo
                    </p>
                    <p className="text-xs text-[#6D4C41]">
                      {log.shipped || log.delivered
                        ? "Pedido seguiu para envio."
                        : preparing
                          ? "Estamos preparando seu pedido."
                          : "Aguardando pagamento ou envio."}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  {log.shipped ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]/25" />
                  )}
                  <div>
                    <p
                      className={`font-inter text-sm font-medium ${log.shipped ? "text-[#1B4332]" : "text-[#6D4C41]/70"}`}
                    >
                      Enviado
                    </p>
                    {!log.shipped ? (
                      <p className="text-xs text-[#6D4C41]">Código de rastreio aparece aqui quando a loja enviar.</p>
                    ) : !rawTracking ? (
                      <p className="text-xs text-amber-800">Enviado — código em breve.</p>
                    ) : null}
                  </div>
                  <Truck className="ml-auto h-4 w-4 text-[#6D4C41]/35" aria-hidden />
                </li>
              </ol>
            </div>

            {log.shipped && rawTracking ? (
              <div className="rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md ring-1 ring-emerald-200/60">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Rastreio</p>
                <p className="mt-2 font-mono text-lg font-bold tracking-tight text-[#1B4332] sm:text-xl">{rawTracking}</p>
                {order.shippingMethod?.trim() ? (
                  <p className="mt-2 text-sm font-medium text-[#6D4C41]">{order.shippingMethod.trim()}</p>
                ) : null}
                {trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2D5F4A]"
                  >
                    Abrir rastreio
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ) : null}
              </div>
            ) : null}

            {log.cancelled ? (
              <p className="rounded-xl border border-[#1B4332]/15 bg-[#FAF8F3] p-3 text-center text-sm text-[#6D4C41]">
                Este pedido foi cancelado.
              </p>
            ) : null}

            <Link
              to="/"
              className="block w-full rounded-full border-2 border-[#1B4332]/20 py-3 text-center font-medium text-[#1B4332] hover:bg-[#FAF8F3]"
            >
              Voltar à loja
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderPublicTrackPage;
