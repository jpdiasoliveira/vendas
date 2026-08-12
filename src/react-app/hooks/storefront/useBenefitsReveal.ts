import { useEffect, type RefObject } from "react";
import { animate, stagger } from "animejs";
import { registerGsap } from "@/react-app/lib/gsap/registerGsap";
import { ScrollTrigger } from "@/react-app/lib/gsap/registerGsap";

/** Entrada em stagger dos cards de benefícios com Anime.js ao entrar na viewport. */
export function useBenefitsReveal(gridRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    registerGsap();
    const grid = gridRef.current;
    if (!grid) return;

    let played = false;

    const playReveal = () => {
      if (played) return;
      const cards = grid.querySelectorAll<HTMLElement>("[data-benefit-card]");
      if (cards.length === 0) return;
      played = true;
      animate(cards, {
        opacity: [0, 1],
        translateY: [28, 0],
        delay: stagger(110),
        duration: 620,
        ease: "out(3)",
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: grid,
      start: "top 85%",
      once: true,
      onEnter: playReveal,
    });

    return () => {
      trigger.kill();
    };
  }, [gridRef]);
}
