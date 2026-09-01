import { zValidator } from "@hono/zod-validator";
import {
  createCoupon,
  deleteCoupon,
  getCouponByIdAndStore,
  getCouponsByStore,
  updateCoupon,
} from "../../core/database.js";
import { couponCreateSchema, couponUpdateSchema } from "../../schemas/coupon.js";
import { logAction } from "../../utils/audit.js";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import { zodErrorToMessage } from "./helpers.js";
import type { AdminHono } from "./types.js";

function businessErrorStatus(message: string): 400 | 404 | 409 {
  if (message.toLowerCase().includes("não encontrado") || message.toLowerCase().includes("nao encontrado")) {
    return 404;
  }
  if (message.toLowerCase().includes("já existe")) return 409;
  return 400;
}

export const registerAdminCouponRoutes = (admin: AdminHono): void => {
  admin.get("/coupons", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    try {
      const data = await getCouponsByStore(c.env, store.id);
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /coupons", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.post(
    "/coupons",
    zValidator("json", couponCreateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      const body = c.req.valid("json");
      try {
        const coupon = await createCoupon(c.env, store.id, {
          code: body.code,
          discountType: body.discount_type,
          discountValue: body.discount_value,
          validFrom: body.valid_from,
          validUntil: body.valid_until,
          active: body.active,
        });
        await logAction(c, "CREATE_COUPON", "coupon", coupon.id, { code: coupon.code });
        return c.json({ success: true, data: coupon }, 201);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : genericServerErrorMessage();
        if (err instanceof Error && message !== genericServerErrorMessage()) {
          return c.json({ success: false, error: message }, businessErrorStatus(message));
        }
        logServerError("admin.post /coupons", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    },
  );

  admin.patch(
    "/coupons/:id",
    zValidator("json", couponUpdateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      const couponId = c.req.param("id");
      const body = c.req.valid("json");
      try {
        const prev = await getCouponByIdAndStore(c.env, couponId, store.id);
        if (!prev) {
          return c.json({ success: false, error: "Cupom não encontrado." }, 404);
        }
        const coupon = await updateCoupon(c.env, couponId, store.id, {
          code: body.code,
          discountType: body.discount_type,
          discountValue: body.discount_value,
          validFrom: body.valid_from,
          validUntil: body.valid_until,
          active: body.active,
        });
        await logAction(c, "UPDATE_COUPON", "coupon", couponId, { code: coupon.code, active: coupon.active });
        return c.json({ success: true, data: coupon }, 200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : genericServerErrorMessage();
        if (err instanceof Error && message !== genericServerErrorMessage()) {
          return c.json({ success: false, error: message }, businessErrorStatus(message));
        }
        logServerError("admin.patch /coupons/:id", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    },
  );

  admin.delete("/coupons/:id", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const couponId = c.req.param("id");
    try {
      const prev = await getCouponByIdAndStore(c.env, couponId, store.id);
      if (!prev) {
        return c.json({ success: false, error: "Cupom não encontrado." }, 404);
      }
      await deleteCoupon(c.env, couponId, store.id);
      await logAction(c, "DELETE_COUPON", "coupon", couponId, { code: prev.code });
      return c.json({ success: true, data: { id: couponId } }, 200);
    } catch (err: unknown) {
      logServerError("admin.delete /coupons/:id", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });
};
