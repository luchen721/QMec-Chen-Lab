import { TextWithMath } from '../../components/TextWithMath';
import { siteContent } from '../../data/siteContent';

export function JoinUs() {
  const { join } = siteContent;

  return (
    <section className="page-title join-page-title">
      <div>
        <p className="eyebrow">
          <TextWithMath value={join.eyebrow} />
        </p>
        <h1>
          <TextWithMath value={join.title} />
        </h1>
      </div>
      <p>
        <TextWithMath value={join.intro} />
      </p>
      <div className="prose join-page-title-opportunities">
        <ul>
          {join.groups.map((group, index) => (
            <li key={`join-group-${index}`}>
              <strong>
                <TextWithMath value={group.title} />
              </strong>{' '}
              <TextWithMath value={group.summary} />
              {group.link ? (
                <>
                  {' '}
                  <a className="text-link" href={group.link.href}>
                    <TextWithMath value={group.link.label} />
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div className="contact-band join-contact-card floating-tile">
        <div className="join-contact-note">
          <strong>
            <TextWithMath value={join.contactTitle} />
          </strong>
          <p>
            <TextWithMath value={join.contactDepartment} />
          </p>
          <p>
            <TextWithMath value={join.contactAddress} />
          </p>
        </div>
        <span className="button contact-email-button">
          <TextWithMath value={join.contactEmail} />
        </span>
      </div>
    </section>
  );
}

