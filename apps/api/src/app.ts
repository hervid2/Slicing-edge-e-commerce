import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rawBody from 'fastify-raw-body';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { PrismaClient } from '@slicing-edge/db';
import { prismaPlugin } from './plugins/prisma';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './modules/health/health.controller';
import { authRoutes } from './modules/auth/auth.controller';
import { productRoutes } from './modules/product/product.controller';
import { categoryRoutes } from './modules/category/category.controller';
import { cartRoutes } from './modules/cart/cart.controller';
import { orderRoutes } from './modules/order/order.controller';
import { checkoutRoutes } from './modules/checkout/checkout.controller';
import { uploadRoutes } from './modules/upload/upload.controller';
import { reviewRoutes } from './modules/review/review.controller';
import { wishlistRoutes } from './modules/wishlist/wishlist.controller';
import { metricsRoutes } from './modules/metrics/metrics.controller';
import { userRoutes } from './modules/user/user.controller';
import { chatbotRoutes } from './modules/chatbot/chatbot.controller';
import { loggerConfig } from './lib/logger';

const PORT = Number(process.env.PORT) || 3001;

interface BuildAppOptions {
  /** When provided, overrides the real Prisma plugin with this mock (test use only). */
  overridePrisma?: PrismaClient;
}

/**
 * Builds and fully initialises the Fastify application.
 * Accepts an optional `overridePrisma` for test environments so no real database
 * connection is required.
 */
export async function buildApp({ overridePrisma }: BuildAppOptions = {}) {
  const isTest = Boolean(overridePrisma);

  const app = Fastify({
    logger: isTest ? false : loggerConfig,
  });

  if (!isTest) {
    await app.register(helmet);
    await app.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });
    await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
    await app.register(swagger, {
      openapi: {
        info: { title: 'Slicing Edge API', description: 'REST API', version: '1.0.0' },
      },
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }

  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  });

  if (overridePrisma) {
    app.decorate('prisma', overridePrisma);
  } else {
    await app.register(prismaPlugin);
  }

  app.setErrorHandler(errorHandler);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(productRoutes, { prefix: '/api' });
  await app.register(categoryRoutes, { prefix: '/api' });
  await app.register(cartRoutes, { prefix: '/api' });
  await app.register(orderRoutes, { prefix: '/api' });
  await app.register(checkoutRoutes, { prefix: '/api' });
  await app.register(uploadRoutes, { prefix: '/api' });
  await app.register(reviewRoutes, { prefix: '/api' });
  await app.register(wishlistRoutes, { prefix: '/api' });
  await app.register(metricsRoutes, { prefix: '/api' });
  await app.register(userRoutes, { prefix: '/api' });
  await app.register(chatbotRoutes, { prefix: '/api' });

  return app;
}

export { PORT };
