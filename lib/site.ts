export const SITE_NAME = 'La Voz Riojana';
export const SITE_SLOGAN = 'La Rioja habla, La Voz Riojana comunica.';

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavozriojana.com';

export const SITE_URL = configuredSiteUrl
  .replace(/\/+$/, '')
  .replace(/^https?:\/\/www\./, 'https://');

export const MEDIA_URL =
  (process.env.NEXT_PUBLIC_MEDIA_URL || process.env.R2_PUBLIC_BASE_URL || 'https://media.lavozriojana.com').replace(
    /\/+$/,
    ''
  );

export const DEFAULT_OG_IMAGE = `${MEDIA_URL}/og/la-voz-riojana-og.jpg`;

export const INITIAL_CATEGORIES = [
  'Ultimo momento',
  'Politica',
  'Policiales',
  'Interior',
  'Sociedad',
  'Economia',
  'Salud',
  'Educacion',
  'Deportes',
  'Cultura',
  'Espectaculos'
];

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function mediaUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${MEDIA_URL}${normalizedPath}`;
}
