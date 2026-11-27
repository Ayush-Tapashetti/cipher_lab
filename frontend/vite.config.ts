import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env['DEV_PORT'] ?? 5173) },
  preview: { port: Number(process.env['PREVIEW_PORT'] ?? 4173) },
  build: { target: 'es2022', assetsInlineLimit: 0 }, // nothing inlined as a data: URI, so the CSP can stay strict
});
