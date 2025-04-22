import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { createBillService } from "../features/bill/service";
import { createAiService } from "../services/ai";
import { createVoteService } from "../features/vote/service";

export const apiRouter = new Hono<{
  Bindings: Env;
  Variables: {
    billService: ReturnType<typeof createBillService>;
    voteService: ReturnType<typeof createVoteService>;
  };
}>()
  .use(async (c, next) => {
    const db = c.env.BILLY_DB;
    const aiService = createAiService(c.env.GOOGLEAI_API_KEY);

    const billService = createBillService({ db, aiService });
    const voteService = createVoteService({ db });

    c.set("billService", billService);
    c.set("voteService", voteService);

    await next();
  })
  .get("/bill/:billId", async (c) => {
    const billService = c.get("billService");
    const { billId } = c.req.param();

    const billWithVotes = await billService.getBillWithVotes({
      billId: Number(billId),
    });

    if (!billWithVotes) {
      return c.json({ error: "Bill not found" }, 404);
    }

    return c.json(billWithVotes);
  })
  .get("/bill/:billId/results", async (c) => {
    const billService = c.get("billService");
    const { billId } = c.req.param();

    // TODO: move calculation to bill service
    const calculationResult = await billService.getBillSplit(Number(billId));
    if (!calculationResult) {
      return c.json({ error: "Bill not found" }, 404);
    }

    return c.json({
      ...calculationResult,
      // TODO: add superjson
      userSelections: Object.fromEntries(calculationResult.userSelections),
    });
  })
  .get("/bill/:billId/items/:itemId", async (c) => {
    const billService = c.get("billService");
    const voteService = c.get("voteService");
    const { billId, itemId } = c.req.param();

    const billItem = await billService.getBillItem(Number(itemId));
    if (!billItem) {
      return c.json({ error: "Bill item not found" }, 404);
    }

    const votes = await voteService.getVotesByBillId(Number(billId));
    const userVotes = votes
      // filter voters who voted for this item
      .map(({ userId, quantity }) => {
        return {
          userId,
          share: quantity,
        };
      });

    return c.json({
      billItem,
      userVotes,
    });
  })
  .post(
    "/bill/:billId/items/:itemId/edit",
    zValidator(
      "json",
      z.array(
        z.object({
          userId: z.number(), // TODO: get user id from context
          share: z.number(),
        }),
      ),
    ),
    async (c) => {
      const voteService = c.get("voteService");
      const { billId, itemId } = c.req.param();
      const votes = c.req.valid("json");

      await voteService.storeVotes({
        billId: Number(billId),
        votes: votes.map((vote) => ({
          userId: vote.userId,
          itemId: Number(itemId),
          quantity: vote.share,
        })),
      });

      return c.json({ ok: true });
    },
  )
  .post(
    "/bill/:billId/vote",
    zValidator(
      "json",
      z.object({
        userId: z.number(), // TODO: get user id from context
        itemIds: z.array(z.number()),
      }),
    ),
    async (c) => {
      const voteService = c.get("voteService");

      const { userId, itemIds } = c.req.valid("json");
      const { billId } = c.req.param();
      await voteService.storeVotes({
        billId: Number(billId),
        votes: itemIds.map((itemId) => ({
          userId,
          itemId,
          quantity: 1,
        })),
      });

      return c.json({ ok: true });
    },
  );

export type ApiRouter = typeof apiRouter;
