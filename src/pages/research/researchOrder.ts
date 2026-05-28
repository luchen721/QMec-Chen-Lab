export type IndexedItem<T> = {
  index: number;
  item: T;
};

export function indexedItems<T>(items: T[]) {
  return items.map((item, index) => ({ index, item }));
}

export function normalizeOrderedIndexes(
  naturalIndexes: number[],
  orderedIndexes: number[],
) {
  const visibleIndexes = new Set(naturalIndexes);
  const baseIndexes = orderedIndexes.length > 0 ? orderedIndexes : naturalIndexes;
  const normalizedIndexes = baseIndexes.filter((index) => visibleIndexes.has(index));

  naturalIndexes.forEach((index) => {
    if (!normalizedIndexes.includes(index)) {
      normalizedIndexes.push(index);
    }
  });

  return normalizedIndexes;
}
