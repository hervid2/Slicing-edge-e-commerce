import { buildApp } from '../../app';
import { createMockPrisma } from './mock-prisma';
import type { MockPrisma } from './mock-prisma';

/**
 * Builds a Fastify test instance with an injected mock PrismaClient.
 * No real database connection is made.
 */
export async function buildTestApp(mockPrisma?: MockPrisma) {
  const prisma = mockPrisma ?? createMockPrisma();
  const app = await buildApp({ overridePrisma: prisma });
  await app.ready();
  return { app, prisma };
}
