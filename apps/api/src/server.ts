import 'dotenv/config';
import { buildApp, PORT } from './app';

/** Critical env vars required in every environment. Missing any → refuse to start. */
const REQUIRED_ENV = ['DATABASE_URL', 'AUTH_SECRET'] as const;

/** Additional vars required in production. Missing any → refuse to start in prod. */
const REQUIRED_PROD_ENV = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'FRONTEND_URL'] as const;

/** Optional vars — missing triggers a warning but not a hard failure. */
const OPTIONAL_ENV = [
  'RESEND_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'ANTHROPIC_API_KEY',
  'UPSTASH_REDIS_REST_URL',
] as const;

function validateEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) missing.push(key);
  }

  if (process.env.NODE_ENV === 'production') {
    for (const key of REQUIRED_PROD_ENV) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const warnings = OPTIONAL_ENV.filter((key) => !process.env[key]);
  if (warnings.length > 0) {
    console.warn(`[startup] Optional env vars not set (some features may be disabled): ${warnings.join(', ')}`);
  }
}

async function start() {
  validateEnv();

  try {
    const app = await buildApp();
    const HOST = process.env.HOST || '0.0.0.0';
    await app.listen({ port: PORT, host: HOST });
    console.log(`Slicing Edge API running at http://${HOST}:${PORT}`);
    console.log(`API docs available at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
