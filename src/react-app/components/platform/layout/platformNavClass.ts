export const platformNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-primary/12 font-semibold text-brand-primary ring-1 ring-brand-primary/20"
      : "text-content-muted hover:bg-surface-muted hover:text-content"
  }`;
