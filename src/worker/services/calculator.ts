import type { BillItem, BillWithItems } from "./db.ts";

type UserId = number;

interface UserSelection {
  itemsWithProportion: {
    item: BillItem;
    proportionalPrice: number;
    proportion: number;
  }[];
  total: number;
}

interface CalculationResult {
  userSelections: Map<UserId, UserSelection>;
  unvotedItems: BillItem[];
}

function getTotalItemCost(item: BillItem): number {
  if (item.priceTotal) {
    return item.priceTotal;
  }
  if (item.pricePerUnit) {
    return item.pricePerUnit * item.quantity;
  }
  return 0;
}

export function calculateBillSplit(
  bill: BillWithItems,
  votes: { userId: UserId; itemId: number; quantity: number }[],
): CalculationResult {
  // Second pass: calculate proportional costs
  const userSelections = new Map<UserId, UserSelection>();

  // Find unvoted items
  const unvotedItems = bill.billItems.filter((item) => {
    return !votes.some((vote) => vote.itemId === item.id);
  });

  // Process each vote and build user selections
  for (const vote of votes) {
    const { userId, itemId, quantity } = vote;

    // Find the corresponding item
    const item = bill.billItems.find((item) => item.id === itemId);
    if (!item) continue;

    // Initialize user selection if not exists
    if (!userSelections.has(userId)) {
      userSelections.set(userId, {
        itemsWithProportion: [],
        total: 0,
      });
    }

    const userSelection = userSelections.get(userId)!;
    const itemCost = getTotalItemCost(item);

    // Calculate proportional cost based on quantity
    const proportion = quantity / item.quantity;
    const proportionalPrice = itemCost * proportion;

    // Add to user's selections
    userSelection.itemsWithProportion.push({
      item,
      proportionalPrice,
      proportion,
    });

    userSelection.total += proportionalPrice;
  }

  return {
    userSelections,
    unvotedItems,
  };
}
