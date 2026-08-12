import { useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { animate } from "animejs";
import { cn } from "@/react-app/design-system/cn";
import type { NewsletterSubscribeStatus } from "@/react-app/hooks/storefront/useNewsletterSubscribe";

type NewsletterSubscribeButtonProps = {
  label: string;
  status: NewsletterSubscribeStatus;
  onClick: () => void;
  disabled?: boolean;
};

export function NewsletterSubscribeButton({
  label,
  status,
  onClick,
  disabled = false,
}: NewsletterSubscribeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (disabled || status === "loading") return;
    const element = buttonRef.current;
    if (element) {
      animate(element, {
        scale: [1, 0.96, 1.02, 1],
        duration: 380,
        ease: "out(3)",
      });
    }
    onClick();
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={disabled || status === "loading"}
      className={cn(
        "inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 font-body text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60",
        status === "success"
          ? "bg-accent text-content"
          : "bg-brand-primary text-white hover:bg-brand-primary-hover",
      )}
    >
      {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {status === "success" ? <Check className="h-4 w-4" aria-hidden /> : null}
      {status === "success" ? "Inscrito!" : label}
    </button>
  );
}
