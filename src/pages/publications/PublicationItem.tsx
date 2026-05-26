import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { TextWithMath } from '../../components/TextWithMath';
import type { Publication } from '../../data/siteContent';
import { defaultPublicationCardStyle, normalizePublicationStarCount } from '../../data/publicationStyles';

const manuscriptCircleGeometry = {
  canvasBleedPx: 28,
  pathInsetPx: 0,
  segmentHalfLengthPx: 150,
  circleSeparationRatio: 0.16,
  baseRadiusPx: 1.2,
  peakRadiusBoostPx: 4.8,
  radiusProfilePower: 4,
} as const;

const manuscriptCircleColor = {
  opacitySpread: 1.8,
  opacityScale: 0.1,
  fillRgb: '74, 210, 255',
  strokeRgb: '55, 184, 255',
  strokeOpacityScale: 0,
  strokeWidthPx: 0,
} as const;

const manuscriptCircleMotion = {
  speedPxPerSecond: 600,
  direction: 1,
  startPosition: 'top-center',
} as const;

type BorderPosition = 'top-center' | 'right-center' | 'bottom-center' | 'left-center';

type BorderPoint = {
  x: number;
  y: number;
};

type BorderPathMetrics = {
  bottom: number;
  cornerLength: number;
  left: number;
  perimeter: number;
  radius: number;
  right: number;
  straightHeight: number;
  straightWidth: number;
  top: number;
};

