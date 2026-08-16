# QMec Chen Lab website

This repository contains the public source for the QMec Chen Lab website. The site is a React application built with Vite and published through GitHub Pages.

## Local visual editor

The local development version includes a visual editor that is not included in the published website.

### First-time setup

Install Node.js 22, open a terminal in this repository, and run:

```bash
npm ci
```

### Start editing

Run:

```bash
npm run edit
```

The local website opens in a browser. Click **Edit site** in the lower-left corner, select a page in the editor panel, and then click visible text or an image.

- Edit text, links, numbers, and other fields in the side panel.
- Use **Find any field** when a value is not visible on the current page.
- Use **Replace this image** after selecting an image.
- Click **Save to site** to write the change to `src/data/siteContent.json`.
- Turn editing off to preview the website normally.

Changes remain only on the local computer until they are committed and pushed to GitHub.

## Check before publishing

Run:

```bash
npm run build
```

If the build succeeds, commit and push the changes to the `main` branch. The workflow in `.github/workflows/deploy.yml` then builds and publishes the website automatically through GitHub Pages.

## Project documentation

The files in `docs/` explain the project structure, architecture, content model, and individual source files. Most public website content is stored in `src/data/siteContent.json`; images are stored under `public/images/`.
