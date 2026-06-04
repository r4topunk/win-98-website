import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Inject <link rel="preconnect"/"dns-prefetch"> for the Supabase origin at
// build time. The app calls Supabase immediately on mount (GalleriesProvider →
// fetchAll), so warming the DNS+TLS handshake during HTML parse shaves ~100-300ms
// off the first data request on cold connections. The URL is read from
// VITE_SUPABASE_URL so it stays multi-env safe (no hardcoding).
function supabasePreconnectPlugin(): Plugin {
  return {
    name: "supabase-preconnect",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const env = loadEnv(ctx.server ? "development" : "production", process.cwd(), "");
        const supabaseUrl = env.VITE_SUPABASE_URL;
        if (!supabaseUrl) return html;
        let origin: string;
        try {
          origin = new URL(supabaseUrl).origin;
        } catch {
          return html;
        }
        const tags = [
          `<link rel="preconnect" href="${origin}" crossorigin />`,
          `<link rel="dns-prefetch" href="${origin}" />`,
        ].join("\n    ");
        return html.replace("  </head>", `    ${tags}\n  </head>`);
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), supabasePreconnectPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-redux": ["react-redux", "@reduxjs/toolkit"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-audio": ["howler"],
        },
      },
    },
  },
});
