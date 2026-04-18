import * as Sentry from "@sentry/nextjs";

/**
 * Sentry client-side configuration.
 * Errors thrown in browser JS are captured here.
 * DSN is loaded from NEXT_PUBLIC_SENTRY_DSN at build time.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of transactions for performance monitoring in production.
  // Raise to 1.0 during initial rollout to gather baseline data.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture 10 % of sessions for session replay in production.
  replaysSessionSampleRate: 0.1,
  // Always capture a replay when an error is recorded.
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media to protect user privacy.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Disable in development to avoid noise.
  enabled: process.env.NODE_ENV === "production",
});
