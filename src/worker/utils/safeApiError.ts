/**
 * Resposta genérica ao cliente em 500; detalhes só em log (evita vazar schema/stack).
 */
export function logServerError(context: string, err: unknown): void {
  console.error(`[${context}]`, err);
}

export function genericServerErrorMessage(): string {
  return "Erro interno. Tente novamente.";
}
