import path from 'node:path'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@rescript/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
      '@rescript/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
      '@rescript/permissions': path.resolve(
        __dirname,
        '../../packages/permissions/src/index.ts',
      ),
      '@rescript/database': path.resolve(
        __dirname,
        '../../packages/database/src/index.ts',
      ),
    },
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
