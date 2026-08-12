import { useRef } from "react";
import { Container } from "@/react-app/design-system/components/Container";
import { ImageReveal } from "@/react-app/components/storefront/media/ImageReveal";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";
import { useLifestyleParallax } from "@/react-app/hooks/storefront/useLifestyleParallax";
import { adminStorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

export function LifestyleSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua loja";
  const copy = resolveStorefrontHome(displayName, settings?.publicProfile);

  useLifestyleParallax(sectionRef, backgroundRef);

  return (
    <section
      ref={sectionRef}
      id={adminStorefrontPreviewSectionId("lifestyle")}
      className="relative overflow-hidden py-24 sm:py-28"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div ref={backgroundRef} className="absolute inset-0 -top-[12%] h-[124%] w-full">
          <ImageReveal
            src={copy.lifestyleLeftImageUrl}
            alt=""
            className="h-full w-full"
            imgClassName="scale-105 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/40" />
        </div>
      </div>

      <Container className="relative z-10">
        <div className="max-w-xl">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-brand-primary">{copy.lifestyleEyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-content sm:text-4xl">{copy.lifestyleTitle}</h2>
          <p className="mt-4 font-body text-content-muted">{copy.lifestyleSubtitle}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="overflow-hidden rounded-3xl border border-brand-primary/15 bg-surface-elevated/80 backdrop-blur-md">
            <ImageReveal
              src={copy.lifestyleLeftImageUrl}
              alt={copy.lifestyleLeftTitle}
              className="aspect-[4/3] w-full"
            />
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-content">{copy.lifestyleLeftTitle}</h3>
              <p className="mt-2 font-body text-sm text-content-muted">{copy.lifestyleLeftText}</p>
            </div>
          </article>

          <article className="overflow-hidden rounded-3xl border border-brand-primary/15 bg-surface-elevated/80 backdrop-blur-md">
            <ImageReveal
              src={copy.lifestyleRightImageUrl}
              alt={copy.lifestyleRightTitle}
              className="aspect-[4/3] w-full"
            />
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-content">{copy.lifestyleRightTitle}</h3>
              <p className="mt-2 font-body text-sm text-content-muted">{copy.lifestyleRightText}</p>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
