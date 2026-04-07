import { vi } from 'vitest';
import type { PrismaClient } from '@slicing-edge/db';

/**
 * Creates a minimal PrismaClient mock using Vitest spies.
 * Each model method is a `vi.fn()` that resolves to `null` by default.
 * Override per-test with `.mockResolvedValueOnce(...)`.
 */
export function createMockPrisma() {
  const mock = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    cart: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cartItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    orderStatusHistory: {
      create: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    wishlist: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(
      async (operations: Array<Promise<unknown>> | ((tx: unknown) => Promise<unknown>)) => {
        if (Array.isArray(operations)) {
          return Promise.all(operations);
        }
        // Functional form: pass the mock itself as the "transaction" client
        return operations(mock);
      },
    ),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };

  return mock as unknown as PrismaClient & typeof mock;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
