import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  CheckCircle2,
  Circle,
  Home,
  Loader2,
  Package,
  Truck,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/react-app/services/api";
import type { OrderWithItems } from "@/react-app/types";
import { buildTrackingExternalUrl } from "@/react-app/utils/trackingCarrierUrl";

const POLL_MS = 5000;

const logistics = (status: string) => {
  const s = status.toLowerCase();
  return {
    cancelled: s === "cancelled" || s === "canceled",
    shipped: s === "shipped" || s === "delivered" || s === "enviado",
    delivered: s === "delivered" || s === "entregue",
  };
};

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const guestEmail = searchParams.get("guestEmail") ?? searchParams.get("guest_email");
  const mpResult = searchParams.get("mp_result");

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    if (!guestEmail?.trim()) return "";
    return `?guestEmail=${encodeURIComponent(guestEmail.trim())}`;
  }, [guestEmail]);

  const load = useCallback(async () => {
    if (!orderId?.trim()) {
      setError("Pedido inválido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OrderWithItems>(`/api/orders/${encodeURIComponent(orderId.trim())}${qs}`);
      setOrder(data);
    } catch (e: unknown) {
      setOrder(null);
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar o pedido. Verifique o link ou faça login em «Meus pedidos»."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, qs]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!orderId?.trim()) return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load, orderId]);

  const stockConflict =
    order?.metadata &&
    typeof order.metadata === "object" &&
    (order.metadata as Record<string, unknown>).insufficient_stock_at_payment === true;

  const paymentApproved = order?.paymentStatus === "approved";
  const log = order ? logistics(order.status ?? "") : { cancelled: false, shipped: false, delivered: false };
  const rawTracking = order?.trackingCode?.trim() ?? "";
  const trackingUrl = rawTracking ? buildTrackingExternalUrl(rawTracking) : "";
  const statusLower = (order?.status ?? "").toLowerCase();
  const isShippedStatus =
    statusLower === "shipped" || statusLower === "enviado" || statusLower === "delivered" || statusLower === "entregue";

  const mpBanner =
    mpResult === "failure"
      ? "Pagamento não concluído. Você pode tentar novamente em «Meus pedidos» ou no carrinho."
      : mpResult === "pending"
        ? "Pagamento em análise. Esta página atualiza automaticamente."
        : null;

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
          <h1 className="font-playfair text-2xl font-bold text-[#1B4332]">Pedido</h1>
        </div>

        {mpBanner ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {mpBanner}
          </div>
        ) : null}

        {loading && !order ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/50 bg-white/80 py-16 shadow-xl">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#1B4332]" />
            <p className="font-inter text-[#6D4C41]">Carregando pedido…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50/90 p-6 text-center text-red-800 shadow-lg">
            <p className="mb-4 font-inter">{error}</p>
            <Link
              to="/pedidos"
              className="inline-block rounded-full bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5a4a]"
            >
              Ir para meus pedidos
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-6 rounded-3xl border border-white/50 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
            {stockConflict ? (
              <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Pedido cancelado por indisponibilidade de estoque</p>
                  <p className="mt-1 text-red-800/90">
                    Se o pagamento foi debitado, a loja precisará reembolsar pelo Mercado Pago. Guarde o número do
                    pedido.
                  </p>
                </div>
              </div>
            ) : null}
            {log.cancelled && !stockConflict ? (
              <div className="rounded-2xl border border-[#1B4332]/15 bg-[#FAF8F3] p-4 text-sm text-[#6D4C41]">
                Este pedido foi cancelado.
              </div>
            ) : null}

            <div>
              <p className="font-mono text-xs text-[#6D4C41]">#{order.id}</p>
              <p className="mt-1 font-playfair text-xl font-bold text-[#1B4332]">
                Total R$ {order.total.toFixed(2).replace(".", ",")}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-900">Pagamento</p>
              <p className="mt-1 font-inter text-sm text-green-900">
                {paymentApproved ? "Confirmado — obrigado pela compra." : "Aguardando confirmação do pagamento."}
              </p>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6D4C41]">Acompanhamento</p>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                  <div>
                    <p className="font-inter text-sm font-medium text-[#1B4332]">Recebido</p>
                    <p className="text-xs text-[#6D4C41]">Seu pedido foi registrado.</p>
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
                    {paymentApproved ? (
                      <p className="text-xs text-green-800">Pagamento confirmado.</p>
                    ) : (
                      <p className="text-xs text-[#6D4C41]">Aguardando confirmação.</p>
                    )}
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
                      <p className="text-xs text-[#6D4C41]">Em preparação.</p>
                    ) : !rawTracking ? (
                      <p className="text-xs text-amber-800">Enviado — código de rastreio em breve.</p>
                    ) : null}
                  </div>
                  <Truck className="ml-auto h-4 w-4 text-[#6D4C41]/35" aria-hidden />
                </li>
                <li className="flex items-start gap-3">
                  {log.delivered ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]/25" />
                  )}
                  <div>
                    <p
                      className={`font-inter text-sm font-medium ${log.delivered ? "text-[#1B4332]" : "text-[#6D4C41]/70"}`}
                    >
                      Entregue
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {isShippedStatus && rawTracking ? (
              <div className="rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md ring-1 ring-emerald-200/60">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Seu pedido foi enviado</p>
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
                    Abrir rastreio (Correios ou busca)
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ) : null}
                <p className="mt-3 text-xs text-emerald-900/80">
                  Códigos no formato dos Correios (ex.: AA123456789BR) abrem direto no rastreador oficial; demais abrem
                  uma busca segura pelo código.
                </p>
              </div>
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
}
