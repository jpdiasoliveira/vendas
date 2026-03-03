import { Hono } from "hono";
import { cors } from "hono/cors";
import { Variables } from "./types.js";
import { storeMiddleware } from "./middleware/store.js";
import { verifyAuth } from "./middlewares/verifyAuth.js";
import products from "./routes/products.js";
import orders from "./routes/orders.js";
import webhooks from "./routes/webhooks.js";
import auth from "./routes/auth.js";
import admin from "./routes/admin.js";
import store from "./routes/store.js";

/**
 * @file index.ts
 * Servidor Principal (Hono) nativo do Cloudflare Edge Worker.
 * Responsável estritamente pela Orquestração Limpa e Injeção de Dependências.
 */
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// --- 0. CORS (permite origem do frontend em dev) ---
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-store-slug"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
  })
);

// --- 1. MIDDLEWARES DE ISOLAMENTO ---
app.use('/api/*', storeMiddleware);
app.use('/api/admin/*', verifyAuth);

// --- 2. ROTEADORES MODULARES (BUSINESS RULES) ---
app.route('/api/products', products);
app.route('/api/orders', orders);
app.route('/api', auth); // Utiliza '/api' base para suportar urls nativas curtas ex: '/api/users/me'
app.route("/api/webhooks", webhooks);
app.route("/api/admin", admin);
app.route("/api/store", store);

app.get("/api/health", (c) =>
  c.json({ success: true, data: { ok: true, timestamp: Date.now() } })
);

export default app;