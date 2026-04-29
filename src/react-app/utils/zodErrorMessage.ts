/** Formata erros do Zod em uma mensagem curta para a UI. */
export const zodErrorToMessage = (error: {
  issues: { message: string; path: (string | number)[] }[];
}): string => {
  const messages = error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
  return messages.length > 0 ? messages.join("; ") : "Dados inválidos.";
};
