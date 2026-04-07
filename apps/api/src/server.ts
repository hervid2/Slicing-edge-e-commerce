import 'dotenv/config';
import { buildApp, PORT } from './app';

async function start() {
  try {
    const app = await buildApp();
    const HOST = process.env.HOST || '0.0.0.0';
    await app.listen({ port: PORT, host: HOST });
    console.log(`🔪 Slicing Edge API running at http://${HOST}:${PORT}`);
    console.log(`📖 API docs available at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
