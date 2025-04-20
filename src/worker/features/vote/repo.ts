import { eq, and, inArray } from "drizzle-orm";
import { setupDb, billItems, itemAssignments, users } from "../../services/db";

type DB = D1Database;

// FIXME: go to definition do not work with this kind of factory
export function createVoteRepo({ db }: { db: DB }) {
  const drizzleDb = setupDb(db);

  return {
    async storeVote({
      billId,
      userId,
      votes,
    }: {
      billId: number;
      userId: string;
      votes: number[];
    }): Promise<void> {
      // Get or create user
      let userData = await drizzleDb
        .select()
        .from(users)
        .where(eq(users.telegramId, userId))
        .limit(1)
        .get();

      if (!userData) {
        // Create user if doesn't exist
        const [insertedUser] = await drizzleDb
          .insert(users)
          .values({
            name: `User-${userId}`, // Default name, could be updated later
            telegramId: userId,
          })
          .returning();
        userData = insertedUser;
      }

      // Get all item IDs for this bill to ensure complete removal of old votes
      const itemsForBill = await drizzleDb
        .select({ id: billItems.id })
        .from(billItems)
        .where(eq(billItems.billId, billId))
        .all();
      const allBillItemIds = itemsForBill.map((item) => item.id);

      // Delete ALL existing assignments for this user on this bill's items
      if (allBillItemIds.length > 0) {
        await drizzleDb.delete(itemAssignments).where(
          and(
            eq(itemAssignments.userId, userData.id),
            // Use all item IDs associated with this bill
            inArray(itemAssignments.billItemId, allBillItemIds),
          ),
        );
      }

      // Create new assignments based on votes (item IDs)
      if (votes.length > 0) {
        // Map vote item IDs to assignment values
        const assignmentValues = votes.map((itemId) => ({
          billItemId: itemId,
          userId: userData.id,
          quantity: 1, // Default to 1, could be adjusted based on requirements
        }));

        await drizzleDb.insert(itemAssignments).values(assignmentValues);
      }
    },

    async getVotesByBillId(billId: number): Promise<Map<string, number[]>> {
      const votes = new Map<string, number[]>();

      // Get all item assignments for this bill
      const assignments = await drizzleDb
        .select({
          billItemId: itemAssignments.billItemId,
          userId: users.id,
          telegramId: users.telegramId,
        })
        .from(itemAssignments)
        .innerJoin(users, eq(itemAssignments.userId, users.id))
        .innerJoin(billItems, eq(itemAssignments.billItemId, billItems.id))
        .where(eq(billItems.billId, billId))
        .all();

      // Group assignments by user
      for (const assignment of assignments) {
        if (!assignment.telegramId) continue;

        const userVotes = votes.get(assignment.telegramId) || [];
        // Push the actual item ID
        userVotes.push(assignment.billItemId);
        votes.set(assignment.telegramId, userVotes);
      }

      return votes;
    },
  };
}
