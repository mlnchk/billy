import { describe, it, expect } from 'vitest';
import { calculateBillSplit } from './calculator';
import type { BillWithItems, BillItem } from './db';

function createBill(items: BillItem[]): BillWithItems {
  return {
    id: 1,
    total: items.reduce((sum, i) => sum + (i.priceTotal ?? (i.pricePerUnit ?? 0) * i.quantity), 0),
    currency: 'USD',
    createdAt: new Date(),
    billItems: items,
  } as BillWithItems;
}

describe('calculateBillSplit', () => {
  it('splits basic costs between multiple users', () => {
    const bill = createBill([
      {
        id: 1,
        billId: 1,
        nameOriginal: 'A',
        nameEnglish: 'A',
        quantity: 1,
        priceTotal: 10,
        pricePerUnit: null,
      },
      {
        id: 2,
        billId: 1,
        nameOriginal: 'B',
        nameEnglish: 'B',
        quantity: 1,
        priceTotal: 20,
        pricePerUnit: null,
      },
    ]);

    const result = calculateBillSplit(bill, [
      { userId: 1, itemId: 1, quantity: 1 },
      { userId: 2, itemId: 2, quantity: 1 },
    ]);

    expect(result.userSelections.get(1)?.total).toBeCloseTo(10);
    expect(result.userSelections.get(2)?.total).toBeCloseTo(20);
    expect(result.unvotedItems).toHaveLength(0);
  });

  it('handles item quantities and partial votes', () => {
    const bill = createBill([
      {
        id: 1,
        billId: 1,
        nameOriginal: 'C',
        nameEnglish: 'C',
        quantity: 3,
        priceTotal: 9,
        pricePerUnit: null,
      },
    ]);

    const result = calculateBillSplit(bill, [
      { userId: 1, itemId: 1, quantity: 1 },
      { userId: 2, itemId: 1, quantity: 2 },
    ]);

    expect(result.userSelections.get(1)?.total).toBeCloseTo(3);
    expect(result.userSelections.get(2)?.total).toBeCloseTo(6);
  });

  it('detects items with remaining quantity as unvoted', () => {
    const bill = createBill([
      {
        id: 1,
        billId: 1,
        nameOriginal: 'D',
        nameEnglish: 'D',
        quantity: 3,
        priceTotal: 12,
        pricePerUnit: null,
      },
    ]);

    const result = calculateBillSplit(bill, [
      { userId: 1, itemId: 1, quantity: 1 },
      { userId: 2, itemId: 1, quantity: 1 },
    ]);

    expect(result.unvotedItems.map(i => i.id)).toEqual([1]);
  });

  it('collects items without votes into unvotedItems', () => {
    const bill = createBill([
      {
        id: 1,
        billId: 1,
        nameOriginal: 'A',
        nameEnglish: 'A',
        quantity: 1,
        priceTotal: 5,
        pricePerUnit: null,
      },
      {
        id: 2,
        billId: 1,
        nameOriginal: 'B',
        nameEnglish: 'B',
        quantity: 1,
        priceTotal: 5,
        pricePerUnit: null,
      },
    ]);

    const result = calculateBillSplit(bill, [
      { userId: 1, itemId: 1, quantity: 1 },
    ]);

    expect(result.unvotedItems.map(i => i.id)).toEqual([2]);
  });
});
