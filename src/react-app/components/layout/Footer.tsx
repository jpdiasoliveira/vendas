import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Leaf, Instagram, Facebook, Mail, LayoutDashboard, MessageCircle, Search, X } from "lucide-react";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";
import { isStoreLogoKnockoutWhite, storeLogoHeightPx } from "@/react-app/utils/storeLogoDisplay";
import type { StorePublicProfile } from "@/react-app/types";
import {
  adminStorefrontPreviewSectionId,
  PREVIEW_POLITICA_ENTREGA_ID,
  PREVIEW_POLITICA_PRIVACIDADE_ID,
  PREVIEW_POLITICA_TROCAS_ID,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";
import { DEFAULT_FOOTER_SHIPPING_BLURB } from "@/react-app/constants/storefrontHomeCopy";

function whatsappHref(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const digits = t.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}`;
}

/** href seguro para Instagram/Facebook quando faltar https:// */
function externalHttpUrl(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

type FooterProps = {
  onConsultOrder?: () => void;
  /** Pré-visualização admin: destaca blocos do rodapé ligados ao formulário. */
  previewHighlightClassName?: (section: StorefrontPreviewSectionId) => string;
  /** Pré-visualização admin: expõe IDs estáveis para scroll sync com o formulário. */
  assignAdminPreviewDomIds?: boolean;
};

type PolicyKey = "delivery" | "returns" | "privacy";

type ContactBlockProps = {
  p?: StorePublicProfile;
  wa: string | null;
  ig: string | undefined;
  fb: string | undefined;
  igHref: string | null;
  fbHref: string | null;
  mail: string | undefined;
  phone: string | undefined;
};

const ContactDetailsBlock = ({ p, wa, ig, fb, igHref, fbHref, mail, phone }: ContactBlockProps) => (
  <div className="space-y-1.5 font-inter text-sm leading-relaxed text-white/85">
    {p?.contactWhatsapp?.trim() ? (
      <p>
        <span className="text-white/55">WhatsApp: </span>
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFD166] hover:underline break-all"
          >
            {p.contactWhatsapp.trim()}
          </a>
        ) : (
          <span className="break-all">{p.contactWhatsapp.trim()}</span>
        )}
      </p>
    ) : null}
    {mail ? (
      <p>
        <span className="text-white/55">E-mail: </span>
        <a href={`mailto:${mail}`} className="text-[#FFD166] hover:underline break-all">
          {mail}
        </a>
      </p>
    ) : null}
    {phone ? (
      <p>
        <span className="text-white/55">Telefone: </span>
        <a href={`tel:${phone.replace(/\D/g, "")}`} className="text-[#FFD166] hover:underline">
          {phone}
        </a>
      </p>
    ) : null}
    {igHref ? (
      <p>
        <span className="text-white/55">Instagram: </span>
        <a
          href={igHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#FFD166] hover:underline break-all"
        >
          {ig?.replace(/^https?:\/\//i, "")}
        </a>
      </p>
    ) : null}
    {fbHref ? (
      <p>
        <span className="text-white/55">Facebook: </span>
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#FFD166] hover:underline break-all"
        >
          {fb?.replace(/^https?:\/\//i, "")}
        </a>
      </p>
    ) : null}
  </div>
);

export const Footer = ({
  onConsultOrder,
  previewHighlightClassName,
  assignAdminPreviewDomIds = false,
}: FooterProps) => {
  const previewId = (suffix: string) =>
    assignAdminPreviewDomIds ? adminStorefrontPreviewSectionId(suffix) : undefined;
  const { settings } = useStoreSettings();
  const [activePolicy, setActivePolicy] = useState<PolicyKey | null>(null);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const p = settings?.publicProfile;
  const displayName = settings?.displayName?.trim() || "Sua Loja";
  const tagline = p?.tagline?.trim();
  const logoSrc = settings?.logoUrl?.trim() || null;
  const logoH = storeLogoHeightPx(settings);
  const logoKnockout = isStoreLogoKnockoutWhite(settings);
  const wa = whatsappHref(p?.contactWhatsapp);
  const ig = p?.instagramUrl?.trim();
  const fb = p?.facebookUrl?.trim();
  const igHref = ig ? externalHttpUrl(ig) : null;
  const fbHref = fb ? externalHttpUrl(fb) : null;
  const mail = p?.contactEmail?.trim();
  const phone = p?.contactPhone?.trim();
  const policyShown = (text: string | null | undefined, hidden?: boolean) =>
    !!(text?.trim()) && hidden !== true;
  const deliveryVis = policyShown(p?.deliveryPolicy, p?.deliveryPolicyHidden);
  const returnsVis = policyShown(p?.returnsPolicy, p?.returnsPolicyHidden);
  const privacyVis = policyShown(p?.privacyPolicy, p?.privacyPolicyHidden);
  const hasLegal = deliveryVis || returnsVis || privacyVis;
  /** Texto guardado em alguma política (mesmo com “ocultar na loja”). Evita mensagem “preencha em Admin” quando o operador só ocultou tudo. */
  const hasAnyPolicyDraft = !!(
    p?.deliveryPolicy?.trim() ||
    p?.returnsPolicy?.trim() ||
    p?.privacyPolicy?.trim()
  );
  const showPoliciesSetupHint = !hasLegal && !hasAnyPolicyDraft;
  const hoursShown = !!(p?.businessHours?.trim()) && p?.businessHoursHidden !== true;
  const shippingBlurbShown = p?.shippingInfoHidden !== true;
  const hasContactChannel = !!(wa || mail || phone || igHref || fbHref);
  const policyByKey = useMemo(
    () => ({
      delivery: {
        title: "Política de entrega",
        content: p?.deliveryPolicy?.trim() ?? "",
      },
      returns: {
        title: "Trocas e devoluções",
        content: p?.returnsPolicy?.trim() ?? "",
      },
      privacy: {
        title: "Privacidade",
        content: p?.privacyPolicy?.trim() ?? "",
      },
    }),
    [
      p?.deliveryPolicy,
      p?.returnsPolicy,
      p?.privacyPolicy,
      p?.deliveryPolicyHidden,
      p?.returnsPolicyHidden,
      p?.privacyPolicyHidden,
    ]
  );
  const activePolicyData = activePolicy ? policyByKey[activePolicy] : null;

  return (
    <footer id="contato" className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-primary, #1B4332) 0%, var(--brand-primary-hover, #123325) 50%, var(--brand-primary, #1B4332) 100%)",
        }}
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFD166]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 py-20 text-white">
        <div className={storefrontShellClass}>
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4 group">
                {logoSrc ? (
                  <span
                    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                      logoKnockout
                        ? "bg-[color:var(--brand-primary)] p-0.5 ring-1 ring-white/20"
                        : ""
                    }`}
                  >
                    <img
                      src={logoSrc}
                      alt=""
                      style={{ height: `${Math.min(96, logoH + 16)}px`, width: "auto" }}
                      className={`max-h-[5.5rem] w-auto object-contain ${
                        logoKnockout ? "mix-blend-multiply" : "rounded-xl border border-white/25"
                      }`}
                    />
                  </span>
                ) : (
                  <div className="relative">
                    <Leaf className="h-12 w-12 text-[#FFD166] group-hover:rotate-12 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-[#FFD166]/30 blur-xl rounded-full" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold font-playfair">{displayName}</h1>
                  {tagline ? <p className="text-sm text-white/70">{tagline}</p> : null}
                </div>
              </div>
              <div
                id={previewId("footerIntro")}
                data-preview-section="footerIntro"
                className={previewHighlightClassName?.("footerIntro") ?? ""}
              >
                {shippingBlurbShown ? (
                  <p className="mb-4 max-w-md whitespace-pre-line font-inter text-sm leading-relaxed text-white/80">
                    {p?.shippingInfo?.trim() || DEFAULT_FOOTER_SHIPPING_BLURB}
                  </p>
                ) : null}
                {hoursShown ? (
                  <p className="text-white/70 text-sm font-inter mb-4 whitespace-pre-line">{p?.businessHours}</p>
                ) : null}
              </div>
              <p className="sr-only">Atalhos para WhatsApp, redes e e-mail</p>
              <div className="flex flex-wrap gap-3">
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5 text-[#FFD166]" />
                  </a>
                ) : null}
                {igHref ? (
                  <a
                    href={igHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5 group-hover:text-[#FFD166] transition-colors" />
                  </a>
                ) : null}
                {fbHref ? (
                  <a
                    href={fbHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5 group-hover:text-[#FFD166] transition-colors" />
                  </a>
                ) : null}
                {mail ? (
                  <a
                    href={`mailto:${mail}`}
                    className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="E-mail"
                  >
                    <Mail className="h-5 w-5 group-hover:text-[#FFD166] transition-colors" />
                  </a>
                ) : null}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-lg mb-4 font-playfair">Links Rápidos</h5>
              <ul className="space-y-2 font-inter">
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToTop();
                    }}
                    className="text-white/80 hover:text-[#FFD166] transition-colors duration-300"
                  >
                    Início
                  </a>
                </li>
                <li>
                  <a href="#produtos" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Produtos
                  </a>
                </li>
                <li>
                  <a href="#historia" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Nossa História
                  </a>
                </li>
                <li>
                  <Link
                    to="/pedido/acompanhar"
                    className="inline-flex items-center gap-1.5 text-white/80 transition-colors duration-300 hover:text-[#FFD166]"
                  >
                    <Search className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    Acompanhar pedido
                  </Link>
                </li>
                {onConsultOrder ? (
                  <li>
                    <button
                      type="button"
                      onClick={onConsultOrder}
                      className="inline-flex items-center gap-1.5 text-left text-white/80 transition-colors duration-300 hover:text-[#FFD166]"
                    >
                      Consultar pedido (rápido)
                    </button>
                  </li>
                ) : null}
                <li>
                  <Link
                    to="/admin/pedidos"
                    className="inline-flex items-center gap-1.5 text-white/80 hover:text-[#FFD166] transition-colors duration-300"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div
                id={previewId("footerContact")}
                data-preview-section="footerContact"
                className={previewHighlightClassName?.("footerContact") ?? ""}
              >
                <h5 className="font-bold text-lg mb-4 font-playfair">Informações</h5>
                {hasContactChannel ? (
                  <div className="mb-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#FFD166]/90 font-inter">
                      Contato e redes
                    </p>
                    <ContactDetailsBlock
                      p={p}
                      wa={wa}
                      ig={ig}
                      fb={fb}
                      igHref={igHref}
                      fbHref={fbHref}
                      mail={mail}
                      phone={phone}
                    />
                  </div>
                ) : null}
              </div>
              <div
                id={previewId("footerPolicies")}
                data-preview-section="footerPolicies"
                className={previewHighlightClassName?.("footerPolicies") ?? ""}
              >
              {hasLegal ? (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70 font-inter">
                  Políticas
                </p>
              ) : null}
              <ul className="space-y-2 font-inter">
                {deliveryVis ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicy("delivery")}
                      className="text-white/80 hover:text-[#FFD166] transition-colors duration-300"
                    >
                      Entrega
                    </button>
                  </li>
                ) : null}
                {returnsVis ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicy("returns")}
                      className="text-white/80 hover:text-[#FFD166] transition-colors duration-300"
                    >
                      Trocas e devoluções
                    </button>
                  </li>
                ) : null}
                {privacyVis ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicy("privacy")}
                      className="text-white/80 hover:text-[#FFD166] transition-colors duration-300"
                    >
                      Privacidade
                    </button>
                  </li>
                ) : null}
                {showPoliciesSetupHint ? (
                  <li className="text-white/60 text-sm">
                    {hasContactChannel
                      ? "Políticas (entrega, trocas, privacidade): preencha em Admin → Marca e vitrine → Vitrine."
                      : "Configure textos e contato em Admin → Marca e vitrine → Vitrine."}
                  </li>
                ) : null}
              </ul>
              </div>
            </div>
          </div>

          {(hasLegal || assignAdminPreviewDomIds) && (
            <div
              id={previewId("footerPoliciesBody")}
              data-preview-section="footerPoliciesBody"
              className="border-t border-white/20 pt-10 space-y-10 text-left font-inter text-sm text-white/85 mb-10"
            >
              {(deliveryVis || assignAdminPreviewDomIds) && (
                <section
                  id={assignAdminPreviewDomIds ? PREVIEW_POLITICA_ENTREGA_ID : "politica-entrega"}
                  className={
                    assignAdminPreviewDomIds
                      ? (previewHighlightClassName?.("footerPolicyDelivery") ?? "")
                      : ""
                  }
                >
                  <h3 className="font-playfair font-bold text-lg text-white mb-2">Política de entrega</h3>
                  {deliveryVis ? (
                    <p className="whitespace-pre-line leading-relaxed">{p?.deliveryPolicy}</p>
                  ) : assignAdminPreviewDomIds ? (
                    <p className="text-white/45 text-sm leading-relaxed">
                      {p?.deliveryPolicy?.trim() && p?.deliveryPolicyHidden === true
                        ? "Oculto na loja publicada — o texto permanece guardado nas configurações."
                        : "(Vazio) — o texto aparece aqui ao preencher o campo no formulário."}
                    </p>
                  ) : null}
                </section>
              )}
              {(returnsVis || assignAdminPreviewDomIds) && (
                <section
                  id={assignAdminPreviewDomIds ? PREVIEW_POLITICA_TROCAS_ID : "politica-trocas"}
                  className={
                    assignAdminPreviewDomIds
                      ? (previewHighlightClassName?.("footerPolicyReturns") ?? "")
                      : ""
                  }
                >
                  <h3 className="font-playfair font-bold text-lg text-white mb-2">Trocas e devoluções</h3>
                  {returnsVis ? (
                    <p className="whitespace-pre-line leading-relaxed">{p?.returnsPolicy}</p>
                  ) : assignAdminPreviewDomIds ? (
                    <p className="text-white/45 text-sm leading-relaxed">
                      {p?.returnsPolicy?.trim() && p?.returnsPolicyHidden === true
                        ? "Oculto na loja publicada — o texto permanece guardado nas configurações."
                        : "(Vazio) — o texto aparece aqui ao preencher o campo no formulário."}
                    </p>
                  ) : null}
                </section>
              )}
              {(privacyVis || assignAdminPreviewDomIds) && (
                <section
                  id={assignAdminPreviewDomIds ? PREVIEW_POLITICA_PRIVACIDADE_ID : "politica-privacidade"}
                  className={
                    assignAdminPreviewDomIds
                      ? (previewHighlightClassName?.("footerPolicyPrivacy") ?? "")
                      : ""
                  }
                >
                  <h3 className="font-playfair font-bold text-lg text-white mb-2">Privacidade</h3>
                  {privacyVis ? (
                    <p className="whitespace-pre-line leading-relaxed">{p?.privacyPolicy}</p>
                  ) : assignAdminPreviewDomIds ? (
                    <p className="text-white/45 text-sm leading-relaxed">
                      {p?.privacyPolicy?.trim() && p?.privacyPolicyHidden === true
                        ? "Oculto na loja publicada — o texto permanece guardado nas configurações."
                        : "(Vazio) — o texto aparece aqui ao preencher o campo no formulário."}
                    </p>
                  ) : null}
                </section>
              )}
            </div>
          )}

          {activePolicyData?.content ? (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Fechar política"
                onClick={() => setActivePolicy(null)}
                className="absolute inset-0 bg-[#1B4332]/70 backdrop-blur-sm"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="footer-policy-title"
                className="relative z-[1] max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/20 bg-[#0f2e24] p-6 shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setActivePolicy(null)}
                  className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 id="footer-policy-title" className="mb-3 pr-10 font-playfair text-2xl font-bold text-white">
                  {activePolicyData.title}
                </h3>
                <p className="whitespace-pre-line font-inter text-sm leading-relaxed text-white/90">
                  {activePolicyData.content}
                </p>
              </div>
            </div>
          ) : null}

          <div className="border-t border-white/20 pt-8 text-center text-white/60 font-inter text-sm">
            <p>
              &copy; {new Date().getFullYear()} {displayName}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
