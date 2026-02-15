import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Nova — Daily Routine Planner",
        short_name: "Nova",
        description: "A calm daily time-block routine planner.",
        start_url: "/",
        display: "standalone",
        theme_color: "#0b0f14",
        background_color: "#0b0f14",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});
