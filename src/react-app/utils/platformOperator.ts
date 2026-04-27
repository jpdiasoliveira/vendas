/**
 * Mesma lista conceitual que PLATFORM_OPERATOR_EMAILS no Worker (e-mails separados por vírgula).
 * Usado só para exibir o menu da plataforma na vitrine; o Worker continua sendo a fonte da verdade.
 */
export const isPlatformOperatorEmail = (email: string | undefined | null): boolean => {
  const raw = import.meta.env.VITE_PLATFORM_OPERATOR_EMAILS ?? "";
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  const e = email?.trim().toLowerCase();
  return !!e && allowed.includes(e);
};
