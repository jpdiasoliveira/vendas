export function getOrderStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "Aguardando Pagamento";
    case "paid":
    case "approved":
      return "Pagamento Aprovado";
    case "processing":
      return "Em Separação";
    case "shipped":
      return "Enviado";
    case "delivered":
      return "Entregue";
    case "cancelled":
    case "canceled":
      return "Cancelado";
    default:
      return status;
  }
}

export function getOrderStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "border-amber-500/30 bg-amber-950/30 text-amber-200";
    case "paid":
    case "approved":
      return "border-brand-primary/30 bg-accent-soft text-accent";
    case "processing":
      return "border-brand-primary/20 bg-surface-muted text-content";
    case "shipped":
      return "border-brand-primary/25 bg-surface-muted text-content";
    case "delivered":
      return "border-emerald-500/30 bg-emerald-950/30 text-emerald-200";
    case "cancelled":
    case "canceled":
      return "border-red-500/30 bg-red-950/30 text-red-200";
    default:
      return "border-brand-primary/15 bg-surface-muted text-content-muted";
  }
}

export function getPaymentStatusBadgeClass(paymentStatus: string | null | undefined): string {
  if (paymentStatus === "approved") {
    return "border-emerald-500/30 bg-emerald-950/30 text-emerald-200";
  }
  if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
    return "border-red-500/30 bg-red-950/30 text-red-200";
  }
  return "border-amber-500/30 bg-amber-950/30 text-amber-200";
}

export function getPaymentStatusLabel(paymentStatus: string | null | undefined): string {
  if (paymentStatus === "approved") return "Pagamento confirmado";
  if (paymentStatus === "rejected") return "Recusado";
  if (paymentStatus === "cancelled") return "Cancelado";
  return "Pendente";
}

export function getPaymentMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "pix":
      return "Pix";
    case "boleto":
      return "Boleto";
    case "credit_card":
      return "Cartão de Crédito";
    default:
      return "Não definido";
  }
}

export function formatOrderDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function orderLogistics(status: string) {
  const s = status.toLowerCase();
  return {
    cancelled: s === "cancelled" || s === "canceled",
    shipped: s === "shipped" || s === "delivered" || s === "enviado",
    delivered: s === "delivered" || s === "entregue",
  };
}

export function guestEmailOk(email: string): boolean {
  const t = email.trim();
  return t.length > 4 && t.includes("@") && !t.includes(" ");
}

export function orderIdOk(id: string): boolean {
  return id.trim().length >= 8;
}

export function formatOrderDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
