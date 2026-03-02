import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const gatewayUrl = env.VITE_GATEWAY_URL || "ws://localhost:18789";
  const gatewayHttpUrl = gatewayUrl.replace(/^ws/, "http");

  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: path.resolve(__dirname, "./dist"),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/ws": {
          target: gatewayHttpUrl,
          ws: true,
        },
      },
    },
  };
});
