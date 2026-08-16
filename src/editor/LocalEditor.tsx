import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './localEditor.css';

type ContentPath = Array<string | number>;
type EditableValue = string | number | boolean;

type ContentLeaf = {
  path: ContentPath;
  value: EditableValue;
};

type EditorMessage = {
  kind: 'error' | 'success' | 'tip';
  text: string;
};

const editorSelector = 'h1, h2, h3, h4, h5, h6, p, a, button, figcaption, img, address, li, strong';
const sessionKey = 'qmec-local-editor-enabled';
const editorPages = [
  { label: 'Home', route: '/' },
  { label: 'Research', route: '/research' },
  { label: 'People', route: '/people' },
  { label: 'Lab', route: '/lab' },
  { label: 'Publications', route: '/publications' },
  { label: 'News', route: '/news' },
  { label: 'Gallery', route: '/gallery' },
  { label: 'Join Us / Contact', route: '/join-us' },
] as const;

function currentRoute() {
  return window.location.hash.replace(/^#/, '').split('?')[0] || '/';
}

function normalizeText(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function flattenContent(value: unknown, path: ContentPath = []): ContentLeaf[] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [{ path, value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenContent(item, [...path, index]));
  }

  if (value != null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => flattenContent(item, [...path, key]));
  }

  return [];
}

function titleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function friendlyPath(path: ContentPath, content: unknown) {
  const parts: string[] = [];
  let cursor: unknown = content;

  path.forEach((segment) => {
    if (typeof segment === 'number') {
      const item = Array.isArray(cursor) ? cursor[segment] : undefined;
      const record = item != null && typeof item === 'object' ? (item as Record<string, unknown>) : null;
      const identity = record?.name ?? record?.title ?? record?.date ?? record?.label ?? record?.year;
      parts.push(typeof identity === 'string' ? identity : `Item ${segment + 1}`);
      cursor = item;
      return;
    }

    parts.push(titleCase(segment));
    cursor = cursor != null && typeof cursor === 'object'
      ? (cursor as Record<string, unknown>)[segment]
      : undefined;
  });

  return parts.join(' › ');
}

function samePath(first: ContentPath, second: ContentPath) {
  return first.length === second.length && first.every((segment, index) => segment === second[index]);
}

function routeRoots() {
  const route = currentRoute();
  const rootByRoute: Record<string, string[]> = {
    '/': ['home', 'research', 'news'],
    '/research': ['research'],
    '/people': ['peoplePage', 'join'],
    '/lab': ['lab'],
    '/publications': ['publications', 'manuscriptsInPrep'],
    '/news': ['news'],
    '/gallery': ['gallery'],
    '/join-us': ['join'],
  };
  return [...(rootByRoute[route] ?? []), 'navigation', 'footer'];
}

function normalizedImagePath(source: string) {
  try {
    let pathname = decodeURIComponent(new URL(source, window.location.href).pathname);
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    if (base && pathname.startsWith(base)) pathname = pathname.slice(base.length);
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  } catch {
    return source;
  }
}

function candidatesForElement(element: HTMLElement, leaves: ContentLeaf[]) {
  const roots = routeRoots();
  const image = element instanceof HTMLImageElement ? element : element.querySelector('img');
  const imagePath = image ? normalizedImagePath(image.currentSrc || image.src) : '';
  const imageAlt = image?.alt ? normalizeText(image.alt) : '';
  const accessibleLabel = normalizeText(element.getAttribute('aria-label') || '');
  const text = normalizeText(element.innerText || element.textContent || '');

  const scored = leaves.flatMap((leaf) => {
    if (typeof leaf.value !== 'string') return [];
    const value = normalizeText(leaf.value);
    if (!value) return [];

    let score = 0;
    if (imagePath && normalizedImagePath(value) === imagePath) score = 1000;
    else if (imageAlt && value === imageAlt) score = 900;
    else if (accessibleLabel && value === accessibleLabel) score = 850;
    else if (text && value === text) score = 800;
    else if (text && value.length >= 10 && text.includes(value)) score = 500 + Math.min(value.length, 200);
    else return [];

    const root = String(leaf.path[0] ?? '');
    const rootIndex = roots.indexOf(root);
    if (rootIndex >= 0) score += 100 - rootIndex;
    return [{ leaf, score }];
  });

  return scored
    .sort((first, second) => second.score - first.score)
    .map(({ leaf }) => leaf)
    .filter((leaf, index, all) => all.findIndex((candidate) => samePath(candidate.path, leaf.path)) === index)
    .slice(0, 12);
}

