import { useLayoutEffect, useRef } from "react";
import {
  StoreSettingsPreviewMergeProvider,
  type StoreSettingsData,
} from "@/react-app/contexts/StoreSettingsContext";
import { StorefrontHomeContent } from "@/react-app/components/storefront/StorefrontHomeContent";
import {
  cleanupAdminPreviewFlash,
  resolvePreviewSectionEl,
  scrollPreviewSectionPure,
} from "@/react-app/components/admin/adminStorefrontPreviewScroll";
import {
  policiesBodyPresenceKey,
  useAdminPreviewBrandCss,
} from "@/react-app/components/admin/adminStorefrontPreviewBrandCss";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

type AdminStorefrontPreviewPanelProps = {
  merge: Partial<StoreSettingsData> | null;
  activeSection: StorefrontPreviewSectionId | null;
  previewScrollTick: number;
  onPreviewNavigate?: (section: StorefrontPreviewSectionId) => void;
};

const noop = () => {};

export const AdminStorefrontPreviewPanel = ({
  merge,
  activeSection,
  previewScrollTick,
}: AdminStorefrontPreviewPanelProps) => {
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const policiesKey = policiesBodyPresenceKey(merge);
  const brandCss = useAdminPreviewBrandCss(merge);

  const lifestyleActive =
    activeSection === "lifestyleHead" ||
    activeSection === "lifestyleLeft" ||
    activeSection === "lifestyleRight";
  const scrollTargetSection: StorefrontPreviewSectionId | null = lifestyleActive ? "lifestyle" : activeSection;

  useLayoutEffect(() => cleanupAdminPreviewFlash, []);

  useLayoutEffect(() => {
    if (!activeSection || !scrollTargetSection) return;
    const container = previewScrollRef.current;
    if (!container) return;
    const targetEl = resolvePreviewSectionEl(container, scrollTargetSection);
    if (!targetEl) return;
    const heroAnchor =
      scrollTargetSection === "hero" || activeSection === "hero" ? ({ anchor: "end" } as const) : undefined;
    scrollPreviewSectionPure(container, targetEl, heroAnchor);
  }, [activeSection, scrollTargetSection, previewScrollTick, policiesKey]);

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-brand-primary/15 bg-surface shadow-sm">
      <div
        ref={previewScrollRef}
        className="relative flex-1 min-h-0 max-lg:min-h-[min(280px,40dvh)] overflow-y-auto overscroll-contain scrollbar-slim [-webkit-overflow-scrolling:touch]"
      >
        <StoreSettingsPreviewMergeProvider merge={merge}>
          <div className="relative min-w-0 select-none overflow-x-hidden bg-surface text-content" style={brandCss}>
            <StorefrontHomeContent
              products={[]}
              loading={false}
              error={null}
              trendingProductIds={[]}
              onOpenCart={noop}
              onOpenLogin={noop}
              onOpenGuestOrderLookup={noop}
              scrollToProducts={noop}
              scrollToTop={() => previewScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              previewMode
            />
          </div>
        </StoreSettingsPreviewMergeProvider>
      </div>
    </div>
  );
};
