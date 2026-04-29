import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";

export const Lifestyle = () => {
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua Loja";
  const H = resolveStorefrontHome(displayName, settings?.publicProfile);

  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F3] via-white to-[#FAF8F3]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FFD166]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className={`relative z-10 ${storefrontShellClass}`}>
        <div className="text-center mb-16">
          <div className="inline-block bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full mb-4 border border-[#1B4332]/10">
            <span className="text-sm font-medium text-[#1B4332] font-inter">{H.lifestyleEyebrow}</span>
          </div>
          <h3 className="text-4xl md:text-6xl font-bold text-[#1B4332] mb-4 font-playfair">{H.lifestyleTitle}</h3>
          <p className="text-lg text-[#6D4C41] font-inter">{H.lifestyleSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332]/20 to-[#FFD166]/20 blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100 z-0"></div>
            <div className="relative aspect-[4/3] w-full">
              <img
                src={H.lifestyleLeftImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center origin-center transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#1B4332]/88 via-[#1B4332]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md rounded-2xl border border-white/25 bg-black/40 px-4 py-4 backdrop-blur-md sm:px-5 sm:py-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h4 className="text-xl font-bold text-white font-playfair sm:text-2xl">{H.lifestyleLeftTitle}</h4>
                  <p className="mt-1 text-sm text-white/90 font-inter sm:text-base">{H.lifestyleLeftText}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD166]/20 to-[#1B4332]/20 blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100 z-0"></div>
            <div className="relative aspect-[4/3] w-full">
              <img
                src={H.lifestyleRightImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-top origin-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#1B4332]/88 via-[#1B4332]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md rounded-2xl border border-white/25 bg-black/40 px-4 py-4 backdrop-blur-md sm:px-5 sm:py-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h4 className="text-xl font-bold text-white font-playfair sm:text-2xl">{H.lifestyleRightTitle}</h4>
                  <p className="mt-1 text-sm text-white/90 font-inter sm:text-base">{H.lifestyleRightText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
