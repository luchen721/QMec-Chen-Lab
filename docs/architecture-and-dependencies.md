# Architecture and Dependencies

This project is a public-only Vite, React, and TypeScript source tree for the QMec Chen Lab website. It was generated from the website build source code in a private repo, but it does not depend on that corpus at build time.

The source was refreshed from the recent local corpus. The old corpus remains read-only input; this repository is the clean, maintainable public source.

## Architecture Summary

The app has four layers:

1. **Build and deploy layer**
   - `vite.config.ts` tells Vite to build the site for the GitHub Pages project path `/QMec-Chen-Lab/`.
   - `.github/workflows/deploy.yml` builds the site on GitHub and deploys the generated `dist/` folder to GitHub Pages.

2. **App shell layer**
   - `src/main.tsx` mounts React and wraps the app in `HashRouter`.
   - `src/App.tsx` defines all page routes and keeps the navigation and footer around every page.

3. **Content and rendering layer**
   - `src/data/siteContent.json` stores public website content.
   - `src/data/siteContent.ts` defines TypeScript types for that content.
   - `src/components/TextWithMath.tsx` renders plain text, inline Markdown-style links, and KaTeX math.
- `src/utils/assetPath.ts` builds asset URLs that work under the `/QMec-Chen-Lab/` base path.
- `src/utils/paragraphs.ts` normalizes paragraph-like content for lab and research detail sections.

4. **Page layer**
   - `src/pages/` contains public page components grouped by page.
   - Most page components import `siteContent` directly, then render a specific part of the data.
   - Research, lab, news, and publication pages keep their public interactions and animations.

## Routing

The app uses `HashRouter`:

```tsx
<HashRouter>
  <App />
</HashRouter>
```

With a GitHub Pages project deployment under `/QMec-Chen-Lab/`, public routes look like:

```text
https://<user>.github.io/QMec-Chen-Lab/#/research
```

The hash route is handled entirely by the browser. GitHub Pages only receives the request for `/QMec-Chen-Lab/`, so a custom `404.html` SPA fallback is not needed.

## Vite Base Path

`vite.config.ts` sets the asset base:

```ts
export default defineConfig({
  base: '/QMec-Chen-Lab/',
  plugins: [react()],
});
```

This makes built asset URLs point under the project site path. For example, an image path can become:

```text
/QMec-Chen-Lab/images/quantum-lab-hero.png
```

## Content Flow

The main data file is:

```text
src/data/siteContent.json
```

The typed export is:

```ts
export const siteContent = siteContentData as SiteContent;
```

A page imports that data and renders the part it owns:

```tsx
import { siteContent } from '../../data/siteContent';

export function Research() {
  const { research } = siteContent;

  return (
    <>
      <Materials materials={research.materials} />
      <Tools tools={research.tools} />
    </>
  );
}
```

This keeps public content centralized while leaving page components focused on layout and interaction.

## Text and Math Rendering

`TextWithMath` is the public-only text renderer. It supports:

- Plain text.
- Inline Markdown-style links such as `[National High Magnetic Field Laboratory](https://nationalmaglab.org)`.
- Inline math with `\(...\)`.
- Display math with `\[...\]` or `$$...$$`.

Example usage:

```tsx
<p>
  <TextWithMath value={publication.title} />
</p>
```

The component uses KaTeX:

```ts
import { renderToString, type KatexOptions } from 'katex';
import 'katex/dist/katex.min.css';
```

## Asset Handling

The app keeps public files under:

```text
public/
  files/
  images/
```

Components call `assetPath()` before assigning local asset URLs:

```tsx
<img src={assetPath('/images/UIUC-logo.png')} alt="University of Illinois Urbana-Champaign" />
```

`assetPath()` preserves external URLs and prefixes local URLs with `import.meta.env.BASE_URL`.

## Public Interactions

The generated source preserves public interactions from the source website:

- Lab photos rotate and can be manually stepped.
- News archive cards rotate.
- Research material and tool cards expand on hover/click, support keyboard activation, and show a small touch cue on coarse-pointer devices.
- Highlighted publication cards keep their visual styles and manuscript-prep canvas border behavior.

The source intentionally removes edit-only features:

- No edit mode.
- No source-apply middleware.
- No edit labels or edit paths.
- No draft storage.
- No Playwright test suite.
- No ESLint config.

The latest public research-card behavior is implemented without source-editing hooks. For example, `ResearchCard` renders the public card body directly:

```tsx
<h3>
  <TextWithMath value={item.title} />
</h3>
<p className={summaryClassName(variant)}>
  <TextWithMath value={item.summary} />
</p>
```

`Materials` and `Tools` keep their own hover/click state, card refs, and ResizeObserver measurements. Those are public interaction mechanics, not editor state.

## Dependencies

Runtime dependencies:

- `react`: component rendering.
- `react-dom`: browser mounting.
- `react-router-dom`: `HashRouter`, routes, and links.
- `katex`: math rendering.

Development dependencies:

- `vite`: local dev server and production bundler.
- `typescript`: type checking.
- `@vitejs/plugin-react`: React support for Vite.
- `@types/react`, `@types/react-dom`, `@types/katex`, `@types/node`: TypeScript declarations.

## Build Commands

The package scripts are intentionally minimal:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
}
```

Use:

```bash
npm run build
```

The command first runs TypeScript project references with `tsc -b`, then builds the static site with Vite.

## Deployment Workflow

The GitHub Pages workflow has two jobs:

- `build`: checks out the repository, installs dependencies with `npm ci`, runs `npm run build`, and uploads `dist/`.
- `deploy`: publishes the uploaded artifact through GitHub Pages.

Because routing uses `HashRouter`, the workflow does not create or copy a `404.html` fallback.
