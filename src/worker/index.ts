import { webhookCallback } from "grammy";
import { createBot } from "./bot";
// import { app } from "./server";
import { createAiService } from "./services/ai";
import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { setBotWebhook } from "./bot/set-bot-webhook";

export const app = new Hono<{ Bindings: Env }>();

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

app.use(`/api/bot/*`, async (c) => {
  console.log("bot webhook", c.req.path);

  // TODO: fix env type
  const bot = await createBot({
    botToken: c.env.BOT_TOKEN,
    aiService: createAiService(c.env.GOOGLEAI_API_KEY),
    db: c.env.BILLY_DB,
  });

  return webhookCallback(bot, "hono", { timeoutMilliseconds: 100_000 })(c);
});

// FIXME: for some reason do not work before HMR
setBotWebhook();

export default app;
