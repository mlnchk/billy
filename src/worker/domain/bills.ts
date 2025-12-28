import { eq, and } from "drizzle-orm";
import {
  bills,
  billItems,
  type Bill,
  type BillItem,
  type BillWithItems,
  type BillInsert,
  type BillItemInsert,
} from "../services/db";
import { calculateBillSplit } from "../services/calculator";
import { getVotesByBillId, getVotesByBillItemId } from "./voting";
import type { AiService } from "../services/ai";
import type { DB } from "./users";

export interface BillItemDetailsResponse {
  billItem: BillItem;
  bill: Bill;
  userVotes: {
    userId: number;
    share: number;
    user: {
      id: number;
      name: string | null;
      photoUrl: string | null;
    };
  }[];
}

export async function getBillIdByTelegramMessage(
  db: DB,
  chatId: number,
  messageId: number,
): Promise<number | null> {
  const result = await db
    .select({ id: bills.id })
    .from(bills)
    .where(
      and(
        eq(bills.telegramChatId, chatId.toString()),
        eq(bills.telegramMessageId, messageId.toString()),
      ),
    )
    .limit(1);

  return result[0]?.id ?? null;
}

export async function getBillWithItems(
  db: DB,
  billId: number,
): Promise<BillWithItems | undefined> {
  return db.query.bills.findFirst({
    where: eq(bills.id, billId),
    with: { billItems: true },
  });
}

export async function getBillItem(db: DB, itemId: number) {
  return db.query.billItems.findFirst({
    where: eq(billItems.id, itemId),
    with: { bill: true },
  });
}

export async function saveBill(
  db: DB,
  chatId: number,
  messageId: number,
  bill: BillInsert,
  items: Omit<BillItemInsert, "billId">[],
) {
  const [insertedBill] = await db
    .insert(bills)
    .values({
      telegramChatId: chatId.toString(),
      telegramMessageId: messageId.toString(),
      subtotal: bill.subtotal,
      total: bill.total,
      currency: bill.currency,
    })
    .returning();

  if (items.length === 0) {
    return { bill: insertedBill, items: [] };
  }

  const itemValues = items.map((item) => ({
    ...item,
    billId: insertedBill.id,
  }));

  const insertedItems = await db.insert(billItems).values(itemValues).returning();

  return { bill: insertedBill, items: insertedItems };
}

export async function parseAndSaveBill(
  db: DB,
  aiService: AiService,
  params: { chatId: number; messageId: number; imageUrl: string },
) {
  const parsedBill = await aiService.analyzeBillImage(new URL(params.imageUrl));

  return saveBill(db, params.chatId, params.messageId, parsedBill, parsedBill.items);
}

export async function getBillWithVotes(db: DB, billId: number) {
  const bill = await getBillWithItems(db, billId);
  if (!bill) return null;

  const votes = await getVotesByBillId(db, bill.id);
  return { bill, votes };
}

export async function getBillItemWithVotes(
  db: DB,
  itemId: number,
): Promise<BillItemDetailsResponse | null> {
  const billItem = await getBillItem(db, itemId);
  if (!billItem?.bill) return null;

  const votes = await getVotesByBillItemId(db, itemId);

  return {
    billItem,
    bill: billItem.bill,
    userVotes: votes.map(({ userId, quantity, user }) => ({
      userId,
      share: quantity,
      user,
    })),
  };
}

export async function getBillSplit(db: DB, billId: number) {
  const billWithVotes = await getBillWithVotes(db, billId);
  if (!billWithVotes) return null;

  const calculationResult = calculateBillSplit(
    billWithVotes.bill,
    billWithVotes.votes.map((vote) => ({
      userId: vote.user.id,
      itemId: vote.billItemId,
      quantity: vote.quantity,
    })),
  );

  // Create map of userId -> user info
  const userMap = new Map<number, { id: number; name: string | null; photoUrl: string | null }>();
  for (const vote of billWithVotes.votes) {
    userMap.set(vote.user.id, vote.user);
  }

  // Enhance with user info
  const enhancedUserSelections = Object.fromEntries(
    Array.from(calculationResult.userSelections.entries()).map(([userId, selection]) => [
      userId,
      { ...selection, user: userMap.get(userId) },
    ]),
  );

  return {
    ...calculationResult,
    userSelections: enhancedUserSelections,
    bill: billWithVotes.bill,
  };
}
