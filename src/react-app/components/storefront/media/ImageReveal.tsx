import { useState } from "react";
import { cn } from "@/react-app/design-system/cn";

type ImageRevealProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
};

/** Skeleton + fade-in suave ao carregar a imagem. */
export function ImageReveal({
  src,
  alt,
  className,
  imgClassName,
  loading = "lazy",
}: ImageRevealProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", className)}>
      {!loaded && !failed ? (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-muted via-surface-elevated to-surface-muted"
          aria-hidden
        />
      ) : null}
      {failed ? (
        <div className="flex h-full min-h-[8rem] items-center justify-center font-body text-xs text-content-muted">
          Imagem indisponível
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500 ease-out",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
