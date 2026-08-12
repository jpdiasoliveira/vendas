type HeroStudioLightingProps = {
  brandColor: string;
};

/** Iluminação de estúdio para destacar detalhes do produto. */
export function HeroStudioLighting({ brandColor }: HeroStudioLightingProps) {
  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[5, 8, 4]} intensity={1.15} castShadow />
      <directionalLight position={[-4, 3, -2]} intensity={0.35} />
      <spotLight
        position={[0, 6, 2]}
        angle={0.42}
        penumbra={0.6}
        intensity={0.55}
        color={brandColor}
      />
    </>
  );
}
