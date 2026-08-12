import { useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import type { Object3D } from "three";
import { Mesh } from "three";

type HeroFeaturedProductProps = {
  url: string;
};

function disposeObject3D(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.geometry.dispose();
    const { material } = node;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
      return;
    }
    material.dispose();
  });
}

/** Carrega e renderiza o GLB do produto em destaque (clone isolado + dispose no unmount). */
export function HeroFeaturedProduct({ url }: HeroFeaturedProductProps) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    return () => {
      disposeObject3D(model);
      useGLTF.clear(url);
    };
  }, [model, url]);

  return <primitive object={model} />;
}
