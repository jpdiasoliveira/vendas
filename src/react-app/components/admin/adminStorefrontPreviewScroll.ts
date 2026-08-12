import {
  adminStorefrontPreviewSectionId,
  PREVIEW_POLITICA_ENTREGA_ID,
  PREVIEW_POLITICA_PRIVACIDADE_ID,
  PREVIEW_POLITICA_TROCAS_ID,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";

export const FLASH_CLASS = "bg-brand-primary/10";

let adminPreviewFlashTimer: ReturnType<typeof setTimeout> | null = null;
let adminPreviewLastFlashed: HTMLElement | null = null;

export const cleanupAdminPreviewFlash = () => {
  if (adminPreviewFlashTimer != null) {
    clearTimeout(adminPreviewFlashTimer);
    adminPreviewFlashTimer = null;
  }
  if (adminPreviewLastFlashed) {
    adminPreviewLastFlashed.classList.remove(FLASH_CLASS);
    adminPreviewLastFlashed = null;
  }
};

const findInPreviewById = (container: HTMLElement, domId: string): HTMLElement | null => {
  const el = document.getElementById(domId);
  return el != null && container.contains(el) ? el : null;
};

const findPreviewSectionEl = (container: HTMLElement, suffix: string): HTMLElement | null =>
  findInPreviewById(container, adminStorefrontPreviewSectionId(suffix));

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

const flashPreviewSection = (el: HTMLElement) => {
  if (adminPreviewFlashTimer != null) clearTimeout(adminPreviewFlashTimer);
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

export const scrollPreviewSectionPure = (
  container: HTMLDivElement,
  target: HTMLElement,
  opts?: { anchor: "center" | "end" },
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

export const resolvePreviewSectionEl = (
  container: HTMLElement,
  scrollTargetSection: StorefrontPreviewSectionId,
): HTMLElement | null => {
  const policyFallback = (): HTMLElement | null => {
    const links = findPreviewSectionEl(container, "footerPolicies");
    return links ?? findPreviewSectionEl(container, "footerContact");
  };
  if (scrollTargetSection === "footerPolicyDelivery") {
    return findInPreviewById(container, PREVIEW_POLITICA_ENTREGA_ID) ?? policyFallback();
  }
  if (scrollTargetSection === "footerPolicyReturns") {
    return findInPreviewById(container, PREVIEW_POLITICA_TROCAS_ID) ?? policyFallback();
  }
  if (scrollTargetSection === "footerPolicyPrivacy") {
    return findInPreviewById(container, PREVIEW_POLITICA_PRIVACIDADE_ID) ?? policyFallback();
  }
  if (scrollTargetSection === "footerPolicies") return policyFallback();
  return findPreviewSectionEl(container, scrollTargetSection);
};
