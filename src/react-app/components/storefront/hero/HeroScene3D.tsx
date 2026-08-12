import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { HeroCanvasLoader } from "@/react-app/components/storefront/hero/scene/HeroCanvasLoader";
import { HeroSceneContent } from "@/react-app/components/storefront/hero/scene/HeroSceneContent";
import { HERO_FEATURED_MODEL_URL } from "@/react-app/constants/hero3d";
import { useCanvasDpr } from "@/react-app/hooks/storefront/useCanvasDpr";
import { cn } from "@/react-app/design-system/cn";
type HeroScene3DProps = {
  className?: string;
  brandColor: string;
  modelUrl?: string;
};

/** Mostruário 3D premium — carrega GLB via React Three Fiber + Drei. */
export function HeroScene3D({
  className,
  brandColor,
  modelUrl = HERO_FEATURED_MODEL_URL,
}: HeroScene3DProps) {
  const dpr = useCanvasDpr();

  useEffect(() => {
    useGLTF.preload(modelUrl);
  }, [modelUrl]);

  return (
    <div className={cn("touch-pan-y", className)} aria-hidden>
      <Suspense fallback={<HeroCanvasLoader />}>
        <Canvas
          camera={{ position: [0, 0.15, 3.8], fov: 40 }}
          dpr={dpr}
          gl={{ antialias: true, alpha: true }}
          shadows
          className="h-full w-full"
        >
          <HeroSceneContent modelUrl={modelUrl} brandColor={brandColor} />
        </Canvas>
      </Suspense>
    </div>
  );
}
