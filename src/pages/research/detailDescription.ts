import type { DetailDescription } from '../../data/siteContent';
import { paragraphsFromValue, type TextParagraph } from '../../utils/paragraphs';

export type DetailParagraph = TextParagraph;

export function detailDescriptionToParagraphs(
  detail: DetailDescription | string | undefined,
): DetailParagraph[] {
  return paragraphsFromValue(detail);
}

