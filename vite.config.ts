import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    allowedHosts: true,
    proxy: {
      // Encaminha /api/* para o Worker (login e admin). Use npm run dev + wrangler dev em paralelo.
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
