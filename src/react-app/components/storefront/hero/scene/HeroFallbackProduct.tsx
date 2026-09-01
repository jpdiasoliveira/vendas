import { Float } from "@react-three/drei";

type HeroFallbackProductProps = {
  brandColor: string;
};

/** Cubo geométrico simples para servir de fallback caso o 3D principal falhe. */
export function HeroFallbackProduct({ brandColor }: HeroFallbackProductProps) {
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.35}>
      <mesh castShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial 
          color={brandColor} 
          roughness={0.2} 
          metalness={0.1}
        />
      </mesh>
    </Float>
  );
}
