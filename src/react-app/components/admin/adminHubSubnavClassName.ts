/** Abas dos hubs admin (Produtos, Marca e vitrine): ativo neutro, sem anel. */
export const adminHubSubnavLinkClassName = (isActive: boolean): string =>
  `inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3.5 py-2 text-sm transition-colors sm:px-4 ${
    isActive
      ? "bg-black/[0.06] font-semibold text-[var(--brand-primary)]"
      : "font-medium text-[#6D4C41] hover:bg-black/[0.04] hover:text-[var(--brand-primary)]"
  }`;
