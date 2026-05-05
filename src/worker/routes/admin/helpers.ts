import type { AuthUser } from "../../middlewares/verifyAuth.js";
import { zodErrorToMessage } from "../../utils/zodErrorMessage.js";

export { zodErrorToMessage };

/** Apenas admin ou owner podem acessar configurações da loja. */
export const requireAdminOrOwner = (c: { get: (k: string) => unknown }): AuthUser | null => {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) return null;
  const role = (user.role ?? "").toLowerCase();
  if (role === "admin" || role === "owner") return user;
  return null;
};

/** Apenas o dono da loja (ex.: credenciais de pagamento por tenant). */
export const requireOwner = (c: { get: (k: string) => unknown }): AuthUser | null => {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) return null;
  if ((user.role ?? "").trim().toLowerCase() === "owner") return user;
  return null;
};

export const BUCKET_PRODUCT_IMAGES = "product-images";

/** Gera nome único para arquivo: timestamp-nome-sanitizado.ext */
export const uniqueFileName = (originalName: string): string => {
  const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "image";
  const ext = originalName.includes(".")
    ? originalName.split(".").pop()?.toLowerCase() || "jpg"
    : "jpg";
  const base = sanitized.includes(".") ? sanitized : `${sanitized}.${ext}`;
  return `${Date.now()}-${base}`;
};
