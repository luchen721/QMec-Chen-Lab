export function assetPath(path: string) {
  if (/^(https?:|data:|blob:)/.test(path)) {
    return path;
  }

  if (import.meta.env.BASE_URL !== '/' && path.startsWith(import.meta.env.BASE_URL)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

