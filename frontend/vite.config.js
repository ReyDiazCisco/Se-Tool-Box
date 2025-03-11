import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // ensures relative paths in your final build
  plugins: [react()],
});
