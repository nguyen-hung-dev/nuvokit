import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import appPackage from "../../package.json" with { type: "json" };
const version = appPackage.version;

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  server: { port: 1420, strictPort: true },
  build: { target: ["es2022", "chrome109", "safari15"] },
  clearScreen: false,
});
