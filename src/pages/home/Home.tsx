import { Link } from 'react-router-dom';
import { TextWithMath } from '../../components/TextWithMath';
import { siteContent } from '../../data/siteContent';
import { NewsItem } from '../news/NewsItem';
import { Hero } from './Hero';

export function Home() {
  const { home, research, news } = siteContent;
  const visibleNewsItems = news.items.slice(0, home.news.visibleCount);

  return (
    <>
      <Hero
        labWordmark={home.hero.labWordmark}
        title={home.hero.title}
        subtitle={home.hero.subtitle}
        actionLabel={home.hero.actionLabel}
        actionHref={home.hero.actionHref}
        image={home.hero.image}
        imageAlt={home.hero.imageAlt}
        imageFit={home.hero.imageFit}
        imagePosition={home.hero.imagePosition}
      />

      <section className="section split-band home-recruiting-tile">
        <div>
          <p className="eyebrow">
            <TextWithMath value={home.recruitingTile.eyebrow} />
          </p>
          <h2>
            <TextWithMath value={home.recruitingTile.title} />
          </h2>
        </div>
        <Link className="button" to={home.recruitingTile.actionHref}>
          <TextWithMath value={home.recruitingTile.actionLabel} />
        </Link>
      </section>

      <section className="section two-column home-about-section">
        <div>
          <p className="eyebrow">
            <TextWithMath value={home.about.eyebrow} />
          </p>
          <h2 className="home-section-title">
            <TextWithMath value={home.about.title} />
          </h2>
        </div>
        <div className="prose">
          <p>
            <TextWithMath value={home.about.body} />{' '}
            <Link className="text-link" to={home.about.linkHref}>
              <TextWithMath value={home.about.linkLabel} />
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="section home-highlights-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <TextWithMath value={home.highlights.eyebrow} />
            </p>
            <h2 className="home-section-title">
              <TextWithMath value={home.highlights.title} />
            </h2>
          </div>
        </div>
        <div className="card-grid">
          {research.materials.systems.map((theme, index) => (
            <article className="card floating-tile" key={`research-highlight-${index}`}>
              <h3>
                <TextWithMath value={theme.title} />
              </h3>
              <p>
                <TextWithMath value={theme.summary} />
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section home-news-section">
        <div className="section-heading">
          <p className="eyebrow">
            <TextWithMath value={home.news.eyebrow} />
          </p>
          <h2 className="home-section-title">
            <TextWithMath value={home.news.title} />
          </h2>
        </div>
        <div className="list">
          {visibleNewsItems.map((item, index) => (
            <NewsItem className="floating-tile" item={item} key={`home-news-${index}`} />
          ))}
        </div>
      </section>
    </>
  );
}

