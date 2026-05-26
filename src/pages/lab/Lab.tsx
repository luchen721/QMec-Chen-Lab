import { useEffect, useState } from 'react';
import { TextWithMath } from '../../components/TextWithMath';
import { siteContent, type LabPhoto } from '../../data/siteContent';
import { paragraphsFromValue } from '../../utils/paragraphs';
import { assetPath } from '../../utils/assetPath';
import { SwitchTransition } from './SwitchTransition';

function LabPhotoRotator({ photos }: { photos: LabPhoto[] }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const hasMultiplePhotos = photos.length > 1;

  const showPhoto = (nextPhoto: number) => {
    setActivePhoto((nextPhoto + photos.length) % photos.length);
  };

  useEffect(() => {
    if (!hasMultiplePhotos) {
      return undefined;
    }

    const rotationTimer = window.setInterval(() => {
      setActivePhoto((currentPhoto) => (currentPhoto + 1) % photos.length);
    }, 4500);

    return () => window.clearInterval(rotationTimer);
  }, [hasMultiplePhotos, photos.length]);

  return (
    <figure className="lab-photo">
      <SwitchTransition
        activeIndex={activePhoto}
        className="lab-photo-switch"
        getKey={(_labPhoto, index) => index}
        items={photos}
        renderItem={(labPhoto) =>
          labPhoto.src ? (
            <img
              src={assetPath(labPhoto.src)}
              alt={labPhoto.alt}
              style={{
                objectFit: labPhoto.imageFit ?? 'cover',
                objectPosition: labPhoto.imagePosition ?? 'center',
              }}
            />
          ) : (
            <div className="lab-photo-placeholder" role="img" aria-label={labPhoto.alt} />
          )
        }
      />
      <SwitchTransition
        activeIndex={activePhoto}
        className="lab-caption-switch"
        getKey={(_labPhoto, index) => index}
        items={photos}
        renderItem={(labPhoto) => (
          <figcaption>
            <TextWithMath value={labPhoto.date} />
          </figcaption>
        )}
      />
      {hasMultiplePhotos && (
        <div className="lab-photo-controls" aria-label="Lab photo controls">
          <button
            type="button"
            aria-label="Show previous lab photo"
            onClick={() => showPhoto(activePhoto - 1)}
          >
            &lt;
          </button>
          <span>
            {activePhoto + 1}/{photos.length}
          </span>
          <button
            type="button"
            aria-label="Show next lab photo"
            onClick={() => showPhoto(activePhoto + 1)}
          >
            &gt;
          </button>
        </div>
      )}
    </figure>
  );
}

export function Lab() {
  const { lab } = siteContent;

  return (
    <section className="section lab-facilities-section">
      <div className="section-heading page-title-compact">
        <p className="eyebrow">
          <TextWithMath value={lab.eyebrow} />
        </p>
        <h1>
          <TextWithMath value={lab.title} />
        </h1>
        <p>
          <TextWithMath value={lab.intro} />
        </p>
      </div>
      <div className="lab-layout">
        {lab.panels.map((panel, index) => (
          <article className="lab-panel floating-tile" key={`lab-panel-${index}`}>
            <LabPhotoRotator photos={panel.photos} />
            <div className="lab-panel-body">
              <h2>
                <TextWithMath value={panel.title} />
              </h2>
              {paragraphsFromValue(panel.paragraphs).map((paragraph) => (
                <p key={`lab-panel-${index}-paragraph-${paragraph.sourceIndex}`}>
                  <TextWithMath value={paragraph.text} />
                </p>
              ))}
              <p>
                <strong>Status:</strong>{' '}
                <TextWithMath value={panel.status} />
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

