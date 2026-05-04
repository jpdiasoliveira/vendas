import { useLayoutEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
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
import { AdminStorefrontProductsHeadPreview } from "@/react-app/components/admin/AdminStorefrontProductsHeadPreview";
import {
  hexToRgbTriplet,
  mixHexColor,
  normalizeStoreAccentColor,
  normalizeStorePrimaryColor,
} from "@/react-app/utils/brandColor";
import {
  adminStorefrontPreviewSectionId,
  PREVIEW_LIFESTYLE_LEFT_CAPTION_ID,
  PREVIEW_LIFESTYLE_RIGHT_CAPTION_ID,
  PREVIEW_POLITICA_ENTREGA_ID,
  PREVIEW_POLITICA_PRIVACIDADE_ID,
  PREVIEW_POLITICA_TROCAS_ID,
  storefrontPreviewSectionLabels,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";

type AdminStorefrontPreviewPanelProps = {
  merge: Partial<StoreSettingsData> | null;
  activeSection: StorefrontPreviewSectionId | null;
  /** Incrementa ao clicar/focar para voltar a alinhar a pré-visualização (ex.: mesmo textarea). */
  previewScrollTick: number;
  /** Clique inverso: rolar o formulário até o campo desta secção. */
  onPreviewNavigate?: (section: StorefrontPreviewSectionId) => void;
};

/** Texto de ajuda acima da moldura — fora do scroll para o quadro da vitrine subir e alinhar com o formulário. */
export const AdminStorefrontPreviewChrome = ({
  activeSection,
}: {
  activeSection: StorefrontPreviewSectionId | null;
}) => (
  <div className="shrink-0 font-inter lg:pt-5">
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#6D4C41]/80 sm:text-xs">
      Pré-visualização da home (inclui títulos da grelha de produtos; cartões são exemplo)
    </h3>
    <p className="mt-0.5 text-[11px] leading-snug text-[#6D4C41]/80 sm:text-xs sm:leading-snug">
      <span className="lg:hidden">
        O quadro à direita rola <strong className="text-[#1B4332]">só dentro desta moldura</strong>; em ecrã largo a
        coluna fica <strong className="text-[#1B4332]">sticky</strong> ao lado do formulário.
      </span>
      <span className="hidden lg:inline">
        Rola <strong className="text-[#1B4332]">só dentro do quadro</strong>; coluna{" "}
        <strong className="text-[#1B4332]">sticky</strong> ao formulário.
      </span>
    </p>
    {activeSection ? (
      <div
        className="mt-1.5 rounded-lg border border-amber-300/80 bg-amber-50/95 px-2 py-1.5 text-[11px] leading-snug text-amber-950 sm:mt-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs sm:leading-snug"
        role="status"
        aria-live="polite"
      >
        <span className="font-semibold text-[#1B4332]">A mostrar:</span> {storefrontPreviewSectionLabels[activeSection]}
      </div>
    ) : null}
  </div>
);

const highlightCls = (active: boolean) =>
  active
    ? "z-[1] shadow-xl ring-[3px] ring-[#FFD166] ring-offset-[3px] ring-offset-[#FAF8F3] transition-shadow duration-200 scroll-mt-4 rounded-sm"
    : "transition-shadow duration-200 scroll-mt-4 rounded-sm";

const previewClickableShellCls =
  "cursor-pointer rounded-sm transition-shadow duration-200 hover:ring-2 hover:ring-[#1B4332]/35 hover:ring-offset-2 hover:ring-offset-[#FAF8F3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]/40";

const PreviewSectionShell = ({
  section,
  active,
  onNavigate,
  children,
}: {
  section: StorefrontPreviewSectionId;
  active: boolean;
  onNavigate?: (s: StorefrontPreviewSectionId) => void;
  children: ReactNode;
}) => {
  const clickable = Boolean(onNavigate);
  return (
    <div
      id={adminStorefrontPreviewSectionId(section)}
      data-preview-section={section}
      className={`${highlightCls(active)}${clickable ? ` ${previewClickableShellCls}` : ""}`}
      {...(clickable
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-label": `Editar no formulário: ${storefrontPreviewSectionLabels[section]}`,
            onClick: (e: MouseEvent<HTMLDivElement>) => {
              e.preventDefault();
              onNavigate?.(section);
            },
            onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigate?.(section);
              }
            },
          }
        : {})}
    >
      {clickable ? <div className="pointer-events-none">{children}</div> : children}
    </div>
  );
};

/** Elemento com ID dentro do contentor de scroll da pré-visualização. */
const findInPreviewById = (container: HTMLElement, domId: string): HTMLElement | null => {
  const el = document.getElementById(domId);
  return el != null && container.contains(el) ? el : null;
};

