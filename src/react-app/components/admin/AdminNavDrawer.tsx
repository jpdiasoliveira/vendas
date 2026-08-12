import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, X } from "lucide-react";
import type { AdminNavLink } from "@/react-app/hooks/admin/useAdminNav";

type AdminNavDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  links: AdminNavLink[];
  pathActive: (to: string) => boolean;
  onLogout: () => void;
};

export function AdminNavDrawer({ isOpen, onClose, links, pathActive, onLogout }: AdminNavDrawerProps) {
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
            aria-label="Fechar menu"
            className="fixed inset-0 z-[60] bg-surface/80 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu do painel"
            className="fixed left-0 top-0 z-[61] flex h-[100dvh] w-[min(100vw,18rem)] flex-col border-r border-brand-primary/15 bg-surface-elevated shadow-2xl lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
          >
            <div className="flex items-center justify-between border-b border-brand-primary/10 px-4 py-3">
              <span className="font-display text-sm font-semibold text-content">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-muted hover:text-content"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Seções do painel">
              {links.map(({ to, label, icon: Icon }) => {
                const isActive = pathActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={`inline-flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-primary/12 text-brand-primary ring-1 ring-brand-primary/20"
                        : "text-content-muted hover:bg-surface-muted hover:text-content"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-brand-primary/10 p-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-primary/15 bg-surface px-3 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-muted hover:text-content"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sair
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
