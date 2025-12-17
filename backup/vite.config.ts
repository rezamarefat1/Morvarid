import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to safely import optional plugins
async function getOptionalPlugins() {
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const cartographer = await import("@replit/vite-plugin-cartographer");
      const devBanner = await import("@replit/vite-plugin-dev-banner");
      return [cartographer.cartographer(), devBanner.devBanner()];
    } catch (e) {
      console.warn("Optional plugins not available:", e.message);
      return [];
    }
  }
  return [];
}

export default defineConfig(async () => {
  const optionalPlugins = await getOptionalPlugins();

  return {
    plugins: [
      react(),
      // Dynamically handled through runtime instead of as plugin
      ...optionalPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist", "public"),
      emptyOutDir: true,
    },
    server: {
      host: '127.0.0.1', // Use 127.0.0.1 for Windows compatibility
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
