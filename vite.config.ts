import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Les assets (cartes, sprites, sons) sont servis tels quels depuis assets/.
  publicDir: 'assets',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Phaser dans son propre chunk pour un meilleur cache navigateur.
        codeSplitting: {
          groups: [{ name: 'phaser', test: /node_modules.phaser/ }],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
