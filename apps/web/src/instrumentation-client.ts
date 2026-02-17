// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f7a45b79b68f3b16e31323e771e4b615@o4510707525550080.ingest.us.sentry.io/4510707526336512",

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Optimize tracing and replay rates for production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: process.env.NODE_ENV !== "production",
  sendDefaultPii: false, // Privacy & performance
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

