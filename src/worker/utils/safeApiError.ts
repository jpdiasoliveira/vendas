/**
 * Remove trechos que possam parecer tokens (logs no Worker; nunca enviar ao browser).
 */
export const redactSecrets = (text: string): string => {
  let s = text;
  s = s.replace(/Bearer\s+[\w.-]+/gi, "Bearer [REDACTED]");
  s = s.replace(/APP_USR[-\d\w]{10,}/gi, "APP_USR_[REDACTED]");
  s = s.replace(/\bsk_(live|test)_[\w]+\b/gi, "sk_[REDACTED]");
  s = s.replace(/access[_-]?token["']?\s*[:=]\s*["']?[\w-_.]+/gi, "access_token=[REDACTED]");
  return s;
};

/**
 * Resposta genérica ao cliente em 500; detalhes só em log (evita vazar schema/stack ou segredos).
 */
export const logServerError = (context: string, err: unknown): void => {
  const raw =
    err instanceof Error
      ? `${err.message}\n${err.stack ?? ""}`
      : typeof err === "object" && err !== null
        ? JSON.stringify(err)
        : String(err);
  console.error(`[${context}]`, redactSecrets(raw));
};

export function genericServerErrorMessage(): string {
  return "Erro interno. Tente novamente.";
}
