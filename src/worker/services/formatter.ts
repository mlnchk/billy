import { Bill, BillItemWithId } from "../types.ts";

function getPricePerUnit(item: BillItemWithId): number {
  if (item.pricePerUnit) {
    return item.pricePerUnit;
  }
  if (item.priceTotal) {
    return item.priceTotal / item.quantity;
  }
  return 0;
}

function getCurrencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value || currency
  );
}

function formatBillItem(
  item: BillItemWithId,
  { currency, withPrice }: { currency: string; withPrice: boolean },
): string {
  const paddedIndex = formatTelegramMonospace(String(item.id).padStart(2, "0"));
  const googleUrl = createGoogleImagesUrl(item.nameOriginal);
  const itemLink = formatTelegramLink(item.nameEnglish, googleUrl);

  if (!withPrice) {
    return `${paddedIndex}\\. ${itemLink}`;
  }

  const pricePerUnit = getPricePerUnit(item);

  const price = pricePerUnit.toFixed(0);
  // Convert currency code to symbol using Intl with fallback to code
  const currencySymbol = getCurrencySymbol(currency);

  return [
    `${paddedIndex}\\. ${itemLink}`,
    ...(withPrice
      ? [escapeMarkdown(`${item.quantity} * ${currencySymbol}${price}`)]
      : []),
  ].join(" • ");
}

export function formatBillAnalysis(bill: Bill): string {
  const items = bill.items.map((item, index) => {
    return formatBillItem(
      { ...item, id: index + 1 },
      { currency: bill.currency, withPrice: true },
    );
  });

  // Format summary section
  const summaryLines = [];
  const currencySymbol = getCurrencySymbol(bill.currency);

  if (bill.vat) {
    summaryLines.push(
      escapeMarkdown(`VAT: ${currencySymbol}${bill.vat.toFixed(2)}`),
    );
  }
  if (bill.serviceFee) {
    summaryLines.push(
      escapeMarkdown(`Service: ${currencySymbol}${bill.serviceFee}`),
    );
  }
  if (bill.totalDiscount) {
    summaryLines.push(
      escapeMarkdown(`Discount: -${currencySymbol}${bill.totalDiscount}`),
    );
  }

  if (bill.subtotal) {
    summaryLines.push(
      `Subtotal: ${currencySymbol}${
        formatTelegramMonospace(bill.subtotal.toFixed(2))
      }`,
    );
  }

  summaryLines.push(
    `Total: ${currencySymbol}${formatTelegramMonospace(bill.total.toFixed(2))}`,
  );

  if (bill.subtotal) {
    summaryLines.push(
      `Total / Subtotal coefficient: ${
        formatTelegramMonospace(
          (bill.total / bill.subtotal).toFixed(3),
        )
      }`,
    );
  }

  const summary = summaryLines.length > 0
    ? "\n\n" + summaryLines.map((line) => `💰 ${line}`).join("\n")
    : "";

  return [
    "Dear 🪿and 🦢,\nReply to this message with numbers of your items:\n",
    ...items,
    summary,
  ].join("\n");
}

interface UserSelection {
  itemsWithProportion: {
    item: BillItemWithId;
    proportionalPrice: number;
    proportion: number;
  }[];
  total: number;
}

interface CalculationResult {
  userSelections: Map<string, UserSelection>;
  unvotedItems: BillItemWithId[];
}

export function formatCalculation(
  result: CalculationResult,
  currency: string,
): string {
  let calcMsg = "💰 Bill Calculation\n";

  // Per-user summary with items and totals
  for (
    const [
      user,
      { itemsWithProportion, total },
    ] of result.userSelections.entries()
  ) {
    calcMsg += `\n*${formatTelegramBold(user)}* • ${
      getCurrencySymbol(currency)
    }${
      formatTelegramMonospace(total.toFixed(
        2,
      ))
    }\n`;
    itemsWithProportion.forEach((itemWithProportion) => {
      const proportionString = itemWithProportion.proportion < 1
        ? escapeMarkdown(
          ` [${(itemWithProportion.proportion * 100).toFixed(0)}%]`,
        )
        : "";

      calcMsg += `${
        formatBillItem(itemWithProportion.item, {
          currency,
          withPrice: false,
        })
      }${proportionString}\n`;
    });
  }

  // Unvoted items with prices
  if (result.unvotedItems.length > 0) {
    calcMsg += `\n⚠️ *Items without votes*\n`;
    result.unvotedItems.forEach(
      (
        item,
      ) => (calcMsg += `${
        formatBillItem(item, { currency, withPrice: true })
      }\n`),
    );
  }

  return calcMsg;
}

export function createGoogleImagesUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `https://www.google.com/search?q=${encodedQuery}&tbm=isch`;
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

export function formatTelegramLink(text: string, url: string): string {
  return `[${escapeMarkdown(text)}](${escapeMarkdown(url)})`;
}

export function formatTelegramMonospace(text: string): string {
  return `\`${escapeMarkdown(text)}\``;
}

export function formatTelegramBold(text: string): string {
  return `*${escapeMarkdown(text)}*`;
}
