import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./src/tests/setup.js"] },
  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  resolve: {
    alias: [
      // Version 7 also ships a browser UMD entry. Use its ESM component so the
      // date picker remains a React component when Vite pre-bundles it.
      {
        find: /^react-datepicker$/,
        replacement: fileURLToPath(
          new URL(
            "./node_modules/react-datepicker/dist/es/index.js",
            import.meta.url,
          ),
        ),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
});
