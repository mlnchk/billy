import { Bill, BillItem, BillItemWithId } from "../types.ts";

interface ItemVoters {
  [index: number]: Map<string, number>;
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
  bill: Bill,
  votes: Map<string, number[]>,
): CalculationResult {
  const itemVoters: ItemVoters = {};

  // First pass: count votes per item per user
  for (const [userName, userVotes] of votes) {
    userVotes.forEach((index) => {
      if (!itemVoters[index]) {
        itemVoters[index] = new Map();
      }
      const voters = itemVoters[index];
      voters.set(userName, (voters.get(userName) || 0) + 1);
    });
  }

  // Second pass: calculate proportional costs
  const userSelections = new Map<string, UserSelection>();
  for (const [userName, userVotes] of votes) {
    const uniqueVotes = [...new Set(userVotes)];
    const selectedItems = uniqueVotes.map((index) => {
      const item = bill.items[index - 1];
      const voters = itemVoters[index];
      const totalVotes = Array.from(voters.values()).reduce((a, b) => a + b, 0);
      const userVotes = voters.get(userName) || 0;

      const totalItemCost = getTotalItemCost(item);

      const proportion = userVotes / totalVotes;
      const proportionalPrice = totalItemCost * proportion;

      return {
        item: { ...item, id: index },
        proportionalPrice,
        proportion,
      };
    });

    const userTotal = selectedItems.reduce(
      (sum, itemWithProportion) => sum + itemWithProportion.proportionalPrice,
      0,
    );

    const getAdditionalCosts = (userTotal: number): number => {
      const vat = bill.vat || 0;
      const serviceFee = bill.serviceFee || 0;
      const discount = bill.totalDiscount || 0;

      const additionalCosts = vat + serviceFee - discount;

      // TODO: recalculate based on subtotal
      const result =
        additionalCosts * (userTotal / (bill.total - additionalCosts));

      return result;
    };

    userSelections.set(userName, {
      itemsWithProportion: selectedItems,
      // total: userTotal + getAdditionalCosts(userTotal),
      total: userTotal,
    });
  }

  // Calculate unvoted items
  const unvotedItems = bill.items
    .map((item, index) => ({
      ...item,
      id: index + 1,
    }))
    .filter((item) => !itemVoters[item.id]);

  return {
    userSelections,
    unvotedItems,
  };
}
