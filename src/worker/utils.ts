export function aggregateVotes(itemIds: number[]): { itemId: number; quantity: number }[] {
  const counts = new Map<number, number>();
  for (const id of itemIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([itemId, quantity]) => ({ itemId, quantity }));
}
