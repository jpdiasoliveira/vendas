import type { PlatformCatalogFeatureDto, PlatformCatalogPlanDto } from "@/react-app/services/api";
import { TIER_LABEL, type FeatureDraft } from "@/react-app/components/platform/plans/platformEntitlementsDraft";
import { PlanFeatureEntitlementRow } from "@/react-app/components/platform/plans/PlanFeatureEntitlementRow";

const emptyDraft = (): FeatureDraft => ({
  enabled: false,
  unlimited: false,
  intStr: "0",
  boolOn: false,
});

type PlanTierEntitlementsSectionProps = {
  plan: PlatformCatalogPlanDto;
  features: PlatformCatalogFeatureDto[];
  planDraft: Record<string, FeatureDraft>;
  onUpdateDraft: (featureId: string, patch: Partial<FeatureDraft>) => void;
};

export function PlanTierEntitlementsSection({
  plan,
  features,
  planDraft,
  onUpdateDraft,
}: PlanTierEntitlementsSectionProps) {
  const tier = TIER_LABEL[plan.slug] ?? plan.displayName;
  const version = plan.publicPriceVersion;

  if (!version) {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        <p className="font-semibold text-content">{tier}</p>
        <p className="mt-1 text-xs text-content-muted">Sem versão de preço pública ativa.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-primary/15 bg-surface-muted/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-content">
          {tier} <span className="text-sm font-normal text-content-muted">({plan.displayName})</span>
        </h3>
        <span className="text-xs text-content-muted">
          Versão {version.versionSeq} · período de teste: {version.trialPeriodDays} dias
        </span>
      </div>
      <ul className="mt-4 space-y-4">
        {features.map((feature) => (
          <PlanFeatureEntitlementRow
            key={feature.id}
            feature={feature}
            draft={planDraft[feature.id] ?? emptyDraft()}
            onChange={(patch) => onUpdateDraft(feature.id, patch)}
          />
        ))}
      </ul>
    </section>
  );
}