const findPreviewSectionEl = (container: HTMLElement, suffix: string): HTMLElement | null =>
  findInPreviewById(container, adminStorefrontPreviewSectionId(suffix));

/** Soma `offsetTop` até ao contentor de scroll (cadeia `offsetParent`). */
const offsetTopWithinScrollContainer = (container: HTMLElement, el: HTMLElement): number | null => {
  let sum = 0;
  let n: HTMLElement | null = el;
  while (n && n !== container) {
    sum += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
    if (n && !container.contains(n)) return null;
  }
  return n === container ? sum : null;
};

const FLASH_CLASS = "bg-yellow-100/50";
let adminPreviewFlashTimer: ReturnType<typeof setTimeout> | null = null;
let adminPreviewLastFlashed: HTMLElement | null = null;

const flashPreviewSection = (el: HTMLElement) => {
  if (adminPreviewFlashTimer != null) {
    clearTimeout(adminPreviewFlashTimer);
    adminPreviewFlashTimer = null;
  }
  if (adminPreviewLastFlashed && adminPreviewLastFlashed !== el) {
    adminPreviewLastFlashed.classList.remove(FLASH_CLASS);
  }
  el.classList.add(FLASH_CLASS);
  adminPreviewLastFlashed = el;
  adminPreviewFlashTimer = setTimeout(() => {
    el.classList.remove(FLASH_CLASS);
    if (adminPreviewLastFlashed === el) adminPreviewLastFlashed = null;
    adminPreviewFlashTimer = null;
  }, 480);
};

/** Scroll só dentro do painel: `offsetTop` relativo ao contentor + `scrollTo` suave. */
const scrollPreviewSectionPure = (
  container: HTMLDivElement,
  target: HTMLElement,
  opts?: { anchor: "center" | "end" }
): void => {
  if (container.clientHeight < 8) return;
  const relTop = offsetTopWithinScrollContainer(container, target);
  if (relTop == null) return;
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  const ch = container.clientHeight;
  const anchor = opts?.anchor ?? "center";
  const top =
    anchor === "end"
      ? Math.max(0, Math.min(maxScroll, relTop + target.offsetHeight - ch + 12))
      : Math.max(0, Math.min(maxScroll, relTop - ch / 2));
  container.scrollTo({ top, behavior: "smooth" });
  flashPreviewSection(target);
};

/** Quando passa a haver texto numa política, o bloco `footerPoliciesBody` monta — precisamos voltar a alinhar o scroll. */
const policiesBodyPresenceKey = (merge: Partial<StoreSettingsData> | null) => {
  const pp = merge?.publicProfile;
  const d = pp?.deliveryPolicy?.trim() ? "1" : "0";
  const r = pp?.returnsPolicy?.trim() ? "1" : "0";
  const p = pp?.privacyPolicy?.trim() ? "1" : "0";
  return `${d}${r}${p}`;
};

