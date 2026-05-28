# File-by-File Guide

This guide explains the purpose and main code blocks of each source/configuration file.

## Root Files

### `index.html`

Purpose: Browser entry HTML for Vite.

Important block:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

Vite loads `src/main.tsx`, and React mounts into the `root` div.

### `package.json`

Purpose: Declares project scripts and dependencies.

Important block:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
}
```

The build script checks TypeScript first, then produces the static site.

### `package-lock.json`

Purpose: Records exact dependency versions for reproducible installs.

GitHub Actions uses:

```bash
npm ci
```

`npm ci` installs exactly what the lockfile describes.

### `vite.config.ts`

Purpose: Vite build configuration.

Important block:

```ts
export default defineConfig({
  base: '/QMec-Chen-Lab/',
  plugins: [react()],
});
```

The `base` value makes the built site work under the GitHub Pages project path.

### `tsconfig.json`

Purpose: Root TypeScript project-reference file.

Important block:

```json
"references": [
  { "path": "./tsconfig.app.json" },
  { "path": "./tsconfig.node.json" }
]
```

`tsc -b` builds both the app TypeScript project and the Vite-config TypeScript project.

### `tsconfig.app.json`

Purpose: Type-checks app code under `src/`.

Important settings:

```json
"lib": ["ES2022", "DOM", "DOM.Iterable"],
"jsx": "react-jsx",
"strict": true
```

The DOM libraries provide browser types, `react-jsx` supports modern React JSX, and `strict` makes TypeScript enforce strong type checks.

### `tsconfig.node.json`

Purpose: Type-checks `vite.config.ts`.

Important settings:

```json
"lib": ["ESNext", "DOM", "DOM.Iterable"],
"types": ["node"]
```

Vite and its React plugin expose types that need Node globals and some Web API types during config checking.

### `.github/workflows/deploy.yml`

Purpose: Builds and deploys the site to GitHub Pages.

Important build steps:

```yaml
- name: Install dependencies
  run: npm ci

- name: Build site
  run: npm run build

- name: Upload Pages artifact
  uses: actions/upload-pages-artifact@v4
  with:
    path: dist
```

Important deploy step:

```yaml
- name: Deploy to GitHub Pages
  id: deployment
  uses: actions/deploy-pages@v4
```

## App Shell

### `src/main.tsx`

Purpose: Starts React and configures routing.

Important block:

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
```

`HashRouter` stores the route after `#`, which avoids direct-route 404 behavior on GitHub Pages.

### `src/App.tsx`

Purpose: Defines the public route table and app shell.

Important block:

```tsx
<Routes location={location}>
  <Route path="/" element={<Home />} />
  <Route path="/research" element={<Research />} />
  <Route path="/people" element={<People />} />
  <Route path="/lab" element={<Lab />} />
  <Route path="/publications" element={<Publications />} />
  <Route path="/news" element={<News />} />
  <Route path="/gallery" element={<Gallery />} />
  <Route path="/join-us" element={<JoinUs />} />
</Routes>
```

The `Navbar` and `Footer` live outside the route switch so they appear on every page.

### `src/index.css`

Purpose: Site-wide styling, layout, responsive behavior, and public animations.

Major sections:

- Base styling and math display.
- App shell and navigation.
- Hero and page-title layout.
- Shared sections, cards, grids, and typography.
- Publications.
- News.
- Lab.
- Research section headers, responsive research cards, touch cues, and card transitions.
- People, gallery, join, and footer.
- Responsive media queries.

Example:

```css
.floating-tile {
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.72) inset,
    0 -1px 0 rgba(21, 33, 38, 0.08) inset,
    0 14px 24px rgba(35, 59, 55, 0.12),
    0 34px 68px rgba(35, 59, 55, 0.16);
  position: relative;
  transform: translateY(-4px);
  z-index: 1;
}
```

That class gives cards the raised visual treatment used across the site.

### `src/vite-env.d.ts`

Purpose: Enables Vite client typings.

Important line:

```ts
/// <reference types="vite/client" />
```

This gives TypeScript definitions for `import.meta.env`.

## Shared Components and Utilities

### `src/components/TextWithMath.tsx`

Purpose: Public text renderer for regular text, inline links, and math.

Important parsing flow:

```ts
function splitRichText(value: string): RichTextSegment[] {
  return splitMathText(value).flatMap((segment): RichTextSegment[] => (
    segment.kind === 'text' ? splitInlineLinks(segment.value) : [segment]
  ));
}
```

Render behavior:

```tsx
if (segment.kind === 'link') {
  return (
    <a className="text-link" href={segment.href} rel="noreferrer" target="_blank">
      {segment.label}
    </a>
  );
}
```

Math rendering:

```ts
return renderToString(value, {
  ...katexOptions,
  displayMode,
});
```

### `src/utils/assetPath.ts`

Purpose: Builds correct public asset URLs for the Vite base path.

Important logic:

```ts
const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

return `${import.meta.env.BASE_URL}${normalizedPath}`;
```

