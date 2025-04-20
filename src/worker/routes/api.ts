import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { z } from "zod";
import { calculateBillSplit } from "../services/calculator";
import { createBillRepo } from "../features/bill/repo";
import { createBillService } from "../features/bill/service";
import { createAiService } from "../services/ai";
import { createVoteService } from "../features/vote/service";

// TODO: use :billId as a path param and just get bill id in bot using chatId and messageId
export const apiRouter = new Hono<{
  Bindings: Env;
  Variables: {
    billRepo: ReturnType<typeof createBillRepo>;
    billService: ReturnType<typeof createBillService>;
    voteService: ReturnType<typeof createVoteService>;
  };
}>()
  .use(async (c, next) => {
    const db = c.env.BILLY_DB;
    const aiService = createAiService(c.env.GOOGLEAI_API_KEY);

    const billRepo = createBillRepo({ db });
    const billService = createBillService({ db, aiService });
    const voteService = createVoteService({ db });

    c.set("billRepo", billRepo);
    c.set("billService", billService);
    c.set("voteService", voteService);

    await next();
  })
  .get("/bill/:chatId/:messageId", async (c) => {
    const billService = c.get("billService");
    const { chatId, messageId } = c.req.param();

    const billWithVotes = await billService.getBillWithVotes({
      chatId: Number(chatId),
      messageId: Number(messageId),
    });

    if (!billWithVotes) {
      return c.json({ error: "Bill not found" }, 404);
    }

    return c.json(billWithVotes);
  })
  .get("/bill/:chatId/:messageId/results", async (c) => {
    const billService = c.get("billService");
    const { chatId, messageId } = c.req.param();

    const billWithVotes = await billService.getBillWithVotes({
      chatId: Number(chatId),
      messageId: Number(messageId),
    });

    if (!billWithVotes) {
      return c.json({ error: "Bill not found" }, 404);
    }

    const calculationResult = calculateBillSplit(
      billWithVotes.bill,
      billWithVotes.votes,
    );

    return c.json({
      ...calculationResult,
      // TODO: add superjson
      userSelections: Object.fromEntries(calculationResult.userSelections),
    });
  })
  .get("/bill/:chatId/:messageId/items/:itemId", async (c) => {
    const billRepo = c.get("billRepo");
    const voteService = c.get("voteService");

    const { chatId, messageId, itemId } = c.req.param();

    const bill = await billRepo.getBill(Number(chatId), Number(messageId));

    if (!bill) {
      return c.json({ error: "Bill not found" }, 404);
    }

    const billItem = await billRepo.getBillItem(Number(itemId));

    if (!billItem) {
      return c.json({ error: "Bill item not found" }, 404);
    }

    const votes = await voteService.getVotesByBillId(bill.id);

    const userVotes = Array.from(votes.entries())
      // filter voters who voted for this item
      .map(([userId, userVotes]) => {
        return {
          userId,
          share: userVotes.filter((vote) => vote === Number(itemId)).length,
        };
      });

    return c.json({
      billItem,
      userVotes,
    });
  })
  .post(
    "/bill/:chatId/:messageId/items/:itemId/edit",
    zValidator(
      "json",
      z.array(
        z.object({
          userId: z.string(),
          share: z.number(),
        }),
      ),
    ),
    async (c) => {
      const voteService = c.get("voteService");
      const billRepo = c.get("billRepo");
      const { chatId, messageId, itemId } = c.req.param();
      const votes = c.req.valid("json");

      const bill = await billRepo.getBill(Number(chatId), Number(messageId));

      if (!bill) {
        return c.json({ error: "Bill not found" }, 404);
      }

      const currentVotes = await voteService.getVotesByBillId(bill.id);

      await Promise.all(
        votes.map((vote) => {
          const currentUserVotes = currentVotes.get(vote.userId) || [];

          const newUserVotes = [
            ...currentUserVotes.filter((v) => v !== Number(itemId)),
            ...new Array(vote.share).fill(Number(itemId)),
          ];

          voteService.storeVote({
            billId: bill.id,
            userId: vote.userId,
            votes: newUserVotes,
          });
        }),
      );

      return c.json({ ok: true });
    },
  )
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
      const voteService = c.get("voteService");
      const billRepo = c.get("billRepo");

      const { chatId, messageId } = c.req.param();
      const { userId, itemIds } = c.req.valid("json");

      const bill = await billRepo.getBill(Number(chatId), Number(messageId));

      if (!bill) {
        return c.json({ error: "Bill not found" }, 404);
      }

      await voteService.storeVote({
        billId: bill.id,
        userId,
        votes: itemIds,
      });

      return c.json({ ok: true });
    },
  );

export type ApiRouter = typeof apiRouter;
