import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/attendance/", // <-- important for GitHub Pages repo named 'attendance'
  plugins: [react()],
});
