import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const disableHostedHmrClient = {
    name: 'disable-hosted-hmr-client',
    enforce: 'post' as const,
    configureServer(server: { middlewares: { use: (handler: (req: { url?: string }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/@vite/client')) {
          res.statusCode = 204;
          res.setHeader('Content-Type', 'application/javascript');
          res.end('');
          return;
        }
        next();
      });
    },
    transformIndexHtml(html: string) {
      // Vite injects this module even when hmr is disabled in middleware mode.
      // The hosted preview cannot expose the socket, so remove the injection
      // at the HTML boundary rather than serving a broken client module.
      return html.replace(/\s*<script[^>]+src=["'][^"']*\/@vite\/client[^"']*["'][^>]*><\/script>/gi, '');
    },
  };

  return {
    plugins: [disableHostedHmrClient, react(), tailwindcss()],
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
