import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';

type UserRole = 'CUSTOMER' | 'ADMIN';

/**
 * Business logic for admin user management.
 */
export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Returns a paginated list of users with order count.
   */
  async listUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          image: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Updates a user's role.
   * Prevents admins from changing their own role to avoid lockout.
   *
   * @throws {AppError} 400 if role is invalid, 403 if self-demotion, 404 if user not found.
   */
  async updateRole(targetUserId: string, role: string, requestingUserId: string) {
    if (role !== 'CUSTOMER' && role !== 'ADMIN') {
      throw new AppError('Invalid role. Must be CUSTOMER or ADMIN.', 400);
    }

    if (targetUserId === requestingUserId) {
      throw new AppError('You cannot change your own role.', 403);
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new AppError('User not found', 404);

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: role as UserRole },
      select: { id: true, name: true, email: true, role: true },
    });
  }
}
