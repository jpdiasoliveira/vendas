import { Leaf, MapPin } from "lucide-react";
import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";

export const Story = () => {
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua Loja";
  const H = resolveStorefrontHome(displayName, settings?.publicProfile);

  return (
    <section id="historia" className="py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-[#FAF8F3]/50 backdrop-blur-3xl"></div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#1B4332]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#FFD166]/10 rounded-full blur-3xl"></div>
      </div>

      <div className={`relative z-10 ${storefrontShellClass}`}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/50 shadow-2xl">
              <div className="inline-block bg-gradient-to-r from-[#1B4332]/10 to-[#FFD166]/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-[#1B4332]/10">
                <span className="text-sm font-medium text-[#1B4332] font-inter">{H.storyEyebrow}</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-[#1B4332] mb-6 font-playfair">{H.storyHeading}</h3>
              <div className="space-y-4 text-[#5a4035] font-inter leading-relaxed">
                {H.storyParagraphs.map((para, i) => (
                  <p
                    key={i}
                    className={
                      i === H.storyParagraphs.length - 1
                        ? "text-base sm:text-lg font-medium text-[#1B4332]"
                        : "text-base sm:text-lg"
                    }
                  >
                    {para}
                  </p>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-md border border-[#1B4332]/10 hover:shadow-lg transition-all duration-300">
                  <Leaf className="h-5 w-5 text-[#1B4332]" />
                  <span className="text-sm font-medium text-[#1B4332] font-inter">{H.storyChip1}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-md border border-[#1B4332]/10 hover:shadow-lg transition-all duration-300">
                  <MapPin className="h-5 w-5 text-[#1B4332]" />
                  <span className="text-sm font-medium text-[#1B4332] font-inter">{H.storyChip2}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD166]/20 to-[#1B4332]/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <div className="relative aspect-[4/3] w-full max-h-[min(520px,55vh)] min-h-[240px] overflow-hidden rounded-3xl sm:max-h-[500px]">
              <img
                key={H.storyImageUrl}
                src={H.storyImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full rounded-3xl border-4 border-white/50 object-cover object-center shadow-2xl transition-all duration-500 group-hover:border-white/70"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