function PublicationLink({
  children,
  link,
}: {
  children: ReactNode;
  link: NonNullable<Publication['links']>[number];
}) {
  return link.href ? (
    <a href={link.href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <span>{children}</span>
  );
}

function numberFromCssSize(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function circleRadiusAtDistanceRatio(distanceRatio: number) {
  const normalizedDistance = Math.max(0, 1 - distanceRatio);
  const radiusWeight = Math.sin((normalizedDistance * Math.PI) / 2) ** manuscriptCircleGeometry.radiusProfilePower;
  return manuscriptCircleGeometry.baseRadiusPx + manuscriptCircleGeometry.peakRadiusBoostPx * radiusWeight;
}

function circleRadiusAtOffset(offset: number) {
  const distanceRatio = Math.min(1, Math.abs(offset) / manuscriptCircleGeometry.segmentHalfLengthPx);
  return circleRadiusAtDistanceRatio(distanceRatio);
}

function circleOpacityAtDistanceRatio(distanceRatio: number) {
  return Math.exp(-manuscriptCircleColor.opacitySpread * distanceRatio ** 2);
}

function nextCircleOffset(offset: number, currentRadius: number) {
  let step = Math.max(0.5, currentRadius * 2 * manuscriptCircleGeometry.circleSeparationRatio);

  for (let index = 0; index < 2; index += 1) {
    const nextRadius = circleRadiusAtOffset(offset + step);
    step = Math.max(0.5, (currentRadius + nextRadius) * manuscriptCircleGeometry.circleSeparationRatio);
  }

  return offset + step;
}

function pointAtBorderDistance(metrics: BorderPathMetrics, distance: number): BorderPoint {
  let remaining = ((distance % metrics.perimeter) + metrics.perimeter) % metrics.perimeter;

  const consume = (length: number) => {
    if (remaining > length) {
      remaining -= length;
      return true;
    }

    return false;
  };

  if (!consume(metrics.straightWidth)) {
    return { x: metrics.left + metrics.radius + remaining, y: metrics.top };
  }

  if (!consume(metrics.cornerLength)) {
    const angle = -Math.PI / 2 + remaining / Math.max(1, metrics.radius);
    return {
      x: metrics.right - metrics.radius + Math.cos(angle) * metrics.radius,
      y: metrics.top + metrics.radius + Math.sin(angle) * metrics.radius,
    };
  }

  if (!consume(metrics.straightHeight)) {
    return { x: metrics.right, y: metrics.top + metrics.radius + remaining };
  }

  if (!consume(metrics.cornerLength)) {
    const angle = remaining / Math.max(1, metrics.radius);
    return {
      x: metrics.right - metrics.radius + Math.cos(angle) * metrics.radius,
      y: metrics.bottom - metrics.radius + Math.sin(angle) * metrics.radius,
    };
  }

  if (!consume(metrics.straightWidth)) {
    return { x: metrics.right - metrics.radius - remaining, y: metrics.bottom };
  }

  if (!consume(metrics.cornerLength)) {
    const angle = Math.PI / 2 + remaining / Math.max(1, metrics.radius);
    return {
      x: metrics.left + metrics.radius + Math.cos(angle) * metrics.radius,
      y: metrics.bottom - metrics.radius + Math.sin(angle) * metrics.radius,
    };
  }

  if (!consume(metrics.straightHeight)) {
    return { x: metrics.left, y: metrics.bottom - metrics.radius - remaining };
  }

  const angle = Math.PI + remaining / Math.max(1, metrics.radius);
  return {
    x: metrics.left + metrics.radius + Math.cos(angle) * metrics.radius,
    y: metrics.top + metrics.radius + Math.sin(angle) * metrics.radius,
  };
}

function distanceForBorderPosition(metrics: BorderPathMetrics, position: BorderPosition) {
  switch (position) {
    case 'right-center':
      return metrics.straightWidth + metrics.cornerLength + metrics.straightHeight / 2;
    case 'bottom-center':
      return metrics.straightWidth + metrics.cornerLength + metrics.straightHeight + metrics.cornerLength +
        metrics.straightWidth / 2;
    case 'left-center':
      return metrics.straightWidth + metrics.cornerLength + metrics.straightHeight + metrics.cornerLength +
        metrics.straightWidth + metrics.cornerLength + metrics.straightHeight / 2;
    case 'top-center':
    default:
      return metrics.straightWidth / 2;
  }
}

function drawManuscriptCircle(
  context: CanvasRenderingContext2D,
  point: BorderPoint,
  radius: number,
  opacity: number,
) {
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);

  const fillOpacity = Math.min(1, Math.max(0, opacity * manuscriptCircleColor.opacityScale));

  context.fillStyle = `rgba(${manuscriptCircleColor.fillRgb}, ${fillOpacity})`;
  context.fill();

  if (manuscriptCircleColor.strokeWidthPx > 0) {
    context.strokeStyle = `rgba(${manuscriptCircleColor.strokeRgb}, ${
      manuscriptCircleColor.strokeOpacityScale * opacity
    })`;
    context.lineWidth = manuscriptCircleColor.strokeWidthPx;
    context.stroke();
  }
}

function useManuscriptCircleBorder(
  cardRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  isEnabled: boolean,
) {
  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const card = cardRef.current;
    const canvas = canvasRef.current;

    if (!card || !canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return undefined;
    }

    let canvasHeight = card.offsetHeight + manuscriptCircleGeometry.canvasBleedPx * 2;
    let canvasWidth = card.offsetWidth + manuscriptCircleGeometry.canvasBleedPx * 2;
    let frame = 0;
    let metrics: BorderPathMetrics = {
      bottom: card.offsetHeight,
      cornerLength: 0,
      left: manuscriptCircleGeometry.pathInsetPx,
      perimeter: Math.max(1, 2 * (card.offsetWidth + card.offsetHeight)),
      radius: 0,
      right: card.offsetWidth,
      straightHeight: card.offsetHeight,
      straightWidth: card.offsetWidth,
      top: manuscriptCircleGeometry.pathInsetPx,
    };
    let startTime: number | null = null;

    const updateSize = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      const style = window.getComputedStyle(card);
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const pathInset = manuscriptCircleGeometry.pathInsetPx;
      const radius = Math.min(
        width / 2,
        height / 2,
        Math.max(0, numberFromCssSize(style.borderTopLeftRadius) - pathInset),
      );
      const left = pathInset;
      const top = pathInset;
      const right = Math.max(left + 1, width - pathInset);
      const bottom = Math.max(top + 1, height - pathInset);
      const straightWidth = Math.max(0, right - left - 2 * radius);
      const straightHeight = Math.max(0, bottom - top - 2 * radius);
      const cornerLength = (Math.PI * radius) / 2;

      metrics = {
        bottom,
        cornerLength,
        left,
        perimeter: Math.max(1, 2 * (straightWidth + straightHeight) + 4 * cornerLength),
        radius,
        right,
        straightHeight,
        straightWidth,
        top,
      };
      canvasWidth = width + manuscriptCircleGeometry.canvasBleedPx * 2;
      canvasHeight = height + manuscriptCircleGeometry.canvasBleedPx * 2;
      canvas.width = Math.round(canvasWidth * pixelRatio);
      canvas.height = Math.round(canvasHeight * pixelRatio);
      canvas.style.left = `${-numberFromCssSize(style.borderLeftWidth) - manuscriptCircleGeometry.canvasBleedPx}px`;
      canvas.style.top = `${-numberFromCssSize(style.borderTopWidth) - manuscriptCircleGeometry.canvasBleedPx}px`;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time: number) => {
      if (startTime === null) {
        startTime = time;
      }

      const elapsedSeconds = (time - startTime) / 1000;
      const startDistance = distanceForBorderPosition(metrics, manuscriptCircleMotion.startPosition);
      const centerDistance =
        startDistance +
        elapsedSeconds * manuscriptCircleMotion.speedPxPerSecond * manuscriptCircleMotion.direction;

      context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.save();
      context.translate(manuscriptCircleGeometry.canvasBleedPx, manuscriptCircleGeometry.canvasBleedPx);
      context.globalCompositeOperation = 'source-over';

      let offset = -manuscriptCircleGeometry.segmentHalfLengthPx;

      while (offset <= manuscriptCircleGeometry.segmentHalfLengthPx) {
        const distanceRatioFromCenter = Math.abs(offset) / manuscriptCircleGeometry.segmentHalfLengthPx;
        const point = pointAtBorderDistance(metrics, centerDistance + offset);
        const radius = circleRadiusAtOffset(offset);

        drawManuscriptCircle(
          context,
          point,
          radius,
          circleOpacityAtDistanceRatio(distanceRatioFromCenter),
        );

        offset = nextCircleOffset(offset, radius);
      }

      context.restore();
      frame = window.requestAnimationFrame(draw);
    };

    updateSize();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateSize);
    observer?.observe(card);
    frame = window.requestAnimationFrame(draw);

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [cardRef, canvasRef, isEnabled]);
}

