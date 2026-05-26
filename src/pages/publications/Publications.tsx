import { siteContent } from '../../data/siteContent';
import { PublicationItem } from './PublicationItem';

export function Publications() {
  const { manuscriptsInPrep, publications } = siteContent;
  const years = Array.from(new Set(publications.map((publication) => publication.year))).filter(Boolean);

  return (
    <section className="section publications-section">
      {manuscriptsInPrep.length > 0 ? (
        <div className="publication-year">
          <h3>Manuscript in Prep</h3>
          <div className="list">
            {manuscriptsInPrep.map((publication) => (
              <PublicationItem
                key={`manuscript-in-prep-${publication.title}`}
                publication={publication}
              />
            ))}
          </div>
        </div>
      ) : null}
      {years.map((year) => (
        <div className="publication-year" key={year}>
          <h3>{year}</h3>
          <div className="list">
            {publications
              .filter((publication) => publication.year === year)
              .map((publication) => (
                <PublicationItem key={`publication-${publication.title}`} publication={publication} />
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}

