import * as Sentry from "@sentry/nextjs";

/**
 * Sentry server-side configuration.
 * Captures errors from Server Components, Route Handlers, and Server Actions.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Disable in development to avoid noise.
  enabled: process.env.NODE_ENV === "production",
});
