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

/** Valores enviados ao Worker no query param `actions` (chip Criação). */
export const AUDIT_ACTION_KEYS_CREATE = ["CREATE_PRODUCT", "CREATE_CATEGORY"] as const;

/** Valores enviados ao Worker no query param `actions` (chip Exclusão). */
export const AUDIT_ACTION_KEYS_DELETE = ["DELETE_PRODUCT", "DELETE_CATEGORY"] as const;

const CREATE_KEY_SET = new Set<string>(AUDIT_ACTION_KEYS_CREATE);
const DELETE_KEY_SET = new Set<string>(AUDIT_ACTION_KEYS_DELETE);

/** Opções do select «Mais filtros» (tudo exceto criação/exclusão agregadas nos chips). */
export const AUDIT_MORE_FILTER_OPTIONS = ACTION_OPTIONS.filter(
  (o) => o.value !== "" && !CREATE_KEY_SET.has(o.value) && !DELETE_KEY_SET.has(o.value)
);

/** Estado interno dos chips rápidos (não são action_key reais). */
export const AUDIT_FILTER_QUICK_CREATE = "__quick_create__";
export const AUDIT_FILTER_QUICK_DELETE = "__quick_delete__";

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

/** Texto curto para ajuda contextual (?), em linguagem simples. */
export const getAuditLogContextualHelp = (entry: AuditLogReport): string => {
  const key = entry.action_key ?? "";
  switch (key) {
    case "CREATE_PRODUCT":
      return "Este registro confirma que um novo produto foi adicionado ao catálogo. Ajuda a ver quem criou o item e quando.";
    case "UPDATE_PRODUCT":
      return "Indica que dados de um produto (preço, stock, nome, etc.) foram alterados. Útil para perceber mudanças no catálogo.";
    case "DELETE_PRODUCT":
      return "Indica que um produto foi removido do catálogo. Confirma remoções acidentais ou limpezas de SKU.";
    case "UPDATE_ORDER_STATUS":
      return "Indica que o estado do pedido mudou (ex.: pago, enviado). Acompanha o fluxo de venda até à entrega.";
    case "UPDATE_ORDER_TRACKING":
      return "Indica que foi guardado ou alterado o código de rastreio do envio. O cliente pode acompanhar a encomenda.";
    case "CREATE_CATEGORY":
      return "Indica que foi criada uma nova categoria para organizar produtos.";
    case "UPDATE_CATEGORY":
      return "Indica que o nome ou ordem de uma categoria foi alterada.";
    case "DELETE_CATEGORY":
      return "Indica que uma categoria foi apagada. Os produtos podem ficar sem categoria até serem reorganizados.";
    case "SYNC_ORDER_MP_PAYMENT":
      return "Indica que o sistema sincronizou o pagamento deste pedido com o Mercado Pago (confirmação ou atualização).";
    case "MP_WEBHOOK_PAYMENT_NOTIFICATION":
      return "Indica que o Mercado Pago enviou um aviso automático (webhook) sobre o pagamento. É processamento normal do gateway.";
    case "ORDER_EMAIL_HOOK_CREATED":
      return "Indica que foi pedido o envio de e-mail ao cliente quando o pedido foi criado (fila de notificações).";
    case "ORDER_EMAIL_HOOK_PAID":
      return "Indica que foi pedido o envio de e-mail ao cliente quando o pagamento foi confirmado.";
    case "ORDER_EMAIL_HOOK_SHIPPED":
      return "Indica que foi pedido o envio de e-mail ao cliente quando o pedido foi marcado como enviado.";
    case "ORDER_MANUAL_REFUND_ALERT":
      return "Alerta quando um pedido foi cancelado e pode ser necessário estorno manual no gateway de pagamento.";
    default:
      if (entry.tipo === "order") {
        return "Evento ligado a um pedido: alteração de estado, pagamento ou envio. Faz parte do histórico de segurança da loja.";
      }
      if (entry.tipo === "category") {
        return "Evento ligado a categorias do catálogo: criação, edição ou eliminação.";
      }
      return "Registro de atividade da loja: mostra uma ação feita pela equipe ou pelo sistema. Ajuda a auditar o que mudou e quando.";
  }
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
      iconBg: "bg-brand-primary/15",
      iconColor: "text-brand-primary",
      borderColor: "border-brand-primary/30",
    };
  }
  if (acaoDescricao.includes("Excluir")) {
    return {
      Icon: Trash2,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-300",
      borderColor: "border-red-500/30",
    };
  }
  if (acaoDescricao.toLowerCase().includes("rastreio")) {
    return {
      Icon: Truck,
      iconBg: "bg-sky-500/15",
      iconColor: "text-sky-300",
      borderColor: "border-sky-500/30",
    };
  }
  return {
    Icon: Pencil,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-300",
    borderColor: "border-amber-500/30",
  };
};
