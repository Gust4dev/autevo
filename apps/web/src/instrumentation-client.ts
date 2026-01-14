// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f7a45b79b68f3b16e31323e771e4b615@o4510707525550080.ingest.us.sentry.io/4510707526336512",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: "dark",
      buttonLabel: "Reportar Bug",
      submitButtonLabel: "Enviar",
      cancelButtonLabel: "Cancelar",
      formTitle: "Reportar um Bug",
      nameLabel: "Nome",
      namePlaceholder: "Seu nome",
      emailLabel: "Email",
      emailPlaceholder: "seu@email.com",
      messageLabel: "Descrição do problema",
      messagePlaceholder: "O que aconteceu?",
      successMessageText: "Obrigado pelo feedback!",
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

