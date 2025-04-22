import { eq, inArray, and } from "drizzle-orm";
import { setupDb, billItems, itemAssignments, users } from "../../services/db";

type DB = D1Database;

export function createVoteRepo({ db }: { db: DB }) {
  const drizzleDb = setupDb(db);

  return {
    async deleteVotesByBillId({
      billId,
      userIds,
    }: {
      billId: number;
      userIds: number[];
    }) {
      // Check if there are any user IDs to process
      if (userIds.length === 0) {
        return; // Nothing to delete
      }

      // Select the billItem IDs associated with the given bill ID
      const billItemIdsToDelete = drizzleDb
        .select({ id: billItems.id })
        .from(billItems)
        .where(eq(billItems.billId, billId)); // Use eq for single ID

      // Delete assignments where billItemId is in the selected list AND userId is in the provided list
      await drizzleDb
        .delete(itemAssignments)
        .where(
          and(
            inArray(itemAssignments.billItemId, billItemIdsToDelete),
            inArray(itemAssignments.userId, userIds),
          ),
        );
    },

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
      console.log("votes", votes);

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
