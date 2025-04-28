import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { createBillService } from "../features/bill/service";
import { createAiService } from "../services/ai";
import { createVoteService } from "../features/vote/service";
import { createUserService } from "../features/user/service";

import { MY_ID } from "../../lib/constants";

export const apiRouter = new Hono<{
  Bindings: Env;
  Variables: {
    billService: ReturnType<typeof createBillService>;
    voteService: ReturnType<typeof createVoteService>;
    userService: ReturnType<typeof createUserService>;
    userId: number;
  };
}>()
  .use(async (c, next) => {
    const db = c.env.BILLY_DB;
    const aiService = createAiService(c.env.GOOGLEAI_API_KEY);

    const userService = createUserService({ db });
    const billService = createBillService({ db, aiService });
    const voteService = createVoteService({ db });

    c.set("billService", billService);
    c.set("voteService", voteService);
    c.set("userService", userService);

    await next();
  })
  .use(async (c, next) => {
    // TODO: get user id from token or telegram id
    c.set("userId", MY_ID);

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

    const calculationResult = await billService.getBillSplit(Number(billId));
    if (!calculationResult) {
      return c.json(
        { error: "Bill not found or could not be calculated" },
        404,
      );
    }

    return c.json(calculationResult);
  })
  .get("/bill/:billId/items/:itemId", async (c) => {
    const billService = c.get("billService");
    const { itemId } = c.req.param();

    const billItemWithVotes = await billService.getBillItemWithVotes({
      itemId: Number(itemId),
    });

    if (!billItemWithVotes) {
      return c.json({ error: "Bill item details not found" }, 404);
    }

    return c.json(billItemWithVotes);
  })
  .post(
    "/bill/:billId/items/:itemId/edit",
    zValidator(
      "json",
      z.array(
        z.object({
          userId: z.number(),
          share: z.number(),
        }),
      ),
    ),
    async (c) => {
      const voteService = c.get("voteService");
      const { itemId } = c.req.param();
      const votes = c.req.valid("json");

      await voteService.updateVotesForBillItem({
        billItemId: Number(itemId),
        votes: votes.map((vote) => ({
          userId: vote.userId,
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
        itemIds: z.array(z.number()),
      }),
    ),
    async (c) => {
      const voteService = c.get("voteService");
      const userId = c.get("userId");

      const { itemIds } = c.req.valid("json");
      const { billId } = c.req.param();

      await voteService.voteForBill({
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
