import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/attendance/", // <-- important for GitHub Pages repo named 'attendance'
  plugins: [react()],
});
