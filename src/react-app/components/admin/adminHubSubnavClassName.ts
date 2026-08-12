/** Abas dos hubs admin (Produtos, Marca e vitrine): ativo neutro, sem anel. */
export const adminHubSubnavLinkClassName = (isActive: boolean): string =>
  `inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3.5 py-2 text-sm transition-colors sm:px-4 ${
    isActive
      ? "bg-brand-primary/10 font-semibold text-brand-primary"
      : "font-medium text-content-muted hover:bg-surface-muted hover:text-content"
  }`;
