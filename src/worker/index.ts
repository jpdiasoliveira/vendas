import { Hono } from "hono";
import { Variables } from "./types.js";
import { storeMiddleware } from "./middleware/store.js";
import products from "./routes/products.js";
import orders from "./routes/orders.js";
import webhooks from "./routes/webhooks.js";
import auth from "./routes/auth.js";
import admin from "./routes/admin.js";

/**
 * @file index.ts
 * Servidor Principal (Hono) nativo do Cloudflare Edge Worker.
 * Responsável estritamente pela Orquestração Limpa e Injeção de Dependências.
 */
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// --- 1. MIDDLEWARES DE ISOLAMENTO ---
app.use('/api/*', storeMiddleware);

// --- 2. ROTEADORES MODULARES (BUSINESS RULES) ---
app.route('/api/products', products);
app.route('/api/orders', orders);
app.route('/api', auth); // Utiliza '/api' base para suportar urls nativas curtas ex: '/api/users/me'
app.route("/api/webhooks", webhooks);
app.route("/api/admin", admin);

app.get("/api/health", (c) =>
  c.json({ success: true, data: { ok: true, timestamp: Date.now() } })
);

export default app;