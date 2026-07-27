import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 5000,
    hookTimeout: 60_000,
    teardownTimeout: 30_000,
    fileParallelism: false,
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      '../../packages/auth/src/**/*.test.ts',
      '../../packages/permissions/src/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '#': path.resolve(__dirname, './src'),
      // Production uses the real package (throws in client bundles).
      'server-only': path.resolve(__dirname, './src/test/server-only-shim.ts'),
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
})
