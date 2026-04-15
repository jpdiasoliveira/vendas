/**
 * Máscara de telefone nacional (BR) enquanto digita.
 * Não altera URLs (WhatsApp / wa.me) — devolve o texto como veio.
 */

function isLikelyPhoneUrl(raw: string): boolean {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) || /wa\.me/i.test(raw) || /whatsapp\.com/i.test(raw);
}

function takeNationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) {
    d = d.slice(2);
  }
  return d.slice(0, 11);
}

/**
 * Formata como (DD) XXXX-XXXX (fixo, 10 dígitos) ou (DD) 9XXXX-XXXX (celular, 11).
 */
export const formatBrazilPhoneInput = (raw: string): string => {
  if (isLikelyPhoneUrl(raw)) return raw;

  const digits = takeNationalDigits(raw);
  if (digits.length === 0) return "";

  if (digits.length === 1) {
    return `(${digits}`;
  }
  if (digits.length === 2) {
    return `(${digits})`;
  }

  const ddd = digits.slice(0, 2);
  const local = digits.slice(2);
  const prefix = `(${ddd})`;

  if (local.length === 0) return prefix;

  const mobile = local[0] === "9";

  if (mobile) {
    const a = local.slice(0, 5);
    const b = local.slice(5, 9);
    if (b) return `${prefix} ${a}-${b}`;
    return `${prefix} ${a}`;
  }

  const a = local.slice(0, 4);
  const b = local.slice(4, 8);
  if (b) return `${prefix} ${a}-${b}`;
  return `${prefix} ${a}`;
};
