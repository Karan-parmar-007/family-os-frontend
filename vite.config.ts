import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: 1577,
    strictPort: true,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/familyos': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    devtools(),
    nitro({
      devProxy: {
        '/api/auth': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/api/familyos': {
          target: 'http://localhost:8003',
          changeOrigin: true,
        },
      },
      rollupConfig: { external: [/^@sentry\//] },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})

export default config
