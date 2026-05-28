import type {
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
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
  index: number;
  indexKind: ResearchCardIndexKind;
  isExpanded: boolean;
  item: ResearchCardItem;
  onClick: MouseEventHandler<HTMLElement>;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
  onMouseMove?: MouseEventHandler<HTMLElement>;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  tabIndex: 0;
  variant: ResearchCardVariant;
};

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(' ');
}

function cardClassName(
  variant: ResearchCardVariant,
  isExpanded: boolean,
) {
  const variantClassName =
    variant === 'material' ? 'research-theme-card' : 'card research-tool-card';

  return classNames(
    variantClassName,
    isExpanded &&
      (variant === 'material'
        ? 'research-theme-card-expanded research-theme-card-content-expanded'
        : 'research-tool-card-expanded research-tool-card-content-expanded'),
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
  index,
  indexKind,
  isExpanded,
  item,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onPointerDown,
  tabIndex,
  variant,
}: ResearchCardProps) {
  const targetImageSrc =
    isExpanded && item.expandedImage ? item.expandedImage : item.image;

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
      <span aria-hidden="true" className="research-card-touch-cue" />
    </>
  );

  return (
    <article
      aria-expanded={isExpanded}
      className={cardClassName(variant, isExpanded)}
      data-system-index={indexKind === 'system' ? index : undefined}
      data-tool-index={indexKind === 'tool' ? index : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onPointerDown={onPointerDown}
      ref={articleRef}
      tabIndex={tabIndex}
    >
      <figure>
        {variant === 'material' ? (
          <img
            alt={item.imageAlt}
            className="research-theme-card-image-layer"
            src={assetPath(targetImageSrc)}
          />
        ) : (
          <img
            alt={item.imageAlt}
            src={assetPath(targetImageSrc)}
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
