import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: "./",
  plugins: [viteReact(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  publicDir: false,
  build: {
    outDir: "dist-play",
    emptyOutDir: true,
    assetsDir: "assets",
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: path.resolve(__dirname, "play.html"),
      output: {
        format: "iife",
        name: "GizmoAttackApp",
        entryFileNames: "assets/play.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
        inlineDynamicImports: true,
      },
    },
  },
});
