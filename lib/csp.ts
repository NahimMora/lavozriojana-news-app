/**
 * Content-Security-Policy of the site (applied in middleware.ts), as a pure
 * function so tests can read it.
 *
 * Google tag (gtag.js) + AdSense necesitan cargar scripts, hacer beacons/XHR
 * y renderizar iframes desde dominios de Google. Antes esta CSP solo permitía
 * 'self', lo que bloqueaba silenciosamente Analytics y los anuncios en producción.
 *
 * Instagram (videos del feed, docs/FEED_INTEGRATION.md): miniaturas y mp4
 * firmados desde su CDN (img-src, media-src) y su página oficial de embed en
 * un iframe (frame-src). No carga scripts de Instagram, así que script-src no
 * lo incluye. media-src también cubre los mp4 propios del CMS en mediaUrl,
 * que antes caían en default-src 'self'.
 */
const googleScriptSrc = [
  'https://www.googletagmanager.com',
  'https://pagead2.googlesyndication.com',
  'https://www.google-analytics.com',
  'https://googleads.g.doubleclick.net',
  'https://www.google.com'
];
const googleConnectSrc = [
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://pagead2.googlesyndication.com',
  'https://*.googlesyndication.com',
  'https://googleads.g.doubleclick.net'
];
const googleFrameSrc = [
  'https://googleads.g.doubleclick.net',
  'https://tpc.googlesyndication.com',
  'https://www.google.com',
  'https://*.googlesyndication.com'
];
const googleImgSrc = [
  'https://www.google-analytics.com',
  'https://pagead2.googlesyndication.com',
  'https://*.googlesyndication.com',
  'https://*.g.doubleclick.net'
];
export const INSTAGRAM_CDN_SRC = ['https://*.cdninstagram.com', 'https://*.fbcdn.net'];
export const INSTAGRAM_FRAME_SRC = ['https://www.instagram.com'];

export function buildContentSecurityPolicy({ isDev, mediaUrl }: { isDev: boolean; mediaUrl: string }) {
  const scriptPolicy = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' ${googleScriptSrc.join(' ')}`
    : `'self' 'unsafe-inline' ${googleScriptSrc.join(' ')}`;

  return [
    "default-src 'self'",
    `img-src 'self' data: blob: ${mediaUrl} ${googleImgSrc.join(' ')} ${INSTAGRAM_CDN_SRC.join(' ')}`,
    `media-src 'self' blob: ${mediaUrl} ${INSTAGRAM_CDN_SRC.join(' ')}`,
    `script-src ${scriptPolicy}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `connect-src 'self' ${googleConnectSrc.join(' ')}`,
    `frame-src 'self' ${googleFrameSrc.join(' ')} ${INSTAGRAM_FRAME_SRC.join(' ')}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}
