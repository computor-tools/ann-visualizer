import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import license from 'rollup-plugin-license';
import { fileURLToPath } from 'url';
import path from 'path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), viteSingleFile()],

  build: {
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      plugins: [
        license({
          sourcemap: true,
          thirdParty: {
            includePrivate: true,
            output: {
              file: path.join(dirname, 'dist', 'dependencies.txt'),
            },
          },
        }),
      ],
    },
  },
});
