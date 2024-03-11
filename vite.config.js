import { defineConfig } from "vite";
export default defineConfig({
  base: "./docs",
  build: {
    outDir: "./docs",
    emptyOutDir: true,
  },
});