export function PublicationItem({
  publication,
}: {
  publication: Publication;
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const manuscriptCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const journalLink = publication.links?.find((link) => !link.label.toLowerCase().includes('arxiv'));
  const arxivLinks = publication.links?.filter((link) => link.label.toLowerCase().includes('arxiv')) ?? [];
  const cardStyle = publication.cardStyle ?? defaultPublicationCardStyle;
  const starCount = normalizePublicationStarCount(publication.starCount);
  const isManuscriptInPrep = cardStyle === 'prep_publication_card';

  useManuscriptCircleBorder(cardRef, manuscriptCanvasRef, isManuscriptInPrep);

  return (
    <article className={`publication-item floating-tile ${cardStyle}`} ref={cardRef}>
      {isManuscriptInPrep ? (
        <canvas aria-hidden="true" className="manuscript-border-canvas" ref={manuscriptCanvasRef} />
      ) : null}
      <div className="publication-title-row">
        <h3>
          <TextWithMath value={publication.title} />
        </h3>
        {cardStyle === 'selected_publication_card' && starCount > 0 ? (
          <span className="publication-stars" aria-label={`${starCount} star selected publication`}>
            {'★'.repeat(starCount)}
          </span>
        ) : null}
      </div>
      <p>
        <TextWithMath value={publication.authors} />
      </p>
      {publication.description ? (
        <p className="publication-description">
          <TextWithMath value={publication.description} />
        </p>
      ) : null}
      <div className="publication-links">
        <p className="venue">
          {journalLink ? (
            <PublicationLink link={journalLink}>
              <TextWithMath value={publication.venue} />
            </PublicationLink>
          ) : (
            <span>
              <TextWithMath value={publication.venue} />
            </span>
          )}
        </p>
        {arxivLinks.length > 0 ? (
          <div className="inline-links">
            {arxivLinks.map((link) => (
              <PublicationLink key={`publication-link-${link.label}`} link={link}>
                <TextWithMath value={link.label} />
              </PublicationLink>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

