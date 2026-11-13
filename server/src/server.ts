import { createApp } from './app.js';
import { env } from './config/env.js';
import { aiProvider } from './config/gemini.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[SignalDesk API] listening on http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
  console.log(`[SignalDesk API] CORS origin: ${env.CLIENT_ORIGIN}`);
  console.log(
    `[SignalDesk API] AI: ${aiProvider.configured ? `Gemini (${aiProvider.model})` : 'demo/mock mode (GEMINI_API_KEY not set)'}`
  );
});

function shutdown(signal: string) {
  console.log(`[SignalDesk API] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
