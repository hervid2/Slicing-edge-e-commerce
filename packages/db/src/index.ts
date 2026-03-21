export { PrismaClient, Prisma } from '@prisma/client';
export type {
  User,
  Account,
  Session,
  VerificationToken,
  Address,
  Category,
  Product,
  ProductImage,
  Wishlist,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatusHistory,
  Review,
} from '@prisma/client';
export { UserRole, OrderStatus } from '@prisma/client';

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
