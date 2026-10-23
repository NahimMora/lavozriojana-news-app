/**
 * URL checks for the AutoPublicador feeds. Every URL in a feed is external,
 * untrusted data: only http(s) without credentials is accepted, and links to
 * our own stories are reduced to a validated slug so the site links to its
 * own route instead of echoing the feed's URL.
 */

const SITE_HOSTS = new Set(['lavozriojana.com', 'www.lavozriojana.com']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const INSTAGRAM_PATH = /^\/(?:[A-Za-z0-9._]{1,30}\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,40})\/?$/;
// Instagram serves thumbnails from its CDNs only, through signed URLs that expire.
const INSTAGRAM_CDN = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/;

export function parseHttpUrl(value: unknown): URL | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password || !url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

/** An external link that is safe to put in an href, or null. */
export function safeExternalUrl(value: unknown): string | null {
  return parseHttpUrl(value)?.toString() ?? null;
}

export type NewsLink = { slug: string; path: string };

/** https://lavozriojana.com/noticias/<slug> → its slug and internal path. */
export function toNewsLink(value: unknown): NewsLink | null {
  const url = parseHttpUrl(value);
  if (!url || !SITE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const match = url.pathname.match(/^\/noticias\/([^/]+)\/?$/);
  if (!match) return null;
  let slug: string;
  try {
    slug = decodeURIComponent(match[1]).toLowerCase();
  } catch {
    return null;
  }
  if (!SLUG.test(slug) || slug.length > 200) return null;
  return { slug, path: `/noticias/${slug}` };
}

/** Normalized slug of an internal path or URL, for comparisons ("/noticias/x/", "https://…/noticias/x?utm"). */
export function newsSlugFromPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const link = toNewsLink(path.startsWith('/') ? `https://lavozriojana.com${path}` : path);
  return link?.slug ?? null;
}

export type InstagramLink = { url: string; shortcode: string; kind: 'p' | 'reel' | 'tv' };

/** A post or Reel permalink on instagram.com, normalized. Anything else is rejected. */
export function toInstagramLink(value: unknown): InstagramLink | null {
  const url = parseHttpUrl(value);
  if (!url || url.protocol !== 'https:' || !INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;
  const match = url.pathname.match(INSTAGRAM_PATH);
  if (!match) return null;
  const kind = match[1] === 'reels' ? 'reel' : (match[1] as InstagramLink['kind']);
  return { url: `https://www.instagram.com/${kind}/${match[2]}/`, shortcode: match[2], kind };
}

/** Temporary thumbnail from Instagram's CDN (https only), or null. Never persisted. */
export function toInstagramThumbnail(value: unknown): string | null {
  const url = parseHttpUrl(value);
  if (!url || url.protocol !== 'https:' || !INSTAGRAM_CDN.test(url.hostname.toLowerCase())) return null;
  return url.toString();
}
