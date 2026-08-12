import { useState, useEffect, useRef } from "react";
import { CircleHelp } from "lucide-react";
import type { AuditLogReport } from "@/shared/types";
import { getAuditLogContextualHelp } from "@/react-app/utils/auditLogDisplay";

type AuditLogHelpControlProps = {
  entry: AuditLogReport;
};

export const AuditLogHelpControl = ({ entry }: AuditLogHelpControlProps) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const helpText = getAuditLogContextualHelp(entry);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        className="rounded p-1 text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25"
        aria-expanded={open}
        aria-controls={`audit-help-${entry.id}`}
        title={helpText}
        aria-label="O que significa este registo?"
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp className="h-4 w-4" strokeWidth={2} />
      </button>
      {open ? (
        <div
          id={`audit-help-${entry.id}`}
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-brand-primary/15 bg-surface-elevated p-3 text-left text-xs leading-relaxed text-content shadow-lg"
        >
          {helpText}
        </div>
      ) : null}
    </div>
  );
};
