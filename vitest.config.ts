import { defineConfig } from 'vitest/config'
import solidPlugin from 'vite-plugin-solid'
import path from 'path'

export default defineConfig(({ mode }) => {
  const testSSR = mode === 'test:ssr' || mode === 'ssr'

  return {
    plugins: [
      solidPlugin({
        // https://github.com/solidjs/solid-refresh/issues/29
        hot: false,
        // For testing SSR we need to do a SSR JSX transform
        solid: { generate: testSSR ? 'ssr' : 'dom' },
      }),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: './test/setup.ts',
    },
    resolve: {
      alias: {
        src: path.resolve(__dirname, './src'),
      },
    },
  }
})
