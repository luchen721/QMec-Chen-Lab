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
        <div className="footer-logo-row">
          <a
            className="footer-logo-link"
            href={footer.mrsecHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Visit the Illinois Materials Research Science and Engineering Center website"
          >
            <img
              className="footer-mrsec-logo"
              src={assetPath(footer.mrsecImage)}
              alt="U.S. National Science Foundation Materials Research Science and Engineering Centers"
            />
            <span className="footer-logo-label">Illinois I-MRSEC</span>
          </a>
          <img
            className="footer-illinois-logo"
            src={assetPath(footer.image)}
            alt="The Grainger College of Engineering"
          />
        </div>
      </div>
    </footer>
  );
}
