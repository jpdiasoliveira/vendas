import { Link } from "react-router";
import { Leaf, Instagram, Facebook, Mail, LayoutDashboard, Phone, MessageCircle } from "lucide-react";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";

function whatsappHref(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const digits = t.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}`;
}

export const Footer = () => {
  const { settings } = useStoreSettings();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const p = settings?.publicProfile;
  const displayName = settings?.displayName?.trim() || "Natfoods";
  const subtitle = "Chips da Amazônia";
  const logoSrc = settings?.logoUrl?.trim() || null;
  const wa = whatsappHref(p?.contactWhatsapp);
  const ig = p?.instagramUrl?.trim();
  const fb = p?.facebookUrl?.trim();
  const mail = p?.contactEmail?.trim();
  const phone = p?.contactPhone?.trim();

  return (
    <footer id="contato" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#2D5F4A] to-[#1B4332]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFD166]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4 group">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt=""
                    className="h-14 w-14 rounded-xl object-contain bg-white/10 border border-white/20"
                  />
                ) : (
                  <div className="relative">
                    <Leaf className="h-12 w-12 text-[#FFD166] group-hover:rotate-12 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-[#FFD166]/30 blur-xl rounded-full" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold font-playfair">{displayName}</h1>
                  <p className="text-sm text-white/70">{subtitle}</p>
                </div>
              </div>
              <p className="text-white/80 mb-4 max-w-md font-inter text-sm leading-relaxed whitespace-pre-line">
                {p?.shippingInfo?.trim() ||
                  "Banana chips orgânicos premium, direto das plantações da Amazônia para sua mesa. Sabor autêntico e sustentável."}
              </p>
              {(p?.businessHours?.trim() || phone) && (
                <p className="text-white/70 text-sm font-inter mb-4 space-y-1">
                  {p?.businessHours?.trim() ? (
                    <span className="block whitespace-pre-line">{p.businessHours}</span>
                  ) : null}
                  {phone ? (
                    <a href={`tel:${phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-[#FFD166]">
                      <Phone className="h-4 w-4 shrink-0" />
                      {phone}
                    </a>
                  ) : null}
                </p>
              )}
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
                {ig ? (
                  <a
                    href={ig}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5 group-hover:text-[#FFD166] transition-colors" />
                  </a>
                ) : null}
                {fb ? (
                  <a
                    href={fb}
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
              <h5 className="font-bold text-lg mb-4 font-playfair">Informações</h5>
              <ul className="space-y-2 font-inter">
                {p?.deliveryPolicy?.trim() ? (
                  <li>
                    <a href="#politica-entrega" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                      Entrega
                    </a>
                  </li>
                ) : null}
                {p?.returnsPolicy?.trim() ? (
                  <li>
                    <a href="#politica-trocas" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                      Trocas e devoluções
                    </a>
                  </li>
                ) : null}
                {p?.privacyPolicy?.trim() ? (
                  <li>
                    <a href="#politica-privacidade" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                      Privacidade
                    </a>
                  </li>
                ) : null}
                {!p?.deliveryPolicy?.trim() && !p?.returnsPolicy?.trim() && !p?.privacyPolicy?.trim() ? (
                  <li className="text-white/60 text-sm">Configure textos em Admin → Configurações.</li>
                ) : null}
              </ul>
            </div>
          </div>

          {(p?.deliveryPolicy?.trim() || p?.returnsPolicy?.trim() || p?.privacyPolicy?.trim()) && (
            <div className="border-t border-white/20 pt-10 space-y-10 text-left font-inter text-sm text-white/85 mb-10">
              {p?.deliveryPolicy?.trim() ? (
                <section id="politica-entrega">
                  <h3 className="font-playfair font-bold text-lg text-white mb-2">Política de entrega</h3>
                  <p className="whitespace-pre-line leading-relaxed">{p.deliveryPolicy}</p>
                </section>
              ) : null}
              {p?.returnsPolicy?.trim() ? (
                <section id="politica-trocas">
                  <h3 className="font-playfair font-bold text-lg text-white mb-2">Trocas e devoluções</h3>
                  <p className="whitespace-pre-line leading-relaxed">{p.returnsPolicy}</p>
                </section>
              ) : null}
              {p?.privacyPolicy?.trim() ? (
                <section id="politica-privacidade">
                  <h3 className="font-playfair font-bold text-lg text-white mb-2">Privacidade</h3>
                  <p className="whitespace-pre-line leading-relaxed">{p.privacyPolicy}</p>
                </section>
              ) : null}
            </div>
          )}

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
