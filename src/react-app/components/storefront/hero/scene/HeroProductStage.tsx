type HeroProductStageProps = {
  brandColor: string;
};

/** Palco virtual com reflexo sutil da cor da marca. */
export function HeroProductStage({ brandColor }: HeroProductStageProps) {
  return (
    <group position={[0, -0.85, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.65, 64]} />
        <meshStandardMaterial
          color={brandColor}
          transparent
          opacity={0.14}
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <ringGeometry args={[1.05, 1.65, 64]} />
        <meshStandardMaterial
          color={brandColor}
          transparent
          opacity={0.22}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
