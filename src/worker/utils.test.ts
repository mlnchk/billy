import { describe, it, expect } from 'vitest';
import { aggregateVotes } from './utils';

describe('aggregateVotes', () => {
  it('aggregates duplicate item IDs into quantities', () => {
    const result = aggregateVotes([1, 2, 2, 3, 3, 3]);
    expect(result).toEqual([
      { itemId: 1, quantity: 1 },
      { itemId: 2, quantity: 2 },
      { itemId: 3, quantity: 3 },
    ]);
  });
});
