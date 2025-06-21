import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

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
    .nullish()
    .describe("Price per unit of the item. Float, max 3 decimal places."),
  priceTotal: z
    .number()
    .nullish()
    .describe("Total price of the item. Float, max 3 decimal places."),
});

const BillSchema = z.object({
  items: z.array(BillItemSchema),
  subtotal: z
    .number()
    .nullish()
    .describe("Sum of all item prices. Float, max 3 decimal places."),
  total: z
    .number()
    .describe("Total price of the bill. Float, max 3 decimal places."),
  currency: z.string().describe("Currency of the bill. String, e.g. 'THB'"),
  vat: z
    .number()
    .nullish()
    .describe("VAT amount. Float, max 3 decimal places."),
  serviceFee: z
    .number()
    .nullish()
    .describe("Service fee. Float, max 3 decimal places."),
  totalDiscount: z
    .number()
    .nullish()
    .describe("Total discount. Float, max 3 decimal places."),
});

const SYSTEM_PROMPT = `### Bill Extraction Assistant

**Task:** Convert bill image to structured data with translations. Original language is Thai.

**Key Rules:**
1. Preserve OCR text exactly as recognized
2. Translate items contextually to English
3. Keep all numbers unchanged
4. Detect currency from symbols/context (e.g., $=USD, ฿=THB, €=EUR)
5. Do not use more than 3 decimal places for numbers

**Extract:**
-  Item name (original + English)
- Price per unit: The price for a single unit if available.
- Price total: The extended price for the quantity of items.
  - *Note:* In some cases, only one of these fields may be explicitly provided. In such situations, make an educated guess to infer the value. For instance:
    - If only price per unit and quantity are provided, do not compute price total.
    - If only price total and quantity are provided, do not compute price per unit.
    - If both are provided, use the provided values.
-  Quantity (default to 1 if missing)
-  Subtotal amount (price before taxes and additional costs)
-  Total amount
-  Currency
-  VAT (if present and not included in prices)
-  Service fee (if present and not included in prices)
-  Total discount (if present and not included in prices)

**Process:**
1. List items with original OCR text
2. Add English translations
3. Identify currency
4. Extract prices/quantities
5. Look for additional charges/discounts:
   - VAT (e.g., VAT 7%, VAT ฿xxx)
   - Service charge (e.g., Service 10%, Service Fee ฿xxx)
   - Discounts (e.g., Discount, Special Discount, -฿xxx)
`;

export const createAiService = (apiKey: string) => {
  const google = createGoogleGenerativeAI({
    apiKey,
  });

  async function analyzeBillImage(imageUrl: string) {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.0-flash"),
        schema: BillSchema,
        schemaName: "Bill",
        schemaDescription: "A bill with items, quantities, prices and total",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image", image: new URL(imageUrl) },
              {
                type: "text",
                text: "Analyze the bill image and return the structured data.",
              },
            ],
          },
        ],
      });

      return BillSchema.parse(object);
    } catch (error) {
      console.error("Error analyzing bill:", error);
      throw new Error("Failed to analyze bill image: " + error);
    }
  }

  return {
    analyzeBillImage,
  };
};

export type AiService = ReturnType<typeof createAiService>;
