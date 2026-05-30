import type { CSSProperties } from 'react';
import type { PersonImageCrop } from '../../data/siteContent';

const defaultFocusX = 50;
const defaultFocusY = 35;
const defaultZoom = 110;
const zoomOutMinimum = 50;

export type PersonImageFit = 'cover' | 'contain';

export type NormalizedPersonImageCrop = {
  fit: PersonImageFit;
  focusX: number;
  focusY: number;
  zoom: number;
  mobileFocusX: number;
  mobileFocusY: number;
  mobileFit: PersonImageFit;
  mobileMode: 'inherit' | 'custom';
  mobileZoom: number;
};

export function clampPercent(value: unknown, fallback: number) {
  const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function normalizedFit(value: unknown): PersonImageFit {
  return value === 'contain' ? 'contain' : 'cover';
}

export function clampZoom(value: unknown, fallback: number, fit: PersonImageFit) {
  const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  const minimum = fit === 'contain' ? zoomOutMinimum : 100;
  return Math.max(minimum, Math.min(200, Math.round(numericValue)));
}

export function normalizePersonImageCrop(imageCrop?: PersonImageCrop): NormalizedPersonImageCrop {
  const fit = normalizedFit(imageCrop?.fit);
  const focusX = clampPercent(imageCrop?.focusX, defaultFocusX);
  const focusY = clampPercent(imageCrop?.focusY, defaultFocusY);
  const zoom = clampZoom(imageCrop?.zoom, defaultZoom, fit);
  const mobileMode = imageCrop?.mobile?.mode === 'custom' ? 'custom' : 'inherit';
  const mobileFit = mobileMode === 'custom' ? normalizedFit(imageCrop?.mobile?.fit) : fit;

  return {
    fit,
    focusX,
    focusY,
    zoom,
    mobileFit,
    mobileFocusX: mobileMode === 'custom' ? clampPercent(imageCrop?.mobile?.focusX, focusX) : focusX,
    mobileFocusY: mobileMode === 'custom' ? clampPercent(imageCrop?.mobile?.focusY, focusY) : focusY,
    mobileMode,
    mobileZoom: mobileMode === 'custom' ? clampZoom(imageCrop?.mobile?.zoom, zoom, mobileFit) : zoom,
  };
}

export function personImageCropStyle(imageCrop?: PersonImageCrop) {
  const normalized = normalizePersonImageCrop(imageCrop);

  return {
    '--person-photo-fit': normalized.fit,
    '--person-photo-focus-x': `${normalized.focusX}%`,
    '--person-photo-focus-y': `${normalized.focusY}%`,
    '--person-photo-zoom': String(normalized.zoom / 100),
    '--person-photo-mobile-fit': normalized.mobileFit,
    '--person-photo-mobile-focus-x': `${normalized.mobileFocusX}%`,
    '--person-photo-mobile-focus-y': `${normalized.mobileFocusY}%`,
    '--person-photo-mobile-zoom': String(normalized.mobileZoom / 100),
  } as CSSProperties;
}
