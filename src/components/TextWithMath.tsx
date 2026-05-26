import { renderToString, type KatexOptions } from 'katex';
import 'katex/dist/katex.min.css';

type TextSegment = {
  kind: 'text';
  value: string;
};

type LinkSegment = {
  href: string;
  kind: 'link';
  label: string;
};

type MathSegment = {
  display: boolean;
  kind: 'math';
  source: string;
  value: string;
};

type RichTextSegment = LinkSegment | MathSegment | TextSegment;

const mathDelimiters = [
  { display: false, left: '\\(', right: '\\)' },
  { display: true, left: '\\[', right: '\\]' },
  { display: true, left: '$$', right: '$$' },
] as const;

const katexOptions: KatexOptions = {
  output: 'htmlAndMathml',
  strict: 'warn',
  throwOnError: false,
  trust: false,
};

function nextDelimiter(value: string, startIndex: number) {
  let nextMatch: {
    delimiter: (typeof mathDelimiters)[number];
    index: number;
  } | null = null;

  for (const delimiter of mathDelimiters) {
    const index = value.indexOf(delimiter.left, startIndex);

    if (index === -1) {
      continue;
    }

    if (!nextMatch || index < nextMatch.index) {
      nextMatch = { delimiter, index };
    }
  }

  return nextMatch;
}

function splitMathText(value: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let position = 0;

  while (position < value.length) {
    const match = nextDelimiter(value, position);

    if (!match) {
      segments.push({ kind: 'text', value: value.slice(position) });
      break;
    }

    if (match.index > position) {
      segments.push({ kind: 'text', value: value.slice(position, match.index) });
    }

    const mathStart = match.index + match.delimiter.left.length;
    const mathEnd = value.indexOf(match.delimiter.right, mathStart);

    if (mathEnd === -1) {
      segments.push({ kind: 'text', value: value.slice(match.index) });
      break;
    }

    const source = value.slice(match.index, mathEnd + match.delimiter.right.length);
    const mathValue = value.slice(mathStart, mathEnd);

    if (mathValue.trim().length === 0) {
      segments.push({ kind: 'text', value: source });
    } else {
      segments.push({
        display: match.delimiter.display,
        kind: 'math',
        source,
        value: mathValue,
      });
    }

    position = mathEnd + match.delimiter.right.length;
  }

  return segments;
}

function renderMathHtml(value: string, displayMode: boolean) {
  try {
    return renderToString(value, {
      ...katexOptions,
      displayMode,
    });
  } catch {
    return null;
  }
}

function isSafeLinkHref(href: string) {
  return /^(https?:\/\/|mailto:|\/)/.test(href);
}

function splitInlineLinks(value: string): Array<LinkSegment | TextSegment> {
  const segments: Array<LinkSegment | TextSegment> = [];
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let position = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(value))) {
    const [source, label, href] = match;

    if (!label || !href || !isSafeLinkHref(href)) {
      continue;
    }

    if (match.index > position) {
      segments.push({ kind: 'text', value: value.slice(position, match.index) });
    }

    segments.push({ href, kind: 'link', label });
    position = match.index + source.length;
  }

  if (position < value.length) {
    segments.push({ kind: 'text', value: value.slice(position) });
  }

  return segments;
}

function splitRichText(value: string): RichTextSegment[] {
  return splitMathText(value).flatMap((segment): RichTextSegment[] => (
    segment.kind === 'text' ? splitInlineLinks(segment.value) : [segment]
  ));
}

export function TextWithMath({ value }: { value: string }) {
  return (
    <>
      {splitRichText(value).map((segment, index) => {
        if (segment.kind === 'text') {
          return <span key={`text-${index}`}>{segment.value}</span>;
        }

        if (segment.kind === 'link') {
          return (
            <a className="text-link" href={segment.href} key={`link-${index}`} rel="noreferrer" target="_blank">
              {segment.label}
            </a>
          );
        }

        const html = renderMathHtml(segment.value, segment.display);

        if (!html) {
          return <span key={`math-fallback-${index}`}>{segment.source}</span>;
        }

        return (
          <span
            className={segment.display ? 'math-display' : 'math-inline'}
            dangerouslySetInnerHTML={{ __html: html }}
            key={`math-${index}`}
          />
        );
      })}
    </>
  );
}

