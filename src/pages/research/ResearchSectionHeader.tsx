import { TextWithMath } from '../../components/TextWithMath';
import { assetPath } from '../../utils/assetPath';

type ResearchSectionHeaderClasses = {
  copy: string;
  heading: string;
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
  return (
    <div className={`section-heading ${classes.heading}`}>
      <div className={classes.copy}>
        <p className="eyebrow">
          <TextWithMath value={eyebrow} />
        </p>
        <h2>
          <TextWithMath value={title} />
        </h2>
        <p>
          <TextWithMath value={intro} />
        </p>
      </div>
      <figure className={classes.visual}>
        <img src={assetPath(imageSrc)} alt={imageAlt} />
      </figure>
    </div>
  );
}

