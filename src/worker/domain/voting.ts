import { eq, inArray, and, sql } from "drizzle-orm";
import { billItems, itemAssignments, users } from "../services/db";
import type { DB } from "./users";

export async function getVotesByBillId(db: DB, billId: number) {
  return db
    .select({
      billItemId: itemAssignments.billItemId,
      quantity: itemAssignments.quantity,
      user: {
        id: users.id,
        name: users.name,
        photoUrl: users.photoUrl,
      },
    })
    .from(itemAssignments)
    .innerJoin(users, eq(itemAssignments.userId, users.id))
    .innerJoin(billItems, eq(itemAssignments.billItemId, billItems.id))
    .where(eq(billItems.billId, billId))
    .all();
}

export async function getVotesByBillItemId(db: DB, billItemId: number) {
  return db
    .select({
      userId: itemAssignments.userId,
      quantity: itemAssignments.quantity,
      user: {
        id: users.id,
        name: users.name,
        photoUrl: users.photoUrl,
      },
    })
    .from(itemAssignments)
    .innerJoin(users, eq(itemAssignments.userId, users.id))
    .where(eq(itemAssignments.billItemId, billItemId))
    .all();
}

export async function voteForBill(
  db: DB,
  params: {
    billId: number;
    votes: { itemId: number; userId: number; quantity: number }[];
  },
) {
  const userIds = [...new Set(params.votes.map((vote) => vote.userId))];

  // Delete previous votes for these users on this bill
  if (userIds.length > 0) {
    const billItemIdsToDelete = db
      .select({ id: billItems.id })
      .from(billItems)
      .where(eq(billItems.billId, params.billId));

    await db
      .delete(itemAssignments)
      .where(
        and(
          inArray(itemAssignments.billItemId, billItemIdsToDelete),
          inArray(itemAssignments.userId, userIds),
        ),
      );
  }

  if (params.votes.length === 0) {
    return;
  }

  // Insert new votes
  const votesToInsert = params.votes.map((vote) => ({
    billItemId: vote.itemId,
    userId: vote.userId,
    quantity: vote.quantity,
  }));

  await db
    .insert(itemAssignments)
    .values(votesToInsert)
    .onConflictDoUpdate({
      target: [itemAssignments.userId, itemAssignments.billItemId],
      set: { quantity: sql`excluded.quantity` },
    });
}

export async function updateVotesForBillItem(
  db: DB,
  params: {
    billItemId: number;
    votes: { userId: number; quantity: number }[];
  },
) {
  if (params.votes.length === 0) {
    return;
  }

  const votesToInsert = params.votes.map((vote) => ({
    billItemId: params.billItemId,
    userId: vote.userId,
    quantity: vote.quantity,
  }));

  await db
    .insert(itemAssignments)
    .values(votesToInsert)
    .onConflictDoUpdate({
      target: [itemAssignments.userId, itemAssignments.billItemId],
      set: { quantity: sql`excluded.quantity` },
    });
}
