import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    outDir: "./docs",
    emptyOutDir: true,
    target: "esnext",
  },
  features: {
    topLevelAwait: true,
  },
  port: 5173,
});
