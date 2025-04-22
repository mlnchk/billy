import { eq, and } from "drizzle-orm";
import {
  setupDb,
  bills,
  billItems,
  BillInsert,
  BillItemInsert,
} from "../../services/db";

type DB = D1Database;

export function createBillRepo({ db }: { db: DB }) {
  const drizzleDb = setupDb(db);

  return {
    async getBillIdByTelegramChatIdAndMessageId(
      chatId: number,
      messageId: number,
    ): Promise<number | null> {
      const billData = await drizzleDb
        .select({ id: bills.id })
        .from(bills)
        .where(
          and(
            eq(bills.telegramChatId, chatId.toString()),
            eq(bills.telegramMessageId, messageId.toString()),
          ),
        )
        .limit(1);

      if (!billData[0]) return null;

      return billData[0].id;
    },

    async saveBill(
      chatId: number,
      messageId: number,
      bill: BillInsert,
      items: Omit<BillItemInsert, "billId">[],
    ) {
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
        .returning();

      const billId = insertedBill.id;

      // Insert bill items as a batch
      if (items.length <= 0) {
        return { bill: insertedBill, items: [] };
      }

      const itemValues = items.map((item) => ({
        ...item,
        billId,
      }));

      const insertedItems = await drizzleDb
        .insert(billItems)
        .values(itemValues)
        .returning();

      return { bill: insertedBill, items: insertedItems };
    },

    async getBillWithItems(billId: number) {
      return drizzleDb.query.bills.findFirst({
        where: eq(bills.id, billId),
        with: {
          billItems: true,
        },
      });
    },

    async getBillItem(itemId: number) {
      return drizzleDb.query.billItems.findFirst({
        where: eq(billItems.id, itemId),
      });
    },
  };
}
