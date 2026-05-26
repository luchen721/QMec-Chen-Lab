import { TextWithMath } from '../components/TextWithMath';
import { siteContent } from '../data/siteContent';
import { assetPath } from '../utils/assetPath';

export function Footer() {
  const { footer } = siteContent;

  return (
    <footer className="site-footer">
      <div>
        <a className="footer-lab-link" href={footer.labHref}>
          <strong>
            <TextWithMath value={footer.labName} />
          </strong>
        </a>
        <p className="contact-email">
          <TextWithMath value={footer.email} />
        </p>
        <p>
          <TextWithMath value={footer.department} />
        </p>
        <p>
          <TextWithMath value={footer.address} />
        </p>
      </div>
      <div className="footer-contact">
        <img
          className="footer-illinois-logo"
          src={assetPath(footer.image)}
          alt="The Grainger College of Engineering"
        />
      </div>
    </footer>
  );
}

