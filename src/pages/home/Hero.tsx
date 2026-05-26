import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TextWithMath } from '../../components/TextWithMath';
import { assetPath } from '../../utils/assetPath';

function mergeClassName(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

const qmecHeroTitle = 'Quantum materials under extreme conditions';
const qmecHeroTitleLines = [
  { compact: false, initial: 'Q', rest: 'uantum' },
  { compact: false, initial: 'M', rest: 'aterials under' },
  { compact: true, initial: 'e', rest: 'xtreme' },
  { compact: true, initial: 'c', rest: 'onditions' },
] as const;

function HeroTitleLogo() {
  return (
    <span className="hero-title-logo-anchor" aria-hidden="true">
      <img
        className="hero-title-logo"
        src={assetPath('/images/hero_title_logo_2.png')}
        alt=""
      />
    </span>
  );
}

function renderHeroTitle(title: string): ReactNode {
  if (title !== qmecHeroTitle) {
    return <TextWithMath value={title} />;
  }

  return (
    <span aria-hidden="true">
      {qmecHeroTitleLines.map(({ compact, initial, rest }) => (
        <span
          className={mergeClassName('hero-title-line', compact ? 'hero-title-line-compact' : undefined)}
          key={initial}
        >
          <span className="hero-title-initial">{initial}</span>
          <span className="hero-title-rest">{rest}</span>
          {initial === 'c' ? <HeroTitleLogo /> : null}
        </span>
      ))}
    </span>
  );
}

type HeroProps = {
  labWordmark: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionHref?: string;
  image: string;
  imageAlt: string;
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
};

export function Hero({
  labWordmark,
  title,
  subtitle,
  actionLabel,
  actionHref,
  image,
  imageAlt,
  imageFit = 'cover',
  imagePosition = 'center',
}: HeroProps) {
  const isInternalAction = actionHref?.startsWith('/');

  return (
    <section className="hero">
      {labWordmark ? (
        <div className="hero-lockup" aria-label={`University of Illinois ${labWordmark}`}>
          <span className="lab-wordmark">
            <TextWithMath value={labWordmark} />
          </span>
          <img
            className="hero-illinois-logo"
            src={assetPath('/images/UIUC-logo.png')}
            alt="University of Illinois Urbana-Champaign"
          />
        </div>
      ) : null}
      <div className="hero-content">
        <h1
          aria-label={title === qmecHeroTitle ? title : undefined}
          className={mergeClassName('hero-title', title === qmecHeroTitle ? 'hero-title-qmec' : undefined)}
        >
          {renderHeroTitle(title)}
        </h1>
        <p>
          <TextWithMath value={subtitle} />
        </p>
        {actionLabel && actionHref && isInternalAction ? (
          <Link className="button" to={actionHref}>
            <TextWithMath value={actionLabel} />
          </Link>
        ) : actionLabel && actionHref ? (
          <a className="button" href={actionHref}>
            <TextWithMath value={actionLabel} />
          </a>
        ) : null}
      </div>
      <div className="hero-visual">
        <img
          src={assetPath(image)}
          alt={imageAlt}
          style={{
            objectFit: imageFit,
            objectPosition: imagePosition,
          }}
        />
      </div>
    </section>
  );
}

