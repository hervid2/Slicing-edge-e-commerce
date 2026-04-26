import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rawBody from 'fastify-raw-body';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { PrismaClient } from '@slicing-edge/db';
import { prismaPlugin } from './plugins/prisma';
import { upstashRateLimitPlugin } from './plugins/upstash-rate-limit';
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
import { returnRoutes } from './modules/return/return.controller';
import { contactRoutes } from './modules/contact/contact.controller';
import { faqRoutes } from './modules/faq/faq.controller';
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
    // ── Helmet with CSP ────────────────────────────────────────────────────
    await app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      // Allow Swagger UI to load its embedded assets in dev
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
    });

    // ── CORS — multi-origin for production ─────────────────────────────────
    // Set ALLOWED_ORIGINS=https://example.com,https://preview.example.com
    // Falls back to FRONTEND_URL or localhost for local dev.
    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000'
    )
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    await app.register(cors, {
      origin: (origin, cb) => {
        // Allow server-to-server requests (no Origin header) and allowed origins
        if (!origin || allowedOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(new Error(`CORS: origin "${origin}" not allowed`), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    // ── Rate limiting — in-memory fallback; Upstash used when env vars set ─
    await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
    await app.register(upstashRateLimitPlugin);

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
  await app.register(returnRoutes, { prefix: '/api' });
  await app.register(contactRoutes, { prefix: '/api' });
  await app.register(faqRoutes, { prefix: '/api' });

  return app;
}

export { PORT };
