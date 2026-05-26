export type TextParagraph = {
  sourceIndex: number;
  text: string;
};

export function paragraphsFromValue(value: string | string[] | undefined): TextParagraph[] {
  if (!value) {
    return [];
  }

  const paragraphs = Array.isArray(value)
    ? value
    : value.split(/\r?\n\s*\r?\n/g);

  return paragraphs
    .map((text, sourceIndex) => ({
      sourceIndex,
      text: text.trim(),
    }))
    .filter(({ text }) => text.length > 0);
}

