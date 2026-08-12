export const LAST_AUTH_ERROR_KEY = "lastAuthError";

export function safeInternalPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("://")) return null;
  return next;
}
