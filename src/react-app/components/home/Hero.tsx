import { ChevronRight, Sparkles } from "lucide-react";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { STOREFRONT_EDGE_PADDING_CLASS } from "@/react-app/utils/storefrontLayout";
import { hexToRgbTriplet, normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";
import {
  DEFAULT_HERO_BADGE,
  DEFAULT_HERO_CTA,
  DEFAULT_HERO_IMAGE,
  DEFAULT_HERO_SUBTITLE,
  DEFAULT_HERO_TITLE,
} from "@/react-app/constants/storefrontHomeCopy";

export const Hero = ({
  onShopClick,
  previewLayout = false,
}: {
  onShopClick: () => void;
  /** Coluna estreita da pré-visualização admin — altura do primeiro ecrã mais compacta. */
  previewLayout?: boolean;
}) => {
  const { settings } = useStoreSettings();
  const p = settings?.publicProfile;
  const heroBadge = p?.heroBadge?.trim() || DEFAULT_HERO_BADGE;
  const heroTitle = p?.heroTitle?.trim() || DEFAULT_HERO_TITLE;
  const heroSubtitle = p?.heroSubtitle?.trim() || DEFAULT_HERO_SUBTITLE;
  const heroCta = p?.heroCtaLabel?.trim() || DEFAULT_HERO_CTA;
  const bannerSrc = settings?.bannerUrl?.trim() || DEFAULT_HERO_IMAGE;
  const primary = normalizeStorePrimaryColor(settings?.primaryColor ?? undefined);
  const rgb = hexToRgbTriplet(primary);
  const overlayStyle =
    rgb != null
      ? {
          background: `linear-gradient(to bottom, rgba(${rgb},0.62) 0%, rgba(${rgb},0.38) 45%, rgba(${rgb},0.72) 100%)`,
        }
      : undefined;

  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden ${
        previewLayout ? "min-h-[min(68dvh,460px)] sm:min-h-[min(72dvh,500px)]" : "min-h-[100dvh]"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={bannerSrc}
          alt=""
          className="w-full h-full max-w-none object-cover sm:scale-105 scale-100 animate-[zoom_20s_ease-in-out_infinite_alternate]"
        />
        <div
          className={
            overlayStyle
              ? "absolute inset-0"
              : "absolute inset-0 bg-gradient-to-b from-[#1B4332]/60 via-[#1B4332]/40 to-[#1B4332]/70"
          }
          style={overlayStyle}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD166]/10 via-transparent to-[#1B4332]/20" />
      </div>
      <div className={`relative z-10 mx-auto w-full max-w-3xl text-center ${STOREFRONT_EDGE_PADDING_CLASS}`}>
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl animate-[float_6s_ease-in-out_infinite]">
          <div className="inline-flex items-center space-x-2 bg-[#FFD166]/20 backdrop-blur-sm px-3 py-2 rounded-full mb-4 border border-[#FFD166]/30">
            <Sparkles className="h-4 w-4 text-[#FFD166] shrink-0" />
            <span className="text-sm text-white font-inter font-medium">{heroBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 font-playfair leading-tight drop-shadow-2xl">
            {heroTitle}
          </h2>
          <p className="text-base md:text-lg text-white mb-5 font-inter font-normal drop-shadow-lg leading-relaxed">
            {heroSubtitle}
          </p>
          <button
            type="button"
            onClick={onShopClick}
            style={{ color: "var(--brand-primary, #1B4332)" }}
            className="min-h-[48px] min-w-[min(100%,200px)] justify-center bg-gradient-to-r from-[#FFD166] to-[#FFE084] px-8 py-3.5 rounded-full text-base font-bold hover:shadow-2xl hover:shadow-[#FFD166]/50 transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105 transform font-inter inline-flex items-center space-x-2 group relative overflow-hidden w-full sm:w-auto"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10">{heroCta}</span>
            <ChevronRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>

      <div className="absolute top-20 left-10 w-20 h-20 bg-[#FFD166]/20 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div
        className="absolute bottom-20 right-10 w-32 h-32 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_reverse] opacity-90"
        style={{ backgroundColor: `rgba(${rgb ?? "27, 67, 50"}, 0.2)` }}
      />
    </section>
  );
};
