export type AdminSettingsTabId =
  | "branding"
  | "logo"
  | "theme"
  | "hero"
  | "products"
  | "story"
  | "lifestyle"
  | "benefits"
  | "newsletter"
  | "contact"
  | "delivery"
  | "legal";

const tabs: { id: AdminSettingsTabId; label: string }[] = [
  { id: "branding", label: "Marca" },
  { id: "logo", label: "Logo" },
  { id: "theme", label: "Tema" },
  { id: "hero", label: "Hero" },
  { id: "products", label: "Produtos" },
  { id: "story", label: "História" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "benefits", label: "Benefícios" },
  { id: "newsletter", label: "Newsletter" },
  { id: "contact", label: "Contato" },
  { id: "delivery", label: "Entrega" },
  { id: "legal", label: "Legal" },
];

type AdminSettingsTabsProps = {
  active: AdminSettingsTabId;
  onChange: (tab: AdminSettingsTabId) => void;
};

export function AdminSettingsTabs({ active, onChange }: AdminSettingsTabsProps) {
  return (
    <nav className="flex flex-wrap gap-1.5 border-b border-brand-primary/10 pb-3" aria-label="Secções de configuração">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-3.5 py-2 text-sm transition-colors ${
            active === tab.id
              ? "bg-brand-primary/10 font-semibold text-brand-primary"
              : "font-medium text-content-muted hover:bg-surface-muted hover:text-content"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
