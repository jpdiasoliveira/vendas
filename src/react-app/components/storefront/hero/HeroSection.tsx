import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { Container } from "@/react-app/design-system/components/Container";
import { Button } from "@/react-app/design-system/components/Button";
import { HeroScene3D } from "@/react-app/components/storefront/hero/HeroScene3D";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";
import { fadeUpVariants } from "@/react-app/lib/motion/pageVariants";
import { adminStorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

type HeroSectionProps = {
  onShopClick: () => void;
  previewLayout?: boolean;
};

export function HeroSection({ onShopClick, previewLayout = false }: HeroSectionProps) {
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua loja";
  const brandColor = normalizeStorePrimaryColor(settings?.primaryColor ?? undefined);

  return (
    <section
      id={adminStorefrontPreviewSectionId("hero")}
      className="relative min-h-[min(92vh,52rem)] overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-surface-muted/40 to-transparent" />
      <div className="pointer-events-none absolute -left-1/4 top-0 h-[70%] w-[70%] rounded-full bg-accent-soft/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-1/4 bottom-0 h-[55%] w-[55%] rounded-full bg-brand-primary/10 blur-3xl" />

      <Container className="relative z-10 grid min-h-[min(92vh,52rem)] items-center gap-8 px-4 py-12 sm:px-5 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8 lg:py-20">
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start"
        >
          <span className="mb-4 inline-flex rounded-full border border-brand-primary/20 bg-surface-elevated/70 px-4 py-1.5 font-body text-xs font-medium uppercase tracking-[0.2em] text-content-muted backdrop-blur-sm">
            Experiência premium
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] text-content sm:text-5xl lg:text-6xl">
            {displayName}
            <span className="mt-2 block bg-gradient-to-r from-brand-primary to-accent bg-clip-text text-transparent">
              curadoria em movimento
            </span>
          </h1>
          <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-content-muted sm:text-lg">
            Descubra produtos selecionados com uma vitrine fluida, interativa e feita para converter — sem ruído visual.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={onShopClick}>Explorar catálogo</Button>
            <Button variant="outline" onClick={onShopClick}>
              Ver destaques
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full min-h-[14rem] max-h-[min(72vw,22rem)] sm:min-h-[18rem] sm:max-h-none sm:aspect-square lg:max-w-none justify-self-center"
        >
          <div className="absolute inset-0 rounded-2xl border border-brand-primary/15 bg-surface-elevated/50 shadow-2xl shadow-brand-primary/10 backdrop-blur-sm sm:rounded-[2rem]" />
          <HeroScene3D
            brandColor={brandColor}
            className="relative h-full min-h-[14rem] w-full rounded-2xl sm:min-h-[18rem] sm:rounded-[2rem]"
          />
          {!previewLayout ? (
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <span className="rounded-full bg-surface-elevated/80 px-3 py-1 font-body text-[10px] uppercase tracking-widest text-content-muted backdrop-blur-sm">
                3D interativo · arraste para girar
              </span>
            </div>
          ) : null}
        </motion.div>
      </Container>


    </section>
  );
}
