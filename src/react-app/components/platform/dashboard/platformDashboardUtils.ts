import type { PlatformAnalyticsOverviewDto } from "@/react-app/services/api";

export const defaultPlatformOverview: PlatformAnalyticsOverviewDto = {
  mrrBrlEstimated: 0,
  payingOrTrialingSubscriptions: 0,
  activeStoresCount: 0,
  gmvPaidBrlLast30d: 0,
};

export const formatPlatformBrl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);

export const mrrSubscriptionsCaption = (count: number) => {
  if (count === 0) {
    return "Nenhuma assinatura em cobrança, período de teste ou pendência financeira entra nesta estimativa.";
  }
  if (count === 1) {
    return "1 assinatura em cobrança, teste ou pendência de pagamento entra neste valor.";
  }
  return `${count} assinaturas nesses estados entram neste valor.`;
};
