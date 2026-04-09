import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Upstash Redis-backed distributed rate limiter.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are present the
 * limiter uses Redis sliding-window counters so limits are shared across
 * multiple API instances (production).
 *
 * When the env vars are absent (local dev / CI) the plugin no-ops and
 * the existing @fastify/rate-limit in-memory limiter remains active.
 */
export const upstashRateLimitPlugin = fp(async (app: FastifyInstance) => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    app.log.warn(
      'UPSTASH_REDIS_REST_URL / TOKEN not set — distributed rate-limit skipped, using in-memory fallback',
    );
    return;
  }

  const redis = new Redis({ url, token });

  /** Global limiter: 100 req / minute per IP */
  const globalLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'se:rl:global',
    analytics: false,
  });

  /** Chatbot limiter: 10 req / minute per IP */
  const chatbotLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'se:rl:chatbot',
    analytics: false,
  });

  /**
   * Resolves the real client IP, respecting X-Forwarded-For set by a
   * trusted reverse proxy (Railway / Vercel).
   */
  function resolveIp(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return first?.trim() ?? request.ip;
    }
    return request.ip;
  }

  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const isChatbot = request.url.startsWith('/api/chatbot');
    const limiter = isChatbot ? chatbotLimiter : globalLimiter;
    const ip = resolveIp(request);

    const { success, limit, remaining, reset } = await limiter.limit(ip);

    reply.header('X-RateLimit-Limit', String(limit));
    reply.header('X-RateLimit-Remaining', String(remaining));
    reply.header('X-RateLimit-Reset', new Date(reset).toISOString());

    if (!success) {
      return reply.status(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }
  });

  app.log.info('Upstash Redis rate limiter registered (distributed mode)');
});
