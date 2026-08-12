import { useRef } from "react";
import { Container } from "@/react-app/design-system/components/Container";
import { ImageReveal } from "@/react-app/components/storefront/media/ImageReveal";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";
import { useScrollReveal } from "@/react-app/hooks/storefront/useScrollReveal";
import { adminStorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

export function StorySection() {
  const copyRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua loja";
  const copy = resolveStorefrontHome(displayName, settings?.publicProfile);

  useScrollReveal(copyRef, { y: 36, duration: 0.85 });
  useScrollReveal(imageRef, { y: 48, duration: 0.9, start: "top 80%" });

  return (
    <section
      id={adminStorefrontPreviewSectionId("story")}
      className="border-y border-brand-primary/10 bg-surface-muted/30 py-16 sm:py-20 lg:py-24"
    >
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div ref={copyRef} className="space-y-5">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-brand-primary">{copy.storyEyebrow}</p>
          <h2 className="font-display text-3xl font-bold text-content sm:text-4xl">{copy.storyHeading}</h2>
          <div className="space-y-4">
            {copy.storyParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="font-body text-sm leading-relaxed text-content-muted sm:text-base">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="rounded-full border border-brand-primary/20 bg-surface-elevated px-3 py-1 font-body text-xs text-content">
              {copy.storyChip1}
            </span>
            <span className="rounded-full border border-brand-primary/20 bg-surface-elevated px-3 py-1 font-body text-xs text-content">
              {copy.storyChip2}
            </span>
          </div>
        </div>

        <div ref={imageRef} className="overflow-hidden rounded-3xl border border-brand-primary/15 shadow-xl shadow-brand-primary/10">
          <ImageReveal
            src={copy.storyImageUrl}
            alt={copy.storyHeading}
            className="aspect-[4/5] w-full sm:aspect-[5/4] lg:aspect-square"
          />
        </div>
      </Container>
    </section>
  );
}
