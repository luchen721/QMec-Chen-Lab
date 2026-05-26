export type PublicationCardStyle =
  | 'basic_publication_card'
  | 'selected_publication_card'
  | 'prep_publication_card';

export type PublicationStarCount = 0 | 1 | 2 | 3 | 4 | 5;

export const defaultPublicationCardStyle: PublicationCardStyle = 'basic_publication_card';

export const selectedPublicationDefaultStarCount: PublicationStarCount = 3;

export function normalizePublicationStarCount(value: unknown) {
  const count = Number(value ?? selectedPublicationDefaultStarCount);

  return Number.isFinite(count) ? Math.max(0, Math.min(5, Math.floor(count))) : 0;
}

