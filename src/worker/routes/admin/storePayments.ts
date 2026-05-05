import { zValidator } from "@hono/zod-validator";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import { isMpCredentialsMasterSecretConfigured } from "../../utils/fieldCrypto.js";
import {
  getStoreMpCredentialFlags,
  upsertStoreMercadoPagoCredentials,
  getDecryptedMercadoPagoAccessToken,
} from "../../core/db/stores/storeMpCredentialsRepo.js";
import { storePaymentsPatchSchema, storePaymentsTestSchema } from "../../schemas/storePayments.js";
import { testMercadoPagoAccessToken } from "../../services/mercadopagoTestConnection.js";
import { zodErrorToMessage } from "../../utils/zodErrorMessage.js";
import { requireOwner } from "./helpers.js";
import type { AdminHono } from "./types.js";

export const registerAdminStorePaymentRoutes = (admin: AdminHono): void => {
  admin.get("/store/payments", async (c) => {
    if (!requireOwner(c)) {
      return c.json({ success: false, error: "Apenas o dono da loja pode consultar as credenciais de pagamento." }, 403);
    }
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    try {
      const flags = await getStoreMpCredentialFlags(c.env, store.id);
      return c.json({ success: true, data: flags }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /store/payments", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.patch(
    "/store/payments",
    zValidator("json", storePaymentsPatchSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      if (!requireOwner(c)) {
        return c.json({ success: false, error: "Apenas o dono da loja pode alterar as credenciais de pagamento." }, 403);
      }
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      if (!isMpCredentialsMasterSecretConfigured(c.env)) {
        return c.json(
          {
            success: false,
            error:
              "O servidor não está configurado para guardar credenciais cifradas (MP_STORE_CREDENTIALS_SECRET, mín. 16 caracteres). Contacte a equipa técnica.",
          },
          503
        );
      }
      const body = c.req.valid("json");
      try {
        await upsertStoreMercadoPagoCredentials(c.env, store.id, {
          mpAccessToken: body.mpAccessToken,
          mpPublicKey: body.mpPublicKey,
        });
        const flags = await getStoreMpCredentialFlags(c.env, store.id);
        return c.json({ success: true, data: flags }, 200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("MP_STORE_CREDENTIALS_SECRET_NOT_CONFIGURED")) {
          return c.json({ success: false, error: "Segredo de cifra não configurado no servidor." }, 503);
        }
        logServerError("admin.patch /store/payments", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    }
  );

  admin.post(
    "/store/payments/test",
    zValidator("json", storePaymentsTestSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      if (!requireOwner(c)) {
        return c.json({ success: false, error: "Apenas o dono da loja pode testar as credenciais de pagamento." }, 403);
      }
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      const body = c.req.valid("json");
      let token = (body.mpAccessToken ?? "").trim();
      if (!token) {
        token = (await getDecryptedMercadoPagoAccessToken(c.env, store.id))?.trim() ?? "";
      }
      if (!token) {
        return c.json(
          { success: false, error: "Informe o Access Token ou guarde credenciais antes de testar." },
          400
        );
      }
      try {
        const r = await testMercadoPagoAccessToken(token);
        if (!r.ok) {
          return c.json(
            { success: false, error: `Mercado Pago (${r.status}): ${r.message}` },
            400
          );
        }
        return c.json(
          {
            success: true,
            data: {
              ok: true as const,
              mpUserId: r.userId,
              nickname: r.nickname ?? null,
            },
          },
          200
        );
      } catch (err: unknown) {
        logServerError("admin.post /store/payments/test", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    }
  );
};
