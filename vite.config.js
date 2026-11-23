import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  server: { host: "0.0.0.0" },
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        studio: fileURLToPath(new URL("./studio.html", import.meta.url))
      }
    }
  }
});
