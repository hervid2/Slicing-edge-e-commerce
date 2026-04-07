import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../modules/auth/auth.service';
import { AppError } from '../../middleware/error-handler';
import { createMockPrisma } from '../helpers/mock-prisma';

// Mock bcryptjs so tests don't spend time on real hashing
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: AuthService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AuthService(prisma);
  });

  // ─── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates user and verification token for a new email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user_1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'CUSTOMER',
      });
      prisma.verificationToken.create.mockResolvedValue({
        identifier: 'alice@example.com',
        token: 'tok',
        expires: new Date(),
      });

      const result = await service.register({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
      });
      expect(prisma.user.create).toHaveBeenCalledOnce();
      expect(result.user.email).toBe('alice@example.com');
      expect(result.verificationToken).toBeDefined();
    });

    it('throws 409 when email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing_user',
        email: 'alice@example.com',
      });

      await expect(
        service.register({ name: 'Alice', email: 'alice@example.com', password: 'pass' }),
      ).rejects.toThrow(AppError);

      await expect(
        service.register({ name: 'Alice', email: 'alice@example.com', password: 'pass' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('does not expose the real password in the returned user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user_2',
        name: 'Bob',
        email: 'bob@example.com',
        passwordHash: 'hashed_password',
        role: 'CUSTOMER',
      });
      prisma.verificationToken.create.mockResolvedValue({});

      const { user } = await service.register({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret',
      });

      expect((user as Record<string, unknown>).password).toBeUndefined();
    });
  });

  // ─── verifyEmail ─────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('marks user email as verified and deletes the token', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'alice@example.com',
        token: 'valid_token',
        expires: new Date(Date.now() + 60_000), // future
      });
      prisma.user.update.mockResolvedValue({});
      prisma.verificationToken.delete.mockResolvedValue({});

      const result = await service.verifyEmail('valid_token');

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
        data: expect.objectContaining({ emailVerified: expect.any(Date) }),
      });
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid_token' },
      });
    });

    it('throws 400 for an expired token', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'alice@example.com',
        token: 'old_token',
        expires: new Date(Date.now() - 1000), // past
      });

      await expect(service.verifyEmail('old_token')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('throws 400 for a non-existent token', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('ghost_token')).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // ─── requestPasswordReset ────────────────────────────────────────────────────

  describe('requestPasswordReset', () => {
    it('returns a reset token for a known email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user_1',
        email: 'alice@example.com',
        name: 'Alice',
      });
      prisma.verificationToken.upsert.mockResolvedValue({});

      const result = await service.requestPasswordReset('alice@example.com');

      expect(result).not.toBeNull();
      expect(result?.resetToken).toBeDefined();
      expect(prisma.verificationToken.upsert).toHaveBeenCalledOnce();
    });

    it('returns null for an unknown email (no enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset('ghost@example.com');

      expect(result).toBeNull();
      expect(prisma.verificationToken.upsert).not.toHaveBeenCalled();
    });
  });

  // ─── resetPassword ───────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('updates the password and deletes the reset token on success', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'reset:alice@example.com',
        token: 'reset_token',
        expires: new Date(Date.now() + 60_000),
      });
      prisma.user.update.mockResolvedValue({});
      prisma.verificationToken.delete.mockResolvedValue({});

      const result = await service.resetPassword('reset_token', 'newPassword123');

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
        data: { passwordHash: 'hashed_password' },
      });
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'reset_token' },
      });
    });

    it('throws 400 for an expired reset token', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'reset:alice@example.com',
        token: 'expired_token',
        expires: new Date(Date.now() - 1000),
      });

      await expect(service.resetPassword('expired_token', 'newPass')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('throws 400 for a token that is not a reset token', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        identifier: 'alice@example.com', // no "reset:" prefix
        token: 'verify_token',
        expires: new Date(Date.now() + 60_000),
      });

      await expect(service.resetPassword('verify_token', 'newPass')).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
