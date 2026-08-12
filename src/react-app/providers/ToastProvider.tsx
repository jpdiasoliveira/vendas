import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/react-app/design-system/cn";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastInput = {
  type?: ToastType;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const iconByType: Record<ToastType, typeof AlertCircle> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: AlertCircle,
};

const toneByType: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-950/90 text-emerald-50",
  error: "border-red-500/30 bg-red-950/90 text-red-50",
  info: "border-brand-primary/30 bg-surface-elevated text-content",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", message, durationMs = 5000 }: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = iconByType[toast.type];
            return (
              <motion.div
                key={toast.id}
                role="alert"
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className={cn(
                  "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md",
                  toneByType[toast.type],
                )}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <p className="flex-1 font-body text-sm leading-snug">{toast.message}</p>
                <button
                  type="button"
                  className="rounded-full p-1 opacity-70 transition hover:opacity-100"
                  aria-label="Fechar notificação"
                  onClick={() => dismiss(toast.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return ctx;
}
