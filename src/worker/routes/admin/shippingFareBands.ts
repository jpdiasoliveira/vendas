import { zValidator } from "@hono/zod-validator";
import {
  createShippingFareBand,
  deleteShippingFareBand,
  getShippingFareBandByIdAndStore,
  getShippingFareBandsByStore,
  updateShippingFareBand,
} from "../../core/database.js";
import {
  shippingFareBandCreateSchema,
  shippingFareBandUpdateSchema,
} from "../../schemas/shippingFareBand.js";
import { logAction } from "../../utils/audit.js";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import { zodErrorToMessage } from "./helpers.js";
import type { AdminHono } from "./types.js";

function businessErrorStatus(message: string): 400 | 404 {
  const lower = message.toLowerCase();
  if (lower.includes("não encontrad") || lower.includes("nao encontrad")) return 404;
  return 400;
}

export const registerAdminShippingFareBandRoutes = (admin: AdminHono): void => {
  admin.get("/shipping-fare-bands", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    try {
      const data = await getShippingFareBandsByStore(c.env, store.id);
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /shipping-fare-bands", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.post(
    "/shipping-fare-bands",
    zValidator("json", shippingFareBandCreateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      const body = c.req.valid("json");
      try {
        const band = await createShippingFareBand(c.env, store.id, {
          cepFrom: body.cep_from,
          cepTo: body.cep_to,
          amountBrl: body.amount_brl,
          label: body.label ?? null,
        });
        await logAction(c, "CREATE_SHIPPING_FARE_BAND", "shipping_fare_band", band.id, {
          cep_from: band.cepFrom,
          cep_to: band.cepTo,
          amount_brl: band.amountBrl,
        });
        return c.json({ success: true, data: band }, 201);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : genericServerErrorMessage();
        if (err instanceof Error && message !== genericServerErrorMessage()) {
          return c.json({ success: false, error: message }, businessErrorStatus(message));
        }
        logServerError("admin.post /shipping-fare-bands", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    },
  );

  admin.patch(
    "/shipping-fare-bands/:id",
    zValidator("json", shippingFareBandUpdateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      const bandId = c.req.param("id");
      const body = c.req.valid("json");
      try {
        const prev = await getShippingFareBandByIdAndStore(c.env, bandId, store.id);
        if (!prev) {
          return c.json({ success: false, error: "Faixa de frete não encontrada." }, 404);
        }
        const band = await updateShippingFareBand(c.env, bandId, store.id, {
          cepFrom: body.cep_from,
          cepTo: body.cep_to,
          amountBrl: body.amount_brl,
          label: body.label,
        });
        await logAction(c, "UPDATE_SHIPPING_FARE_BAND", "shipping_fare_band", bandId, {
          cep_from: band.cepFrom,
          cep_to: band.cepTo,
          amount_brl: band.amountBrl,
        });
        return c.json({ success: true, data: band }, 200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : genericServerErrorMessage();
        if (err instanceof Error && message !== genericServerErrorMessage()) {
          return c.json({ success: false, error: message }, businessErrorStatus(message));
        }
        logServerError("admin.patch /shipping-fare-bands/:id", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    },
  );

  admin.delete("/shipping-fare-bands/:id", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const bandId = c.req.param("id");
    try {
      const prev = await getShippingFareBandByIdAndStore(c.env, bandId, store.id);
      if (!prev) {
        return c.json({ success: false, error: "Faixa de frete não encontrada." }, 404);
      }
      await deleteShippingFareBand(c.env, bandId, store.id);
      await logAction(c, "DELETE_SHIPPING_FARE_BAND", "shipping_fare_band", bandId, {
        cep_from: prev.cepFrom,
        cep_to: prev.cepTo,
      });
      return c.json({ success: true, data: { id: bandId } }, 200);
    } catch (err: unknown) {
      logServerError("admin.delete /shipping-fare-bands/:id", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });
};
