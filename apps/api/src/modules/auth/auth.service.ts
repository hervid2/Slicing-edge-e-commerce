import { PrismaClient } from '@slicing-edge/db';
import { hash } from 'bcryptjs';
import crypto from 'node:crypto';
import { AppError } from '../../middleware/error-handler';
import { stripHtml } from '../../lib/sanitize';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Registers a new customer account and creates an email verification token.
   *
   * @throws {AppError} When the email is already in use.
   */
  async register(data: { name: string; email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError('A user with this email already exists', 409);
    }

    const passwordHash = await hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: stripHtml(data.name),
        email: data.email,
        passwordHash,
        role: 'CUSTOMER',
      },
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.verificationToken.create({
      data: {
        identifier: data.email,
        token: verificationToken,
        expires,
      },
    });

    return { user, verificationToken };
  }

  /**
   * Verifies a user's email using a previously issued verification token.
   *
   * @throws {AppError} When the token is invalid or expired.
   */
  async verifyEmail(token: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expires < new Date()) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    await this.prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    });

    await this.prisma.verificationToken.delete({
      where: { token },
    });

    return true;
  }

  /**
   * Creates and stores a password reset token for an existing user.
   * Returns null when the email does not exist to avoid account enumeration.
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal whether user exists
    if (!user) return null;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: `reset:${email}`,
          token: resetToken,
        },
      },
      update: { token: resetToken, expires },
      create: {
        identifier: `reset:${email}`,
        token: resetToken,
        expires,
      },
    });

    return { user, resetToken };
  }

  /**
   * Resets the password associated with a valid reset token.
   *
   * @throws {AppError} When the token is invalid, expired, or not a reset token.
   */
  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expires < new Date() || !record.identifier.startsWith('reset:')) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const email = record.identifier.replace('reset:', '');
    const passwordHash = await hash(newPassword, 12);

    await this.prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await this.prisma.verificationToken.delete({
      where: { token },
    });

    return true;
  }
}
