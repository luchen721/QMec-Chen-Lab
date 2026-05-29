import { renderToString, type KatexOptions } from 'katex';
import 'katex/dist/katex.min.css';

type TextSegment = {
  kind: 'text';
  value: string;
};

type ProtectedTextSegment = {
  kind: 'protected-text';
  value: string;
};

type LinkSegment = {
  href: string;
  kind: 'link';
  label: string;
};

type TextCitation = {
  href?: string;
  label: string;
  marker: string;
  status: 'verified' | 'unverified';
};

type CitationSegment = {
  href?: string;
  kind: 'citation';
  marker: string;
  status: 'verified' | 'unverified';
};

type MathSegment = {
  display: boolean;
  kind: 'math';
  source: string;
  value: string;
};

type RichTextSegment = CitationSegment | LinkSegment | MathSegment | TextSegment;

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizedCitations(citations: TextCitation[]): TextCitation[] {
  return citations
    .filter((citation) => citation.marker.trim().length > 0)
    .map((citation) => ({
      ...citation,
      href: citation.href && isSafeLinkHref(citation.href) ? citation.href : undefined,
      marker: citation.marker.trim(),
      status: citation.status === 'verified' ? ('verified' as const) : ('unverified' as const),
    }))
    .sort((left, right) => right.marker.length - left.marker.length);
}

function citationSegmentFor(citation: TextCitation): CitationSegment {
  return {
    href: citation.status === 'verified' ? citation.href : undefined,
    kind: 'citation',
    marker: citation.marker,
    status: citation.status,
  };
}

function splitKnownCitationCluster(
  value: string,
  normalized: TextCitation[],
  markerPattern: string,
  allowSingleMarker: boolean,
): Array<CitationSegment | TextSegment> | null {
  const separator = '(?:\\s*,\\s*|\\s+and\\s+)';
  const clusterPattern = allowSingleMarker
    ? `^\\s*(?:${markerPattern})(?:${separator}(?:${markerPattern}))*\\s*$`
    : `^\\s*(?:${markerPattern})(?:${separator}(?:${markerPattern}))+\\s*$`;

  if (!new RegExp(clusterPattern, 'i').test(value)) {
    return null;
  }

  const segments: Array<CitationSegment | TextSegment> = [];
  const tokenPattern = new RegExp(markerPattern, 'gi');
  let position = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(value))) {
    const marker = match[0];
    const citation = normalized.find((candidate) => candidate.marker.toLowerCase() === marker.toLowerCase());

    if (!citation) {
      return null;
    }

    if (match.index > position) {
      segments.push({ kind: 'text', value: value.slice(position, match.index) });
    }

    segments.push(citationSegmentFor(citation));
    position = match.index + marker.length;
  }

  if (position < value.length) {
    segments.push({ kind: 'text', value: value.slice(position) });
  }

  return segments.filter((segment) => segment.kind !== 'text' || segment.value.length > 0);
}

function isBlockedBareCitationClusterStart(value: string, markerStart: number) {
  return /\bor\s*[,;:]?\s*$/i.test(value.slice(0, markerStart));
}

function splitCitationMarkers(value: string, citations: TextCitation[]): Array<CitationSegment | TextSegment> {
  const normalized = normalizedCitations(citations);

  if (normalized.length === 0) {
    return [{ kind: 'text', value }];
  }

  const markerPattern = normalized.map((citation) => escapeRegExp(citation.marker)).join('|');
  const bareClusterPattern = '\\d+(?:(?:\\s*,\\s*|\\s+and\\s+)\\d+)+';
  const pattern = new RegExp(
    `\\(refs?\\.\\s*([^)]*)\\)|\\[([^\\]]+)\\]|(^|[\\s([{])(${bareClusterPattern})(?=\\s*(?:[.;:]|$))`,
    'gi',
  );
  const segments: Array<CitationSegment | TextSegment> = [];
  let position = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value))) {
    const source = match[0];
    const refCluster = match[1];
    const bracketCluster = match[2];
    const barePrefix = match[3] ?? '';
    const bareCluster = match[4];
    const cluster = refCluster ?? bracketCluster ?? bareCluster;
    const isBracketedMarkdownLink = bracketCluster !== undefined && value[match.index + source.length] === '(';
    const citationSegments = isBracketedMarkdownLink
      ? null
      : splitKnownCitationCluster(cluster, normalized, markerPattern, refCluster !== undefined || bracketCluster !== undefined);

    if (!citationSegments) {
      continue;
    }

    const markerStart = match.index + (bareCluster ? barePrefix.length : 0);

    if (bareCluster && isBlockedBareCitationClusterStart(value, markerStart)) {
      continue;
    }

    if (markerStart > position) {
      segments.push({ kind: 'text', value: value.slice(position, markerStart) });
    }

    segments.push(...citationSegments);
    position = match.index + source.length;
  }

  if (position < value.length) {
    segments.push({ kind: 'text', value: value.slice(position) });
  }

  return segments;
}

function splitInlineLinks(value: string): Array<LinkSegment | ProtectedTextSegment | TextSegment> {
  const segments: Array<LinkSegment | ProtectedTextSegment | TextSegment> = [];
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let position = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(value))) {
    const [source, label, href] = match;

    if (!label || !href) {
      continue;
    }

    if (match.index > position) {
      segments.push({ kind: 'text', value: value.slice(position, match.index) });
    }

    if (isSafeLinkHref(href)) {
      segments.push({ href, kind: 'link', label });
    } else {
      segments.push({ kind: 'protected-text', value: source });
    }

    position = match.index + source.length;
  }

  if (position < value.length) {
    segments.push({ kind: 'text', value: value.slice(position) });
  }

  return segments;
}

function splitRichText(value: string, citations: TextCitation[]): RichTextSegment[] {
  return splitMathText(value).flatMap((segment): RichTextSegment[] => {
    if (segment.kind !== 'text') {
      return [segment];
    }

    return splitInlineLinks(segment.value).flatMap((inlineSegment): RichTextSegment[] => {
      if (inlineSegment.kind === 'link') {
        return [inlineSegment];
      }

      if (inlineSegment.kind === 'protected-text') {
        return [{ kind: 'text', value: inlineSegment.value }];
      }

      return splitCitationMarkers(inlineSegment.value, citations);
    });
  });
}

export function TextWithMath({ citations = [], value }: { citations?: TextCitation[]; value: string }) {
  return (
    <>
      {splitRichText(value, citations).map((segment, index) => {
        if (segment.kind === 'text') {
          return <span key={`text-${index}`}>{segment.value}</span>;
        }

        if (segment.kind === 'citation') {
          const label = `[${segment.marker}]`;
          const className = `publication-abstract-citation-marker ${
            segment.status === 'verified' && segment.href ? 'is-verified' : 'is-unverified'
          }`;

          return segment.status === 'verified' && segment.href ? (
            <a className={className} href={segment.href} key={`citation-${index}`} rel="noreferrer" target="_blank">
              {label}
            </a>
          ) : (
            <span className={className} key={`citation-${index}`}>
              {label}
            </span>
          );
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
