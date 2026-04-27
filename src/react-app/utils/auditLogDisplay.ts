import { PlusCircle, Pencil, Trash2, Truck, type LucideIcon } from "lucide-react";
import type { AuditLogReport } from "@/shared/types";

export const ACTION_OPTIONS = [
  { value: "", label: "Todas as ações" },
  { value: "CREATE_PRODUCT", label: "Criar" },
  { value: "UPDATE_PRODUCT", label: "Editar" },
  { value: "DELETE_PRODUCT", label: "Excluir" },
  { value: "CREATE_CATEGORY", label: "Criar categoria" },
  { value: "UPDATE_CATEGORY", label: "Editar categoria" },
  { value: "DELETE_CATEGORY", label: "Excluir categoria" },
  { value: "UPDATE_ORDER_STATUS", label: "Pedido" },
  { value: "UPDATE_ORDER_TRACKING", label: "Rastreio" },
  { value: "SYNC_ORDER_MP_PAYMENT", label: "Sync MP" },
  { value: "MP_WEBHOOK_PAYMENT_NOTIFICATION", label: "Webhook MP" },
  { value: "ORDER_EMAIL_HOOK_CREATED", label: "E-mail (pedido criado)" },
  { value: "ORDER_EMAIL_HOOK_PAID", label: "E-mail (pedido pago)" },
  { value: "ORDER_EMAIL_HOOK_SHIPPED", label: "E-mail (pedido enviado)" },
  { value: "ORDER_MANUAL_REFUND_ALERT", label: "Estorno manual" },
] as const;

export const CHANGE_LABELS: Record<string, string> = {
  price: "Preço",
  price_wholesale: "Preço atacado",
  stock: "Estoque",
  active: "Status",
};

export const getResourceDisplayName = (entry: AuditLogReport): string => {
  const d = (entry.detalhes ?? {}) as Record<string, unknown>;
  if (entry.tipo === "product") {
    const name = (d.product_name ?? d.name) as string | undefined;
    if (name && String(name).trim()) return String(name).trim();
  }
  if (entry.tipo === "order") {
    const customer = d.customer_name as string | undefined;
    if (customer && String(customer).trim()) return String(customer).trim();
    const orderNum = (d.order_number ?? d.order_id) as string | number | undefined;
    if (orderNum != null) return String(orderNum);
  }
  if (entry.tipo === "category") {
    const nm = d.name as string | undefined;
    if (nm && String(nm).trim()) return String(nm).trim();
  }
  const rid = entry.resource_id;
  if (rid && typeof rid === "string" && rid.length > 0) return `ID: ${rid.slice(0, 4)}${rid.length > 4 ? "…" : ""}`;
  return entry.tipo === "order" ? "um pedido" : "um produto";
};

