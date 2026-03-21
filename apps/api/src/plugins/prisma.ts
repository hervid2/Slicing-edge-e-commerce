import fp from 'fastify-plugin';
import { PrismaClient } from '@slicing-edge/db';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../middleware/error-handler';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const prismaPlugin = fp(async (app: FastifyInstance) => {
  if (!process.env.DATABASE_URL) {
    app.log.warn('DATABASE_URL not set — database features disabled');
    const unavailableMethod = () => {
      throw new AppError(
        'Database is not configured. Set DATABASE_URL to enable this feature.',
        503,
      );
    };

    const unavailableModel: any = new Proxy(
      {},
      {
        get() {
          return unavailableMethod;
        },
      },
    );

    const unavailablePrisma: any = new Proxy(
      {},
      {
        get() {
          return unavailableModel;
        },
      },
    );

    app.decorate('prisma', unavailablePrisma as PrismaClient);
    return;
  }

  const prisma = new PrismaClient();

  await prisma.$connect();
  app.log.info('Database connected');

  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    app.log.info('Database disconnected');
  });
});
