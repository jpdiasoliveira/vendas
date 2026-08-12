import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { pageTransitionVariants } from "@/react-app/lib/motion/pageVariants";

type PageTransitionProps = {
  children: ReactNode;
};

const STOREFRONT_PATHS = new Set(["/", "/pedidos", "/pedido/acompanhar", "/login"]);

function shouldAnimate(pathname: string): boolean {
  if (STOREFRONT_PATHS.has(pathname)) return true;
  return pathname.startsWith("/order/") && pathname.endsWith("/confirmation");
}

/** Transições fluidas entre rotas da vitrine (Motion). */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const animate = shouldAnimate(location.pathname);

  if (!animate) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
