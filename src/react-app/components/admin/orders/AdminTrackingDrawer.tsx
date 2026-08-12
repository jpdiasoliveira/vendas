import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Package, X } from "lucide-react";
import { useAdminTrackingDrawer } from "@/react-app/hooks/admin/useAdminTrackingDrawer";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type AdminTrackingDrawerProps = {
  isOpen: boolean;
  orderId: string | null;
  initialTrackingCode?: string | null;
  initialShippingMethod?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function AdminTrackingDrawer({
  isOpen,
  orderId,
  initialTrackingCode,
  initialShippingMethod,
  onClose,
  onSaved,
}: AdminTrackingDrawerProps) {
  const form = useAdminTrackingDrawer({
    isOpen,
    orderId,
    initialTrackingCode,
    initialShippingMethod,
    onSaved,
    onClose,
  });

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
            aria-label="Fechar rastreio"
            className="fixed inset-0 z-[72] bg-surface/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Inserir rastreio"
            className="fixed right-0 top-0 z-[73] flex h-[100dvh] w-full max-w-[100vw] flex-col border-l border-brand-primary/15 bg-surface shadow-2xl sm:max-w-md"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
          >
            <div className="flex items-center justify-between border-b border-brand-primary/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-primary" />
                <h2 className="font-display text-lg font-semibold text-content">Inserir rastreio</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-content-muted hover:bg-surface-muted hover:text-content"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={form.handleSubmit} className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
              <p className="text-sm text-content-muted">
                Preencha o código e a transportadora para o pedido #{orderId}.
              </p>
              <div>
                <label htmlFor="tracking-code" className="mb-1 block text-sm font-medium text-content-muted">
                  Código de rastreio
                </label>
                <input
                  id="tracking-code"
                  type="text"
                  value={form.trackingCode}
                  onChange={(e) => form.setTrackingCode(e.target.value)}
                  placeholder="Ex: BR123456789BR"
                  className={storefrontInputClass}
                />
              </div>
              <div>
                <label htmlFor="shipping-method" className="mb-1 block text-sm font-medium text-content-muted">
                  Transportadora
                </label>
                <input
                  id="shipping-method"
                  type="text"
                  value={form.shippingMethod}
                  onChange={(e) => form.setShippingMethod(e.target.value)}
                  placeholder="Ex: Correios SEDEX"
                  className={storefrontInputClass}
                />
              </div>
              {form.error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{form.error}</p>
              ) : null}
              <div className="mt-auto flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-brand-primary/15 bg-surface-elevated py-2.5 text-sm font-medium text-content-muted hover:bg-surface-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={form.saving}
                  className="flex-1 rounded-xl bg-brand-primary py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {form.saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
