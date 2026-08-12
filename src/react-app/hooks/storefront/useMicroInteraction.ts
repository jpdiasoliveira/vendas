import { useCallback } from "react";
import { animate } from "animejs";

/** Micro-interações performáticas com Anime.js (cliques, feedback tátil). */
export function useMicroInteraction() {
  const bindPulse = useCallback((element: HTMLElement) => {
    animate(element, {
      scale: [1, 0.96, 1],
      duration: 280,
      ease: "out(3)",
    });
  }, []);

  return { bindPulse };
}
