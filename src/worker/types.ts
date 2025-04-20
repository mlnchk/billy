import { z } from "zod";

const BillItemSchema = z.object({
  nameOriginal: z
    .string()
    .describe("Exact name of the item as it appears on the bill."),
  nameEnglish: z.string().describe("English translation of the name."),
  quantity: z
    .number()
    .int()
    .default(1)
    .describe("Quantity of the item. Integer."),
  pricePerUnit: z
    .number()
    .optional()
    .describe("Price per unit of the item. Float, max 3 decimal places."),
  priceTotal: z
    .number()
    .optional()
    .describe("Total price of the item. Float, max 3 decimal places."),
});

export const BillSchema = z.object({
  items: z.array(BillItemSchema),
  subtotal: z
    .number()
    .optional()
    .describe("Sum of all item prices. Float, max 3 decimal places."),
  total: z
    .number()
    .describe("Total price of the bill. Float, max 3 decimal places."),
  currency: z.string().describe("Currency of the bill. String, e.g. 'THB'"),
  vat: z
    .number()
    .optional()
    .describe("VAT amount. Float, max 3 decimal places."),
  serviceFee: z
    .number()
    .optional()
    .describe("Service fee. Float, max 3 decimal places."),
  totalDiscount: z
    .number()
    .optional()
    .describe("Total discount. Float, max 3 decimal places."),
});

export type BillItem = z.infer<typeof BillItemSchema>;
export type Bill = z.infer<typeof BillSchema>;

export type BillWithItemIds = Omit<Bill, "items"> & { items: BillItemWithId[] };

export type BillItemWithId = BillItem & { id: number };
