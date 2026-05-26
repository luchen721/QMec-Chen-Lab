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
import { indexedItems } from './researchOrder';
import { hasMeaningfulTranslation, prefersReducedMotion } from './researchMotion';

type ToolsProps = {
  tools: ResearchContent['tools'];
};

const RESEARCH_TOOL_MOTION_MS = 1380;
const RESEARCH_TOOL_MOTION_GUARD_MS = 1560;
const RESEARCH_TOOL_EXPANDED_MIN_HEIGHT = 700;
const RESEARCH_TOOL_COMPACT_HEIGHT = 'var(--research-compact-card-height)';

export function Tools({ tools }: ToolsProps) {
  const [expandedToolIndexes, setExpandedToolIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const [closingToolIndexes, setClosingToolIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const closingToolIndexesRef = useRef<Set<number>>(new Set());
  const closingToolTokensRef = useRef(new Map<number, number>());
  const detailRefs = useRef(new Map<number, HTMLElement>());
  const expandedToolIndexesRef = useRef<Set<number>>(new Set());
  const hoverSuppressedIndexesRef = useRef<Set<number>>(new Set());
  const imageMotionTokensRef = useRef(new Map<number, number>());
  const imageRefs = useRef(new Map<number, HTMLElement>());
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const movingToolIndexesRef = useRef<Set<number>>(new Set());
  const pendingToolHeightFrameRef = useRef<number | null>(null);
  const pendingToolStateFrameRef = useRef<number | null>(null);
  const previousCardLayoutsRef = useRef(new Map<number, DOMRect>());
  const previousImageLayoutsRef = useRef(new Map<number, DOMRect>());
  const toolMotionTokensRef = useRef(new Map<number, number>());

  const visibleItems = indexedItems(tools.items)
    .map(({ index, item: tool }) => ({ index, tool }));

  const markToolAsMoving = (
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

        const pointerPosition = lastPointerPositionRef.current;
        const element = cardRefs.current.get(index);

        if (
          pointerPosition &&
          element &&
          !expandedToolIndexesRef.current.has(index) &&
          !hoverSuppressedIndexesRef.current.has(index)
        ) {
          const rect = element.getBoundingClientRect();

          if (
            pointerPosition.x >= rect.left &&
            pointerPosition.x <= rect.right &&
            pointerPosition.y >= rect.top &&
            pointerPosition.y <= rect.bottom
          ) {
            expandTool(index);
          }
        }
      }
    }, durationMs);

    return token;
  };

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
      if (!expandedToolIndexesRef.current.has(index)) {
        const previousTransition = element.style.transition;

        element.style.transition = 'none';
        element.style.setProperty(
          '--research-tool-card-compact-height',
          RESEARCH_TOOL_COMPACT_HEIGHT,
        );
        element.style.minHeight = RESEARCH_TOOL_COMPACT_HEIGHT;
        void window.getComputedStyle(element).minHeight;
        element.style.transition = previousTransition;
      }

      const rect = element.getBoundingClientRect();

      layouts.set(index, rect);
    });
    previousCardLayoutsRef.current = layouts;
  };

  const recordToolImageLayout = (index: number) => {
    const image = imageRefs.current.get(index);

    if (!image) {
      return;
    }

    previousImageLayoutsRef.current.set(index, image.getBoundingClientRect());
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
    [...openingIndexes, ...closingIndexes].forEach(recordToolImageLayout);
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

          const compactHeight = Number.parseFloat(
            element.style.getPropertyValue('--research-tool-card-compact-height'),
          );
          const targetHeight = Math.max(
            Number.isNaN(compactHeight) ? 0 : compactHeight,
            RESEARCH_TOOL_EXPANDED_MIN_HEIGHT,
          );
          element.style.minHeight = `${targetHeight}px`;
        });

        closingIndexes.forEach((index) => {
          const element = cardRefs.current.get(index);

          if (!element) {
            return;
          }

          element.style.setProperty(
            '--research-tool-card-compact-height',
            RESEARCH_TOOL_COMPACT_HEIGHT,
          );
          element.style.minHeight = RESEARCH_TOOL_COMPACT_HEIGHT;
        });
      });
    });
  };

  const setClosingTools = (indexes: Set<number>) => {
    closingToolIndexesRef.current = indexes;
    setClosingToolIndexes(indexes);
  };

  const clearClosingTool = (index: number) => {
    if (!closingToolIndexesRef.current.has(index)) {
      return;
    }

    const nextIndexes = new Set(closingToolIndexesRef.current);
    nextIndexes.delete(index);
    setClosingTools(nextIndexes);
  };

  const markToolAsClosing = (index: number) => {
    const nextIndexes = new Set(closingToolIndexesRef.current);
    nextIndexes.add(index);
    setClosingTools(nextIndexes);

    const token = (closingToolTokensRef.current.get(index) ?? 0) + 1;
    closingToolTokensRef.current.set(index, token);

    window.setTimeout(() => {
      if (closingToolTokensRef.current.get(index) !== token) {
        return;
      }

      closingToolTokensRef.current.delete(index);
      clearClosingTool(index);
    }, RESEARCH_TOOL_MOTION_GUARD_MS);
  };

  const expandTool = (index: number) => {
    if (expandedToolIndexesRef.current.has(index)) {
      return;
    }

    clearClosingTool(index);
    measureToolDetail(index);
    hoverSuppressedIndexesRef.current.delete(index);
    const nextIndexes = new Set(expandedToolIndexesRef.current);
    nextIndexes.add(index);
    setExpandedTools(nextIndexes, index);
  };

  const expandToolFromHover = (index: number) => {
    if (
      hoverSuppressedIndexesRef.current.has(index) ||
      movingToolIndexesRef.current.has(index)
    ) {
      return;
    }

    expandTool(index);
  };

  const toggleTool = (index: number, suppressHoverAfterClose = false) => {
    const nextIndexes = new Set(expandedToolIndexesRef.current);

    if (nextIndexes.has(index)) {
      nextIndexes.delete(index);
      markToolAsClosing(index);

      if (suppressHoverAfterClose) {
        hoverSuppressedIndexesRef.current.add(index);
      }
    } else {
      clearClosingTool(index);
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

  const recordPointerPosition = (event: MouseEvent<HTMLElement>) => {
    lastPointerPositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

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
  }, [expandedToolIndexes]);

  useLayoutEffect(() => {
    const previousImageLayouts = previousImageLayoutsRef.current;

    if (previousImageLayouts.size === 0) {
      return;
    }

    const isReducedMotion = prefersReducedMotion();

    previousImageLayouts.forEach((previousRect, index) => {
      const image = imageRefs.current.get(index);

      if (!image) {
        return;
      }

      const nextRect = image.getBoundingClientRect();

      if (
        nextRect.width <= 0 ||
        nextRect.height <= 0 ||
        previousRect.width <= 0 ||
        previousRect.height <= 0
      ) {
        return;
      }

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;
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

      const animation = image.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
          },
          { transform: 'translate(0, 0) scale(1, 1)' },
        ],
        {
          duration: RESEARCH_TOOL_MOTION_MS,
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
  }, [expandedToolIndexes]);

  return (
    <section className="section muted experimental-tools-section">
      <ResearchSectionHeader
        classes={{
          copy: 'research-tools-heading-copy',
          heading: 'research-tools-heading',
          visual: 'research-tools-intro-visual',
        }}
        eyebrow={tools.eyebrow}
        imageAlt="Experimental measurement tools overview"
        imageSrc="/images/research/experimental_tool.png"
        intro={tools.intro}
        title={tools.title}
      />
      <div className="research-tool-grid">
        {visibleItems.map(({ tool, index }) => {
          const isExpanded = expandedToolIndexes.has(index);
          const isClosing = closingToolIndexes.has(index) && !isExpanded;

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
              imageRef={(element) => {
                if (element) {
                  imageRefs.current.set(index, element);
                } else {
                  imageRefs.current.delete(index);
                }
              }}
              index={index}
              indexKind="tool"
              isClosing={isClosing}
              isExpanded={isExpanded}
              item={tool}
              key={`research-tool-${index}`}
              onClick={() => {
                toggleTool(index, true);
              }}
              onKeyDown={(event) => handleToolKeyDown(event, index)}
              onMouseEnter={() => expandToolFromHover(index)}
              onMouseLeave={() => clearHoverSuppression(index)}
              onMouseMove={(event) => {
                recordPointerPosition(event);
                expandToolFromHover(index);
              }}
              tabIndex={0}
              variant="tool"
            />
          );
        })}
      </div>
    </section>
  );
}

