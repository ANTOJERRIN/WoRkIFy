import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { assertPublicBrowserKey, readPublicConfig } from './src/config/runtime.ts'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_')
  assertPublicBrowserKey(env.VITE_SUPABASE_ANON_KEY)
  if (command === 'build') readPublicConfig(env)

  return {
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'workify-browser-boundary',
        generateBundle(_options, bundle) {
          const root = fileURLToPath(new URL('.', import.meta.url)).replaceAll('\\', '/')
          const privateRoots = [`${root}backend/`, `${root}tests/`]
          for (const output of Object.values(bundle)) {
            if (output.type !== 'chunk') continue
            for (const moduleId of Object.keys(output.modules)) {
              const path = moduleId.replaceAll('\\', '/')
              if (privateRoots.some(directory => path.startsWith(directory))) {
                this.error(`Non-application module included in browser output: ${moduleId}`)
              }
            }
          }
        },
      },
    ],
  }
})
