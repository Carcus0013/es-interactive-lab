/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`      -> one self-contained dist/index.html (code, styles and fonts inlined).
//                         Browsers refuse to load separate module files from disk (file://),
//                         so this is the build that works when you double-click it.
// `npm run build:web`  -> multi-file build in dist-web/ with lazy-loaded chunks, for hosting on a web server.
export default defineConfig(({ mode }) => {
  const web = mode === 'web';
  return {
    base: './',
    plugins: [react(), ...(web ? [] : [viteSingleFile()])],
    build: {
      outDir: web ? 'dist-web' : 'dist',
      chunkSizeWarningLimit: 2500,
    },
    server: { port: 5173, open: false },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  };
});
