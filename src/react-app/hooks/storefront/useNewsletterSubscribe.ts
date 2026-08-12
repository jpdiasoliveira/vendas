import { useCallback, useState } from "react";
import { z } from "zod";
import { subscribeStoreNewsletter } from "@/react-app/services/api";
import { useToast } from "@/react-app/providers/ToastProvider";

const newsletterEmailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .email("E-mail inválido.");

export type NewsletterSubscribeStatus = "idle" | "loading" | "success" | "error";

export function useNewsletterSubscribe() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NewsletterSubscribeStatus>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const subscribe = useCallback(async () => {
    const parsed = newsletterEmailSchema.safeParse(email);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "E-mail inválido.";
      setFieldError(message);
      setStatus("error");
      showToast({ type: "error", message });
      return;
    }

    setFieldError(null);
    setStatus("loading");

    try {
      await subscribeStoreNewsletter(parsed.data);
      setStatus("success");
      setEmail("");
      showToast({ type: "success", message: "Inscrição confirmada! Obrigado." });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Não foi possível concluir a inscrição.";
      setFieldError(message);
      setStatus("error");
      showToast({ type: "error", message });
    }
  }, [email, showToast]);

  return {
    email,
    setEmail,
    status,
    fieldError,
    subscribe,
    isLoading: status === "loading",
    isSuccess: status === "success",
  };
}
