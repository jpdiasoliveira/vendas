import { Container } from "@/react-app/design-system/components/Container";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { DEFAULT_FOOTER_SHIPPING_BLURB } from "@/react-app/constants/storefrontHomeCopy";
import {
  adminStorefrontPreviewSectionId,
  PREVIEW_POLITICA_ENTREGA_ID,
  PREVIEW_POLITICA_PRIVACIDADE_ID,
  PREVIEW_POLITICA_TROCAS_ID,
} from "@/react-app/components/admin/storefrontPreviewLink";

type StorefrontFooterProps = {
  onConsultOrder: () => void;
  previewMode?: boolean;
};

export function StorefrontFooter({ onConsultOrder, previewMode = false }: StorefrontFooterProps) {
  const { settings } = useStoreSettings();
  const profile = settings?.publicProfile;
  const shippingBlurb = profile?.shippingInfo?.trim() || DEFAULT_FOOTER_SHIPPING_BLURB;

  return (
    <footer className="border-t border-brand-primary/10 bg-surface-muted/50 py-14">
      <Container>
        <div
          id={adminStorefrontPreviewSectionId("footerIntro")}
          className="mb-8 max-w-2xl"
        >
          <p className="font-body text-sm leading-relaxed text-content-muted">{shippingBlurb}</p>
          {profile?.businessHours?.trim() && profile.businessHoursHidden !== true ? (
            <p className="mt-2 font-body text-sm text-content-muted">{profile.businessHours.trim()}</p>
          ) : null}
        </div>

        <div
          id={adminStorefrontPreviewSectionId("footerContact")}
          className="mb-8 flex flex-wrap gap-4 font-body text-sm text-content-muted"
        >
          {profile?.contactWhatsapp?.trim() ? <span>WhatsApp: {profile.contactWhatsapp.trim()}</span> : null}
          {profile?.contactEmail?.trim() ? <span>E-mail: {profile.contactEmail.trim()}</span> : null}
        </div>

        <div id={adminStorefrontPreviewSectionId("footerPolicies")} className="space-y-4">
          {profile?.deliveryPolicy?.trim() ? (
            <div id={PREVIEW_POLITICA_ENTREGA_ID}>
              <h4 className="font-body text-xs font-semibold uppercase tracking-wide text-content">Entrega</h4>
              <p className="mt-1 font-body text-sm text-content-muted">{profile.deliveryPolicy.trim()}</p>
            </div>
          ) : null}
          {profile?.returnsPolicy?.trim() ? (
            <div id={PREVIEW_POLITICA_TROCAS_ID}>
              <h4 className="font-body text-xs font-semibold uppercase tracking-wide text-content">Trocas</h4>
              <p className="mt-1 font-body text-sm text-content-muted">{profile.returnsPolicy.trim()}</p>
            </div>
          ) : null}
          {profile?.privacyPolicy?.trim() ? (
            <div id={PREVIEW_POLITICA_PRIVACIDADE_ID}>
              <h4 className="font-body text-xs font-semibold uppercase tracking-wide text-content">Privacidade</h4>
              <p className="mt-1 font-body text-sm text-content-muted">{profile.privacyPolicy.trim()}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-brand-primary/10 pt-6">
          <p className="font-body text-xs text-content-muted">
            © {new Date().getFullYear()} {settings?.displayName?.trim() || "Loja"}
          </p>
          {!previewMode ? (
            <button
              type="button"
              onClick={onConsultOrder}
              className="font-body text-xs text-brand-primary underline-offset-4 hover:underline"
            >
              Consultar pedido
            </button>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
