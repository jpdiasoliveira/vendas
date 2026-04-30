import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Variables } from "../types.js";
import { requireStoreContext } from "../utils/requireStoreContext.js";
import { resolveOrderLinesForCheckout } from "../core/db/productsRepo.js";
import { validateCouponForSubtotal } from "../core/db/couponsRepo.js";
import type { CartItemPayload } from "../../contracts/schema.js";
import { OrderBusinessError } from "../core/orderErrors.js";
import { genericServerErrorMessage, logServerError } from "../utils/safeApiError.js";
import { couponValidateBodySchema } from "../schemas/orderPublic.js";
import { zodErrorToMessage } from "../utils/zodErrorMessage.js";

const coupons = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Valida cupom com o mesmo subtotal que o servidor usaria na criação do pedido (preços do catálogo).
 */
coupons.post(
  "/validate",
  zValidator("json", couponValidateBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const body = c.req.valid("json");

    try {
      const lines = await resolveOrderLinesForCheckout(
        c.env,
        store.id,
        body.items as CartItemPayload[]
      );
      const subtotal = Math.round(lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0) * 100) / 100;
      const codeRaw = body.code ?? "";
      if (!String(codeRaw).trim()) {
        return c.json(
          { success: true, data: { valid: true, subtotal, discountAmount: 0, code: null as string | null } },
          200
        );
      }
      try {
        const v = await validateCouponForSubtotal(c.env, store.id, codeRaw, subtotal);
        return c.json(
          {
            success: true,
            data: {
              valid: true,
              subtotal,
              discountAmount: v.discountAmount,
              code: v.codeNormalized,
            },
          },
          200
        );
      } catch (inner: unknown) {
        if (inner instanceof OrderBusinessError) {
          return c.json(
            {
              success: true,
              data: { valid: false, error: inner.message, subtotal },
            },
            200
          );
        }
        throw inner;
      }
    } catch (err: unknown) {
      if (err instanceof OrderBusinessError) {
        return c.json({ success: true, data: { valid: false, error: err.message, subtotal: 0 } }, 200);
      }
      logServerError("coupons.post /validate", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  }
);

export default coupons;
