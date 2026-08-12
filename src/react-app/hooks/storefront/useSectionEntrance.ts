import { useEffect, type RefObject } from "react";
import { gsap, registerGsap } from "@/react-app/lib/gsap/registerGsap";

type SectionEntranceOptions = {
  selector?: string;
  y?: number;
  stagger?: number;
};

/** Entrada em stagger dos filhos marcados com `data-section-enter`. */
export function useSectionEntrance<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options?: SectionEntranceOptions,
): void {
  const { selector = "[data-section-enter]", y = 32, stagger = 0.12 } = options ?? {};

  useEffect(() => {
    registerGsap();
    const section = ref.current;
    if (!section) return;

    const items = section.querySelectorAll<HTMLElement>(selector);
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(items, { opacity: 0, y });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });
    }, section);

    return () => ctx.revert();
  }, [ref, selector, y, stagger]);
}
