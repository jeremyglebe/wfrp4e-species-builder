import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

import { resolve } from 'path';
import { readFileSync } from 'fs';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import stripJsonComments from 'strip-json-comments';

/**
 * Vite plugin that reads module.jsonc, strips comments, and emits module.json
 * into the build output. This lets you annotate module.json with // comments
 * in the source repo without shipping them to Foundry.
 */
function moduleJsonPlugin(): Plugin {
  return {
    name: 'module-jsonc',
    generateBundle() {
      const raw = readFileSync(resolve(__dirname, 'module.jsonc'), 'utf-8');
      const stripped = stripJsonComments(raw);
      const clean = JSON.stringify(JSON.parse(stripped), null, 2);
      this.emitFile({
        type: 'asset',
        fileName: 'module.json',
        source: clean,
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const outDir = env.FOUNDRY_MODULE_PATH || 'build';
  const isProd = mode === 'production';

  return {
    plugins: [
      vue(),
      vueDevTools(),
      moduleJsonPlugin(),
      viteStaticCopy({
        targets: [
          {
            src: 'static/**/*',
            dest: '.',
          },
        ],
      }),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: true,
      lib: {
        entry: resolve(__dirname, 'src/module/index.ts'),
        formats: ['es'],
        fileName: () => 'dist/module.js',
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              // All CSS files imported somewhere in the app become a single built CSS file
              return 'dist/app.css';
            }
            return 'assets/[name][extname]';
          },
        },
      },
    },
  };
});
