import type { PlatformCatalogFeatureDto } from "@/react-app/services/api";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { FeatureDraft } from "@/react-app/components/platform/plans/platformEntitlementsDraft";

type PlanFeatureEntitlementRowProps = {
  feature: PlatformCatalogFeatureDto;
  draft: FeatureDraft;
  onChange: (patch: Partial<FeatureDraft>) => void;
};

export function PlanFeatureEntitlementRow({ feature, draft, onChange }: PlanFeatureEntitlementRowProps) {
  return (
    <li className="rounded-xl border border-brand-primary/15 bg-surface-elevated px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-content">{feature.displayName}</p>
          {feature.description ? <p className="text-xs text-content-muted">{feature.description}</p> : null}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-content">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-brand-primary/30 accent-brand-primary"
          />
          Ativo neste plano
        </label>
      </div>
      {draft.enabled && feature.valueKind === "boolean" ? (
        <label className="mt-3 flex items-center gap-2 text-sm text-content-muted">
          <input
            type="checkbox"
            checked={draft.boolOn}
            onChange={(e) => onChange({ boolOn: e.target.checked })}
            className="h-4 w-4 rounded border-brand-primary/30 accent-brand-primary"
          />
          Ativar para as lojas deste plano
        </label>
      ) : null}
      {draft.enabled && feature.valueKind === "integer" ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-content-muted">
            <input
              type="checkbox"
              checked={draft.unlimited}
              onChange={(e) => onChange({ unlimited: e.target.checked })}
              className="h-4 w-4 rounded border-brand-primary/30 accent-brand-primary"
            />
            Sem limite numérico
          </label>
          {!draft.unlimited ? (
            <input
              type="number"
              min={0}
              step={1}
              value={draft.intStr}
              onChange={(e) => onChange({ intStr: e.target.value })}
              className={`${storefrontInputClass} w-28 py-2 font-mono text-sm`}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
