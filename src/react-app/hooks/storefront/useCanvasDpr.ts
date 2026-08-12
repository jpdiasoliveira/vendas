import { useEffect, useState } from "react";

/** Reduz DPR do Canvas 3D em telas pequenas para melhor performance. */
export function useCanvasDpr(): [number, number] {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => {
      setDpr(media.matches ? [1, 1.25] : [1, 1.75]);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return dpr;
}
