/**
 * Utilitários de formatação para exibição (moeda, data, hora).
 * Centralizados para reuso e consistência em todo o frontend.
 */

/** Formata valor numérico em Real (BRL) para exibição. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

/** Formata data e hora no padrão pt-BR (dd/mm/aaaa, hh:mm). */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Formata apenas data no padrão pt-BR (dd/mm/aaaa, hh:mm) — sem segundos. */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
