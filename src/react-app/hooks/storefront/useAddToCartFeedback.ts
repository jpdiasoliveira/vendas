import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "animejs";

const ADDED_RESET_MS = 2200;

/** Estado visual + pulso Anime.js para o botão de adicionar ao carrinho. */
export function useAddToCartFeedback() {
  const [added, setAdded] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const triggerAdded = useCallback((element: HTMLElement) => {
    animate(element, {
      scale: [1, 0.94, 1.04, 1],
      duration: 420,
      ease: "out(3)",
    });

    setAdded(true);
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setAdded(false);
      resetTimerRef.current = null;
    }, ADDED_RESET_MS);
  }, []);

  return { added, triggerAdded };
}
