import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validate, parse } from "@telegram-apps/init-data-node";

import { setupDb } from "../services/db";
import * as users from "../domain/users";
import * as bills from "../domain/bills";
import * as voting from "../domain/voting";

export const apiRouter = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof setupDb>;
    userId: number;
  };
}>()
  .use(async (c, next) => {
    c.set("db", setupDb(c.env.BILLY_DB));
    await next();
  })
  .use(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [authType, authData = ""] = authHeader.split(" ");

    if (authType !== "tma") {
      return c.json({ error: "Auth type not supported" }, 401);
    }

    // парсим только в production, потому что в development мы используем mock
    if (import.meta.env.PROD) {
      try {
        validate(authData, c.env.BOT_TOKEN);
      } catch (error) {
        console.error(error);
        return c.json({ error: "Invalid init data" }, 401);
      }
    }

    const parsedInitData = parse(authData);
    const telegramUser = parsedInitData.user;

    if (!telegramUser) {
      return c.json({ error: "Telegram user is not found" }, 401);
    }

    const db = c.get("db");
    const user = await users.findOrCreateUser(db, telegramUser.id.toString(), {
      name: [telegramUser.first_name, telegramUser.last_name]
        .filter(Boolean)
        .join(" "),
      photoUrl: telegramUser.photo_url,
    });

    c.set("userId", user.id);

    await next();
  })
  .get("/user", async (c) => {
    const db = c.get("db");
    const userId = c.get("userId");

    const user = await users.findUserById(db, userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  })
  .get("/bill/:billId", async (c) => {
    const db = c.get("db");
    const { billId } = c.req.param();

    const billWithVotes = await bills.getBillWithVotes(db, Number(billId));

    if (!billWithVotes) {
      return c.json({ error: "Bill not found" }, 404);
    }

    return c.json(billWithVotes);
  })
  .get("/bill/:billId/results", async (c) => {
    const db = c.get("db");
    const { billId } = c.req.param();

    const calculationResult = await bills.getBillSplit(db, Number(billId));
    if (!calculationResult) {
      return c.json(
        { error: "Bill not found or could not be calculated" },
        404,
      );
    }

    return c.json(calculationResult);
  })
  .get("/bill/:billId/items/:itemId", async (c) => {
    const db = c.get("db");
    const { itemId } = c.req.param();

    const billItemWithVotes = await bills.getBillItemWithVotes(db, Number(itemId));

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
      const db = c.get("db");
      const { itemId } = c.req.param();
      const votes = c.req.valid("json");

      await voting.updateVotesForBillItem(db, {
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
      const db = c.get("db");
      const userId = c.get("userId");

      const { itemIds } = c.req.valid("json");
      const { billId } = c.req.param();

      await voting.voteForBill(db, {
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
