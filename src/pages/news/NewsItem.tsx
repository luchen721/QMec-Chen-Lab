import { TextWithMath } from '../../components/TextWithMath';
import type { NewsEntry } from '../../data/siteContent';
import { assetPath } from '../../utils/assetPath';

export function NewsItem({
  className,
  item,
}: {
  className?: string;
  item: NewsEntry;
}) {
  return (
    <article className={['news-item', className].filter(Boolean).join(' ')}>
      <figure className="news-media">
        <img
          className={item.imageFit === 'contain' ? 'news-image-contain' : undefined}
          src={assetPath(item.image)}
          alt={item.imageAlt}
          loading="lazy"
          style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
        />
      </figure>
      <div className="news-body">
        <p className="meta">
          <TextWithMath value={item.date} />
        </p>
        <h3>
          <TextWithMath value={item.title} />
        </h3>
        <p>
          <TextWithMath value={item.summary} />
        </p>
      </div>
    </article>
  );
}

