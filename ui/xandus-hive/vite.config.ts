import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, "../../dist/control-ui"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@xandus/shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  server: {
    proxy: {
      "/ws": {
        target: "ws://localhost:18789",
        ws: true,
      },
    },
  },
});
