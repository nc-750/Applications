import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://mirror.nc750.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
