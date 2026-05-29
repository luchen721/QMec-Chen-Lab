import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { TextWithMath } from '../../components/TextWithMath';
import { siteContent, type NewsEntry } from '../../data/siteContent';
import { NewsItem } from './NewsItem';

const ARCHIVE_ROLL_DURATION_MS = 1800;
const ARCHIVE_ROLL_SETTLE_MS = 600;

type ArchiveMotion = 'enter' | 'exit' | 'promote' | 'steady';

type ArchiveRollRow<T> = {
  item: T;
  motion: ArchiveMotion;
  slotIndex: number;
};

function getRotatingArchive<T>(items: T[], count: number, startIndex: number) {
  if (items.length <= count) {
    return items;
  }

  return Array.from({ length: count }, (_, index) => items[(startIndex + index) % items.length]);
}

function getArchiveRollRows<T>(
  items: T[],
  count: number,
  currentStartIndex: number,
  previousStartIndex: number | null,
): ArchiveRollRow<T>[] {
  const currentRows = getRotatingArchive(items, count, currentStartIndex);

  if (previousStartIndex === null || items.length <= count) {
    return currentRows.map((item, slotIndex) => ({
      item,
      motion: 'steady',
      slotIndex,
    }));
  }

  const previousRows = getRotatingArchive(items, count, previousStartIndex);
  const exitingRows = previousRows
    .filter((item) => !currentRows.includes(item))
    .map((item) => ({
      item,
      motion: 'exit' as const,
      slotIndex: previousRows.indexOf(item),
    }));
  const currentRollRows = currentRows.map((item, slotIndex) => {
    const previousSlotIndex = previousRows.indexOf(item);
    let motion: ArchiveMotion = 'steady';

    if (previousSlotIndex < 0) {
      motion = 'enter';
    } else if (slotIndex < previousSlotIndex) {
      motion = 'promote';
    }

    return {
      item,
      motion,
      slotIndex,
    };
  });

  return [...exitingRows, ...currentRollRows];
}

function compareNewsBySortDate(a: NewsEntry, b: NewsEntry) {
  const aDate = a.sortDate.trim();
  const bDate = b.sortDate.trim();

  return bDate.localeCompare(aDate);
}

export function News() {
  const { news } = siteContent;
  const [archiveRotation, setArchiveRotation] = useState({
    cycle: 0,
    previousStartIndex: null as number | null,
    startIndex: 0,
  });
  const sortedNews = useMemo(
    () => [...news.items].sort(compareNewsBySortDate),
    [news.items],
  );
  const latestNews = sortedNews.slice(0, news.visibleLatestCount);
  const archivePool = sortedNews.slice(news.visibleLatestCount);
  const normalizedArchiveStartIndex = archivePool.length > 0 ? archiveRotation.startIndex % archivePool.length : 0;
  const normalizedPreviousArchiveStartIndex =
    archiveRotation.previousStartIndex !== null && archivePool.length > 0
      ? archiveRotation.previousStartIndex % archivePool.length
      : null;
  const archiveNews = getRotatingArchive(archivePool, news.visibleArchiveCount, normalizedArchiveStartIndex);
  const archiveRollRows = getArchiveRollRows(
    archivePool,
    news.visibleArchiveCount,
    normalizedArchiveStartIndex,
    normalizedPreviousArchiveStartIndex,
  );
  const archiveRollStyle = {
    '--archive-roll-duration': `${ARCHIVE_ROLL_DURATION_MS}ms`,
  } as CSSProperties;
  const archiveRotationIntervalMs = Math.max(
    news.rotationIntervalMs,
    ARCHIVE_ROLL_DURATION_MS + ARCHIVE_ROLL_SETTLE_MS,
  );

  useEffect(() => {
    if (archivePool.length <= news.visibleArchiveCount) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setArchiveRotation((currentRotation) => {
        const currentStartIndex = currentRotation.startIndex % archivePool.length;

        return {
          cycle: currentRotation.cycle + 1,
          previousStartIndex: currentStartIndex,
          startIndex: (currentStartIndex + 1) % archivePool.length,
        };
      });
    }, archiveRotationIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [archivePool.length, archiveRotationIntervalMs, news.visibleArchiveCount]);

  useEffect(() => {
    if (archiveRotation.previousStartIndex === null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setArchiveRotation((currentRotation) => {
        if (currentRotation.cycle !== archiveRotation.cycle) {
          return currentRotation;
        }

        return {
          ...currentRotation,
          previousStartIndex: null,
        };
      });
    }, ARCHIVE_ROLL_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [archiveRotation.cycle, archiveRotation.previousStartIndex]);

  return (
    <>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <TextWithMath value={news.latestEyebrow} />
            </p>
            <h2>
              <TextWithMath value={news.latestTitle} />
            </h2>
          </div>
        </div>
        <div className="list news-list">
          {latestNews.map((item) => (
            <NewsItem className="floating-tile" item={item} key={`latest-news-${item.title}`} />
          ))}
        </div>
      </section>

      {archiveNews.length > 0 && (
        <section className="section muted">
          <div className="section-heading">
            <p className="eyebrow">
              <TextWithMath value={news.archiveEyebrow} />
            </p>
          </div>
          <div
            className="archive-news-roller archive-news-switch list news-list news-list-compact"
            data-archive-cycle={archiveRotation.cycle}
            style={archiveRollStyle}
          >
            {archiveRollRows.map(({ item, motion, slotIndex }) => (
              <div
                className="archive-news-roll-card"
                data-archive-motion={motion}
                data-archive-news-id={news.items.indexOf(item)}
                data-archive-slot={slotIndex}
                key={`archive-news-${item.title}`}
              >
                <div className="switch-transition-item is-active">
                  <NewsItem className="floating-tile" item={item} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
