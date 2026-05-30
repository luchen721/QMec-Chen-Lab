import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ResearchContent } from '../../data/siteContent';
import { ResearchCard } from './ResearchCard';
import { ResearchSectionHeader } from './ResearchSectionHeader';
import { indexedItems } from './researchOrder';
import { hasMeaningfulTranslation, prefersReducedMotion } from './researchMotion';

type ToolsProps = {
  tools: ResearchContent['tools'];
};

const RESEARCH_TOOL_MOTION_MS = 1380;
const RESEARCH_TOOL_MOTION_GUARD_MS = RESEARCH_TOOL_MOTION_MS + 180;
const RESEARCH_TOOL_EXPANDED_MIN_HEIGHT = 700;
const TOUCH_HOVER_SUPPRESSION_MS = 800;

export function Tools({ tools }: ToolsProps) {
  const [expandedToolIndexes, setExpandedToolIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const detailRefs = useRef(new Map<number, HTMLElement>());
  const expandedToolIndexesRef = useRef<Set<number>>(new Set());
  const hoverSuppressedIndexesRef = useRef<Set<number>>(new Set());
  const movingToolIndexesRef = useRef<Set<number>>(new Set());
  const touchHoverSuppressionUntilRef = useRef(0);
  const pendingToolHeightFrameRef = useRef<number | null>(null);
  const pendingToolStateFrameRef = useRef<number | null>(null);
  const previousCardLayoutsRef = useRef(new Map<number, DOMRect>());
  const toolMotionTokensRef = useRef(new Map<number, number>());
  const expandToolRef = useRef<(index: number) => void>(() => undefined);

  const visibleItems = indexedItems(tools.items)
    .map(({ index, item: tool }) => ({ index, tool }));

  const markToolAsMoving = useCallback((
    index: number,
    durationMs = RESEARCH_TOOL_MOTION_GUARD_MS,
  ) => {
    const token = (toolMotionTokensRef.current.get(index) ?? 0) + 1;
    toolMotionTokensRef.current.set(index, token);
    movingToolIndexesRef.current.add(index);

    window.setTimeout(() => {
      if (toolMotionTokensRef.current.get(index) === token) {
        movingToolIndexesRef.current.delete(index);
        toolMotionTokensRef.current.delete(index);

        const element = cardRefs.current.get(index);

        if (
          element &&
          !expandedToolIndexesRef.current.has(index) &&
          !hoverSuppressedIndexesRef.current.has(index) &&
          element.matches(':hover')
        ) {
          expandToolRef.current(index);
        }
      }
    }, durationMs);

    return token;
  }, []);

  const markToolsBelowAsMoving = (anchorIndex: number) => {
    const anchorRect = cardRefs.current.get(anchorIndex)?.getBoundingClientRect();

    if (!anchorRect) {
      return;
    }

    cardRefs.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();

      if (rect.top > anchorRect.top + 24) {
        markToolAsMoving(index);
      }
    });
  };

  const recordCardLayouts = () => {
    const layouts = new Map<number, DOMRect>();
    cardRefs.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();

      layouts.set(index, rect);
    });
    previousCardLayoutsRef.current = layouts;
  };

  const measureToolDetail = (index: number) => {
    const detail = detailRefs.current.get(index);

    if (!detail) {
      return;
    }

    const targetHeight = `${Math.ceil(detail.scrollHeight + 2)}px`;

    if (
      detail.style.getPropertyValue('--research-tool-card-detail-height') !==
      targetHeight
    ) {
      detail.style.setProperty('--research-tool-card-detail-height', targetHeight);
    }
  };

  const measureToolDetails = () => {
    detailRefs.current.forEach((_detail, index) => measureToolDetail(index));
  };

  const setExpandedTools = (indexes: Set<number>, motionAnchorIndex: number) => {
    const previousIndexes = expandedToolIndexesRef.current;
    const nextIndexes = new Set(indexes);
    const openingIndexes = [...nextIndexes].filter(
      (index) => !previousIndexes.has(index),
    );
    const closingIndexes = [...previousIndexes].filter(
      (index) => !nextIndexes.has(index),
    );

    recordCardLayouts();
    markToolsBelowAsMoving(motionAnchorIndex);
    expandedToolIndexesRef.current = nextIndexes;

    if (pendingToolStateFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingToolStateFrameRef.current);
    }
    if (pendingToolHeightFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingToolHeightFrameRef.current);
    }

    pendingToolStateFrameRef.current = window.requestAnimationFrame(() => {
      pendingToolStateFrameRef.current = null;
      setExpandedToolIndexes(nextIndexes);

      pendingToolHeightFrameRef.current = window.requestAnimationFrame(() => {
        pendingToolHeightFrameRef.current = null;

        openingIndexes.forEach((index) => {
          const element = cardRefs.current.get(index);

          if (!element) {
            return;
          }

          element.style.minHeight = `${RESEARCH_TOOL_EXPANDED_MIN_HEIGHT}px`;
        });

        closingIndexes.forEach((index) => {
          const element = cardRefs.current.get(index);

          if (!element) {
            return;
          }

          element.style.minHeight = '';
        });
      });
    });
  };

  const expandTool = (index: number) => {
    if (expandedToolIndexesRef.current.has(index)) {
      return;
    }

    measureToolDetail(index);
    hoverSuppressedIndexesRef.current.delete(index);
    const nextIndexes = new Set(expandedToolIndexesRef.current);
    nextIndexes.add(index);
    setExpandedTools(nextIndexes, index);
  };

  const shouldIgnoreToolHoverInteraction = (index: number) => (
    window.performance.now() < touchHoverSuppressionUntilRef.current ||
    hoverSuppressedIndexesRef.current.has(index) ||
    movingToolIndexesRef.current.has(index)
  );

  const shouldIgnoreToolToggleInteraction = (index: number) => (
    movingToolIndexesRef.current.has(index)
  );

  const expandToolFromHover = (index: number) => {
    if (shouldIgnoreToolHoverInteraction(index)) {
      return;
    }
    expandTool(index);
  };

  const toggleTool = (index: number, suppressHoverAfterClose = false) => {
    if (shouldIgnoreToolToggleInteraction(index)) {
      return;
    }

    const nextIndexes = new Set(expandedToolIndexesRef.current);

    if (nextIndexes.has(index)) {
      nextIndexes.delete(index);

      if (suppressHoverAfterClose) {
        hoverSuppressedIndexesRef.current.add(index);
      }
    } else {
      measureToolDetail(index);
      hoverSuppressedIndexesRef.current.delete(index);
      nextIndexes.add(index);
    }

    setExpandedTools(nextIndexes, index);
  };

  const handleToolKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    toggleTool(index);
  };

  const clearHoverSuppression = (index: number) => {
    hoverSuppressedIndexesRef.current.delete(index);
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

  useLayoutEffect(() => {
    expandToolRef.current = expandTool;
  });

  useLayoutEffect(() => {
    measureToolDetails();
  });

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => measureToolDetails());

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

      if (isReducedMotion || !hasMeaningfulTranslation(deltaX, deltaY)) {
        return;
      }

      const token = markToolAsMoving(index);

      const animation = element.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration: RESEARCH_TOOL_MOTION_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
      );

      animation.finished
        .catch(() => undefined)
        .finally(() => {
          if (toolMotionTokensRef.current.get(index) === token) {
            movingToolIndexesRef.current.delete(index);
            toolMotionTokensRef.current.delete(index);
          }
        });
    });

    previousCardLayoutsRef.current = new Map();
  }, [expandedToolIndexes, markToolAsMoving]);

  return (
    <section className="section muted experimental-tools-section">
      <ResearchSectionHeader
        classes={{
          heading: 'research-tools-heading',
          text: 'research-tools-heading-text',
          visual: 'research-tools-heading-visual',
        }}
        eyebrow={tools.eyebrow}
        imageAlt={tools.overview.imageAlt}
        imageSrc={tools.overview.image}
        intro={tools.intro}
        title={tools.title}
      />
      <div className="research-tool-grid">
        {visibleItems.map(({ tool, index }) => {
          const isExpanded = expandedToolIndexes.has(index);

          return (
            <ResearchCard
              articleRef={(element) => {
                if (element) {
                  cardRefs.current.set(index, element);
                } else {
                  cardRefs.current.delete(index);
                }
              }}
              detailRef={(element) => {
                if (element) {
                  detailRefs.current.set(index, element);
                  measureToolDetail(index);
                } else {
                  detailRefs.current.delete(index);
                }
              }}
              index={index}
              indexKind="tool"
              isExpanded={isExpanded}
              item={tool}
              key={`research-tool-${index}`}
              onClick={() => toggleTool(index, true)}
              onKeyDown={(event) => handleToolKeyDown(event, index)}
              onMouseEnter={() => expandToolFromHover(index)}
              onMouseLeave={() => clearHoverSuppression(index)}
              onPointerDown={handlePointerDown}
              tabIndex={0}
              variant="tool"
            />
          );
        })}
      </div>
    </section>
  );
}
