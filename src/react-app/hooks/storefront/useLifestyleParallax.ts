import { useEffect, type RefObject } from "react";
import { gsap, registerGsap } from "@/react-app/lib/gsap/registerGsap";

/** Parallax leve no fundo da seção Lifestyle via GSAP ScrollTrigger. */
export function useLifestyleParallax(
  sectionRef: RefObject<HTMLElement | null>,
  backgroundRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    const background = backgroundRef.current;
    if (!section || !background) return;

    const ctx = gsap.context(() => {
      gsap.to(background, {
        yPercent: 22,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [sectionRef, backgroundRef]);
}