External URLs and already-prefixed URLs are returned unchanged.

### `src/utils/paragraphs.ts`

Purpose: Normalizes paragraph content for pages that render arrays or paragraph-separated strings.

Important block:

```ts
const paragraphs = Array.isArray(value)
  ? value
  : value.split(/\r?\n\s*\r?\n/g);
```

The return shape includes `sourceIndex` so React keys stay stable.

## Data Files

### `src/data/siteContent.json`

Purpose: Central public content file.

It contains:

- Home hero, about, highlights, and news settings.
- Research materials and tools.
- People entries and join summaries.
- Lab panels and photos.
- Publications and links.
- News entries.
- Gallery placeholder entries.
- Join/contact content.
- Footer contact content.

Example:

```json
"hero": {
  "labWordmark": "QMec Chen Lab",
  "title": "Quantum materials under extreme conditions",
  "actionHref": "/join-us"
}
```

### `src/data/siteContent.ts`

Purpose: TypeScript types for the public content and the typed content export.

Important export:

```ts
export const siteContent = siteContentData as SiteContent;
```

Pages import `siteContent` rather than reaching into the JSON file directly.

### `src/data/publicationStyles.ts`

Purpose: Defines publication card style names and normalizes star counts.

Important helper:

```ts
export function normalizePublicationStarCount(value: unknown) {
  const count = Number(value ?? selectedPublicationDefaultStarCount);

  return Number.isFinite(count) ? Math.max(0, Math.min(5, Math.floor(count))) : 0;
}
```

## Shared Page Shell

### `src/pages/Navbar.tsx`

Purpose: Top navigation.

Important block:

```tsx
const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Research', path: '/research' },
  { label: 'People', path: '/people' },
  { label: 'Lab', path: '/lab' },
  { label: 'Publications', path: '/publications' },
  { label: 'News', path: '/news' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Join Us / Contact', path: '/join-us' },
];
```

`NavLink` applies the `active` class to the current route.

### `src/pages/Footer.tsx`

Purpose: Footer contact block.

Important block:

```tsx
const { footer } = siteContent;
```

The footer reads its lab name, email, department, address, logo, and profile link from centralized data.

## Home Page

### `src/pages/home/Hero.tsx`

Purpose: Large first-view hero.

Special title rendering:

```tsx
const qmecHeroTitleLines = [
  { compact: false, initial: 'Q', rest: 'uantum' },
  { compact: false, initial: 'M', rest: 'aterials under' },
  { compact: true, initial: 'e', rest: 'xtreme' },
  { compact: true, initial: 'c', rest: 'onditions' },
] as const;
```

This preserves the stylized QMec title treatment while still using the plain title as the accessible label.

### `src/pages/home/Home.tsx`

Purpose: Home page sections.

It renders:

- Hero.
- Recruiting tile.
- About section.
- Research highlight cards.
- Latest news list.

Example content flow:

```tsx
const { home, research, news } = siteContent;
const visibleNewsItems = news.items.slice(0, home.news.visibleCount);
```

## Research Page

### `src/pages/research/Research.tsx`

Purpose: Research page coordinator.

Important block:

```tsx
<Materials materials={research.materials} />
<Tools tools={research.tools} />
```

The page itself stays thin and delegates section behavior.

### `src/pages/research/Materials.tsx`

Purpose: Material-systems section with expandable cards.

Important state:

```ts
const [expandedSystemIndexes, setExpandedSystemIndexes] = useState<Set<number>>(
  () => new Set(),
);
```

The file tracks expanded cards, card refs, detail refs, and layout snapshots so card reordering motion remains smooth. It also suppresses synthetic hover immediately after touch input:

```ts
const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
  if (event.pointerType !== 'mouse') {
    suppressSyntheticTouchHover();
  }
};
```

The section header is shared with the research-tools section:

```tsx
<ResearchSectionHeader
  classes={{
    heading: 'material-systems-heading',
    text: 'material-systems-heading-text',
    visual: 'material-systems-heading-visual',
  }}
  eyebrow={materials.eyebrow}
  imageSrc={materials.overview.image}
  intro={materials.intro}
  title={materials.title}
/>
```

### `src/pages/research/Tools.tsx`

Purpose: Experimental tools section with expandable cards.

Important constants:

```ts
const RESEARCH_TOOL_MOTION_MS = 1380;
const RESEARCH_TOOL_EXPANDED_MIN_HEIGHT = 700;
```

The section uses public hover/click/keyboard interactions to expand tool cards.

Important height measurement:

```ts
const targetHeight = `${Math.ceil(detail.scrollHeight + 2)}px`;
detail.style.setProperty('--research-tool-card-detail-height', targetHeight);
```

This lets CSS animate the detail panel to the measured content height instead of guessing.

### `src/pages/research/ResearchCard.tsx`

Purpose: Shared card renderer for material systems and tools.

Important variant logic:

```ts
const variantClassName =
  variant === 'material' ? 'research-theme-card' : 'card research-tool-card';
```

The same component renders both card families, while CSS classes provide their different layouts.

