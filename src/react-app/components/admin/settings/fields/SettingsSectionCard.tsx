import type { ReactNode } from "react";

type SettingsSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingsSectionCard({ title, description, children }: SettingsSectionCardProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-brand-primary/10 bg-surface-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-content">{title}</h3>
        {description ? <p className="mt-1 text-xs text-content-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
