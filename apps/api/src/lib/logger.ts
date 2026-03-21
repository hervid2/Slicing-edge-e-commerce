import type { FastifyServerOptions } from 'fastify';

export const loggerConfig: FastifyServerOptions['logger'] =
  process.env.NODE_ENV !== 'production'
    ? {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
        redact: {
          paths: ['req.headers.authorization', 'req.body.password', 'req.body.passwordHash'],
          censor: '[REDACTED]',
        },
      }
    : {
        level: process.env.LOG_LEVEL || 'info',
        redact: {
          paths: ['req.headers.authorization', 'req.body.password', 'req.body.passwordHash'],
          censor: '[REDACTED]',
        },
      };
