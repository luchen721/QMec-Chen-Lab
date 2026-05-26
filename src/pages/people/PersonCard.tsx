import { useState } from 'react';
import { TextWithMath } from '../../components/TextWithMath';
import type { Person } from '../../data/siteContent';
import { assetPath } from '../../utils/assetPath';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((part) => !part.startsWith('('))
    .map((part) => part[0])
    .join('');
}

export function PersonCard({
  featured = false,
  person,
}: {
  featured?: boolean;
  person: Person;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = person.image;
  const showImage = imageSrc && !imageFailed;

  return (
    <article className={['person-card', featured ? 'person-card-featured' : '', 'floating-tile'].filter(Boolean).join(' ')}>
      <div className="person-media" aria-hidden="true">
        {showImage ? (
          <img
            className="person-photo"
            src={assetPath(imageSrc)}
            alt=""
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="avatar">{getInitials(person.name)}</div>
        )}
      </div>
      <div className="person-body">
        <h3>
          <TextWithMath value={person.name} />
        </h3>
        <p className="role">
          <TextWithMath value={person.role} />
        </p>
        <dl className="person-meta">
          {person.department ? (
            <>
              <dt>Department</dt>
              <dd>
                <TextWithMath value={person.department} />
              </dd>
            </>
          ) : null}
          {person.email ? (
            <>
              <dt>Email</dt>
              <dd>
                <TextWithMath value={person.email} />
              </dd>
            </>
          ) : null}
          {person.office ? (
            <>
              <dt>Office</dt>
              <dd>
                <TextWithMath value={person.office} />
              </dd>
            </>
          ) : null}
        </dl>
        {person.details ? (
          <ul className="person-details">
            {person.details.map((detail, index) => (
              <li key={`person-detail-${index}`}>
                <TextWithMath value={detail} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

