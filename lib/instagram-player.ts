/**
 * Stages of the video player (components/feed/InstagramPlayer.tsx), as a
 * pure transition so it is tested without a browser:
 *
 *   video   the Reel's signed mp4 in a <video>, when the feed gives a valid one
 *   iframe  Instagram's official embed page, when there is no mp4 or it fails
 *   failed  a message with the link to Instagram, when the iframe never answers
 *
 * The iframe counts as working only when Instagram's page posts a message:
 * a blocked iframe still fires `load` (verified in Chromium), so `load`
 * alone cannot tell a player from an error page.
 */
export type PlayerStage = 'video' | 'iframe' | 'failed';
export type PlayerEvent = 'video-error' | 'iframe-message' | 'iframe-timeout';

export const IFRAME_TIMEOUT_MS = 8000;
export const IFRAME_DEFAULT_HEIGHT = 700;
const ALLOWED_HEIGHT = { min: 320, max: 1200 };

export const initialStage = (videoUrl: string | null): PlayerStage => (videoUrl ? 'video' : 'iframe');

export function nextStage(stage: PlayerStage, event: PlayerEvent): PlayerStage {
  if (stage === 'video' && event === 'video-error') return 'iframe';
  if (stage === 'iframe' && event === 'iframe-timeout') return 'failed';
  return stage;
}

/**
 * Reads a message from the embed iframe. Instagram posts JSON strings such
 * as {"type":"MEASURE","details":{"height":708}} from https://www.instagram.com.
 * Anything else, or another origin, is ignored.
 */
export function readEmbedMessage(origin: string, data: unknown): { fromInstagram: boolean; height: number | null } {
  if (origin !== 'https://www.instagram.com') return { fromInstagram: false, height: null };
  let parsed: unknown = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      return { fromInstagram: true, height: null };
    }
  }
  const message = parsed as { type?: unknown; details?: { height?: unknown } } | null;
  const height = message?.type === 'MEASURE' ? message.details?.height : null;
  const valid = typeof height === 'number' && Number.isFinite(height);
  return { fromInstagram: true, height: valid ? Math.min(ALLOWED_HEIGHT.max, Math.max(ALLOWED_HEIGHT.min, Math.round(height))) : null };
}
