import { ArrowRight } from "lucide-react";
import type { AuditLogReport } from "@/shared/types";
import { formatDateTime } from "@/react-app/utils/format";
import {
  CHANGE_LABELS,
  formatChangeValue,
  formatDetalhes,
  getActionStyle,
  getFriendlyActionMessage,
} from "@/react-app/utils/auditLogDisplay";
import { AuditLogHelpControl } from "@/react-app/components/admin/AuditLogHelpControl";

type AuditLogsListProps = {
  logs: AuditLogReport[];
};

export const AuditLogsList = ({ logs }: AuditLogsListProps) => (
  <div className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-surface-elevated shadow-sm">
    {logs.map((entry) => {
      const { Icon, iconBg, iconColor, borderColor } = getActionStyle(entry.acao_descricao);
      const detalhes = (entry.detalhes ?? {}) as Record<string, unknown>;
      const changes = detalhes.changes as Record<string, { from: unknown; to: unknown }> | undefined;
      const detalhesStr =
        !changes && entry.action_key !== "UPDATE_ORDER_TRACKING" ? formatDetalhes(entry.detalhes) : "";
      const categoryLabel = entry.tipo === "product" ? "Produto" : "Pedido";
      const badgeClass =
        entry.tipo === "order"
          ? "inline-flex items-center rounded-lg bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300"
          : "inline-flex items-center rounded-lg bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-300";

      return (
        <div key={entry.id} className="flex gap-3 border-b border-brand-primary/10 px-5 py-4 last:border-b-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconBg} ${iconColor} ${borderColor}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-content">
                <span className={badgeClass}>{categoryLabel}</span> <span>{getFriendlyActionMessage(entry)}</span>
              </p>
              <AuditLogHelpControl entry={entry} />
            </div>
            <p className="mt-1 text-xs text-content-muted">
              {formatDateTime(entry.data_hora)}
              {entry.usuario_email ? (
                <>
                  <span className="mx-1.5 text-content-muted/60">|</span>
                  {entry.usuario_email}
                </>
              ) : null}
            </p>
            {changes && Object.keys(changes).length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-content-muted">
                {Object.entries(changes).map(([key, { from, to }]) => (
                  <li key={key} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-content">{CHANGE_LABELS[key] ?? key}:</span>
                    <span>{formatChangeValue(key, from)}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-content-muted/60" aria-hidden />
                    <span>{formatChangeValue(key, to)}</span>
                  </li>
                ))}
              </ul>
            )}
            {detalhesStr ? <p className="mt-1 text-xs text-content-muted">{detalhesStr}</p> : null}
          </div>
        </div>
      );
    })}
  </div>
);
