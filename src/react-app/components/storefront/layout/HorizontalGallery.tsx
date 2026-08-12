import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type HorizontalGalleryProps = {
  children: React.ReactNode;
  previewMode?: boolean;
};

export function HorizontalGallery({ children, previewMode = false }: HorizontalGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If in admin preview mode, disable the complex scroll to keep standard vertical preview
    if (previewMode) return;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".gallery-panel");
      if (panels.length === 0) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          pin: true,
          scrub: 1,
          snap: {
            snapTo: 1 / (panels.length - 1),
            duration: { min: 0.2, max: 0.6 },
            delay: 0.1,
            ease: "power1.inOut"
          },
          end: () => `+=${containerRef.current?.scrollWidth || 0}px`,
        }
      });

      // Efeito de galeria: rolar horizontalmente enquanto gira/escala levemente os painéis
      tl.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
      });

      // Efeito 3D sutil para dar o ar de "virar quadros"
      panels.forEach((panel, i) => {
        if (i === 0) return; // ignora o primeiro (hero)
        
        gsap.fromTo(panel, 
          { rotationY: 15, scale: 0.9 },
          { 
            rotationY: 0, 
            scale: 1, 
            ease: "none",
            scrollTrigger: {
              trigger: wrapperRef.current,
              scrub: 1,
              start: () => `top top-=${window.innerWidth * (i - 1)}`,
              end: () => `top top-=${window.innerWidth * i}`,
            }
          }
        );
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, [previewMode]);

  if (previewMode) {
    return <div className="flex flex-col w-full overflow-hidden">{children}</div>;
  }

  return (
    <div ref={wrapperRef} className="h-screen w-full overflow-hidden bg-transparent relative" style={{ perspective: "1000px" }}>
      <div 
        ref={containerRef} 
        className="flex h-screen w-max items-center flex-nowrap"
      >
        {children}
      </div>
    </div>
  );
}
