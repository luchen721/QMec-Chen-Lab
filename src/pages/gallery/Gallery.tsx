import { TextWithMath } from '../../components/TextWithMath';
import { siteContent } from '../../data/siteContent';

export function Gallery() {
  const { gallery } = siteContent;

  return (
    <>
      <section className="page-title page-title-compact gallery-page-title">
        <p className="eyebrow">
          <TextWithMath value={gallery.eyebrow} />
        </p>
        <h1>
          <TextWithMath value={gallery.title} />
        </h1>
        <p>
          <TextWithMath value={gallery.intro} />
        </p>
      </section>

      <section className="section gallery-grid">
        {gallery.items.map((item, index) => (
          <article className="gallery-tile floating-tile" key={`gallery-item-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>
              <TextWithMath value={item} />
            </h2>
          </article>
        ))}
      </section>
    </>
  );
}

