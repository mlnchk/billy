import { webhookCallback } from "grammy";
import { createBot } from "./bot";
// import { app } from "./server";
import { createAiService } from "./services/ai";
import { Hono } from "hono";
import { apiRouter } from "./routes/api";

// TODO: add webhook registration on start

export const app = new Hono<{ Bindings: Env }>();

app.route("/api/client", apiRouter);

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

export default app;
