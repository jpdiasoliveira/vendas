import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useAdminOrderDetailsDrawer } from "@/react-app/hooks/admin/useAdminOrderDetailsDrawer";
import type { OrderDetail } from "@/react-app/types";
import {
  AdminOrderDetailsBody,
  AdminOrderDetailsLoading,
} from "@/react-app/components/admin/orders/AdminOrderDetailsBody";

type AdminOrderDetailsDrawerProps = {
  isOpen: boolean;
  orderId: string | null;
  order: OrderDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

export function AdminOrderDetailsDrawer({
  isOpen,
  orderId,
  order,
  loading,
  error,
  onClose,
}: AdminOrderDetailsDrawerProps) {
  const drawer = useAdminOrderDetailsDrawer({ isOpen, orderId, order, loading });

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Fechar detalhes do pedido"
            className="fixed inset-0 z-[70] bg-surface/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={orderId ? `Pedido ${orderId}` : "Detalhes do pedido"}
            className="fixed right-0 top-0 z-[71] flex h-[100dvh] w-full max-w-[100vw] flex-col border-l border-brand-primary/15 bg-surface shadow-2xl sm:max-w-xl lg:max-w-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-primary/10 px-4 py-3 sm:px-5">
              <h2 className="min-w-0 font-display text-lg font-bold text-content sm:text-xl">
                Pedido {orderId ? `#${orderId}` : ""}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-muted hover:text-content"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
              {loading && !order ? <AdminOrderDetailsLoading /> : null}
              {error ? (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">{error}</div>
              ) : null}
              {order && !loading ? (
                <AdminOrderDetailsBody
                  order={order}
                  selectedStatus={drawer.selectedStatus}
                  setSelectedStatus={drawer.setSelectedStatus}
                  cancellationReason={drawer.cancellationReason}
                  setCancellationReason={drawer.setCancellationReason}
                  statusSuccessMessage={drawer.statusSuccessMessage}
                  syncPaymentMessage={drawer.syncPaymentMessage}
                  formError={drawer.formError}
                  updating={drawer.updating}
                  syncPaymentLoading={drawer.syncPaymentLoading}
                  onSyncPayment={() => void drawer.handleSyncPayment()}
                  onSubmitStatus={() => void drawer.handleSubmitStatus()}
                />
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
