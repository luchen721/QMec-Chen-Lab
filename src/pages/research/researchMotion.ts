export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hasMeaningfulTranslation(deltaX: number, deltaY: number) {
  return Math.abs(deltaX) >= 1 || Math.abs(deltaY) >= 1;
}

