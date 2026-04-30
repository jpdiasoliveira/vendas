import { useState, useEffect, useRef } from "react";
import { ArrowRight, CircleHelp } from "lucide-react";
import type { AuditLogReport } from "@/shared/types";
import { formatDateTime } from "@/react-app/utils/format";
import {
  CHANGE_LABELS,
  formatChangeValue,
  formatDetalhes,
  getActionStyle,
  getAuditLogContextualHelp,
  getFriendlyActionMessage,
} from "@/react-app/utils/auditLogDisplay";

type AuditLogsListProps = {
  logs: AuditLogReport[];
};

const AuditLogHelpControl = ({ entry }: { entry: AuditLogReport }) => {
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
        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]/25"
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
          className="absolute right-0 top-full z-20 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 text-left text-xs leading-relaxed text-slate-700 shadow-lg ring-1 ring-black/5"
        >
          {helpText}
        </div>
      ) : null}
    </div>
  );
};

export const AuditLogsList = ({ logs }: AuditLogsListProps) => (
  <div className="overflow-hidden rounded-2xl border border-[#1B4332]/10 bg-white/70 shadow-sm backdrop-blur-sm">
    {logs.map((entry) => {
      const { Icon, iconBg, iconColor, borderColor } = getActionStyle(entry.acao_descricao);
      const detalhes = (entry.detalhes ?? {}) as Record<string, unknown>;
      const changes = detalhes.changes as Record<string, { from: unknown; to: unknown }> | undefined;
      const detalhesStr =
        !changes && entry.action_key !== "UPDATE_ORDER_TRACKING" ? formatDetalhes(entry.detalhes) : "";
      const categoryLabel = entry.tipo === "product" ? "Produto" : "Pedido";
      const badgeClass =
        entry.tipo === "order"
          ? "inline-flex items-center rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
          : "inline-flex items-center rounded-lg bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800";

      return (
        <div
          key={entry.id}
          className="flex gap-3 border-b border-[#1B4332]/10 px-5 py-4 font-inter last:border-b-0"
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconBg} ${iconColor} ${borderColor}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[#1B4332]">
                <span className={badgeClass}>{categoryLabel}</span> <span>{getFriendlyActionMessage(entry)}</span>
              </p>
              <AuditLogHelpControl entry={entry} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(entry.data_hora)}
              {entry.usuario_email ? (
                <>
                  <span className="mx-1.5 text-slate-400">|</span>
                  {entry.usuario_email}
                </>
              ) : null}
            </p>
            {changes && Object.keys(changes).length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
                {Object.entries(changes).map(([key, { from, to }]) => (
                  <li key={key} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-600">{CHANGE_LABELS[key] ?? key}:</span>
                    <span>{formatChangeValue(key, from)}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    <span>{formatChangeValue(key, to)}</span>
                  </li>
                ))}
              </ul>
            )}
            {detalhesStr && <p className="mt-1 text-xs text-slate-500">{detalhesStr}</p>}
          </div>
        </div>
      );
    })}
  </div>
);
