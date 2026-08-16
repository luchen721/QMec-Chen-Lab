import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const contentFile = resolve(process.cwd(), 'src/data/siteContent.json');
const publicImagesDirectory = resolve(process.cwd(), 'public/images');
const maximumRequestBytes = 24 * 1024 * 1024;

type ContentPath = Array<string | number>;

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumRequestBytes) {
      throw new Error('The selected file is too large. Please use an image smaller than 18 MB.');
    }
    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

function isSafePath(path: unknown): path is ContentPath {
  if (!Array.isArray(path) || path.length === 0) return false;

  return path.every((segment) => {
    if (typeof segment === 'number') return Number.isInteger(segment) && segment >= 0;
    return (
      typeof segment === 'string' &&
      segment.length > 0 &&
      !['__proto__', 'prototype', 'constructor'].includes(segment)
    );
  });
}

function setExistingValue(document: unknown, path: ContentPath, value: unknown) {
  let cursor = document as Record<string | number, unknown>;

  for (const segment of path.slice(0, -1)) {
    if (cursor == null || typeof cursor !== 'object' || !(segment in cursor)) {
      throw new Error('That content field no longer exists. Reload the page and try again.');
    }
    cursor = cursor[segment] as Record<string | number, unknown>;
  }

  const finalSegment = path[path.length - 1];
  if (finalSegment == null || cursor == null || typeof cursor !== 'object' || !(finalSegment in cursor)) {
    throw new Error('That content field no longer exists. Reload the page and try again.');
  }

  if (typeof cursor[finalSegment] !== typeof value) {
    throw new Error('That field type changed. Reload the page and try again.');
  }

  cursor[finalSegment] = value;
}

async function readContent() {
  return JSON.parse(await readFile(contentFile, 'utf8')) as unknown;
}

async function writeContent(document: unknown) {
  const temporaryFile = `${contentFile}.editing`;
  await writeFile(temporaryFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await rename(temporaryFile, contentFile);
}

function localOnlyRequest(request: IncomingMessage) {
  const host = request.headers.host ?? '';
  const origin = request.headers.origin;
  const localHost = /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host);
  const localOrigin =
    origin == null ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://[::1]:');
  return localHost && localOrigin;
}

const mimeExtensions: Record<string, string> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
};

function safeImageName(fileName: string, mimeType: string) {
  const suppliedExtension = extname(fileName).toLowerCase();
  const extension = mimeExtensions[mimeType];
  if (extension == null) throw new Error('Please choose a PNG, JPG, GIF, WebP, or SVG image.');

  const stem = basename(fileName, suppliedExtension)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'website-image';

  return `${stem}-${Date.now()}${extension}`;
}

function imageFolderForPath(path: ContentPath) {
  const root = path[0];
  if (root === 'peoplePage') return 'people';
  if (root === 'news') return 'news';
  if (root === 'lab') return 'lab';
  if (root === 'research') return 'research';
  return 'editor-uploads';
}

function localEditorPlugin(): Plugin {
  return {
    name: 'qmec-local-visual-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (!pathname.startsWith('/__local-editor/')) return next();

        if (!localOnlyRequest(request)) {
          sendJson(response, 403, { error: 'The visual editor is available only on this computer.' });
          return;
        }

        try {
          if (pathname === '/__local-editor/content' && request.method === 'GET') {
            sendJson(response, 200, await readContent());
            return;
          }

          if (pathname === '/__local-editor/content' && request.method === 'PUT') {
            const body = await readJsonBody(request);
            if (!isSafePath(body.path)) throw new Error('The selected content path is invalid.');
            if (!['string', 'number', 'boolean'].includes(typeof body.value)) {
              throw new Error('This editor can save text, numbers, and on/off values.');
            }

            const document = await readContent();
            setExistingValue(document, body.path, body.value);
            await writeContent(document);
            sendJson(response, 200, { ok: true });
            return;
          }

          if (pathname === '/__local-editor/image' && request.method === 'POST') {
            const body = await readJsonBody(request);
            if (!isSafePath(body.path)) throw new Error('The selected image path is invalid.');
            if (typeof body.fileName !== 'string' || typeof body.mimeType !== 'string') {
              throw new Error('The selected image is missing its name or file type.');
            }
            if (typeof body.data !== 'string') throw new Error('The selected image could not be read.');

            const imageBytes = Buffer.from(body.data, 'base64');
            if (imageBytes.length === 0 || imageBytes.length > 18 * 1024 * 1024) {
              throw new Error('Please use an image between 1 byte and 18 MB.');
            }

            const folder = imageFolderForPath(body.path);
            const fileName = safeImageName(body.fileName, body.mimeType);
            const destination = resolve(publicImagesDirectory, folder, fileName);
            if (!destination.startsWith(`${publicImagesDirectory}/`)) {
              throw new Error('The image destination is invalid.');
            }

            await mkdir(dirname(destination), { recursive: true });
            await writeFile(destination, imageBytes, { flag: 'wx' });

            const imagePath = `/images/${folder}/${fileName}`;
            const document = await readContent();
            setExistingValue(document, body.path, imagePath);
            await writeContent(document);
            sendJson(response, 200, { ok: true, imagePath });
            return;
          }

          sendJson(response, 404, { error: 'Unknown local editor request.' });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'The edit could not be saved.';
          sendJson(response, 400, { error: message });
        }
      });
    },
  };
}

export default defineConfig({
  base: '/QMec-Chen-Lab/',
  plugins: [react(), localEditorPlugin()],
});
