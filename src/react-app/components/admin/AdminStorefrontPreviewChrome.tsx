import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import { storefrontPreviewSectionLabels } from "@/react-app/components/admin/storefrontPreviewLink";

type AdminStorefrontPreviewChromeProps = {
  activeSection: StorefrontPreviewSectionId | null;
};

export const AdminStorefrontPreviewChrome = ({ activeSection }: AdminStorefrontPreviewChromeProps) => (
  <div className="shrink-0 font-body lg:pt-5">
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-content-muted sm:text-xs">
      Pré-visualização da nova vitrine
    </h3>
    <p className="mt-0.5 text-[11px] leading-snug text-content-muted sm:text-xs">
      Hero 3D, catálogo e seções em redesign — sincronizado com o formulário.
    </p>
    {activeSection ? (
      <div
        className="mt-1.5 rounded-lg border border-brand-primary/30 bg-surface-elevated px-2 py-1.5 text-[11px] text-content sm:mt-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs"
        role="status"
        aria-live="polite"
      >
        <span className="font-semibold text-brand-primary">A mostrar:</span>{" "}
        {storefrontPreviewSectionLabels[activeSection]}
      </div>
    ) : null}
  </div>
);