export const AdminStorefrontPreviewPanel = ({
  merge,
  activeSection,
  previewScrollTick,
  onPreviewNavigate,
}: AdminStorefrontPreviewPanelProps) => {
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const policiesKey = policiesBodyPresenceKey(merge);

  const lifestyleActive =
    activeSection === "lifestyleHead" ||
    activeSection === "lifestyleLeft" ||
    activeSection === "lifestyleRight";

  const scrollTargetSection: StorefrontPreviewSectionId | null = lifestyleActive ? "lifestyle" : activeSection;

  useLayoutEffect(() => {
    return () => {
      if (adminPreviewFlashTimer != null) {
        clearTimeout(adminPreviewFlashTimer);
        adminPreviewFlashTimer = null;
      }
      if (adminPreviewLastFlashed) {
        adminPreviewLastFlashed.classList.remove(FLASH_CLASS);
        adminPreviewLastFlashed = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!activeSection || !scrollTargetSection) return;
    const container = previewScrollRef.current;
    if (!container) return;

    const policyFallback = (): HTMLElement | null => {
      const body = findPreviewSectionEl(container, "footerPoliciesBody");
      if (body) return body;
      const links = findPreviewSectionEl(container, "footerPolicies");
      if (links) return links;
      return findPreviewSectionEl(container, "footerContact");
    };

    const resolveSectionEl = (): HTMLElement | null => {
      if (activeSection === "lifestyleLeft") {
        return (
          findInPreviewById(container, PREVIEW_LIFESTYLE_LEFT_CAPTION_ID) ??
          findPreviewSectionEl(container, "lifestyle")
        );
      }
      if (activeSection === "lifestyleRight") {
        return (
          findInPreviewById(container, PREVIEW_LIFESTYLE_RIGHT_CAPTION_ID) ??
          findPreviewSectionEl(container, "lifestyle")
        );
      }
      const s = scrollTargetSection;
      if (s === "footerPolicyDelivery") {
        return findInPreviewById(container, PREVIEW_POLITICA_ENTREGA_ID) ?? policyFallback();
      }
      if (s === "footerPolicyReturns") {
        return findInPreviewById(container, PREVIEW_POLITICA_TROCAS_ID) ?? policyFallback();
      }
      if (s === "footerPolicyPrivacy") {
        return findInPreviewById(container, PREVIEW_POLITICA_PRIVACIDADE_ID) ?? policyFallback();
      }
      if (s === "footerPolicies") {
        return policyFallback();
      }
      return findPreviewSectionEl(container, s);
    };

    const targetEl = resolveSectionEl();
    if (!targetEl) return;
    /** Hero: mostrar a zona do CTA (fundo do bloco), não só o topo — evita “saltar para cima” ao escolher cores. */
    const heroAnchor =
      scrollTargetSection === "hero" || activeSection === "hero" ? ({ anchor: "end" } as const) : undefined;
    scrollPreviewSectionPure(container, targetEl, heroAnchor);
  }, [activeSection, scrollTargetSection, previewScrollTick, policiesKey]);

  const brand = normalizeStorePrimaryColor(merge?.primaryColor ?? undefined);
  const accent = normalizeStoreAccentColor(merge?.publicProfile?.accentColor ?? undefined);
  const rgb = hexToRgbTriplet(brand);
  const brandCss = useMemo(() => {
    const hover = mixHexColor(brand, "#000000", 0.12);
    const soft = mixHexColor(brand, "#ffffff", 0.82);
    return {
      ["--brand-primary" as string]: brand,
      ["--brand-primary-rgb" as string]: rgb ?? "27, 67, 50",
      ["--brand-primary-hover" as string]: hover,
      ["--brand-primary-soft" as string]: soft,
      ["--brand-accent" as string]: accent,
    };
  }, [brand, accent, rgb]);

  const noop = () => {};

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#1B4332]/15 bg-[#FAF8F3]/90 shadow-sm">
      <div
        ref={previewScrollRef}
        className="relative flex-1 min-h-0 max-lg:min-h-[min(280px,40dvh)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden bg-yellow-100/50 opacity-0"
        />
        <StoreSettingsPreviewMergeProvider merge={merge}>
          <div
            className="relative min-w-0 select-none overflow-x-hidden bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3]"
            style={brandCss}
          >
            <PreviewSectionShell
              section="navbar"
              active={activeSection === "navbar"}
              onNavigate={onPreviewNavigate}
            >
              <Navbar
                previewScrollContainerRef={previewScrollRef}
                onOpenCart={noop}
                onOpenLogin={noop}
                onOpenGuestOrderLookup={noop}
                scrollToProducts={noop}
                scrollToTop={() => previewScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              />
            </PreviewSectionShell>

            <PreviewSectionShell section="hero" active={activeSection === "hero"} onNavigate={onPreviewNavigate}>
              <Hero onShopClick={noop} previewLayout />
            </PreviewSectionShell>

            <PreviewSectionShell
              section="products"
              active={activeSection === "products"}
              onNavigate={onPreviewNavigate}
            >
              <AdminStorefrontProductsHeadPreview />
            </PreviewSectionShell>

            <PreviewSectionShell section="story" active={activeSection === "story"} onNavigate={onPreviewNavigate}>
              <Story />
            </PreviewSectionShell>

            <PreviewSectionShell
              section="lifestyle"
              active={lifestyleActive}
              onNavigate={onPreviewNavigate}
            >
              <Lifestyle assignAdminPreviewDomIds />
            </PreviewSectionShell>

            <PreviewSectionShell
              section="benefits"
              active={activeSection === "benefits"}
              onNavigate={onPreviewNavigate}
            >
              <Benefits />
            </PreviewSectionShell>

            <PreviewSectionShell
              section="newsletter"
              active={activeSection === "newsletter"}
              onNavigate={onPreviewNavigate}
            >
              <Newsletter />
            </PreviewSectionShell>

            <Footer
              onConsultOrder={noop}
              assignAdminPreviewDomIds
              onAdminPreviewNavigate={onPreviewNavigate}
              previewHighlightClassName={(id) =>
                highlightCls(
                  activeSection === id ||
                    (id === "footerPolicies" &&
                      activeSection != null &&
                      (activeSection === "footerPolicyDelivery" ||
                        activeSection === "footerPolicyReturns" ||
                        activeSection === "footerPolicyPrivacy" ||
                        activeSection === "footerPolicies"))
                )
              }
            />
          </div>
        </StoreSettingsPreviewMergeProvider>
      </div>
    </div>
  );
};
