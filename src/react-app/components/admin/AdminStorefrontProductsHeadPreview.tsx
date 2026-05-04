import { Package } from "lucide-react";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";
import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";

/** Cabeçalho da secção #produtos na mini pré-visualização admin (cartões são placeholders). */
export const AdminStorefrontProductsHeadPreview = () => {
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua Loja";
  const H = resolveStorefrontHome(displayName, settings?.publicProfile);

  return (
    <section className={`relative py-8 sm:py-10 ${storefrontShellClass}`} data-preview-section="productsHead">
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#FFD166]/10 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-gradient-to-tr from-[#1B4332]/10 to-transparent blur-2xl" />

      <div className="relative z-10 mb-6 text-center">
        <div className="mb-3 inline-block rounded-full border border-[#1B4332]/10 bg-white/60 px-4 py-1.5 backdrop-blur-sm">
          <span className="font-inter text-xs font-medium text-[#1B4332] sm:text-sm">{H.productsGridEyebrow}</span>
        </div>
        <h3 className="mb-2 px-1 font-playfair text-2xl font-bold text-[#1B4332] sm:text-3xl md:text-4xl">
          {H.productsGridTitle}
        </h3>
        <p className="mx-auto max-w-xl px-2 font-inter text-sm text-[#5a4035] sm:text-base">{H.productsGridSubtitle}</p>
      </div>

      <div className="relative z-10 flex flex-wrap justify-center gap-2.5 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex h-[4.25rem] w-[calc((100%-0.5rem)/2)] min-w-[5.5rem] max-w-[8.5rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#1B4332]/12 bg-white/55 sm:h-[4.75rem] sm:w-[calc((100%-0.75rem)/3)]"
          >
            <Package className="h-4 w-4 text-[#1B4332]/35" aria-hidden />
            <span className="text-[8px] font-medium uppercase tracking-wide text-[#6D4C41]/45">Produto</span>
          </div>
        ))}
      </div>
      <p className="relative z-10 mt-3 text-center font-inter text-[9px] leading-snug text-[#6D4C41]/65 sm:text-[10px]">
        Placeholder — na loja aparecem os artigos do catálogo.
      </p>
    </section>
  );
};
