// import { app } from "./server";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { z } from "zod";
import { calculateBillSplit } from "../services/calculator";
import { createBillRepo } from "../features/bill/repo";
import { createVoteRepo } from "../features/vote/repo";

export const apiRouter = new Hono<{ Bindings: Env }>()
  .get("/bill/:chatId/:messageId", async (c) => {
    const db = c.env.BILLY_DB;
    const billRepo = createBillRepo({ db });
    const voteRepo = createVoteRepo({ db });

    const { chatId, messageId } = c.req.param();

    const bill = await billRepo.getBill(Number(chatId), Number(messageId));

    if (!bill) {
      return c.json({ error: "Bill not found" }, 404);
    }

    // Get all votes using storage service
    const votes = await voteRepo.getVotes(Number(chatId), Number(messageId));

    return c.json({ bill, votes: Object.fromEntries(votes) });
  })
  .get("/bill/:chatId/:messageId/results", async (c) => {
    const db = c.env.BILLY_DB;
    const billRepo = createBillRepo({ db });
    const voteRepo = createVoteRepo({ db });

    const { chatId, messageId } = c.req.param();

    const bill = await billRepo.getBill(Number(chatId), Number(messageId));

    if (!bill) {
      return c.json({ error: "Bill not found" }, 404);
    }

    // Get all votes using storage service
    const votes = await voteRepo.getVotes(Number(chatId), Number(messageId));

    const calculationResult = calculateBillSplit(bill, votes);

    return c.json({
      ...calculationResult,
      // TODO: add superjson
      userSelections: Object.fromEntries(calculationResult.userSelections),
    });
  })
  .get("/bill/:chatId/:messageId/items/:itemId", async (c) => {
    const db = c.env.BILLY_DB;
    const billRepo = createBillRepo({ db });
    const voteRepo = createVoteRepo({ db });

    const { chatId, messageId, itemId } = c.req.param();

    const billItem = await billRepo.getBillItem(Number(itemId));

    if (!billItem) {
      return c.json({ error: "Bill item not found" }, 404);
    }

    const votes = await voteRepo.getVotes(Number(chatId), Number(messageId));

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
      const db = c.env.BILLY_DB;

      const voteRepo = createVoteRepo({ db });

      const { chatId, messageId, itemId } = c.req.param();
      const votes = c.req.valid("json");

      const currentVotes = await voteRepo.getVotes(
        Number(chatId),
        Number(messageId),
      );

      console.log(itemId, votes, currentVotes);

      await Promise.all(
        votes.map((vote) => {
          const currentUserVotes = currentVotes.get(vote.userId) || [];

          const newUserVotes = [
            ...currentUserVotes.filter((v) => v !== Number(itemId)),
            ...new Array(vote.share).fill(Number(itemId)),
          ];

          voteRepo.storeVote(
            Number(chatId),
            Number(messageId),
            vote.userId,
            newUserVotes,
          );
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
      const db = c.env.BILLY_DB;
      const voteRepo = createVoteRepo({ db });

      const { chatId, messageId } = c.req.param();
      const { userId, itemIds } = c.req.valid("json");

      await voteRepo.storeVote(
        Number(chatId),
        Number(messageId),
        userId,
        itemIds,
      );

      return c.json({ ok: true });
    },
  );

export type ApiRouter = typeof apiRouter;
