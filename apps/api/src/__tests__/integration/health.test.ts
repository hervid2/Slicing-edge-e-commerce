import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/build-test-app';

describe('GET /api/health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with status=ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ status: string; service: string; timestamp: string }>();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('slicing-edge-api');
    expect(body.timestamp).toBeDefined();
  });

  it('returns a valid ISO timestamp', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    const { timestamp } = response.json<{ timestamp: string }>();
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('returns 404 for an unknown route', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(response.statusCode).toBe(404);
  });
});