async function responseJson(response: Response) {
  const body = (await response.json()) as { error?: string; imagePath?: string; ok?: boolean };
  if (!response.ok) throw new Error(body.error || 'The edit could not be saved.');
  return body;
}

function fileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

export default function LocalEditor() {
  const [content, setContent] = useState<unknown>(null);
  const [enabled, setEnabled] = useState(() => sessionStorage.getItem(sessionKey) === 'true');
  const [pageRoute, setPageRoute] = useState(currentRoute);
  const [matches, setMatches] = useState<ContentLeaf[]>([]);
  const [selected, setSelected] = useState<ContentLeaf | null>(null);
  const [draft, setDraft] = useState<EditableValue>('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<EditorMessage>({
    kind: 'tip',
    text: 'Turn on Edit mode, then click visible text or an image.',
  });
  const [saving, setSaving] = useState(false);
  const hoveredElement = useRef<HTMLElement | null>(null);

  const leaves = useMemo(() => flattenContent(content), [content]);

  useEffect(() => {
    fetch('/__local-editor/content')
      .then(async (response) => {
        const body = (await response.json()) as unknown;
        if (!response.ok) {
          const error = body as { error?: string };
          throw new Error(error.error || 'The editor could not load.');
        }
        return body;
      })
      .then(setContent)
      .catch((error: unknown) => {
        setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'The editor could not load.' });
      });
  }, []);

  useEffect(() => {
    sessionStorage.setItem(sessionKey, String(enabled));
    document.documentElement.classList.toggle('qmec-editing', enabled);
    return () => document.documentElement.classList.remove('qmec-editing');
  }, [enabled]);

  useEffect(() => {
    const onRouteChange = () => {
      setPageRoute(currentRoute());
      setMatches([]);
      setSelected(null);
      setSearch('');
      setMessage({ kind: 'tip', text: 'Click visible text or an image on this page.' });
    };
    window.addEventListener('hashchange', onRouteChange);
    return () => window.removeEventListener('hashchange', onRouteChange);
  }, []);

  const chooseLeaf = useCallback((leaf: ContentLeaf) => {
    setSelected(leaf);
    setDraft(leaf.value);
    setMessage({ kind: 'tip', text: 'Review the field below, then save when it looks right.' });
  }, []);

  useEffect(() => {
    if (!enabled || leaves.length === 0) return;

    const editorRoot = (target: EventTarget | null) =>
      target instanceof Element ? target.closest('[data-local-editor-ui]') : null;

    const editableElement = (target: EventTarget | null) => {
      if (!(target instanceof Element) || editorRoot(target)) return null;
      return target.closest<HTMLElement>(editorSelector);
    };

    const onMouseOver = (event: MouseEvent) => {
      const element = editableElement(event.target);
      if (hoveredElement.current === element) return;
      hoveredElement.current?.classList.remove('qmec-editor-target');
      hoveredElement.current = element;
      element?.classList.add('qmec-editor-target');
    };

    const onMouseOut = (event: MouseEvent) => {
      const element = editableElement(event.target);
      if (element && event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
      element?.classList.remove('qmec-editor-target');
      if (hoveredElement.current === element) hoveredElement.current = null;
    };

    const onClick = (event: MouseEvent) => {
      const element = editableElement(event.target);
      if (!element) return;
      event.preventDefault();
      event.stopPropagation();

      const candidates = candidatesForElement(element, leaves);
      setMatches(candidates);
      if (candidates.length === 0) {
        setSelected(null);
        setMessage({
          kind: 'error',
          text: 'I could not connect that item to the content file. Use “Find any field” below, or turn off Edit mode to use the page normally.',
        });
        return;
      }

      chooseLeaf(candidates[0]);
    };

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('click', onClick, true);
      hoveredElement.current?.classList.remove('qmec-editor-target');
      hoveredElement.current = null;
    };
  }, [chooseLeaf, enabled, leaves]);

  const searchResults = useMemo(() => {
    const query = normalizeText(search).toLowerCase();
    if (query.length < 2) return [];
    return leaves
      .filter((leaf) => {
        const label = friendlyPath(leaf.path, content).toLowerCase();
        return label.includes(query) || String(leaf.value).toLowerCase().includes(query);
      })
      .slice(0, 40);
  }, [content, leaves, search]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await responseJson(
        await fetch('/__local-editor/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: selected.path, value: draft }),
        }),
      );
      sessionStorage.setItem(sessionKey, 'true');
      window.location.reload();
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'The edit could not be saved.' });
      setSaving(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (!selected) return;
    setSaving(true);
    try {
      await responseJson(
        await fetch('/__local-editor/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: selected.path,
            fileName: file.name,
            mimeType: file.type,
            data: await fileAsBase64(file),
          }),
        }),
      );
      sessionStorage.setItem(sessionKey, 'true');
      window.location.reload();
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'The image could not be saved.' });
      setSaving(false);
    }
  };

  const selectedKey = String(selected?.path.at(-1) ?? '').toLowerCase();
  const canUploadImage =
    typeof selected?.value === 'string' &&
    (selectedKey.includes('image') || selectedKey === 'src');

  return (
    <div className="qmec-editor" data-local-editor-ui>
      <button
        className={`qmec-editor-toggle ${enabled ? 'is-active' : ''}`}
        type="button"
        onClick={() => setEnabled((current) => !current)}
      >
        <span aria-hidden="true">{enabled ? '✓' : '✎'}</span>
        {enabled ? 'Editing on' : 'Edit site'}
      </button>

      {enabled ? (
        <aside className="qmec-editor-panel" aria-label="Local website editor">
          <header>
            <div>
              <p className="qmec-editor-kicker">Local visual editor</p>
              <h2>Click the page to edit</h2>
            </div>
            <button className="qmec-editor-close" type="button" onClick={() => setEnabled(false)} aria-label="Close editor">
              ×
            </button>
          </header>

          <div className={`qmec-editor-message is-${message.kind}`}>{message.text}</div>

          <label className="qmec-editor-field">
            <span>Page</span>
            <select
              value={pageRoute}
              onChange={(event) => {
                const route = event.target.value;
                setPageRoute(route);
                window.location.hash = route;
              }}
            >
              {editorPages.map((page) => (
                <option key={page.route} value={page.route}>{page.label}</option>
              ))}
            </select>
          </label>

          {matches.length > 1 ? (
            <label className="qmec-editor-field">
              <span>This click matches several fields</span>
              <select
                value={selected ? JSON.stringify(selected.path) : ''}
                onChange={(event) => {
                  const next = matches.find((match) => JSON.stringify(match.path) === event.target.value);
                  if (next) chooseLeaf(next);
                }}
              >
                {matches.map((match) => (
                  <option key={JSON.stringify(match.path)} value={JSON.stringify(match.path)}>
                    {friendlyPath(match.path, content)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selected ? (
            <section className="qmec-editor-selection">
              <p className="qmec-editor-path">{friendlyPath(selected.path, content)}</p>

              {typeof selected.value === 'string' ? (
                <label className="qmec-editor-field">
                  <span>Content</span>
                  <textarea value={String(draft)} rows={7} onChange={(event) => setDraft(event.target.value)} />
                </label>
              ) : typeof selected.value === 'number' ? (
                <label className="qmec-editor-field">
                  <span>Number</span>
                  <input type="number" value={Number(draft)} onChange={(event) => setDraft(Number(event.target.value))} />
                </label>
              ) : (
                <label className="qmec-editor-check">
                  <input type="checkbox" checked={Boolean(draft)} onChange={(event) => setDraft(event.target.checked)} />
                  <span>Turn this option on</span>
                </label>
              )}

              <div className="qmec-editor-actions">
                <button className="qmec-editor-save" type="button" onClick={save} disabled={saving || draft === selected.value}>
                  {saving ? 'Saving…' : 'Save to site'}
                </button>
                <button className="qmec-editor-secondary" type="button" onClick={() => chooseLeaf(selected)} disabled={saving}>
                  Reset
                </button>
              </div>

              {canUploadImage ? (
                <label className="qmec-editor-upload">
                  <span>Replace this image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    disabled={saving}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(file);
                    }}
                  />
                </label>
              ) : null}
            </section>
          ) : null}

          <section className="qmec-editor-search">
            <label className="qmec-editor-field">
              <span>Find any field</span>
              <input
                type="search"
                value={search}
                placeholder="Try a name, heading, or email"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {searchResults.length > 0 ? (
              <div className="qmec-editor-results">
                {searchResults.map((leaf) => (
                  <button key={JSON.stringify(leaf.path)} type="button" onClick={() => chooseLeaf(leaf)}>
                    <strong>{friendlyPath(leaf.path, content)}</strong>
                    <span>{String(leaf.value)}</span>
                  </button>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <p className="qmec-editor-empty">No matching content fields found.</p>
            ) : null}
          </section>

          <footer>
            Changes are saved only to this local project. Publishing remains a separate step.
          </footer>
        </aside>
      ) : null}
    </div>
  );
}
