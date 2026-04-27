import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Variables } from "../types.js";
import { requireStoreContext } from "../utils/requireStoreContext.js";
import { normalizeBrazilCep, resolveShippingFeeForCep } from "../core/db/shippingRepo.js";
import { genericServerErrorMessage, logServerError } from "../utils/safeApiError.js";
import { shippingQuoteBodySchema } from "../schemas/orderPublic.js";
import { zodErrorToMessage } from "../utils/zodErrorMessage.js";

const shipping = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Cotação de frete (pública na vitrine): CEP + loja do header — não persiste pedido.
 */
shipping.post(
  "/quote",
  zValidator("json", shippingQuoteBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const body = c.req.valid("json");
    const norm = normalizeBrazilCep(body.cep);
    if (!norm) {
      return c.json(
        {
          success: true,
          data: { deliverable: false, message: "Informe um CEP válido (8 dígitos)." },
        },
        200
      );
    }
    try {
      const r = await resolveShippingFeeForCep(c.env, store.id, norm);
      if (!r.deliverable) {
        return c.json(
          {
            success: true,
            data: { deliverable: false, cep: norm, message: r.message },
          },
          200
        );
      }
      return c.json(
        {
          success: true,
          data: {
            deliverable: true,
            cep: norm,
            fee: r.fee,
            label: r.bandLabel ?? null,
          },
        },
        200
      );
    } catch (err: unknown) {
      logServerError("shipping.post /quote", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  }
);

export default shipping;
