import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
export default defineConfig({
  base: "./",
  build: {
    outDir: "./docs",
    emptyOutDir: true,
    target: "esnext",
  },
  plugins: [basicSsl()],
  port: 5173,
});
