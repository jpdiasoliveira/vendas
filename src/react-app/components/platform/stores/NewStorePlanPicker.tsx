import { useFormContext } from "react-hook-form";
import { PLATFORM_PLAN_LABELS, type PlatformPlanSlug } from "@/schemas/platformCreateStore";
import type { PlatformCreateStoreFormValues } from "@/schemas/platformCreateStore";

const planOptions: { slug: PlatformPlanSlug; hint: string }[] = [
  { slug: "tier_base", hint: "Entrada com funcionalidades essenciais." },
  { slug: "tier_standard", hint: "Mais capacidade para lojas em crescimento." },
  { slug: "tier_unlimited", hint: "Máxima flexibilidade e limites alargados." },
];

export function NewStorePlanPicker() {
  const { watch, setValue } = useFormContext<PlatformCreateStoreFormValues>();
  const planSlug = watch("planSlug");

  return (
    <div>
      <p className="text-sm font-semibold text-content">Plano inicial</p>
      <div className="mt-3 grid gap-2">
        {planOptions.map((opt) => {
          const selected = planSlug === opt.slug;
          return (
            <label
              key={opt.slug}
              className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition ${
                selected
                  ? "border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary/30"
                  : "border-brand-primary/15 bg-surface-elevated hover:border-brand-primary/30"
              }`}
            >
              <input
                type="radio"
                name="planSlug"
                value={opt.slug}
                checked={selected}
                onChange={() => setValue("planSlug", opt.slug, { shouldDirty: true, shouldValidate: true })}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-content">{PLATFORM_PLAN_LABELS[opt.slug]}</span>
              <span className="text-xs text-content-muted">{opt.hint}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
