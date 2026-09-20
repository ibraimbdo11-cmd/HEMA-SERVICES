import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The hosted preview proxies HTTP but does not expose Vite's HMR socket.
      // Disable the client socket there so the preview cannot report premature
      // WebSocket closures while the app itself is still available.
      hmr: false,
      watch: null,
      allowedHosts: true as const,
    },
  };
});
