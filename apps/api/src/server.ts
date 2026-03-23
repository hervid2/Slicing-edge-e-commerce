import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rawBody from 'fastify-raw-body';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { prismaPlugin } from './plugins/prisma';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './modules/health/health.controller';
import { authRoutes } from './modules/auth/auth.controller';
import { productRoutes } from './modules/product/product.controller';
import { categoryRoutes } from './modules/category/category.controller';
import { cartRoutes } from './modules/cart/cart.controller';
import { orderRoutes } from './modules/order/order.controller';
import { checkoutRoutes } from './modules/checkout/checkout.controller';
import { loggerConfig } from './lib/logger';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function buildApp() {
  const app = Fastify({
    logger: loggerConfig,
  });

  // ──── Security ────
  await app.register(helmet);
  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  });
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ──── Documentation ────
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Slicing Edge API',
        description: 'REST API for the Slicing Edge knife e-commerce platform',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // ──── Plugins ────
  await app.register(prismaPlugin);

  // ──── Error Handling ────
  app.setErrorHandler(errorHandler);

  // ──── Routes ────
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(productRoutes, { prefix: '/api' });
  await app.register(categoryRoutes, { prefix: '/api' });
  await app.register(cartRoutes, { prefix: '/api' });
  await app.register(orderRoutes, { prefix: '/api' });
  await app.register(checkoutRoutes, { prefix: '/api' });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port: PORT, host: HOST });
    console.log(`🔪 Slicing Edge API running at http://${HOST}:${PORT}`);
    console.log(`📖 API docs available at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
