import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "regardless-responsibilities-lance-allows.trycloudflare.com",
      "scan-induced-widely-ext.trycloudflare.com",
      "you-tariff-brunette-wine.trycloudflare.com",
    ],
    proxy: {
      '/api': {
        target: 'http://192.168.43.178:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
