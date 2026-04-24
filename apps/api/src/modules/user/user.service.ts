import type { PrismaClient } from '@slicing-edge/db';
import crypto from 'node:crypto';
import { AppError } from '../../middleware/error-handler';

type UserRole = 'CUSTOMER' | 'ADMIN';

/**
 * Business logic for admin user management.
 */
export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Returns a paginated list of users with order count.
   * Supports optional search by name or email.
   */
  async listUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
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
      this.prisma.user.count({ where }),
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

  /**
   * Permanently deletes a user account.
   * Admins cannot delete their own account.
   *
   * @throws {AppError} 403 if self-deletion, 404 if user not found.
   */
  async deleteUser(targetUserId: string, requestingUserId: string) {
    if (targetUserId === requestingUserId) {
      throw new AppError('You cannot delete your own account.', 403);
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new AppError('User not found', 404);

    await this.prisma.user.delete({ where: { id: targetUserId } });
    return { deleted: true };
  }

  /**
   * Creates a new admin account and returns an activation token.
   * The caller is responsible for sending the invitation email.
   *
   * @throws {AppError} 409 if email is already in use.
   */
  async inviteAdmin(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        role: 'ADMIN',
      },
    });

    const setupToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: `reset:${email}`,
          token: setupToken,
        },
      },
      update: { token: setupToken, expires },
      create: {
        identifier: `reset:${email}`,
        token: setupToken,
        expires,
      },
    });

    return { user, setupToken };
  }
}
