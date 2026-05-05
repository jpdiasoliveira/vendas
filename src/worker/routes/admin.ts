import { Hono } from "hono";
import { Variables } from "../types.js";
import { registerAdminCategoryRoutes } from "./admin/categories.js";
import { registerAdminStorePaymentRoutes } from "./admin/storePayments.js";
import { registerAdminNewsletterRoutes } from "./admin/newsletter.js";
import { registerAdminOrderRoutes } from "./admin/orders.js";
import { registerAdminProductRoutes } from "./admin/products.js";
import { registerAdminSettingsAndAuditRoutes } from "./admin/settingsAndAudit.js";
import type { AdminHono } from "./admin/types.js";

/**
 * Rotas do painel admin por domínio (settings/audit, categorias, produtos, pedidos).
 * Mantém um único `Hono` montado em `/api/admin` no index do Worker.
 */
const admin: AdminHono = new Hono<{ Bindings: Env; Variables: Variables }>();

registerAdminSettingsAndAuditRoutes(admin);
registerAdminStorePaymentRoutes(admin);
registerAdminNewsletterRoutes(admin);
registerAdminCategoryRoutes(admin);
registerAdminProductRoutes(admin);
registerAdminOrderRoutes(admin);

export default admin;
