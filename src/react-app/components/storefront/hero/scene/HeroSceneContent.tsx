import { Suspense } from "react";
import { Bounds, Center, Environment, OrbitControls } from "@react-three/drei";
import { HeroStudioLighting } from "@/react-app/components/storefront/hero/scene/HeroStudioLighting";
import { HeroProductStage } from "@/react-app/components/storefront/hero/scene/HeroProductStage";
import { HeroFeaturedProduct } from "@/react-app/components/storefront/hero/scene/HeroFeaturedProduct";
import { HeroFallbackProduct } from "@/react-app/components/storefront/hero/scene/HeroFallbackProduct";
import { HeroModelErrorBoundary } from "@/react-app/components/storefront/hero/scene/HeroModelErrorBoundary";

type HeroSceneContentProps = {
  modelUrl: string;
  brandColor: string;
};

export function HeroSceneContent({ modelUrl, brandColor }: HeroSceneContentProps) {
  return (
    <>
      <HeroStudioLighting brandColor={brandColor} />
      <HeroProductStage brandColor={brandColor} />

      <HeroModelErrorBoundary fallback={<HeroFallbackProduct brandColor={brandColor} />}>
        <Suspense fallback={<HeroFallbackProduct brandColor={brandColor} />}>
          <Bounds fit clip observe margin={1.3}>
            <Center>
              <HeroFeaturedProduct url={modelUrl} />
            </Center>
          </Bounds>
        </Suspense>
      </HeroModelErrorBoundary>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        rotateSpeed={0.75}
      />
      <Environment preset="studio" />
    </>
  );
}
