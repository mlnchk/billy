import { eq } from "drizzle-orm";
import { setupDb, billItems, itemAssignments, users } from "../../services/db";

type DB = D1Database;

export function createVoteRepo({ db }: { db: DB }) {
  const drizzleDb = setupDb(db);

  return {
    async storeVotes({
      votes,
    }: {
      votes: {
        userId: number;
        billItemId: number;
        quantity: number;
      }[];
    }) {
      if (votes.length <= 0) return;

      await drizzleDb.insert(itemAssignments).values(votes);
    },

    async getVotesByBillId(billId: number) {
      return drizzleDb
        .select({
          billItemId: itemAssignments.billItemId,
          userId: users.id,
          telegramId: users.telegramId,
          quantity: itemAssignments.quantity,
        })
        .from(itemAssignments)
        .innerJoin(users, eq(itemAssignments.userId, users.id))
        .innerJoin(billItems, eq(itemAssignments.billItemId, billItems.id))
        .where(eq(billItems.billId, billId))
        .all();
    },
  };
}
