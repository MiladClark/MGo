import path from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mgoUpdatePlugin } from "./vite-plugin-mgo-update";
import { tsMimeFixPlugin } from "./vite-plugin-ts-mime";

const host = process.env.TAURI_DEV_HOST;
const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
) as { version: string };

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(command === "serve" ? [tsMimeFixPlugin(), mgoUpdatePlugin()] : []),
  ],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    headers: {
      "X-Content-Type-Options": "nosniff",
    },
    proxy: {
      "/api/lmstudio": {
        target: "http://127.0.0.1:1234",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/lmstudio/, ""),
      },
    },
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
