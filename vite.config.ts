import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@vue/devtools-api": fileURLToPath(
        new URL("./src/shims/vue-devtools-api.ts", import.meta.url),
      ),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData:
          `$app-bg: #ffffff;\n$grouped-bg: #e5e5ea;\n$card-bg: #ffffff;\n`,
      },
    },
  },
  plugins: [uni()],
});
