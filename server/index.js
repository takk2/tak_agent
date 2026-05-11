import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  },
});

// CORS 설정
await fastify.register(cors, {
  origin: true,
});

// Static files (프론트엔드 빌드)
const frontendDist = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'dist');
await fastify.register(staticFiles, {
  root: frontendDist,
  prefix: '/',
});

// Routes
import authRoutes from './routes/auth.js';
import configRoutes from './routes/config.js';

await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(configRoutes, { prefix: '/api/config' });

// Health check
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// SPA fallback
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api')) {
    reply.code(404).send({ error: 'Not found' });
  } else {
    reply.sendFile('index.html');
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
