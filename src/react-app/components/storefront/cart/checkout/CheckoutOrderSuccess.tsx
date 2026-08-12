import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { animate } from "animejs";
import { CheckCircle } from "lucide-react";
import { CheckoutPixQrPanel } from "@/react-app/components/storefront/cart/checkout/CheckoutPixQrPanel";
import { useCheckoutPixPolling } from "@/react-app/hooks/storefront/checkout/useCheckoutPixPolling";
import type { CheckoutPixData } from "@/react-app/types/checkout";
import { formatCurrency } from "@/react-app/utils/format";

type CheckoutOrderSuccessProps = {
  orderId: string;
  orderTotal: number;
  pixData: CheckoutPixData | null;
  guestEmail: string;
  onClose: () => void;
};

export function CheckoutOrderSuccess({
  orderId,
  orderTotal,
  pixData,
  guestEmail,
  onClose,
}: CheckoutOrderSuccessProps) {
  const [copied, setCopied] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);

  const confirmationHref = useMemo(() => {
    const path = `/order/${encodeURIComponent(orderId)}/confirmation`;
    const ge = guestEmail.trim();
    return ge ? `${path}?guestEmail=${encodeURIComponent(ge)}` : path;
  }, [orderId, guestEmail]);

  useEffect(() => {
    if (!iconRef.current) return;
    animate(iconRef.current, {
      scale: [0.6, 1.08, 1],
      opacity: [0, 1],
      duration: 600,
      ease: "out(3)",
    });
  }, []);

  useCheckoutPixPolling(orderId, guestEmail, pixData, paymentApproved, () => setPaymentApproved(true));

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 pb-4 text-center"
    >
      <div ref={iconRef} className="mx-auto inline-flex rounded-full bg-accent-soft p-4 text-accent">
        <CheckCircle className="h-12 w-12" aria-hidden />
      </div>

      <div>
        <h3 className="font-display text-xl font-bold text-content">
          {paymentApproved ? "Pagamento aprovado!" : "Pedido criado!"}
        </h3>
        <p className="mt-1 font-body text-sm text-content-muted">
          Pedido #{orderId} • {formatCurrency(orderTotal)}
        </p>
      </div>

      {pixData && !paymentApproved ? (
        <CheckoutPixQrPanel pixData={pixData} copied={copied} onCopy={(text) => void handleCopy(text)} />
      ) : null}

      <div className="flex flex-col gap-2 pt-2">
        <Link
          to={confirmationHref}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-brand-primary/25 font-body text-sm font-semibold text-content transition hover:bg-surface-muted"
        >
          Ver confirmação do pedido
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand-primary font-body text-sm font-bold text-white transition hover:bg-brand-primary-hover"
        >
          Fechar
        </button>
      </div>
    </motion.div>
  );
}
