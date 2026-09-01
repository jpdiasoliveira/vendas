/** Formata inteiro CEP (8 dígitos) para exibição `00000-000`. */
export function formatCepDigits(value: number | string): string {
  const digits = String(value).replace(/\D/g, "").padStart(8, "0").slice(-8);
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Máscara enquanto digita (até 8 dígitos). */
export function maskCepInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
