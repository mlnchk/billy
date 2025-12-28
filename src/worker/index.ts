import { webhookCallback } from "grammy";
import { createBot } from "./bot";
import { createAiService } from "./services/ai";
import { setupDb } from "./services/db";
import { Hono } from "hono";
import { apiRouter } from "./routes/api";
import { setBotWebhook } from "./bot/set-bot-webhook";

export const app = new Hono<{ Bindings: Env }>();

app.route("/api/client", apiRouter);

app.use(`/api/bot/*`, async (c) => {
  console.log("bot webhook", c.req.path);

  // TODO: fix env type
  const bot = await createBot({
    botToken: c.env.BOT_TOKEN,
    aiService: createAiService(c.env.GOOGLEAI_API_KEY),
    db: setupDb(c.env.BILLY_DB),
  });

  return webhookCallback(bot, "hono", { timeoutMilliseconds: 100_000 })(c);
});

// FIXME: for some reason do not work before HMR
setBotWebhook();

export default app;
