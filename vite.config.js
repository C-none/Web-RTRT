import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    outDir: "./docs",
    emptyOutDir: true,
  },
  port: 5173,
});