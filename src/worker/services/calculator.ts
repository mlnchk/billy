import { BillItem, BillItemWithId, BillWithItemIds } from "../types.ts";

interface ItemVoters {
  [itemId: number]: Map<string, number>;
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
  bill: BillWithItemIds,
  votes: Map<string, number[]>,
): CalculationResult {
  console.log("votes", votes);
  const itemVoters: ItemVoters = {};

  // First pass: count votes per item per user
  for (const [userName, userVotes] of votes) {
    userVotes.forEach((itemId) => {
      if (!itemVoters[itemId]) {
        itemVoters[itemId] = new Map();
      }
      const voters = itemVoters[itemId];
      voters.set(userName, (voters.get(userName) || 0) + 1);
    });
  }

  // Second pass: calculate proportional costs
  const userSelections = new Map<string, UserSelection>();
  for (const [userName, userVotes] of votes) {
    const uniqueVotes = [...new Set(userVotes)];
    const selectedItems = uniqueVotes
      .map((itemId) => {
        const item = bill.items.find((item) => item.id === itemId);

        if (!item) return null;

        const voters = itemVoters[itemId];
        const totalVotes = Array.from(voters.values()).reduce(
          (a, b) => a + b,
          0,
        );
        const userVotes = voters.get(userName) || 0;

        const totalItemCost = getTotalItemCost(item);

        const proportion = userVotes / totalVotes;
        const proportionalPrice = totalItemCost * proportion;

        return {
          item,
          proportionalPrice,
          proportion,
        };
      })
      .filter((item) => item !== null);

    const userTotal = selectedItems.reduce(
      (sum, itemWithProportion) => sum + itemWithProportion.proportionalPrice,
      0,
    );

    userSelections.set(userName, {
      itemsWithProportion: selectedItems,
      // total: userTotal + getAdditionalCosts(userTotal),
      total: userTotal,
    });
  }

  // Calculate unvoted items
  const unvotedItems = bill.items.filter((item) => !itemVoters[item.id]);

  return {
    userSelections,
    unvotedItems,
  };
}
