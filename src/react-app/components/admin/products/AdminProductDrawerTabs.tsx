export type AdminProductDrawerTab = "info" | "pricing" | "media" | "inventory";

const TABS: { id: AdminProductDrawerTab; label: string }[] = [
  { id: "info", label: "Info" },
  { id: "pricing", label: "Preços" },
  { id: "media", label: "Mídia" },
  { id: "inventory", label: "Estoque" },
];

type AdminProductDrawerTabsProps = {
  active: AdminProductDrawerTab;
  onChange: (tab: AdminProductDrawerTab) => void;
};

export function AdminProductDrawerTabs({ active, onChange }: AdminProductDrawerTabsProps) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-brand-primary/10 px-4 sm:px-5" aria-label="Abas do produto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`min-h-[44px] rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
            active === tab.id
              ? "border-b-2 border-brand-primary text-brand-primary"
              : "text-content-muted hover:text-content"
          }`}
          aria-current={active === tab.id ? "page" : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