export const getFriendlyActionMessage = (entry: AuditLogReport): string => {
  const nameOrId = getResourceDisplayName(entry);
  const key = entry.action_key ?? "";
  const d = (entry.detalhes ?? {}) as Record<string, unknown>;
  switch (key) {
    case "CREATE_PRODUCT":
      return `Criou o produto ${nameOrId}`;
    case "UPDATE_PRODUCT":
      return `Editou o produto ${nameOrId}`;
    case "DELETE_PRODUCT":
      return `Excluiu o produto ${nameOrId}`;
    case "UPDATE_ORDER_STATUS": {
      const status = (d.status as string) ?? "?";
      return `Mudou o status do pedido #${nameOrId} para ${status}`;
    }
    case "UPDATE_ORDER_TRACKING": {
      const code =
        (d.trackingCode as string | undefined) ??
        (d.tracking_code as string | undefined) ??
        "";
      const trimmed = String(code).trim();
      return `Rastreio atualizado para: ${trimmed || "—"}`;
    }
    case "CREATE_CATEGORY":
      return `Criou a categoria ${nameOrId}`;
    case "UPDATE_CATEGORY":
      return `Atualizou a categoria ${nameOrId}`;
    case "DELETE_CATEGORY":
      return `Excluiu a categoria ${nameOrId}`;
    case "SYNC_ORDER_MP_PAYMENT": {
      const pid = d.mp_payment_id != null ? String(d.mp_payment_id) : "";
      const rid = entry.resource_id?.trim() ?? "";
      return `Sincronizou pagamento MP${rid ? ` — pedido #${rid.slice(0, 8)}${rid.length > 8 ? "…" : ""}` : ""}${pid ? ` · pag. ${pid}` : ""}`;
    }
    case "MP_WEBHOOK_PAYMENT_NOTIFICATION": {
      const pid = d.mp_payment_id != null ? String(d.mp_payment_id) : "";
      const rid = entry.resource_id?.trim() ?? "";
      return `Webhook MP${pid ? ` pag. ${pid}` : ""}${rid ? ` — pedido #${rid.slice(0, 8)}${rid.length > 8 ? "…" : ""}` : ""}`;
    }
    case "ORDER_EMAIL_HOOK_CREATED":
      return `Fila de e-mail: pedido criado (#${entry.resource_id?.slice(0, 8) ?? "?"})`;
    case "ORDER_EMAIL_HOOK_PAID":
      return `Fila de e-mail: pedido pago (#${entry.resource_id?.slice(0, 8) ?? "?"})`;
    case "ORDER_EMAIL_HOOK_SHIPPED":
      return `Fila de e-mail: pedido enviado (#${entry.resource_id?.slice(0, 8) ?? "?"})`;
    case "ORDER_MANUAL_REFUND_ALERT": {
      const r = (d.reason as string | undefined) ?? "";
      return `Cancelamento com possível estorno manual no gateway${r ? `: ${r.slice(0, 120)}` : ""}`;
    }
    default:
      return (
        (entry.acao_descricao ?? "")
          .replace(/\bproduct\b/gi, "Produto")
          .replace(/\border\b/gi, "Pedido") || "Ação registrada"
      );
  }
};

const formatActiveValue = (v: unknown): string => {
  const s = String(v ?? "").toLowerCase();
  if (s === "active" || s === "true" || s === "1") return "Ativo";
  if (s === "inactive" || s === "false" || s === "0") return "Inativo";
  return s || "n/d";
};

export const formatChangeValue = (key: string, value: unknown): string => {
  if (key === "price" || key === "price_wholesale") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }
  if (key === "active") return formatActiveValue(value);
  return String(value ?? "n/d");
};

export const formatDetalhes = (detalhes: unknown): string => {
  if (detalhes == null) return "";
  if (typeof detalhes === "object" && detalhes !== null && "status" in detalhes) {
    return String((detalhes as { status: unknown }).status);
  }
  if (typeof detalhes === "object") {
    const entries = Object.entries(detalhes as Record<string, unknown>).filter(([, v]) => v != null);
    if (entries.length === 0) return "";
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join(" ");
  }
  return String(detalhes);
};

export const getActionStyle = (
  acaoDescricao: string
): { Icon: LucideIcon; iconBg: string; iconColor: string; borderColor: string } => {
  if (acaoDescricao.includes("Criar")) {
    return {
      Icon: PlusCircle,
      iconBg: "bg-[#1B4332]/15",
      iconColor: "text-[#1B4332]",
      borderColor: "border-[#1B4332]/30",
    };
  }
  if (acaoDescricao.includes("Excluir")) {
    return {
      Icon: Trash2,
      iconBg: "bg-[#6D4C41]/15",
      iconColor: "text-[#6D4C41]",
      borderColor: "border-[#6D4C41]/30",
    };
  }
  if (acaoDescricao.toLowerCase().includes("rastreio")) {
    return {
      Icon: Truck,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-800",
      borderColor: "border-sky-300",
    };
  }
  return {
    Icon: Pencil,
    iconBg: "bg-[#FFD166]/40",
    iconColor: "text-[#B8860B]",
    borderColor: "border-[#FFD166]/60",
  };
};
