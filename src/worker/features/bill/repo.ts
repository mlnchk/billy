import { Bill, BillItem, BillItemWithId, BillWithItemIds } from "../../types";
import { eq, and } from "drizzle-orm";
import { setupDb, bills, billItems } from "../../services/db";

type DB = D1Database;

// FIXME: go to definition do not work with this kind of factory
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
      bill: Bill,
    ): Promise<number> {
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

      const billId = insertedBill.id;

      // Insert bill items as a batch
      if (bill.items.length > 0) {
        const itemValues = bill.items.map((item: BillItem) => ({
          billId,
          nameOriginal: item.nameOriginal,
          nameEnglish: item.nameEnglish,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          priceTotal: item.priceTotal,
        }));

        await drizzleDb.insert(billItems).values(itemValues);
      }

      return billId;
    },

    async getBill(chatId: number, messageId: number) {
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

      // TODO: get rid of `BillWithItemIds` type
      const bill: BillWithItemIds = {
        id: billData.id,
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
    },

    async getBillItem(itemId: number): Promise<BillItemWithId | null> {
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
    },
  };
}