Important image choice:

```ts
const targetImageSrc =
  isExpanded && item.expandedImage ? item.expandedImage : item.image;
```

Material cards can use a separate expanded image. Tool cards reuse the same image unless the content data provides another one.

Important touch cue:

```tsx
<span aria-hidden="true" className="research-card-touch-cue" />
```

CSS turns this into "Tap for details" or "Tap to close" on touch devices.

### `src/pages/research/ResearchSectionHeader.tsx`

Purpose: Shared heading + image layout for research sections.

Important structure:

```tsx
<div className={`section-heading research-section-intro ${classes.heading}`}>
  <div className={`research-section-text ${classes.text}`}>...</div>
  <figure className={`research-section-visual ${classes.visual}`}>...</figure>
</div>
```

The generic `research-section-*` classes carry the shared layout. The caller-provided classes leave room for section-specific styling without duplicating the component.

### `src/pages/research/detailDescription.ts`

Purpose: Converts research detail text into paragraph records.

Important block:

```ts
return paragraphsFromValue(detail);
```

This accepts a string, an array of strings, or an empty value and returns stable paragraph records for rendering.

### `src/pages/research/researchOrder.ts`

Purpose: Small ordering helpers for research cards.

Important block:

```ts
export function indexedItems<T>(items: T[]) {
  return items.map((item, index) => ({ index, item }));
}
```

Research card state uses original indexes as stable identifiers even when cards temporarily reorder during expansion.

### `src/pages/research/researchMotion.ts`

Purpose: Motion helpers shared by research card sections.

Important block:

```ts
export function hasMeaningfulTranslation(deltaX: number, deltaY: number) {
  return Math.abs(deltaX) >= 1 || Math.abs(deltaY) >= 1;
}
```

This avoids creating tiny animations for sub-pixel layout differences.

## People Page

### `src/pages/people/People.tsx`

Purpose: Groups and renders lab members.

Important grouping helper:

```ts
function peopleInGroup(group: string) {
  return siteContent.peoplePage.people.filter((person) => person.group === group);
}
```

The page renders principal investigator, graduate researchers, undergraduate researchers, AI agents, and join cards.

### `src/pages/people/PersonCard.tsx`

Purpose: Renders a single person card.

Important image fallback:

```tsx
{showImage ? (
  <img className="person-photo" src={assetPath(imageSrc)} alt="" />
) : (
  <div className="avatar">{getInitials(person.name)}</div>
)}
```

If a photo fails to load, the card shows initials.

## Lab Page

### `src/pages/lab/Lab.tsx`

Purpose: Renders lab facilities and rotating lab photos.

Important rotating-photo state:

```ts
const [activePhoto, setActivePhoto] = useState(0);
```

The rotator auto-advances and also provides previous/next buttons.

### `src/pages/lab/SwitchTransition.tsx`

Purpose: Small reusable transition wrapper for rotating lab images and captions.

Important output:

```tsx
<div
  aria-hidden={!isActive}
  className={isActive ? 'switch-transition-item is-active' : 'switch-transition-item'}
>
  {renderItem(item, index)}
</div>
```

CSS handles opacity and transform transitions.

## Publications Page

### `src/pages/publications/Publications.tsx`

Purpose: Groups publications by year and renders publication cards.

Important grouping:

```ts
const years = Array.from(new Set(publications.map((publication) => publication.year))).filter(Boolean);
```

### `src/pages/publications/PublicationItem.tsx`

Purpose: Renders publication cards, links, highlighted publication stars, and manuscript-prep canvas border effects.

Important link split:

```ts
const journalLink = publication.links?.find((link) => !link.label.toLowerCase().includes('arxiv'));
const arxivLinks = publication.links?.filter((link) => link.label.toLowerCase().includes('arxiv')) ?? [];
```

The venue links to the journal when available, and arXiv links are displayed separately.

## News Page

### `src/pages/news/News.tsx`

Purpose: Renders latest news and a rotating archive.

Important sorting:

```ts
function compareNewsBySortDate(a: NewsEntry, b: NewsEntry) {
  return b.sortDate.trim().localeCompare(a.sortDate.trim());
}
```

The newest items appear first.

### `src/pages/news/NewsItem.tsx`

Purpose: Renders a single news card.

Important block:

```tsx
<img
  className={item.imageFit === 'contain' ? 'news-image-contain' : undefined}
  src={assetPath(item.image)}
  alt={item.imageAlt}
  loading="lazy"
/>
```

The component honors image fit and image position data.

## Gallery Page

### `src/pages/gallery/Gallery.tsx`

Purpose: Renders the current gallery placeholder grid.

It reads `gallery.items` and shows numbered visual tiles.

## Join Page

### `src/pages/join-us/JoinUs.tsx`

Purpose: Renders recruiting opportunities and contact information.

Important pattern:

```tsx
{group.link ? (
  <a className="text-link" href={group.link.href}>
    <TextWithMath value={group.link.label} />
  </a>
) : null}
```

Opportunity links are optional and come from `siteContent.json`.
