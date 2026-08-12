import { useEffect, type RefObject } from "react";
import { gsap, registerGsap } from "@/react-app/lib/gsap/registerGsap";

type ScrollRevealOptions = {
  y?: number;
  duration?: number;
  start?: string;
};

/** Revela elementos ao scroll via GSAP ScrollTrigger. */
export function useScrollReveal<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options?: ScrollRevealOptions,
): void {
  const { y = 40, duration = 0.8, start = "top 85%" } = options ?? {};

  useEffect(() => {
    registerGsap();
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: "play none none reverse",
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [ref, y, duration, start]);
}
