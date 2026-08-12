import { useRef } from "react";
import { Container } from "@/react-app/design-system/components/Container";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { NewsletterSubscribeButton } from "@/react-app/components/storefront/sections/NewsletterSubscribeButton";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";
import { useSectionEntrance } from "@/react-app/hooks/storefront/useSectionEntrance";
import { useNewsletterSubscribe } from "@/react-app/hooks/storefront/useNewsletterSubscribe";
import { adminStorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

export function NewsletterSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua loja";
  const copy = resolveStorefrontHome(displayName, settings?.publicProfile);
  const newsletter = useNewsletterSubscribe();

  useSectionEntrance(sectionRef);

  return (
    <section
      ref={sectionRef}
      id={adminStorefrontPreviewSectionId("newsletter")}
      className="py-16 sm:py-20 lg:py-24"
    >
      <Container>
        <div className="rounded-3xl border border-brand-primary/15 bg-surface-elevated/80 p-6 shadow-lg shadow-brand-primary/5 backdrop-blur-sm sm:p-8 lg:p-10">
          <div data-section-enter className="mx-auto max-w-2xl text-center">
            <p className="font-body text-xs uppercase tracking-[0.2em] text-brand-primary">{copy.newsletterEyebrow}</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-content sm:text-3xl">{copy.newsletterTitle}</h2>
            <p className="mt-3 font-body text-sm text-content-muted sm:text-base">{copy.newsletterSubtitle}</p>
          </div>

          <form
            data-section-enter
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void newsletter.subscribe();
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              E-mail para newsletter
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={newsletter.email}
              onChange={(event) => newsletter.setEmail(event.target.value)}
              placeholder={copy.newsletterPlaceholder}
              autoComplete="email"
              disabled={newsletter.isLoading}
              className={storefrontInputClass}
              aria-invalid={newsletter.fieldError != null}
              aria-describedby={newsletter.fieldError ? "newsletter-error" : undefined}
            />
            <NewsletterSubscribeButton
              label={copy.newsletterCtaLabel}
              status={newsletter.status}
              onClick={() => void newsletter.subscribe()}
              disabled={newsletter.isLoading}
            />
          </form>

          {newsletter.fieldError ? (
            <p id="newsletter-error" role="alert" className="mt-3 text-center font-body text-sm text-red-400">
              {newsletter.fieldError}
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
