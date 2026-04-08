import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const outDir = env.FOUNDRY_MODULE_PATH || 'build';
  const isProd = mode === 'production';

  return {
    plugins: [
      vue(),
      vueDevTools(),
      viteStaticCopy({
        targets: [
          {
            src: 'static/**/*',
            dest: '.',
          },
          {
            src: 'module.json',
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
              return 'dist/module.css';
            }
            return 'assets/[name][extname]';
          },
        },
      },
    },
  };
});
