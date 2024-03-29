import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    outDir: "./docs",
    emptyOutDir: true,
    target: "esnext",
  },
  port: 5173,
});
