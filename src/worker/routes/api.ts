// import { app } from "./server";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { createStorageService } from "../services/storage";
import { z } from "zod";
import { calculateBillSplit } from "../services/calculator";

export const apiRouter = new Hono<{ Bindings: Env }>()
  .get("/bill/:chatId/:messageId", async (c) => {
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
  })
  .get("/bill/:chatId/:messageId/results", async (c) => {
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

    const calculationResult = calculateBillSplit(bill, votes);

    return c.json({
      ...calculationResult,
      // TODO: add superjson
      userSelections: Object.fromEntries(calculationResult.userSelections),
    });
  })
  .post(
    "/bill/:chatId/:messageId/vote",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        itemIds: z.array(z.number()),
      }),
    ),
    async (c) => {
      const storageService = createStorageService({ kv: c.env.BILLY });
      const { chatId, messageId } = c.req.param();
      const { userId, itemIds } = c.req.valid("json");

      await storageService.storeVote(
        Number(chatId),
        Number(messageId),
        userId,
        itemIds,
      );

      return c.json({ ok: true });
    },
  );

export type ApiRouter = typeof apiRouter;
