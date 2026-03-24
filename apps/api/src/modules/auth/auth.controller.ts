import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@slicing-edge/shared';
import { sendEmail, WelcomeEmail, PasswordResetEmail } from '@slicing-edge/email';
import { AuthService } from './auth.service';

/**
 * Registers authentication and account recovery routes.
 */
export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app.prisma);

  app.post('/auth/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register account',
      description: 'Creates a customer account and issues an email verification token.',
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);
    const { user, verificationToken } = await authService.register(body);
    const resendConfigured = Boolean(process.env.RESEND_API_KEY);
    const apiBaseUrl = `${request.protocol}://${request.headers.host}`;
    const verificationUrl = `${apiBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;

    if (!resendConfigured) {
      request.log.info(
        { userId: user.id, email: user.email, verificationUrl },
        'User registered — RESEND_API_KEY missing, verification email not sent',
      );
    } else {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Welcome to Slicing Edge — Verify your email',
          react: WelcomeEmail({
            name: user.name || 'there',
            verificationUrl,
          }),
        });

        request.log.info({ userId: user.id, email: user.email }, 'Welcome verification email sent');
      } catch (error) {
        request.log.error(
          { err: error, userId: user.id, email: user.email },
          'Failed to send welcome verification email',
        );
      }
    }

    return reply.status(201).send({
      message: 'Account created. Please check your email to verify your account.',
    });
  });

  app.get(
    '/auth/verify-email',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Verify email',
        description: 'Verifies the account associated with the provided verification token.',
        querystring: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
      const { token } = request.query;
      await authService.verifyEmail(token);

      return reply.send({ message: 'Email verified successfully.' });
    },
  );

  app.post('/auth/forgot-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Request password reset',
      description: 'Generates a password reset token and sends email if account exists.',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = forgotPasswordSchema.parse(request.body);
    const result = await authService.requestPasswordReset(email);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resendConfigured = Boolean(process.env.RESEND_API_KEY);

    if (result) {
      const resetUrl = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(result.resetToken)}`;

      if (!resendConfigured) {
        request.log.info(
          { email, resetUrl },
          'Password reset requested — RESEND_API_KEY missing, email not sent',
        );
      } else {
        try {
          await sendEmail({
            to: email,
            subject: 'Reset your Slicing Edge password',
            react: PasswordResetEmail({
              name: result.user.name || 'there',
              resetUrl,
            }),
          });

          request.log.info({ email }, 'Password reset email sent');
        } catch (error) {
          request.log.error({ err: error, email }, 'Failed to send password reset email');
        }
      }
    }

    // Always return success to not reveal whether user exists
    return reply.send({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  });

  app.post('/auth/reset-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Reset password',
      description: 'Resets account password using a valid reset token.',
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, password } = resetPasswordSchema.parse(request.body);
    await authService.resetPassword(token, password);

    return reply.send({ message: 'Password reset successfully.' });
  });
}
