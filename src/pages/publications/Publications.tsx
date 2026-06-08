import { useState } from 'react';
import { siteContent } from '../../data/siteContent';
import { PublicationItem } from './PublicationItem';

export function Publications() {
  const [openAbstractKey, setOpenAbstractKey] = useState<string | null>(null);
  const { manuscriptsInPrep, publications } = siteContent;
  const years = Array.from(new Set(publications.map((publication) => publication.year))).filter(Boolean);
  const toggleAbstract = (abstractKey: string) => {
    setOpenAbstractKey((currentKey) => (currentKey === abstractKey ? null : abstractKey));
  };

  return (
    <section className="section publications-section">
      {manuscriptsInPrep.length > 0 ? (
        <div className="publication-year">
          <h3>Manuscripts in Preprints</h3>
          <div className="list">
            {manuscriptsInPrep.map((publication, publicationIndex) => {
              const abstractKey = `manuscriptsInPrep-${publicationIndex}`;

              return (
                <PublicationItem
                  key={`manuscript-in-prep-${publication.title}`}
                  abstractKey={abstractKey}
                  isAbstractOpen={openAbstractKey === abstractKey}
                  onToggleAbstract={toggleAbstract}
                  publication={publication}
                />
              );
            })}
          </div>
        </div>
      ) : null}
      {years.map((year) => (
        <div className="publication-year" key={year}>
          <h3>{year}</h3>
          <div className="list">
            {publications
              .filter((publication) => publication.year === year)
              .map((publication) => {
                const publicationIndex = publications.indexOf(publication);
                const abstractKey = `publications-${publicationIndex}`;

                return (
                  <PublicationItem
                    key={`publication-${publication.title}`}
                    abstractKey={abstractKey}
                    isAbstractOpen={openAbstractKey === abstractKey}
                    onToggleAbstract={toggleAbstract}
                    publication={publication}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </section>
  );
}
