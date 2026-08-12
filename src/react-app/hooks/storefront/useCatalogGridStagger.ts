import { useEffect, type RefObject } from "react";
import { gsap, registerGsap } from "@/react-app/lib/gsap/registerGsap";

type UseCatalogGridStaggerOptions = {
  enabled: boolean;
  productIds: string;
};

/** Fade-up em stagger dos cards do catálogo via GSAP ScrollTrigger. */
export function useCatalogGridStagger(
  gridRef: RefObject<HTMLElement | null>,
  { enabled, productIds }: UseCatalogGridStaggerOptions,
): void {
  useEffect(() => {
    if (!enabled) return;

    registerGsap();
    const grid = gridRef.current;
    if (!grid) return;

    const cards = grid.querySelectorAll<HTMLElement>("[data-catalog-card]");
    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(cards, { opacity: 0, y: 48 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.72,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: grid,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });
    }, grid);

    return () => ctx.revert();
  }, [gridRef, enabled, productIds]);
}
