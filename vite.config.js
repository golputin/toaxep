import { defineConfig } from "vite";

const API = process.env.VITE_API_PROXY || "http://127.0.0.1:8787";

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: API,
        changeOrigin: true,
        // clearer than raw 404 when API is down
        configure: (proxy) => {
          proxy.on("error", (err, _req, res) => {
            console.error("[vite proxy]", err.message);
            if (res && !res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: {
                    code: "api_down",
                    message:
                      "OpenAgent API is not running on :8787. In another terminal run: npm run dev:api (or npm run dev)",
                  },
                })
              );
            }
          });
        },
      },
    },
  },
  // CRITICAL: preview also needs proxy — otherwise /api/chat → HTTP 404
  preview: {
    host: true,
    port: 4173,
    proxy: {
      "/api": {
        target: API,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
