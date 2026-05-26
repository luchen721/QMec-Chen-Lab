import {
  type KeyboardEvent,
  type MouseEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ResearchContent } from '../../data/siteContent';
import { ResearchCard } from './ResearchCard';
import { ResearchSectionHeader } from './ResearchSectionHeader';
import { indexedItems, normalizeOrderedIndexes } from './researchOrder';
import { hasMeaningfulTranslation, prefersReducedMotion } from './researchMotion';

type MaterialsProps = {
  materials: ResearchContent['materials'];
};

type MaterialCardInteractionPhase =
  | 'transitioning'
  | 'static-open'
  | 'static-closed';

const RESEARCH_CARD_MOTION_MS = 1800;
const RESEARCH_CARD_MOTION_GUARD_MS = 2040;

export function Materials({ materials }: MaterialsProps) {
  const [expandedSystemIndexes, setExpandedSystemIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const [closingSystemIndexes, setClosingSystemIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const [orderedSystemIndexes, setOrderedSystemIndexes] = useState<number[]>([]);
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const closingSystemIndexesRef = useRef<Set<number>>(new Set());
  const closingSystemTokensRef = useRef(new Map<number, number>());
  const detailRefs = useRef(new Map<number, HTMLElement>());
  const expandedSystemIndexesRef = useRef<Set<number>>(new Set());
  const hoverSuppressedIndexesRef = useRef<Set<number>>(new Set());
  const imageMotionTokensRef = useRef(new Map<number, number>());
  const imageRefs = useRef(new Map<number, HTMLElement>());
  const movingSystemIndexesRef = useRef<Set<number>>(new Set());
  const cardMotionDeltasRef = useRef(
    new Map<number, { deltaX: number; deltaY: number }>(),
  );
  const nextImageLayoutsRef = useRef(new Map<number, DOMRect>());
  const orderedSystemIndexesRef = useRef<number[]>([]);
  const previousCardLayoutsRef = useRef(new Map<number, DOMRect>());
  const previousImageLayoutsRef = useRef(new Map<number, DOMRect>());
  const systemMotionTokensRef = useRef(new Map<number, number>());
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  const visibleSystems = indexedItems(materials.systems)
    .map(({ index, item: theme }) => ({ index, theme }));
  const naturalSystemIndexes = visibleSystems.map(({ index }) => index);

  const getCurrentOrderedIndexes = () => {
    return normalizeOrderedIndexes(naturalSystemIndexes, orderedSystemIndexesRef.current);
  };

  const getInPlaceSystemOrder = (targetIndex: number) => {
    const currentIndexes = getCurrentOrderedIndexes();
    const targetRect = cardRefs.current.get(targetIndex)?.getBoundingClientRect();

    if (!targetRect) {
      return currentIndexes;
    }

    const rowIndexes = currentIndexes.filter((index) => {
      const rect = cardRefs.current.get(index)?.getBoundingClientRect();
      return rect ? Math.abs(rect.top - targetRect.top) < 24 : false;
    });

    if (!rowIndexes.includes(targetIndex)) {
      return currentIndexes;
    }

    const rowIndexSet = new Set(rowIndexes);
    const firstRowIndex = currentIndexes.findIndex((index) =>
      rowIndexSet.has(index),
    );
    const reorderedRowIndexes = [
      targetIndex,
      ...rowIndexes.filter((index) => index !== targetIndex),
    ];
    const indexesBeforeRow = currentIndexes
      .slice(0, Math.max(firstRowIndex, 0))
      .filter((index) => !rowIndexSet.has(index));
    const indexesAfterRow = currentIndexes
      .slice(Math.max(firstRowIndex, 0))
      .filter((index) => !rowIndexSet.has(index));

    return [...indexesBeforeRow, ...reorderedRowIndexes, ...indexesAfterRow];
  };

  const getNaturalSystemOrder = () => [...naturalSystemIndexes];

  const recordCardLayouts = () => {
    const layouts = new Map<number, DOMRect>();
    cardRefs.current.forEach((element, index) => {
      layouts.set(index, element.getBoundingClientRect());
    });
    previousCardLayoutsRef.current = layouts;
  };

  const recordImageLayout = (index: number) => {
    const image = imageRefs.current.get(index);

    if (!image) {
      return;
    }

    previousImageLayoutsRef.current.set(index, image.getBoundingClientRect());
  };

  const measureSystemDetail = (index: number) => {
    const detail = detailRefs.current.get(index);

    if (!detail) {
      return;
    }

    const targetHeight = `${Math.ceil(detail.scrollHeight + 2)}px`;

    if (
      detail.style.getPropertyValue('--research-theme-card-detail-height') !==
      targetHeight
    ) {
      detail.style.setProperty('--research-theme-card-detail-height', targetHeight);
    }
  };

  const measureSystemDetails = () => {
    detailRefs.current.forEach((_detail, index) => measureSystemDetail(index));
  };

  const setExpandedSystems = (indexes: Set<number>, orderedIndexes: number[]) => {
    recordCardLayouts();
    expandedSystemIndexesRef.current = indexes;
    orderedSystemIndexesRef.current = orderedIndexes;
    setExpandedSystemIndexes(indexes);
    setOrderedSystemIndexes(orderedIndexes);
  };

  const setClosingSystems = (indexes: Set<number>) => {
    closingSystemIndexesRef.current = indexes;
    setClosingSystemIndexes(indexes);
  };

  const clearClosingSystem = (index: number) => {
    if (!closingSystemIndexesRef.current.has(index)) {
      return;
    }

    const nextIndexes = new Set(closingSystemIndexesRef.current);
    nextIndexes.delete(index);
    setClosingSystems(nextIndexes);
  };

  const markSystemAsClosing = (index: number) => {
    const nextIndexes = new Set(closingSystemIndexesRef.current);
    nextIndexes.add(index);
    setClosingSystems(nextIndexes);

    const token = (closingSystemTokensRef.current.get(index) ?? 0) + 1;
    closingSystemTokensRef.current.set(index, token);

    window.setTimeout(() => {
      if (closingSystemTokensRef.current.get(index) !== token) {
        return;
      }

      closingSystemTokensRef.current.delete(index);
      clearClosingSystem(index);
    }, RESEARCH_CARD_MOTION_GUARD_MS);
  };

  const expandSystem = (index: number) => {
    if (expandedSystemIndexesRef.current.has(index)) {
      return;
    }

    clearClosingSystem(index);
    measureSystemDetail(index);
    hoverSuppressedIndexesRef.current.delete(index);
    const nextIndexes = new Set(expandedSystemIndexesRef.current);
    nextIndexes.add(index);
    setExpandedSystems(nextIndexes, getInPlaceSystemOrder(index));
  };

  const hasSystemCardTransitionMotion = (index: number) => {
    const element = cardRefs.current.get(index);

    return (
      movingSystemIndexesRef.current.has(index) ||
      Boolean(
        element?.getAnimations({ subtree: true }).some(
          (animation) => animation.playState === 'running',
        ),
      )
    );
  };

  const getSystemCardInteractionPhase = (
    index: number,
  ): MaterialCardInteractionPhase => {
    if (hasSystemCardTransitionMotion(index)) {
      return 'transitioning';
    }

    return expandedSystemIndexesRef.current.has(index)
      ? 'static-open'
      : 'static-closed';
  };

  const shouldIgnoreSystemHoverInteraction = (index: number) => (
    hoverSuppressedIndexesRef.current.has(index) ||
    getSystemCardInteractionPhase(index) === 'transitioning'
  );

  const shouldIgnoreSystemToggleInteraction = (index: number) => (
    getSystemCardInteractionPhase(index) === 'transitioning'
  );

  const expandSystemFromHover = (index: number) => {
    if (shouldIgnoreSystemHoverInteraction(index)) {
      return;
    }

    expandSystem(index);
  };

  const toggleSystem = (index: number, suppressHoverAfterClose = false) => {
    const nextIndexes = new Set(expandedSystemIndexesRef.current);

    if (nextIndexes.has(index)) {
      recordImageLayout(index);
      nextIndexes.delete(index);
      markSystemAsClosing(index);

      if (suppressHoverAfterClose) {
        hoverSuppressedIndexesRef.current.add(index);
      }

      setExpandedSystems(nextIndexes, getNaturalSystemOrder());
      return;
    }

    clearClosingSystem(index);
    measureSystemDetail(index);
    hoverSuppressedIndexesRef.current.delete(index);
    nextIndexes.add(index);
    setExpandedSystems(nextIndexes, getInPlaceSystemOrder(index));
  };

  const recordPointerPosition = (event: MouseEvent<HTMLElement>) => {
    lastPointerPositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleSystemKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    if (shouldIgnoreSystemToggleInteraction(index)) {
      return;
    }

    toggleSystem(index);
  };

  const clearHoverSuppression = (index: number, element: HTMLElement) => {
    const isMoving =
      movingSystemIndexesRef.current.has(index) ||
      element.getAnimations().some((animation) => animation.playState === 'running');
    const pointerIsInsideElement = () => {
      const pointerPosition = lastPointerPositionRef.current;

      if (!pointerPosition) {
        return false;
      }

      const rect = element.getBoundingClientRect();

      return (
        pointerPosition.x >= rect.left &&
        pointerPosition.x <= rect.right &&
        pointerPosition.y >= rect.top &&
        pointerPosition.y <= rect.bottom
      );
    };

    if (!pointerIsInsideElement()) {
      hoverSuppressedIndexesRef.current.delete(index);
      return;
    }

    window.setTimeout(() => {
      if (!pointerIsInsideElement()) {
        hoverSuppressedIndexesRef.current.delete(index);
      }
    }, isMoving ? RESEARCH_CARD_MOTION_GUARD_MS : 0);
  };

  useLayoutEffect(() => {
    measureSystemDetails();
  });

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => measureSystemDetails());

    cardRefs.current.forEach((element) => observer.observe(element));
    detailRefs.current.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  });

  useLayoutEffect(() => {
    const previousCardLayouts = previousCardLayoutsRef.current;

    if (previousCardLayouts.size === 0) {
      return;
    }

    const isReducedMotion = prefersReducedMotion();
    const cardMotionDeltas = new Map<
      number,
      { deltaX: number; deltaY: number }
    >();
    const nextImageLayouts = new Map<number, DOMRect>();

    cardRefs.current.forEach((element, index) => {
      const previousRect = previousCardLayouts.get(index);

      if (!previousRect) {
        return;
      }

      const nextRect = element.getBoundingClientRect();
      const image = imageRefs.current.get(index);
      if (image) {
        nextImageLayouts.set(index, image.getBoundingClientRect());
      }

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;
      const hasTranslationMotion = hasMeaningfulTranslation(deltaX, deltaY);

      if (isReducedMotion || !hasTranslationMotion) {
        return;
      }

      const token = (systemMotionTokensRef.current.get(index) ?? 0) + 1;
      systemMotionTokensRef.current.set(index, token);
      movingSystemIndexesRef.current.add(index);
      cardMotionDeltas.set(index, { deltaX, deltaY });
      const baseTransform = window.getComputedStyle(element).transform;
      const targetTransform =
        baseTransform === 'none' ? 'translate(0, 0)' : baseTransform;
      const initialTransform = baseTransform === 'none'
        ? `translate(${deltaX}px, ${deltaY}px)`
        : `translate(${deltaX}px, ${deltaY}px) ${baseTransform}`;

      const animation = element.animate(
        [
          { transform: initialTransform },
          { transform: targetTransform },
        ],
        {
          duration: RESEARCH_CARD_MOTION_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
      );

      animation.finished
        .catch(() => undefined)
        .finally(() => {
          if (systemMotionTokensRef.current.get(index) === token) {
            movingSystemIndexesRef.current.delete(index);
            systemMotionTokensRef.current.delete(index);
          }
        });
    });

    cardMotionDeltasRef.current = cardMotionDeltas;
    nextImageLayoutsRef.current = nextImageLayouts;
    previousCardLayoutsRef.current = new Map();
  }, [expandedSystemIndexes, orderedSystemIndexes]);

  useLayoutEffect(() => {
    const previousImageLayouts = previousImageLayoutsRef.current;

    if (previousImageLayouts.size === 0) {
      cardMotionDeltasRef.current = new Map();
      nextImageLayoutsRef.current = new Map();
      return;
    }

    const isReducedMotion = prefersReducedMotion();

    previousImageLayouts.forEach((previousRect, index) => {
      const image = imageRefs.current.get(index);

      if (!image) {
        return;
      }

      const nextRect =
        nextImageLayoutsRef.current.get(index) ?? image.getBoundingClientRect();

      if (
        nextRect.width <= 0 ||
        nextRect.height <= 0 ||
        previousRect.width <= 0 ||
        previousRect.height <= 0
      ) {
        return;
      }

      const cardMotionDelta = cardMotionDeltasRef.current.get(index);
      const deltaX =
        previousRect.left - nextRect.left - (cardMotionDelta?.deltaX ?? 0);
      const deltaY =
        previousRect.top - nextRect.top - (cardMotionDelta?.deltaY ?? 0);
      const scaleX = previousRect.width / nextRect.width;
      const scaleY = previousRect.height / nextRect.height;
      const hasMotion =
        hasMeaningfulTranslation(deltaX, deltaY) ||
        Math.abs(scaleX - 1) >= 0.01 ||
        Math.abs(scaleY - 1) >= 0.01;

      if (isReducedMotion || !hasMotion) {
        return;
      }

      const token = (imageMotionTokensRef.current.get(index) ?? 0) + 1;
      imageMotionTokensRef.current.set(index, token);
      image.style.transformOrigin = 'top left';
      const baseTransform = window.getComputedStyle(image).transform;
      const initialTransform = baseTransform === 'none'
        ? `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`
        : `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY}) ${baseTransform}`;

      const animation = image.animate(
        [
          {
            transform: initialTransform,
          },
          { transform: baseTransform },
        ],
        {
          duration: RESEARCH_CARD_MOTION_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
      );

      animation.finished
        .catch(() => undefined)
        .finally(() => {
          if (imageMotionTokensRef.current.get(index) === token) {
            image.style.transformOrigin = '';
            imageMotionTokensRef.current.delete(index);
          }
        });
    });

    previousImageLayoutsRef.current = new Map();
    cardMotionDeltasRef.current = new Map();
    nextImageLayoutsRef.current = new Map();
  }, [closingSystemIndexes, expandedSystemIndexes, orderedSystemIndexes]);

  const visibleSystemMap = new Map(
    visibleSystems.map((system) => [system.index, system]),
  );
  const orderedVisibleSystems = normalizeOrderedIndexes(naturalSystemIndexes, orderedSystemIndexes)
    .map((index) => visibleSystemMap.get(index))
    .filter((system): system is (typeof visibleSystems)[number] => Boolean(system));

  return (
    <section className="section material-systems-section">
      <ResearchSectionHeader
        classes={{
          copy: 'material-systems-heading-copy',
          heading: 'material-systems-heading',
          visual: 'research-intro-visual',
        }}
        eyebrow={materials.eyebrow}
        imageAlt={materials.overview.imageAlt}
        imageSrc={materials.overview.image}
        intro={materials.intro}
        title={materials.title}
      />
      <div className="research-theme-grid">
        {orderedVisibleSystems.map(({ theme, index }) => {
          const isExpanded = expandedSystemIndexes.has(index);
          const isClosing = closingSystemIndexes.has(index) && !isExpanded;

          return (
            <ResearchCard
              articleRef={(element) => {
                if (element) {
                  cardRefs.current.set(index, element);
                } else {
                  cardRefs.current.delete(index);
                }
              }}
              bodyClassName="research-theme-card-body"
              detailRef={(element) => {
                if (element) {
                  detailRefs.current.set(index, element);
                  measureSystemDetail(index);
                } else {
                  detailRefs.current.delete(index);
                }
              }}
              imageRef={(element) => {
                if (element) {
                  imageRefs.current.set(index, element);
                } else {
                  imageRefs.current.delete(index);
                }
              }}
              index={index}
              indexKind="system"
              isClosing={isClosing}
              isExpanded={isExpanded}
              item={theme}
              key={`material-system-${index}`}
              onClick={(event) => {
                recordPointerPosition(event);
                if (shouldIgnoreSystemToggleInteraction(index)) {
                  return;
                }

                toggleSystem(index, true);
              }}
              onKeyDown={(event) => handleSystemKeyDown(event, index)}
              onMouseEnter={(event) => {
                recordPointerPosition(event);
                expandSystemFromHover(index);
              }}
              onMouseLeave={(event) => {
                recordPointerPosition(event);
                clearHoverSuppression(index, event.currentTarget);
              }}
              onMouseMove={recordPointerPosition}
              tabIndex={0}
              variant="material"
            />
          );
        })}
      </div>
    </section>
  );
}

