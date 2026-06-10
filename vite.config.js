import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build use relative asset paths, so the same `dist`
// works on GitHub Pages (any repo name), Vercel, Netlify, or opened locally —
// no need to hardcode a repo subpath.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
