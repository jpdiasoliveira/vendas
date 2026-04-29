import { useLayoutEffect, useMemo, useRef } from "react";
import {
  StoreSettingsPreviewMergeProvider,
  type StoreSettingsData,
} from "@/react-app/contexts/StoreSettingsContext";
import { Navbar } from "@/react-app/components/layout/Navbar";
import { Footer } from "@/react-app/components/layout/Footer";
import { Hero } from "@/react-app/components/home/Hero";
import { Story } from "@/react-app/components/home/Story";
import { Lifestyle } from "@/react-app/components/home/Lifestyle";
import { Benefits } from "@/react-app/components/home/Benefits";
import { Newsletter } from "@/react-app/components/home/Newsletter";
import { hexToRgbTriplet, mixHexColor, normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";
import {
  storefrontPreviewSectionLabels,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";

type AdminStorefrontPreviewPanelProps = {
  merge: Partial<StoreSettingsData> | null;
  activeSection: StorefrontPreviewSectionId | null;
};

const highlightCls = (active: boolean) =>
  active
    ? "z-[1] shadow-xl ring-[3px] ring-[#FFD166] ring-offset-[3px] ring-offset-[#FAF8F3] transition-shadow duration-200 rounded-sm"
    : "transition-shadow duration-200 rounded-sm";

/** Rola só o `container` e centra o bloco na área visível (sem mexer no scroll da página). */
const scrollSectionIntoPreview = (container: HTMLDivElement, sectionEl: HTMLElement) => {
  const cRect = container.getBoundingClientRect();
  const eRect = sectionEl.getBoundingClientRect();
  const elTop = container.scrollTop + (eRect.top - cRect.top);
  const elH = eRect.height;
  const viewH = container.clientHeight;
  const centered = elTop - (viewH - elH) / 2;
  const maxTop = Math.max(0, container.scrollHeight - viewH);
  container.scrollTo({ top: Math.min(maxTop, Math.max(0, centered)), behavior: "smooth" });
};

export const AdminStorefrontPreviewPanel = ({ merge, activeSection }: AdminStorefrontPreviewPanelProps) => {
  const scrollElRef = useRef<HTMLDivElement>(null);

  const lifestyleActive =
    activeSection === "lifestyleHead" ||
    activeSection === "lifestyleLeft" ||
    activeSection === "lifestyleRight";

  const scrollTargetSection: StorefrontPreviewSectionId | "lifestyle" | null = lifestyleActive
    ? "lifestyle"
    : activeSection;

  useLayoutEffect(() => {
    if (!scrollTargetSection || !scrollElRef.current) return;
    const container = scrollElRef.current;
    let el = container.querySelector<HTMLElement>(`[data-preview-section="${scrollTargetSection}"]`);
    if (!el && scrollTargetSection === "footerPolicies") {
      el = container.querySelector<HTMLElement>(`[data-preview-section="footerContact"]`);
    }
    if (!el) return;
    const run = () => scrollSectionIntoPreview(container, el);
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [scrollTargetSection]);

  const brand = normalizeStorePrimaryColor(merge?.primaryColor ?? undefined);
  const rgb = hexToRgbTriplet(brand);
  const brandCss = useMemo(() => {
    const hover = mixHexColor(brand, "#000000", 0.12);
    const soft = mixHexColor(brand, "#ffffff", 0.82);
    return {
      ["--brand-primary" as string]: brand,
      ["--brand-primary-rgb" as string]: rgb ?? "27, 67, 50",
      ["--brand-primary-hover" as string]: hover,
      ["--brand-primary-soft" as string]: soft,
    };
  }, [brand, rgb]);

  const noop = () => {};

  return (
    <div className="flex h-full min-h-0 w-full max-w-none flex-col rounded-2xl border border-[#1B4332]/15 bg-[#FAF8F3]/90 p-3 shadow-sm sm:p-4">
      <div className="shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6D4C41]/80 sm:text-sm">
          Pré-visualização (componentes da home, sem produtos)
        </h3>
        <p className="mt-1 text-xs text-[#6D4C41]/80 leading-snug sm:text-sm">
          Ao focar um campo, <strong className="text-[#1B4332]">este painel</strong> rola por dentro e centra o
          bloco certo — no PC o painel fica <strong className="text-[#1B4332]">fixo à direita</strong> enquanto o
          formulário desce. Barra, rodapé e blocos são os mesmos da vitrine (rascunho em tempo real).
        </p>
        {activeSection ? (
          <div
            className="mt-2 rounded-xl border border-amber-300/80 bg-amber-50/95 px-3 py-2 text-xs leading-snug text-amber-950 sm:text-sm"
            role="status"
            aria-live="polite"
          >
            <span className="font-semibold text-[#1B4332]">A mostrar:</span>{" "}
            {storefrontPreviewSectionLabels[activeSection]}
          </div>
        ) : null}
      </div>

      <div
        ref={scrollElRef}
        className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth py-1 pr-1 [-webkit-overflow-scrolling:touch]"
      >
        <StoreSettingsPreviewMergeProvider merge={merge}>
          <div
            className="pointer-events-none select-none overflow-x-hidden bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3]"
            style={brandCss}
          >
            <div data-preview-section="navbar" className={highlightCls(activeSection === "navbar")}>
              <Navbar
                previewScrollContainerRef={scrollElRef}
                onOpenCart={noop}
                onOpenLogin={noop}
                onOpenGuestOrderLookup={noop}
                scrollToProducts={noop}
                scrollToTop={() => scrollElRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              />
            </div>

            <div data-preview-section="hero" className={highlightCls(activeSection === "hero")}>
              <Hero onShopClick={noop} previewLayout />
            </div>

            <div data-preview-section="story" className={highlightCls(activeSection === "story")}>
              <Story />
            </div>

            <div data-preview-section="lifestyle" className={highlightCls(lifestyleActive)}>
              <Lifestyle />
            </div>

            <div data-preview-section="benefits" className={highlightCls(activeSection === "benefits")}>
              <Benefits />
            </div>

            <div data-preview-section="newsletter" className={highlightCls(activeSection === "newsletter")}>
              <Newsletter />
            </div>

            <Footer
              onConsultOrder={noop}
              previewHighlightClassName={(id) => highlightCls(activeSection === id)}
            />
          </div>
        </StoreSettingsPreviewMergeProvider>
      </div>
    </div>
  );
};
