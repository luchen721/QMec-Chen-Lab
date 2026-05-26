import {
  useEffect,
  useState,
} from 'react';
import type {
  KeyboardEventHandler,
  MouseEventHandler,
} from 'react';
import { TextWithMath } from '../../components/TextWithMath';
import type { DetailDescription } from '../../data/siteContent';
import { assetPath } from '../../utils/assetPath';
import { detailDescriptionToParagraphs } from './detailDescription';

type ResearchCardVariant = 'material' | 'tool';
type ResearchCardIndexKind = 'system' | 'tool';

type ResearchCardItem = {
  title: string;
  summary: string;
  image: string;
  expandedImage?: string;
  imageAlt: string;
  caption?: string;
  details?: DetailDescription;
};

type ResearchCardProps = {
  articleRef: (element: HTMLElement | null) => void;
  bodyClassName?: string;
  detailRef?: (element: HTMLElement | null) => void;
  imageRef?: (element: HTMLElement | null) => void;
  index: number;
  indexKind: ResearchCardIndexKind;
  isClosing: boolean;
  isExpanded: boolean;
  item: ResearchCardItem;
  onClick: MouseEventHandler<HTMLElement>;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
  onMouseMove?: MouseEventHandler<HTMLElement>;
  tabIndex: 0;
  variant: ResearchCardVariant;
};

const MATERIAL_IMAGE_CROSSFADE_MS = 1800;

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(' ');
}

function cardClassName(
  variant: ResearchCardVariant,
  isExpanded: boolean,
  isClosing: boolean,
) {
  const variantClassName =
    variant === 'material' ? 'research-theme-card' : 'card research-tool-card';

  return classNames(
    variantClassName,
    isExpanded &&
      (variant === 'material'
        ? 'research-theme-card-expanded research-theme-card-content-expanded'
        : 'research-tool-card-expanded research-tool-card-content-expanded'),
    isClosing &&
      (variant === 'material'
        ? 'research-theme-card-closing'
        : 'research-tool-card-closing'),
    'floating-tile',
  );
}

function summaryClassName(variant: ResearchCardVariant) {
  return variant === 'material'
    ? 'research-theme-card-summary'
    : 'research-tool-card-summary';
}

function captionClassName(variant: ResearchCardVariant) {
  return variant === 'material'
    ? 'caption research-theme-card-caption'
    : 'caption research-tool-card-caption';
}

function detailClassName(variant: ResearchCardVariant) {
  return variant === 'material'
    ? 'research-theme-card-detail'
    : 'research-tool-card-detail';
}

export function ResearchCard({
  articleRef,
  bodyClassName,
  detailRef,
  imageRef,
  index,
  indexKind,
  isClosing,
  isExpanded,
  item,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  tabIndex,
  variant,
}: ResearchCardProps) {
  const targetImageSrc =
    isExpanded && item.expandedImage ? item.expandedImage : item.image;
  const [settledMaterialImageSrc, setSettledMaterialImageSrc] =
    useState(targetImageSrc);
  const isMaterialImageTransitioning =
    variant === 'material' && settledMaterialImageSrc !== targetImageSrc;

  useEffect(() => {
    if (
      variant !== 'material' ||
      settledMaterialImageSrc === targetImageSrc
    ) {
      return undefined;
    }

    const finishTransitionId = window.setTimeout(() => {
      setSettledMaterialImageSrc(targetImageSrc);
    }, MATERIAL_IMAGE_CROSSFADE_MS);

    return () => window.clearTimeout(finishTransitionId);
  }, [settledMaterialImageSrc, targetImageSrc, variant]);

  const displayImageSrc =
    variant === 'material' ? settledMaterialImageSrc : targetImageSrc;

  const bodyContent = (
    <>
      <h3>
        <TextWithMath value={item.title} />
      </h3>
      <p className={summaryClassName(variant)}>
        <TextWithMath value={item.summary} />
      </p>
      {item.caption ? (
        <p className={captionClassName(variant)}>
          <TextWithMath value={item.caption} />
        </p>
      ) : null}
      {item.details ? (
        <div className={detailClassName(variant)} ref={detailRef}>
          {detailDescriptionToParagraphs(item.details).map(
            ({ sourceIndex, text }) => (
              <p key={`${variant}-${index}-detail-${sourceIndex}`}>
                <TextWithMath value={text} />
              </p>
            ),
          )}
        </div>
      ) : null}
    </>
  );

  return (
    <article
      aria-expanded={isExpanded}
      className={cardClassName(variant, isExpanded, isClosing)}
      data-system-index={indexKind === 'system' ? index : undefined}
      data-tool-index={indexKind === 'tool' ? index : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      ref={articleRef}
      tabIndex={tabIndex}
    >
      <figure>
        {variant === 'material' ? (
          <span className="research-theme-card-image-frame" ref={imageRef}>
            {isMaterialImageTransitioning ? (
              <>
                <img
                  alt=""
                  aria-hidden="true"
                  className="research-theme-card-image-layer research-theme-card-image-layer-outgoing"
                  src={assetPath(settledMaterialImageSrc)}
                />
                <img
                  alt={item.imageAlt}
                  className="research-theme-card-image-layer research-theme-card-image-layer-incoming"
                  src={assetPath(targetImageSrc)}
                />
              </>
            ) : (
              <img
                alt={item.imageAlt}
                className="research-theme-card-image-layer"
                src={assetPath(displayImageSrc)}
              />
            )}
          </span>
        ) : (
          <img
            alt={item.imageAlt}
            ref={imageRef}
            src={assetPath(displayImageSrc)}
          />
        )}
      </figure>
      {bodyClassName ? (
        <div className={bodyClassName}>{bodyContent}</div>
      ) : (
        bodyContent
      )}
    </article>
  );
}

