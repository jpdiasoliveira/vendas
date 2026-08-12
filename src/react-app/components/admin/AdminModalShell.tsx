import type { ReactNode } from "react";
import { X } from "lucide-react";

type AdminModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  maxWidthClass?: string;
};

export function AdminModalShell({
  isOpen,
  onClose,
  title,
  children,
  description,
  maxWidthClass = "max-w-sm",
}: AdminModalShellProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-surface/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={`relative w-full rounded-2xl border border-brand-primary/15 bg-surface-elevated p-6 shadow-2xl ${maxWidthClass}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="admin-modal-title" className="font-display text-lg font-bold text-content">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-content-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-content-muted hover:bg-surface-muted hover:text-content"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
