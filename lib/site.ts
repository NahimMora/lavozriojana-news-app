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

/* Redes y contacto oficiales. */
export const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61591170825327';
export const INSTAGRAM_URL = 'https://instagram.com/lavozriojana.ok';
/** WhatsApp oficial para que los lectores manden noticias (fotos, videos, datos). */
export const WHATSAPP_NUMBER_DISPLAY = '380 492-2704';
export const WHATSAPP_NEWS_URL = `https://wa.me/5493804922704?text=${encodeURIComponent('Hola La Voz Riojana, quiero enviarles una noticia:')}`;

/* Served from public/ so it ships with the site (the old copy on R2 was missing). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

export const SITE_DESCRIPTION =
  'Noticias de La Rioja, Argentina, al instante: política, policiales, Interior, economía, deportes y servicios. Último momento de la capital y el interior riojano.';

/* Google exige logo raster (no SVG) para NewsArticle/Organization structured data */
export const SITE_LOGO_URL = `${SITE_URL}/logo.png`;

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
