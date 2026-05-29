import { TextWithMath } from '../../components/TextWithMath';
import { assetPath } from '../../utils/assetPath';

type ResearchSectionHeaderClasses = {
  heading: string;
  text: string;
  visual: string;
};

type ResearchSectionHeaderProps = {
  classes: ResearchSectionHeaderClasses;
  eyebrow: string;
  imageAlt: string;
  imageSrc: string;
  intro: string;
  title: string;
};

export function ResearchSectionHeader({
  classes,
  eyebrow,
  imageAlt,
  imageSrc,
  intro,
  title,
}: ResearchSectionHeaderProps) {
  const imageFigure = (
    <figure className={`research-section-visual ${classes.visual}`}>
      <img src={assetPath(imageSrc)} alt={imageAlt} />
    </figure>
  );

  return (
    <div className={`section-heading research-section-intro ${classes.heading}`}>
      <p className="eyebrow">
        <TextWithMath value={eyebrow} />
      </p>
      <div className="research-section-body">
        <div className={`research-section-text ${classes.text}`}>
          <h2>
            <TextWithMath value={title} />
          </h2>
          <p>
            <TextWithMath value={intro} />
          </p>
        </div>
        {imageFigure}
      </div>
    </div>
  );
}
