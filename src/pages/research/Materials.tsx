import {
  type KeyboardEvent,
  type PointerEvent,
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

const RESEARCH_CARD_MOTION_MS = 1800;
const RESEARCH_CARD_MOTION_GUARD_MS = RESEARCH_CARD_MOTION_MS + 240;
const TOUCH_HOVER_SUPPRESSION_MS = 800;

export function Materials({ materials }: MaterialsProps) {
  const [expandedSystemIndexes, setExpandedSystemIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const [orderedSystemIndexes, setOrderedSystemIndexes] = useState<number[]>([]);
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const detailRefs = useRef(new Map<number, HTMLElement>());
  const expandedSystemIndexesRef = useRef<Set<number>>(new Set());
  const hoverSuppressedIndexesRef = useRef<Set<number>>(new Set());
  const movingSystemIndexesRef = useRef<Set<number>>(new Set());
  const orderedSystemIndexesRef = useRef<number[]>([]);
  const previousCardLayoutsRef = useRef(new Map<number, DOMRect>());
  const systemMotionTokensRef = useRef(new Map<number, number>());
  const touchHoverSuppressionUntilRef = useRef(0);

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

  const expandSystem = (index: number) => {
    if (expandedSystemIndexesRef.current.has(index)) {
      return;
    }

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

  const shouldIgnoreSystemHoverInteraction = (index: number) => (
    window.performance.now() < touchHoverSuppressionUntilRef.current ||
    hoverSuppressedIndexesRef.current.has(index) ||
    hasSystemCardTransitionMotion(index)
  );

  const shouldIgnoreSystemToggleInteraction = (index: number) => (
    hasSystemCardTransitionMotion(index)
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
      nextIndexes.delete(index);

      if (suppressHoverAfterClose) {
        hoverSuppressedIndexesRef.current.add(index);
      }

      setExpandedSystems(nextIndexes, getNaturalSystemOrder());
      return;
    }

    measureSystemDetail(index);
    hoverSuppressedIndexesRef.current.delete(index);
    nextIndexes.add(index);
    setExpandedSystems(nextIndexes, getInPlaceSystemOrder(index));
  };

  const suppressSyntheticTouchHover = () => {
    touchHoverSuppressionUntilRef.current =
      window.performance.now() + TOUCH_HOVER_SUPPRESSION_MS;
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') {
      suppressSyntheticTouchHover();
    }
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

    if (!element.matches(':hover')) {
      hoverSuppressedIndexesRef.current.delete(index);
      return;
    }

    window.setTimeout(() => {
      if (!element.matches(':hover')) {
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

    cardRefs.current.forEach((element, index) => {
      const previousRect = previousCardLayouts.get(index);

      if (!previousRect) {
        return;
      }

      const nextRect = element.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;
      const hasTranslationMotion = hasMeaningfulTranslation(deltaX, deltaY);

      if (isReducedMotion || !hasTranslationMotion) {
        return;
      }

      const token = (systemMotionTokensRef.current.get(index) ?? 0) + 1;
      systemMotionTokensRef.current.set(index, token);
      movingSystemIndexesRef.current.add(index);
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

    previousCardLayoutsRef.current = new Map();
  }, [expandedSystemIndexes, orderedSystemIndexes]);

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
          heading: 'material-systems-heading',
          text: 'material-systems-heading-text',
          visual: 'material-systems-heading-visual',
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
              index={index}
              indexKind="system"
              isExpanded={isExpanded}
              item={theme}
              key={`material-system-${index}`}
              onClick={() => {
                if (shouldIgnoreSystemToggleInteraction(index)) {
                  return;
                }

                toggleSystem(index, true);
              }}
              onKeyDown={(event) => handleSystemKeyDown(event, index)}
              onMouseEnter={() => {
                expandSystemFromHover(index);
              }}
              onMouseLeave={(event) => {
                clearHoverSuppression(index, event.currentTarget);
              }}
              onPointerDown={handlePointerDown}
              tabIndex={0}
              variant="material"
            />
          );
        })}
      </div>
    </section>
  );
}
