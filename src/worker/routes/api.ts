// import { app } from "./server";
import { Hono } from "hono";
import { createStorageService } from "../services/storage";

export const apiRouter = new Hono<{ Bindings: Env }>().get(
  "/bill/:chatId/:messageId",
  async (c) => {
    const storageService = createStorageService({ kv: c.env.BILLY });
    const { chatId, messageId } = c.req.param();

    const bill = await storageService.getBill(
      Number(chatId),
      Number(messageId),
    );

    if (!bill) {
      return c.json({ error: "Bill not found" }, 404);
    }

    // Get all votes using storage service
    const votes = await storageService.getVotes(
      Number(chatId),
      Number(messageId),
    );

    return c.json({ bill, votes: Object.fromEntries(votes) });
  },
);

export type ApiRouter = typeof apiRouter;
