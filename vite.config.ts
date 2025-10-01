import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: './server.ts',
      exportName: 'app',
      tsCompiler: 'esbuild',
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    ssr: true,
    rollupOptions: {
      input: 'server.ts',
      output: {
        format: 'es',
      },
    },
  },
});
