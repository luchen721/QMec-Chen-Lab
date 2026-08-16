# File Structure

This document explains the folder layout in this repo.

It keeps the public website source, a lightweight local editor, public content data, public assets, build configuration, deployment workflow, and human documentation.

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
  editor/
  pages/
  utils/
```

`src/` contains all TypeScript, React, CSS, and structured content used by the public site and its development-only editor.

## `src/editor/`

```text
editor/
  LocalEditor.tsx
  localEditor.css
```

This folder contains the local visual editor. `App.tsx` loads it only when Vite is running in development mode, so it is not part of the GitHub Pages production bundle. The editor lets a maintainer click visible content, search all content fields, replace images, and save through the loopback-only middleware in `vite.config.ts`.

## `src/components/`

```text
components/
  TextWithMath.tsx
```

Shared public rendering components live here. At the moment, the only shared component is `TextWithMath`, which renders public text, links, and KaTeX math.

It also understands publication abstract citation markers. That keeps abstract rendering public-only while preserving linked references from the source corpus.

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

Publication records can include optional abstract text and optional abstract citation records:

```text
publication
  abstract
  abstractCitations
    marker
    label
    href
    status
```

The citation data is still public website content, not authoring metadata.

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

The people folder also includes `personImageCrop.ts`, a small public helper that turns person `imageCrop` content into CSS variables for desktop and mobile photo framing.

## `src/utils/`

```text
utils/
  assetPath.ts
  paragraphs.ts
```

Utilities are small public helpers:

- `assetPath.ts`: prefixes public asset paths with the Vite base URL.
- `paragraphs.ts`: normalizes string or string-array content into paragraph objects.

## Excluded Source-Corpus Folders

The source corpus has folders and files for authoring support, test automation, linting, and generated review output. They are intentionally not present here:

```text
lite-edit/
tests/
ESLint/
scripts/
output/
playwright.config.ts
eslint.config.js
tsconfig.lite-edit.json
```

Those original private tools are not needed to build the public website. This repository now has a smaller replacement editor under `src/editor/`; the historical `lite-edit/` application and its supporting corpus remain excluded.

The same rule applies to generated scan or review helpers. Verification can be run from the terminal during maintenance, but those scripts are not part of the shipped source tree.

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
