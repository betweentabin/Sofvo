import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: "./static",
  base: "./",
  resolve: {
    alias: {
      axios: path.resolve(__dirname, 'src/vendor/axios-lite.js'),
    },
  },
});
