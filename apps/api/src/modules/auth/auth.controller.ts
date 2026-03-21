import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@slicing-edge/shared';
import { AuthService } from './auth.service';

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app.prisma);

  app.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);
    const { user, verificationToken } = await authService.register(body);

    // TODO: Send verification email via @slicing-edge/email
    request.log.info(
      { userId: user.id, email: user.email },
      'User registered — verification email pending',
    );

    return reply.status(201).send({
      message: 'Account created. Please check your email to verify your account.',
    });
  });

  app.get(
    '/auth/verify-email',
    async (request: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
      const { token } = request.query;
      await authService.verifyEmail(token);

      return reply.send({ message: 'Email verified successfully.' });
    },
  );

  app.post('/auth/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = forgotPasswordSchema.parse(request.body);
    const result = await authService.requestPasswordReset(email);

    if (result) {
      // TODO: Send password reset email via @slicing-edge/email
      request.log.info({ email }, 'Password reset requested');
    }

    // Always return success to not reveal whether user exists
    return reply.send({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  });

  app.post('/auth/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, password } = resetPasswordSchema.parse(request.body);
    await authService.resetPassword(token, password);

    return reply.send({ message: 'Password reset successfully.' });
  });
}
