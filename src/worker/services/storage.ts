import { Bill, BillItem, BillItemWithId, BillWithItemIds } from "../types.ts";
import { eq, and, inArray } from "drizzle-orm";
import { setupDb, bills, billItems, itemAssignments, users } from "./db.ts";

type DB = D1Database;

// Storage Service
export const createStorageService = ({ db }: { db: DB }) => {
  const drizzleDb = setupDb(db);

  // Bill Storage
  async function storeBill(
    chatId: number,
    messageId: number,
    bill: Bill,
  ): Promise<void> {
    // Insert bill record
    const [insertedBill] = await drizzleDb
      .insert(bills)
      .values({
        telegramChatId: chatId.toString(),
        telegramMessageId: messageId.toString(),
        subtotal: bill.subtotal,
        total: bill.total,
        currency: bill.currency,
      })
      .returning({ id: bills.id });

    // Insert bill items as a batch
    if (bill.items.length > 0) {
      const itemValues = bill.items.map((item: BillItem) => ({
        billId: insertedBill.id,
        nameOriginal: item.nameOriginal,
        nameEnglish: item.nameEnglish,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        priceTotal: item.priceTotal,
      }));

      await drizzleDb.insert(billItems).values(itemValues);
    }
  }

  async function getBill(
    chatId: number,
    messageId: number,
  ): Promise<BillWithItemIds | null> {
    // Find bill by telegram chat ID and message ID
    const billData = await drizzleDb
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.telegramChatId, chatId.toString()),
          eq(bills.telegramMessageId, messageId.toString()),
        ),
      )
      .limit(1)
      .get();

    if (!billData) return null;

    // Get the bill's items
    const billItemsData = await drizzleDb
      .select()
      .from(billItems)
      .where(eq(billItems.billId, billData.id))
      .all();

    // Transform DB data to Bill type
    const bill: BillWithItemIds = {
      subtotal: billData.subtotal ?? undefined,
      total: billData.total,
      currency: billData.currency,
      items: billItemsData.map((item) => ({
        id: item.id,
        nameOriginal: item.nameOriginal,
        nameEnglish: item.nameEnglish,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit ?? undefined,
        priceTotal: item.priceTotal ?? undefined,
      })),
    };

    return bill;
  }

  async function getBillItem(itemId: number): Promise<BillItemWithId | null> {
    const billItemData = await drizzleDb
      .select()
      .from(billItems)
      .where(eq(billItems.id, itemId))
      .get();

    if (!billItemData) return null;

    return {
      id: billItemData.id,
      nameOriginal: billItemData.nameOriginal,
      nameEnglish: billItemData.nameEnglish,
      quantity: billItemData.quantity,
      pricePerUnit: billItemData.pricePerUnit ?? undefined,
      priceTotal: billItemData.priceTotal ?? undefined,
    };
  }

  // Vote Storage using item assignments
  async function storeVote(
    chatId: number,
    messageId: number,
    userId: string,
    votes: number[],
  ): Promise<void> {
    // Get bill first to find bill ID
    const billData = await drizzleDb
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.telegramChatId, chatId.toString()),
          eq(bills.telegramMessageId, messageId.toString()),
        ),
      )
      .limit(1)
      .get();

    if (!billData) return;

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

    // Get items for this bill
    const itemsForBill = await drizzleDb
      .select({ id: billItems.id })
      .from(billItems)
      .where(eq(billItems.billId, billData.id))
      .all();

    const itemIds = itemsForBill.map((item) => item.id);

    // Delete existing assignments for this user on this bill's items
    if (itemIds.length > 0) {
      await drizzleDb
        .delete(itemAssignments)
        .where(
          and(
            eq(itemAssignments.userId, userData.id),
            inArray(itemAssignments.billItemId, itemIds),
          ),
        );
    }

    // Create new assignments based on votes
    if (votes.length > 0 && itemsForBill.length > 0) {
      // Map vote indices to actual item IDs and prepare batch insert
      const assignmentValues = votes
        .map((itemIndex) => {
          // Ensure index is within bounds
          if (itemIndex >= 0 && itemIndex < itemsForBill.length) {
            return {
              billItemId: itemsForBill[itemIndex].id,
              userId: userData.id,
              quantity: 1, // Default to 1, could be adjusted based on requirements
            };
          }
          return null;
        })
        .filter((v) => v !== null);

      if (assignmentValues.length > 0) {
        await drizzleDb.insert(itemAssignments).values(assignmentValues);
      }
    }
  }

  async function getVotes(
    chatId: number,
    messageId: number,
  ): Promise<Map<string, number[]>> {
    const votes = new Map<string, number[]>();

    // Get the bill
    const billData = await drizzleDb
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.telegramChatId, chatId.toString()),
          eq(bills.telegramMessageId, messageId.toString()),
        ),
      )
      .limit(1)
      .get();

    if (!billData) return votes;

    // Get bill items with their index position
    const billItemsData = await drizzleDb
      .select({
        id: billItems.id,
        billId: billItems.billId,
      })
      .from(billItems)
      .where(eq(billItems.billId, billData.id))
      .all();

    // Create a map from item ID to index in the items array
    const itemIdToIndex = new Map<number, number>();
    billItemsData.forEach((item, index) => {
      itemIdToIndex.set(item.id, index);
    });

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
      .where(eq(billItems.billId, billData.id))
      .all();

    // Group assignments by user
    for (const assignment of assignments) {
      if (!assignment.telegramId) continue;

      const itemIndex = itemIdToIndex.get(assignment.billItemId);
      if (itemIndex === undefined) continue;

      const userVotes = votes.get(assignment.telegramId) || [];
      userVotes.push(itemIndex);
      votes.set(assignment.telegramId, userVotes);
    }

    return votes;
  }

  return {
    storeBill,
    getBill,
    getBillItem,
    storeVote,
    getVotes,
  };
};

export type StorageService = ReturnType<typeof createStorageService>;
