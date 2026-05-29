import siteContentData from './siteContent.json';
import type { PublicationCardStyle, PublicationStarCount } from './publicationStyles';

export const siteContentVersion = siteContentData.version;

export type LinkContent = {
  label: string;
  href: string;
};

export type HeroContent = {
  labWordmark: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
  image: string;
  imageAlt: string;
  imageFit: 'cover' | 'contain';
  imagePosition: string;
};

export type HomeContent = {
  hero: HeroContent;
  recruitingTile: {
    eyebrow: string;
    title: string;
    actionLabel: string;
    actionHref: string;
  };
  about: {
    eyebrow: string;
    title: string;
    body: string;
    linkLabel: string;
    linkHref: string;
  };
  highlights: {
    eyebrow: string;
    title: string;
  };
  news: {
    eyebrow: string;
    title: string;
    visibleCount: number;
  };
};

export type DetailDescription = string[];

export type MaterialSystem = {
  title: string;
  summary: string;
  image: string;
  expandedImage?: string;
  imageAlt: string;
  caption?: string;
  details?: DetailDescription;
};

export type ResearchTool = {
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  caption?: string;
  details?: DetailDescription;
};

export type ResearchVisual = {
  image: string;
  imageAlt: string;
  caption?: string;
  details?: DetailDescription;
};

export type ResearchContent = {
  materials: {
    eyebrow: string;
    title: string;
    intro: string;
    overviewLabel: string;
    overview: ResearchVisual;
    systems: MaterialSystem[];
  };
  tools: {
    eyebrow: string;
    title: string;
    intro: string;
    items: ResearchTool[];
  };
};

export type Person = {
  group: 'Principal Investigator' | 'Graduate Students' | 'Undergraduate Students' | 'Lab AI Agents';
  name: string;
  role: string;
  department?: string;
  email?: string;
  office?: string;
  details?: string[];
  image?: string;
};

export type JoinOpportunity = {
  title: string;
  summary: string;
  link?: LinkContent;
};

export type PeopleContent = {
  sections: {
    principalInvestigatorEyebrow: string;
    principalInvestigatorTitle: string;
    graduateStudentsEyebrow: string;
    graduateStudentsTitle: string;
    undergraduateStudentsTitle: string;
    labAiAgentsEyebrow: string;
    labAiAgentsTitle: string;
  };
  people: Person[];
  joinSummary: {
    title: string;
    body: string;
    opportunities: JoinOpportunity[];
  };
};

export type PublicationAbstractCitationStatus = 'verified' | 'unverified';

export type PublicationAbstractCitation = {
  marker: string;
  label: string;
  href?: string;
  status: PublicationAbstractCitationStatus;
};

export type Publication = {
  year: string;
  title: string;
  authors: string;
  abstract?: string;
  abstractCitations?: PublicationAbstractCitation[];
  description?: string;
  venue: string;
  cardStyle?: PublicationCardStyle;
  starCount?: PublicationStarCount;
  links?: {
    label: string;
    href?: string;
  }[];
};

export type NewsEntry = {
  date: string;
  image: string;
  imageAlt: string;
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
  sortDate: string;
  title: string;
  summary: string;
};

export type LabPhoto = {
  src?: string;
  alt: string;
  date: string;
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
};

export type LabPanel = {
  title: string;
  paragraphs: string[];
  status: string;
  photos: LabPhoto[];
};

export type LabContent = {
  eyebrow: string;
  title: string;
  intro: string;
  panels: LabPanel[];
};

export type NewsContent = {
  latestEyebrow: string;
  latestTitle: string;
  archiveEyebrow: string;
  visibleLatestCount: number;
  visibleArchiveCount: number;
  rotationIntervalMs: number;
  items: NewsEntry[];
};

export type GalleryContent = {
  eyebrow: string;
  title: string;
  intro: string;
  items: string[];
};

export type JoinContent = {
  eyebrow: string;
  title: string;
  intro: string;
  groups: JoinOpportunity[];
  contactTitle: string;
  contactDepartment: string;
  contactAddress: string;
  contactEmail: string;
};

export type FooterContent = {
  labName: string;
  labHref: string;
  email: string;
  department: string;
  address: string;
  image: string;
};

export type SiteContent = {
  version: string;
  home: HomeContent;
  research: ResearchContent;
  peoplePage: PeopleContent;
  lab: LabContent;
  manuscriptsInPrep: Publication[];
  publications: Publication[];
  news: NewsContent;
  gallery: GalleryContent;
  join: JoinContent;
  footer: FooterContent;
};

export const siteContent = siteContentData as SiteContent;
