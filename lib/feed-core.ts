/**
 * Loader for the AutoPublicador JSON feeds, independent of Next.js so it can
 * be tested with a fake fetch and clock (tests/feed.test.mjs).
 *
 * Next.js 14.2.5, verified in node_modules:
 * - `next: { revalidate }` stores only HTTP 200 responses in the data cache;
 *   its key ignores `signal`, so the timeout does not fragment the cache.
 * - React skips its per-request fetch memoization when a fetch carries its
 *   own `signal`; requests are deduplicated here instead (single flight plus
 *   a short memo), for concurrent renders too.
 * - Stale entries are served at once and refreshed in the background without
 *   the signal, so only a cold cache ever waits for the network.
 *
 * Failures never throw: they return the last valid copy while it is still
 * within the feed's maximum age, or null. A failure also opens a short
 * backoff, so a feed that is down costs one timeout per minute, not one per
 * render.
 */
import type { ZodType, ZodTypeDef } from 'zod';
import { FEED_VERSION } from './feed-types';

export const DEFAULT_FEED_BASE_URL = 'https://media.lavozriojana.com/feed/v1';
const MAX_BYTES = 2_000_000;
/* A feed dated more than this ahead of our clock is not trusted for freshness. */
const MAX_CLOCK_SKEW_MS = 10 * 60_000;

type FetchLike = (input: string, init?: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>;

export type FeedClientOptions = {
  baseUrl?: string | null;
  fetchImpl?: FetchLike;
  now?: () => number;
  timeoutMs?: number;
  revalidateSeconds?: number;
  backoffMs?: number;
  memoMs?: number;
  log?: (message: string) => void;
};

export type FeedFailure = 'timeout' | 'network' | 'http' | 'too-large' | 'json' | 'version' | 'schema' | 'future' | 'stale';

type Memo = { value: unknown; at: number };
type LastGood = { value: unknown; actualizadoMs: number };

export function normalizeFeedBaseUrl(value: string | null | undefined) {
  const raw = (value || '').trim() || DEFAULT_FEED_BASE_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return DEFAULT_FEED_BASE_URL;
    return url.toString().replace(/\/+$/, '');
  } catch {
    return DEFAULT_FEED_BASE_URL;
  }
}

export function createFeedClient(options: FeedClientOptions = {}) {
  const baseUrl = normalizeFeedBaseUrl(options.baseUrl);
  const fetchImpl: FetchLike = options.fetchImpl || ((input, init) => fetch(input, init));
  const now = options.now || Date.now;
  const timeoutMs = options.timeoutMs ?? 3000;
  const revalidateSeconds = options.revalidateSeconds ?? 300;
  const backoffMs = options.backoffMs ?? 60_000;
  const memoMs = options.memoMs ?? 5_000;
  const log = options.log || ((message: string) => console.warn(message));

  const memo = new Map<string, Memo>();
  const inflight = new Map<string, Promise<unknown>>();
  const lastGood = new Map<string, LastGood>();
  const failedUntil = new Map<string, number>();
  const lastFailure = new Map<string, FeedFailure>();

  async function fetchJson(name: string): Promise<{ ok: true; json: unknown } | { ok: false; reason: FeedFailure; detail?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${baseUrl}/${name}.json`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
        next: { revalidate: revalidateSeconds }
      });
      if (!response.ok) return { ok: false, reason: 'http', detail: String(response.status) };
      const body = await response.text();
      if (body.length > MAX_BYTES) return { ok: false, reason: 'too-large' };
      try {
        return { ok: true, json: JSON.parse(body) };
      } catch {
        return { ok: false, reason: 'json' };
      }
    } catch (error) {
      return { ok: false, reason: controller.signal.aborted ? 'timeout' : 'network', detail: error instanceof Error ? error.message : undefined };
    } finally {
      clearTimeout(timer);
    }
  }

  function fallback<T>(name: string, maxAgeMs: number): T | null {
    const copy = lastGood.get(name);
    if (!copy) return null;
    const age = now() - copy.actualizadoMs;
    return age <= maxAgeMs ? (copy.value as T) : null;
  }

  function fail<T>(name: string, reason: FeedFailure, maxAgeMs: number, detail?: string): T | null {
    failedUntil.set(name, now() + backoffMs);
    if (lastFailure.get(name) !== reason) log(`[feed] ${name}: ${reason}${detail ? ` (${detail})` : ''}`);
    lastFailure.set(name, reason);
    return fallback<T>(name, maxAgeMs);
  }

  async function fetchAndValidate<T extends { actualizado: string }>(
    name: string,
    schema: ZodType<T, ZodTypeDef, unknown>,
    maxAgeMs: number
  ): Promise<T | null> {
    if ((failedUntil.get(name) || 0) > now()) return fallback<T>(name, maxAgeMs);

    const result = await fetchJson(name);
    if (!result.ok) return fail<T>(name, result.reason, maxAgeMs, result.detail);

    const version = (result.json as { version?: unknown } | null)?.version;
    if (version !== FEED_VERSION) return fail<T>(name, 'version', maxAgeMs, String(version));

    const parsed = schema.safeParse(result.json);
    if (!parsed.success) return fail<T>(name, 'schema', maxAgeMs, parsed.error.issues[0]?.path.join('.'));

    const actualizadoMs = Date.parse(parsed.data.actualizado);
    const t = now();
    if (actualizadoMs - t > MAX_CLOCK_SKEW_MS) return fail<T>(name, 'future', maxAgeMs, parsed.data.actualizado);
    if (t - actualizadoMs > maxAgeMs) {
      // A valid file that is too old: not an error to retry soon, just not current.
      lastFailure.set(name, 'stale');
      return null;
    }

    lastGood.set(name, { value: parsed.data, actualizadoMs });
    failedUntil.delete(name);
    lastFailure.delete(name);
    return parsed.data;
  }

  /**
   * Validated feed, or null. `maxAgeMs` is measured from the feed's own
   * `actualizado`, never from when we fetched it.
   */
  async function load<T extends { actualizado: string }>(
    name: string,
    schema: ZodType<T, ZodTypeDef, unknown>,
    maxAgeMs: number
  ): Promise<T | null> {
    const cached = memo.get(name);
    if (cached && now() - cached.at < memoMs) return cached.value as T | null;

    const pending = inflight.get(name);
    if (pending) return pending as Promise<T | null>;

    const promise = fetchAndValidate(name, schema, maxAgeMs)
      .catch(() => fallback<T>(name, maxAgeMs))
      .then((value) => {
        memo.set(name, { value, at: now() });
        return value;
      })
      .finally(() => inflight.delete(name));
    inflight.set(name, promise);
    return promise;
  }

  return { baseUrl, load, lastFailure: (name: string) => lastFailure.get(name) ?? null };
}
