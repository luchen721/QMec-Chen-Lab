# File Structure

This document explains the folder layout under `/Users/lukema/Documents/Prof_Chen_Webpage/QMec-Chen-Lab/`.

## Top-Level Layout

```text
QMec-Chen-Lab/
  .github/
  docs/
  public/
  src/
  .gitignore
  index.html
  package-lock.json
  package.json
  tsconfig.app.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
```

## `.github/`

```text
.github/
  workflows/
    deploy.yml
```

This folder contains the GitHub Actions deployment workflow. It is not used by local Vite development, but GitHub uses it to build and publish the site to Pages.

## `docs/`

```text
docs/
  architecture-and-dependencies.md
  file-structure.md
  file-by-file-guide.md
```

These files are human-readable project documentation. They explain how the source tree works and how the main code files are structured.

## `public/`

```text
public/
  files/
  images/
```

`public/` contains static files copied into the build output by Vite.

Files under `public/images/` are referenced by content data such as:

```json
"image": "/images/quantum-lab-hero.png"
```

At runtime, the app passes those paths through `assetPath()` so they work under `/QMec-Chen-Lab/`.

## `src/`

```text
src/
  App.tsx
  main.tsx
  index.css
  vite-env.d.ts
  components/
  data/
  pages/
  utils/
```

`src/` contains all TypeScript, React, CSS, and structured content used by the public site.

## `src/components/`

```text
components/
  TextWithMath.tsx
```

Shared public rendering components live here. At the moment, the only shared component is `TextWithMath`, which renders public text, links, and KaTeX math.

## `src/data/`

```text
data/
  publicationStyles.ts
  siteContent.json
  siteContent.ts
```

This folder centralizes public website content and content types:

- `siteContent.json`: the actual public text, page data, links, image paths, people, publications, news, and lab panels.
- `siteContent.ts`: TypeScript types and the typed `siteContent` export.
- `publicationStyles.ts`: small helpers for publication card style and star counts.

## `src/pages/`

```text
pages/
  Footer.tsx
  Navbar.tsx
  gallery/
  home/
  join-us/
  lab/
  news/
  people/
  publications/
  research/
```

The `pages/` folder is organized by public page or shared page shell:

- `Navbar.tsx`: top navigation shown on every route.
- `Footer.tsx`: footer shown on every route.
- `home/`: landing page and hero.
- `research/`: materials and tools page.
- `people/`: group members page.
- `lab/`: lab facilities page.
- `publications/`: publication list and publication cards.
- `news/`: latest and archive news.
- `gallery/`: gallery placeholder page.
- `join-us/`: recruiting and contact page.

## `src/utils/`

```text
utils/
  assetPath.ts
  paragraphs.ts
```

Utilities are small public helpers:

- `assetPath.ts`: prefixes public asset paths with the Vite base URL.
- `paragraphs.ts`: normalizes string or string-array content into paragraph objects.

## TypeScript Config Files

```text
tsconfig.json
tsconfig.app.json
tsconfig.node.json
```

- `tsconfig.json` is the root project-reference file.
- `tsconfig.app.json` type-checks the React app under `src/`.
- `tsconfig.node.json` type-checks Vite config files such as `vite.config.ts`.

## Build Output

Running:

```bash
npm run build
```

creates:

```text
dist/
```

`dist/` is generated output. It is ignored by Git and can be recreated at any time.

## Dependencies Folder

Running:

```bash
npm install
```

creates:

```text
node_modules/
```

`node_modules/` is generated dependency output. It is ignored by Git and can be recreated from `package-lock.json`.

