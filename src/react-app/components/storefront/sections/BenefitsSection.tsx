import { useRef } from "react";
import { Headphones, Leaf, Truck } from "lucide-react";
import { Container } from "@/react-app/design-system/components/Container";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";
import { useBenefitsReveal } from "@/react-app/hooks/storefront/useBenefitsReveal";
import { adminStorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

const benefitIcons = [Leaf, Truck, Headphones] as const;

export function BenefitsSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua loja";
  const copy = resolveStorefrontHome(displayName, settings?.publicProfile);

  const benefits = [
    { title: copy.benefit1Title, text: copy.benefit1Text },
    { title: copy.benefit2Title, text: copy.benefit2Text },
    { title: copy.benefit3Title, text: copy.benefit3Text },
  ];

  useBenefitsReveal(gridRef);

  return (
    <section
      id={adminStorefrontPreviewSectionId("benefits")}
      className="border-y border-brand-primary/10 bg-surface-muted/40 py-20 sm:py-24"
    >
      <Container>
        <div className="mb-10 text-center">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-brand-primary">Diferenciais</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-content">Por que comprar conosco</h2>
        </div>

        <div ref={gridRef} className="grid gap-5 md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefitIcons[index] ?? Leaf;
            return (
              <article
                key={benefit.title}
                data-benefit-card
                className="opacity-0 rounded-3xl border border-brand-primary/10 bg-surface-elevated/80 p-6 shadow-lg shadow-brand-primary/5"
              >
                <div className="mb-4 inline-flex rounded-2xl border border-brand-primary/15 bg-accent-soft p-3 text-brand-primary">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="font-display text-lg font-semibold text-content">{benefit.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-content-muted">{benefit.text}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
