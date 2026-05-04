import { useState } from "react";
import { Loader2 } from "lucide-react";
import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";
import { subscribeStoreNewsletter } from "@/react-app/services/api";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua Loja";
  const H = resolveStorefrontHome(displayName, settings?.publicProfile);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      await subscribeStoreNewsletter(email.trim());
      setFeedback({
        type: "success",
        text: "Obrigado! Guardámos o seu e-mail para novidades e ofertas desta loja.",
      });
      setEmail("");
    } catch (err: unknown) {
      console.error("[Newsletter.handleNewsletterSubmit]", err);
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível concluir a inscrição. Tente de novo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F3] to-white"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#FFD166]/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className={`relative z-10 ${storefrontShellClass}`}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-12 border border-white/50 shadow-2xl">
            <div className="inline-block bg-gradient-to-r from-[#1B4332]/10 to-[#FFD166]/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-[#1B4332]/10">
              <span className="text-sm font-medium text-[#1B4332] font-inter">{H.newsletterEyebrow}</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-[#1B4332] mb-4 font-playfair">{H.newsletterTitle}</h3>
            <p className="text-lg text-[#6D4C41] mb-8 font-inter">{H.newsletterSubtitle}</p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (feedback) setFeedback(null);
                }}
                placeholder={H.newsletterPlaceholder}
                disabled={loading}
                className="flex-1 px-6 py-4 rounded-full border-2 border-white/50 bg-white/50 backdrop-blur-sm focus:border-[#1B4332]/30 focus:bg-white/70 focus:outline-none font-inter transition-all duration-300 shadow-lg disabled:opacity-60"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-10 py-4 rounded-full font-bold hover:shadow-2xl hover:shadow-[#FFD166]/50 transition-all duration-300 hover:scale-105 font-inter whitespace-nowrap disabled:pointer-events-none disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : null}
                {H.newsletterCtaLabel}
              </button>
            </form>
            {feedback ? (
              <p
                role="status"
                className={`mt-5 text-sm font-inter ${
                  feedback.type === "success" ? "text-[#1B4332]" : "text-red-600"
                }`}
              >
                {feedback.text}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
