import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { courseAccessHandler } from './api/course-access.js';
import { videoSessionHandler } from './api/video-session.js';
import { videoStreamHandler } from './api/video-stream.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  const attachJsonHelpers = (res: any) => ({
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json(body: unknown) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    },
  });

  const attachQuery = (req: any) => {
    const url = new URL(req.url || '/', 'http://localhost');
    req.query = Object.fromEntries(url.searchParams.entries());
  };

  return {
    plugins: [
      react(),
      {
        name: 'dev-course-access-api',
        configureServer(server) {
          server.middlewares.use('/api/course-access', async (req, res) => {
            attachQuery(req);

            if (req.method === 'POST' || req.method === 'DELETE') {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              req.body = chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : '';
            }

            await courseAccessHandler(req as any, attachJsonHelpers(res));
          });

          server.middlewares.use('/api/video-session', async (req, res) => {
            attachQuery(req);
            await videoSessionHandler(req as any, attachJsonHelpers(res));
          });

          server.middlewares.use('/api/video-stream', async (req, res) => {
            attachQuery(req);
            await videoStreamHandler(req as any, res as any);
          });
        },
      },
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
