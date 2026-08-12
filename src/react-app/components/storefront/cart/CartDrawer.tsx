import { useEffect } from "react";

import { createPortal } from "react-dom";

import { AnimatePresence, motion } from "motion/react";

import LoginModal from "@/react-app/components/LoginModal";

import { CartDrawerHeader } from "@/react-app/components/storefront/cart/CartDrawerHeader";

import { CartEmptyState } from "@/react-app/components/storefront/cart/CartEmptyState";

import { CartCheckoutStepper } from "@/react-app/components/storefront/cart/checkout/CartCheckoutStepper";

import { useCheckoutFlow } from "@/react-app/hooks/storefront/useCheckoutFlow";



type CartDrawerProps = {

  isOpen: boolean;

  onClose: () => void;

};



export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {

  const flow = useCheckoutFlow(onClose);



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



  const showCheckout = flow.items.length > 0 || flow.step === "success";



  return createPortal(

    <>

      <AnimatePresence>

        {isOpen ? (

          <>

            <motion.button

              type="button"

              aria-label="Fechar carrinho"

              className="fixed inset-0 z-[100] bg-surface/75 backdrop-blur-md"

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              exit={{ opacity: 0 }}

              onClick={onClose}

            />

            <motion.aside

              role="dialog"

              aria-modal="true"

              aria-label="Carrinho de compras"

              className="fixed right-0 top-0 z-[101] flex h-[100dvh] w-full max-w-[100vw] flex-col border-l border-brand-primary/15 bg-surface shadow-2xl sm:max-w-md"

              initial={{ x: "100%" }}

              animate={{ x: 0 }}

              exit={{ x: "100%" }}

              transition={{ type: "spring", stiffness: 360, damping: 36 }}

            >

              <CartDrawerHeader itemCount={flow.items.length} onClose={onClose} />



              <div className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pt-5">

                {flow.apiError && flow.step !== "payment" ? (

                  <div

                    role="alert"

                    className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 p-4 font-body text-sm text-red-200"

                  >

                    {flow.apiError}

                  </div>

                ) : null}



                {showCheckout ? <CartCheckoutStepper flow={flow} /> : <CartEmptyState />}

              </div>

            </motion.aside>

          </>

        ) : null}

      </AnimatePresence>



      <LoginModal isOpen={flow.showLoginModal} onClose={() => flow.setShowLoginModal(false)} />

    </>,

    document.body,

  );

}

