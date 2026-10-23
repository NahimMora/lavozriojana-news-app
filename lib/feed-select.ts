/**
 * Editorial selection over validated feeds. Pure functions: every rule that
 * depends on time receives `now`, so expiry, "today" in La Rioja and data
 * age are tested without a clock (tests/feed.test.mjs).
 *
 * Freshness rules (docs/FEED_INTEGRATION.md) are per kind of information:
 * an alert expires, a holiday is a calendar date, a quote ages within hours.
 */
import type {
  ClimaBlock,
  Cut,
  CortesBlock,
  DolarBlock,
  FeriadosBlock,
  HistoriasFeed,
  MasVistoFeed,
  PagosBlock,
  Payment,
  Quake,
  Quote,
  SismosBlock,
  StoryItem,
  TrendingItem,
  UltimoMomentoFeed,
  VideoItem,
  VideosFeed,
  WeatherAlert,
  ActualizacionesFeed
} from './feed-types';
import { EVENT_STORY_KEY } from './feed-types';

export const LA_RIOJA_TZ = 'America/Argentina/La_Rioja';
export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
const CLOCK_SKEW = 10 * MINUTE;

const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : Number.NaN);
const isPastOrNow = (iso: string, now: Date) => ms(iso) <= now.getTime() + CLOCK_SKEW;

/** Calendar day in La Rioja (YYYY-MM-DD) for an instant. */
export function laRiojaDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LA_RIOJA_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Whole calendar days from one YYYY-MM-DD to another; no clock or zone involved. */
export function daysBetween(fromKey: string, toKey: string) {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(toKey) - toUtc(fromKey)) / DAY);
}

/* ─── Formatting ──────────────────────────────────────── */

const clockFormat = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: LA_RIOJA_TZ });
const dayMonthFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: LA_RIOJA_TZ });
const weekdayDayFormat = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', timeZone: LA_RIOJA_TZ });
const longDateFormat = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const shortDateFormat = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const arsFormat = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const decimalFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

/** "16:05" in La Rioja, minutes truncated as the source gives them (02:59:59 → 02:59). */
export const formatClock = (iso: string) => clockFormat.format(new Date(ms(iso)));
/** "$ 1.550,00" with a regular space. */
export const formatArs = (value: number) => arsFormat.format(value).replace(/ /g, ' ');
export const formatDecimal = (value: number) => decimalFormat.format(value);
/** Percentages exactly as reported, up to two decimals: 4.03 → "4,03". */
export const formatPercent = (value: number) => percentFormat.format(value);
const stripDot = (value: string) => value.replace(/\./g, '');

/** "23 oct, 16:05", or "hoy, 16:05" when it is today in La Rioja. */
export function formatUpdated(iso: string, now: Date) {
  const date = new Date(ms(iso));
  const day = laRiojaDateKey(date) === laRiojaDateKey(now) ? 'hoy' : stripDot(dayMonthFormat.format(date));
  return `${day}, ${clockFormat.format(date)}`;
}

/** "hace 5 h" / "hace 40 min" / "hace 2 días", for data older than the module's fresh window. */
export function formatAge(iso: string, now: Date) {
  const age = Math.max(0, now.getTime() - ms(iso));
  if (age < HOUR) return `hace ${Math.max(1, Math.floor(age / MINUTE))} min`;
  if (age < 2 * DAY) return `hace ${Math.floor(age / HOUR)} h`;
  return `hace ${Math.floor(age / DAY)} días`;
}

/** "lunes 24 de noviembre" for a YYYY-MM-DD, independent of the server's zone. */
export function formatCalendarDate(key: string, style: 'long' | 'short' = 'long') {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return style === 'long' ? longDateFormat.format(date) : stripDot(shortDateFormat.format(date)).replace(',', '');
}

export type Age = { ageMs: number; aging: boolean };
/** Age of a datum and whether it is past its fresh window (it is still shown, labelled). */
function ageOf(iso: string, now: Date, freshMs: number): Age {
  const ageMs = Math.max(0, now.getTime() - ms(iso));
  return { ageMs, aging: ageMs > freshMs };
}

/* ─── Último momento ──────────────────────────────────── */

export const URGENT_FEED_MAX_AGE = 3 * HOUR;
export const URGENT_NOTE_MAX_AGE = 12 * HOUR;

export type UrgentNote = { title: string; slug: string; path: string; activado: string };

/**
 * The feed's urgent story, only while `vigente` and confirmed recently: a
 * feed not refreshed for 3 hours cannot confirm it is still urgent.
 */
export function selectUrgentNote(feed: UltimoMomentoFeed | null, now: Date): UrgentNote | null {
  const note = feed?.nota;
  if (!feed || !note || note.vigente !== true) return null;
  if (now.getTime() - ms(feed.actualizado) > URGENT_FEED_MAX_AGE) return null;
  if (!isPastOrNow(note.activado, now) || now.getTime() - ms(note.activado) > URGENT_NOTE_MAX_AGE) return null;
  return { title: note.titulo, slug: note.url.slug, path: note.url.path, activado: note.activado };
}

/* ─── Alertas ─────────────────────────────────────────── */

export const ALERT_FEED_MAX_AGE = 3 * HOUR;
export const ALERT_RECORD_MAX_AGE = 24 * HOUR;
const LEVEL_RANK = { roja: 3, naranja: 2, amarilla: 1 } as const;

export type ActiveAlert = {
  key: string;
  level: WeatherAlert['nivel'];
  /** "Alerta naranja", or "Aviso naranja" for an aviso a muy corto plazo. */
  label: string;
  /** "por viento" */
  cause: string;
  /** "Alerta naranja por viento" */
  headline: string;
  zones: string[];
  /** "Vigente hasta las 02:59" / "Vigente hasta las 02:59 del sábado 24" */
  until: string;
  vence: string;
  description: string | null;
  source: string;
  /** "SMN" when the feed names the Servicio Meteorológico Nacional, else the source as given. */
  sourceShort: string;
  updated: string;
  /** Instant after which the alert must disappear from an open page. */
  hideAt: number;
};

export type AlertCandidate = { alerta: WeatherAlert | null | undefined; feedActualizado: string | null | undefined };

/**
 * Active alerts from every feed that carries one, deduplicated, most severe
 * first. Shown only when the state is "activa", `vence` is valid and future,
 * the alert was updated within 24 h and its feed within 3 h.
 */
export function selectActiveAlerts(candidates: AlertCandidate[], now: Date): ActiveAlert[] {
  const t = now.getTime();
  const seen = new Map<string, ActiveAlert>();
  for (const { alerta, feedActualizado } of candidates) {
    if (!alerta || !feedActualizado) continue;
    if (alerta.estado !== 'activa') continue;
    if (t - ms(feedActualizado) > ALERT_FEED_MAX_AGE) continue;
    const vence = ms(alerta.vence);
    if (!(vence > t)) continue;
    if (!isPastOrNow(alerta.actualizado, now) || t - ms(alerta.actualizado) > ALERT_RECORD_MAX_AGE) continue;

    const zones = [...new Set(alerta.zonas)];
    const key = [alerta.tipo, alerta.nivel, alerta.fenomeno.toLocaleLowerCase('es-AR'), [...zones].sort().join('|'), alerta.vence].join('#');
    const kind = alerta.tipo === 'alerta' ? 'Alerta' : 'Aviso';
    const sameDay = laRiojaDateKey(new Date(vence)) === laRiojaDateKey(now);
    const item: ActiveAlert = {
      key,
      level: alerta.nivel,
      label: `${kind} ${alerta.nivel}`,
      cause: `por ${alerta.fenomeno}`,
      headline: `${kind} ${alerta.nivel} por ${alerta.fenomeno}`,
      zones,
      until: `Vigente hasta las ${formatClock(alerta.vence)}${sameDay ? '' : ` del ${weekdayDayFormat.format(new Date(vence))}`}`,
      vence: alerta.vence,
      description: alerta.descripcion,
      source: alerta.fuente,
      sourceShort: /servicio meteorol[oó]gico nacional|\bsmn\b/i.test(alerta.fuente) ? 'SMN' : alerta.fuente,
      updated: alerta.actualizado,
      hideAt: Math.min(vence, ms(feedActualizado) + ALERT_FEED_MAX_AGE)
    };
    const previous = seen.get(key);
    if (!previous || ms(item.updated) > ms(previous.updated)) seen.set(key, item);
  }
  return [...seen.values()].sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || ms(b.updated) - ms(a.updated));
}

/** "Vinchina" · "Vinchina y Famatina" · "Vinchina, Famatina y Chilecito" · "Vinchina, Famatina y 3 zonas más" */
export function formatZones(zones: string[], max = 3) {
  if (zones.length <= 1) return zones[0] || '';
  if (zones.length <= max) return `${zones.slice(0, -1).join(', ')} y ${zones[zones.length - 1]}`;
  return `${zones.slice(0, max - 1).join(', ')} y ${zones.length - (max - 1)} zonas más`;
}

/* ─── Actualizaciones ─────────────────────────────────── */

export type UpdateCandidate = { slug: string; path: string; title: string; novedad: string | null };

/**
 * Stories that update the one at `currentSlug`. The contract reads
 * `nota` = original, `actualiza` = the story with the news: the original
 * links forward. Chains (A→B→C) are followed so A can reach C; self links and
 * cycles are ignored.
 */
export function selectUpdateCandidates(feed: ActualizacionesFeed | null, currentSlug: string): UpdateCandidate[] {
  if (!feed) return [];
  const edges = new Map<string, UpdateCandidate[]>();
  for (const item of feed.items) {
    if (item.nota.url.slug === item.actualiza.url.slug) continue;
    const list = edges.get(item.nota.url.slug) || [];
    list.push({ slug: item.actualiza.url.slug, path: item.actualiza.url.path, title: item.actualiza.titulo, novedad: item.novedad });
    edges.set(item.nota.url.slug, list);
  }
  const found = new Map<string, UpdateCandidate>();
  const queue = [currentSlug];
  const visited = new Set<string>([currentSlug]);
  for (let depth = 0; queue.length && depth < 6; depth++) {
    const next: string[] = [];
    for (const slug of queue) {
      for (const candidate of edges.get(slug) || []) {
        if (visited.has(candidate.slug)) continue;
        visited.add(candidate.slug);
        found.set(candidate.slug, candidate);
        next.push(candidate.slug);
      }
    }
    queue.splice(0, queue.length, ...next);
  }
  return [...found.values()];
}

/**
 * The most recent update, by the CMS publication date (the feed has no date
 * for `actualiza`, and its order is not documented). Candidates the CMS does
 * not publish, or published before the current story, are discarded.
 */
export function pickLatestUpdate(
  candidates: UpdateCandidate[],
  published: Map<string, { publishedAt: Date | null; title: string }>,
  currentPublishedAt: Date | null
): (UpdateCandidate & { publishedAt: Date }) | null {
  let best: (UpdateCandidate & { publishedAt: Date }) | null = null;
  for (const candidate of candidates) {
    const post = published.get(candidate.slug);
    if (!post?.publishedAt) continue;
    if (currentPublishedAt && post.publishedAt.getTime() <= currentPublishedAt.getTime()) continue;
    if (!best || post.publishedAt.getTime() > best.publishedAt.getTime()) {
      best = { ...candidate, title: post.title || candidate.title, publishedAt: post.publishedAt };
    }
  }
  return best;
}

/* ─── Cronologías ─────────────────────────────────────── */

export const isEventStoryKey = (key: string | null | undefined): key is string => typeof key === 'string' && EVENT_STORY_KEY.test(key);

export type TimelinePost = { slug: string; title: string; excerpt?: string | null; publishedAt: Date | null; storyKey?: string | null };
export type TimelineEntry = { slug: string; path: string; title: string; excerpt: string | null; publishedAt: string; novedad: string | null; current: boolean };

/** The feed's record of the event, only when its key and the current story's URL both match. */
export function findVerifiedStory(feed: HistoriasFeed | null, storyKey: string, currentSlug: string): StoryItem | null {
  if (!feed || !isEventStoryKey(storyKey)) return null;
  return feed.items.find((item) => item.storyKey === storyKey && item.notas.some((note) => note.url.slug === currentSlug)) || null;
}

/**
 * Timeline of one verified event, oldest first, including the current story.
 * CMS stories with the same `event:` key are included; the feed adds
 * stories the CMS publishes whose key is the same or still empty, and their
 * `novedad`. A CMS story with a different key is never pulled in. Returned
 * only with at least two distinct stories.
 */
export function buildStoryTimeline(input: {
  storyKey: string | null | undefined;
  current: TimelinePost;
  sameKey: TimelinePost[];
  feedStory: StoryItem | null;
  feedPosts: Map<string, TimelinePost>;
}): TimelineEntry[] {
  const { storyKey, current } = input;
  if (!isEventStoryKey(storyKey) || !current.publishedAt) return [];

  const entries = new Map<string, TimelineEntry>();
  const add = (post: TimelinePost, novedad: string | null, isCurrent: boolean) => {
    if (!post.publishedAt) return;
    const existing = entries.get(post.slug);
    entries.set(post.slug, {
      slug: post.slug,
      path: `/noticias/${post.slug}`,
      title: post.title,
      excerpt: post.excerpt ?? null,
      publishedAt: post.publishedAt.toISOString(),
      novedad: novedad || existing?.novedad || null,
      current: isCurrent || !!existing?.current
    });
  };

  add(current, null, true);
  for (const post of input.sameKey) {
    if (post.slug !== current.slug && post.storyKey === storyKey) add(post, null, false);
  }
  if (input.feedStory && input.feedStory.storyKey === storyKey) {
    for (const note of input.feedStory.notas) {
      const slug = note.url.slug;
      const novedad = note.novedad?.trim() || null;
      if (slug === current.slug) {
        add(current, novedad, true);
        continue;
      }
      const post = input.feedPosts.get(slug);
      if (!post) continue;
      if (post.storyKey && post.storyKey !== storyKey) continue;
      add(post, novedad, false);
    }
  }

  const list = [...entries.values()].sort((a, b) => ms(a.publishedAt) - ms(b.publishedAt) || a.slug.localeCompare(b.slug));
  return list.length >= 2 ? list : [];
}

/* ─── Lo más visto en Instagram ───────────────────────── */

export const TRENDING_FEED_MAX_AGE = 72 * HOUR;

/** The ranking is shown only when the feed says it measures Instagram: we never relabel another metric. */
export const isInstagramMetric = (feed: MasVistoFeed | null) => !!feed?.metrica && /instagram/i.test(feed.metrica);

export type TrendingEntry = { slug: string; path: string; title: string; seccion: string | null };

/**
 * Ranked by Instagram reach (then interactions) as the feed reports them,
 * not by file order; entries without numbers keep their place after those
 * with them. Duplicates by story are removed.
 */
export function rankTrending(items: TrendingItem[], limit: number): TrendingEntry[] {
  const indexed = items.map((item, index) => ({ item, index }));
  indexed.sort((a, b) => {
    const ra = a.item.instagram?.alcance;
    const rb = b.item.instagram?.alcance;
    if (ra != null && rb != null && ra !== rb) return rb - ra;
    if (ra != null && rb == null) return -1;
    if (ra == null && rb != null) return 1;
    const ia = a.item.instagram?.interacciones;
    const ib = b.item.instagram?.interacciones;
    if (ia != null && ib != null && ia !== ib) return ib - ia;
    return a.index - b.index;
  });
  const seen = new Set<string>();
  const ranked: TrendingEntry[] = [];
  for (const { item } of indexed) {
    if (seen.has(item.url.slug)) continue;
    seen.add(item.url.slug);
    ranked.push({ slug: item.url.slug, path: item.url.path, title: item.titulo, seccion: item.seccion });
    if (ranked.length >= limit) break;
  }
  return ranked;
}

export function selectTrending(feed: MasVistoFeed | null, limit = 5) {
  if (!isInstagramMetric(feed) || !feed) return null;
  const day = rankTrending(feed.ventanas['24h'], limit);
  const week = rankTrending(feed.ventanas['7d'], limit);
  if (!day.length && !week.length) return null;
  return { day, week };
}

export function selectSectionTrending(feed: MasVistoFeed | null, sectionSlug: string, limit = 5) {
  if (!isInstagramMetric(feed) || !feed) return [];
  return rankTrending(feed.por_seccion_7d[sectionSlug] || [], limit);
}

/* ─── Servicios ───────────────────────────────────────── */

/** Volatile data (weather, quotes) older than this is labelled with its age and never called current. */
export const VOLATILE_FRESH = 3 * HOUR;

export type WeatherNow = {
  temperatura: number | null;
  cielo: string | null;
  humedad: number | null;
  viento: string | number | null;
  /** When it was observed; null when the feed does not say (then `updated` is the reference). */
  observado: string | null;
  updated: string;
  age: Age;
};

export type WeatherView = {
  source: string;
  station: string | null;
  now: WeatherNow | null;
  today: { min: number | null; max: number | null } | null;
  forecast: ClimaBlock['pronostico'];
};

/** Current conditions up to 12 h old (labelled after 3 h); forecast from today on. */
export function selectWeather(clima: ClimaBlock | null | undefined, now: Date): WeatherView | null {
  if (!clima) return null;
  const todayKey = laRiojaDateKey(now);
  const reference = clima.observado || clima.actualizado;
  let current: WeatherNow | null = null;
  if (isPastOrNow(reference, now) && now.getTime() - ms(reference) <= 12 * HOUR && (clima.temperatura !== null || clima.cielo)) {
    current = {
      temperatura: clima.temperatura,
      cielo: clima.cielo,
      humedad: clima.humedad,
      viento: clima.viento,
      observado: clima.observado ?? null,
      updated: clima.actualizado,
      age: ageOf(reference, now, VOLATILE_FRESH)
    };
  }
  const forecast = clima.pronostico
    .filter((day) => day.fecha >= todayKey && (day.min !== null || day.max !== null || day.lluvia !== null))
    .filter((day, index, list) => list.findIndex((other) => other.fecha === day.fecha) === index)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 6);
  const todayForecast = forecast.find((day) => day.fecha === todayKey);
  if (!current && !forecast.length) return null;
  return {
    source: clima.fuente,
    station: clima.estacion,
    now: current,
    today: todayForecast ? { min: todayForecast.min, max: todayForecast.max } : null,
    forecast
  };
}

const QUOTE_ORDER: Record<string, number> = { oficial: 1, blue: 2, bolsa: 3, mep: 3, contadoconliqui: 4, ccl: 4 };
export const QUOTE_MAX_AGE = 4 * DAY;

export type QuoteView = Quote & { age: Age; primary: boolean };
export type DollarView = { source: string; updated: string; quotes: QuoteView[]; gap: number | null };

/**
 * Oficial and Blue first, MEP and CCL next, other houses after. A quote with
 * neither price, or older than 4 days (a long weekend at most), is dropped.
 */
export function selectDollar(dolar: DolarBlock | null | undefined, now: Date): DollarView | null {
  if (!dolar) return null;
  const quotes = dolar.cotizaciones
    .filter((quote) => (quote.compra !== null || quote.venta !== null) && isPastOrNow(quote.actualizado, now) && now.getTime() - ms(quote.actualizado) <= QUOTE_MAX_AGE)
    .filter((quote, index, list) => list.findIndex((other) => other.casa === quote.casa) === index)
    .map((quote) => ({ ...quote, age: ageOf(quote.actualizado, now, VOLATILE_FRESH), primary: quote.casa === 'oficial' || quote.casa === 'blue' }))
    .sort((a, b) => (QUOTE_ORDER[a.casa] ?? 9) - (QUOTE_ORDER[b.casa] ?? 9));
  if (!quotes.length) return null;
  const hasBlue = quotes.some((quote) => quote.casa === 'blue');
  return { source: dolar.fuente, updated: dolar.actualizado, quotes, gap: hasBlue ? dolar.brecha_blue_pct : null };
}

export type HolidayView = { fecha: string; nombre: string; tipo: string | null; daysLeft: number };

export const HOLIDAYS_MAX_AGE = 120 * DAY;
export const PAYMENTS_MAX_AGE = 31 * DAY;

/** Holidays from today on (calendar dates in La Rioja); a past date is never "next". */
export function selectHolidays(feriados: FeriadosBlock | null | undefined, now: Date, limit = 6): HolidayView[] {
  if (!feriados || now.getTime() - ms(feriados.actualizado) > HOLIDAYS_MAX_AGE) return [];
  const todayKey = laRiojaDateKey(now);
  return feriados.proximos
    .filter((holiday) => holiday.fecha >= todayKey)
    .filter((holiday, index, list) => list.findIndex((other) => other.fecha === holiday.fecha && other.nombre === holiday.nombre) === index)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, limit)
    .map((holiday) => ({ ...holiday, daysLeft: daysBetween(todayKey, holiday.fecha) }));
}

export type PaymentsView = { source: string; updated: string; today: Payment[]; upcoming: Payment[] };

/**
 * "Today" is decided by each payment's own date in La Rioja, not by the
 * array it came in: a stale `hoy` from yesterday is not today.
 */
export function selectPayments(pagos: PagosBlock | null | undefined, now: Date, upcomingLimit = 8): PaymentsView | null {
  if (!pagos || now.getTime() - ms(pagos.actualizado) > PAYMENTS_MAX_AGE) return null;
  const todayKey = laRiojaDateKey(now);
  const all = [...pagos.hoy, ...pagos.proximos].filter(
    (payment, index, list) => list.findIndex((other) => other.fecha === payment.fecha && other.concepto === payment.concepto) === index
  );
  const today = all.filter((payment) => payment.fecha === todayKey);
  const upcoming = all.filter((payment) => payment.fecha > todayKey).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, upcomingLimit);
  if (!today.length && !upcoming.length) return null;
  return { source: pagos.fuente, updated: pagos.actualizado, today, upcoming };
}

export type QuakesView = { source: string; updated: string; age: Age; items: Quake[] };
export const QUAKES_MAX_AGE = 72 * HOUR;

/** Quakes of the last seven days, newest first. Nothing is marked as felt unless the feed says so. */
export function selectQuakes(sismos: SismosBlock | null | undefined, now: Date, limit = 10): QuakesView | null {
  if (!sismos) return null;
  if (now.getTime() - ms(sismos.actualizado) > QUAKES_MAX_AGE) return null;
  const from = now.getTime() - 7 * DAY;
  const items = sismos.ultimos_7_dias
    .filter((quake) => ms(quake.fecha) >= from && isPastOrNow(quake.fecha, now))
    .filter((quake, index, list) => list.findIndex((other) => other.id === quake.id) === index)
    .sort((a, b) => ms(b.fecha) - ms(a.fecha))
    .slice(0, limit);
  if (!items.length) return null;
  return { source: sismos.fuente, updated: sismos.actualizado, age: ageOf(sismos.actualizado, now, 6 * HOUR), items };
}

/** A quake worth a line in the home summary: felt, or magnitude 4 or more, within 24 h. */
export const isNotableQuake = (quake: Quake, now: Date) =>
  now.getTime() - ms(quake.fecha) <= DAY && (quake.estado === 'sentido' || quake.magnitud >= 4);

export const CUTS_MAX_AGE = 72 * HOUR;
export type CutsView = { source: string; updated: string; items: Cut[] };

/**
 * Notices published in the last 72 hours, newest first. They are notices,
 * not a service status: nothing here says a cut is still going on.
 */
export function selectCuts(cortes: CortesBlock | null | undefined, now: Date, limit = 12): CutsView | null {
  if (!cortes) return null;
  const items = cortes.avisos
    .filter((cut) => isPastOrNow(cut.publicado, now) && now.getTime() - ms(cut.publicado) <= CUTS_MAX_AGE)
    .filter((cut, index, list) => list.findIndex((other) => other.url === cut.url && other.titulo === cut.titulo) === index)
    .sort((a, b) => ms(b.publicado) - ms(a.publicado))
    .slice(0, limit);
  if (!items.length) return null;
  return { source: cortes.fuente, updated: cortes.actualizado, items };
}

/* ─── Videos ──────────────────────────────────────────── */

export const VIDEOS_FEED_MAX_AGE = 14 * DAY;

/** Newest first, one card per Instagram post, nothing dated in the future. */
export function selectVideos(feed: VideosFeed | null, now: Date, limit = 24): VideoItem[] {
  if (!feed) return [];
  return feed.items
    .filter((video) => isPastOrNow(video.publicado, now))
    .filter((video, index, list) => list.findIndex((other) => other.instagram.url.shortcode === video.instagram.url.shortcode) === index)
    .sort((a, b) => ms(b.publicado) - ms(a.publicado))
    .slice(0, limit);
}

/* ─── Resumen de servicios para la portada ────────────── */

export type SummaryItem = { key: string; label: string; value: string; note: string | null; href: string };
export type SummaryWeather = { temperatura: number; cielo: string | null } | null;

export const formatDegrees = (value: number) => `${formatDecimal(value)}°`;

/**
 * Up to four services for the home strip, by editorial relevance rather than
 * file order: weather, then what affects the day (payments today, recent
 * cut notices, a notable quake), then the dollar and the next holiday. Only
 * fresh data reaches the home page; older data stays on /servicios with its age.
 */
export function selectServicesSummary(
  input: {
    weather: SummaryWeather;
    today: { min: number | null; max: number | null } | null;
    dollar: DollarView | null;
    payments: PaymentsView | null;
    holidays: HolidayView[];
    quakes: QuakesView | null;
    cuts: CutsView | null;
  },
  now: Date,
  limit = 4
): SummaryItem[] {
  const items: SummaryItem[] = [];
  const { weather, today, dollar, payments, holidays, quakes, cuts } = input;

  if (weather) {
    const range = [today?.min != null ? `Mín. ${formatDegrees(today.min)}` : null, today?.max != null ? `Máx. ${formatDegrees(today.max)}` : null].filter(Boolean).join(' · ');
    items.push({ key: 'clima', label: 'Clima', value: [formatDegrees(weather.temperatura), weather.cielo].filter(Boolean).join(' · '), note: range || null, href: '/servicios#clima' });
  }
  if (payments?.today.length) {
    const [first, ...others] = payments.today;
    items.push({ key: 'pagos', label: 'Pagos de hoy', value: first.concepto, note: others.length ? `y ${others.length} más` : null, href: '/servicios#pagos' });
  }
  const recentCuts = cuts?.items.filter((cut) => now.getTime() - ms(cut.publicado) <= DAY) ?? [];
  if (recentCuts.length) {
    const services = [...new Set(recentCuts.map((cut) => CUT_LABELS[cut.servicio].toLocaleLowerCase('es-AR')))];
    items.push({
      key: 'cortes',
      label: 'Avisos de cortes',
      value: recentCuts.length === 1 ? recentCuts[0].titulo : `${recentCuts.length} avisos: ${formatZones(services)}`,
      note: recentCuts.length === 1 ? recentCuts[0].zona : 'Publicados en las últimas 24 h',
      href: '/servicios#cortes'
    });
  }
  const notable = quakes?.items.find((quake) => isNotableQuake(quake, now));
  if (notable) {
    items.push({
      key: 'sismo',
      label: `Sismo, ${formatUpdated(notable.fecha, now)}`,
      value: `Magnitud ${formatDecimal(notable.magnitud)}${notable.estado === 'automatico' ? ' (preliminar)' : ''}`,
      note: notable.lugar,
      href: '/servicios#sismos'
    });
  }
  const freshQuotes = dollar?.quotes.filter((quote) => quote.primary && now.getTime() - ms(quote.actualizado) <= DAY) ?? [];
  if (freshQuotes.length) {
    const line = (quote: QuoteView) => `${quote.nombre} ${quote.venta !== null ? formatArs(quote.venta) : formatArs(quote.compra as number)}`;
    items.push({ key: 'dolar', label: 'Dólar (venta)', value: line(freshQuotes[0]), note: freshQuotes[1] ? line(freshQuotes[1]) : null, href: '/servicios#dolar' });
  }
  const holiday = holidays.find((item) => item.daysLeft <= 30);
  if (holiday) {
    items.push({ key: 'feriado', label: 'Próximo feriado', value: `${formatCalendarDate(holiday.fecha, 'short')} · ${holiday.nombre}`, note: daysLeftLabel(holiday.daysLeft), href: '/servicios#feriados' });
  }
  if (!payments?.today.length && payments?.upcoming.length) {
    const next = payments.upcoming[0];
    items.push({ key: 'proximo-pago', label: 'Próximo pago', value: next.concepto, note: formatCalendarDate(next.fecha, 'short'), href: '/servicios#pagos' });
  }
  return items.slice(0, limit);
}

export const CUT_LABELS: Record<Cut['servicio'], string> = { luz: 'Luz', agua: 'Agua', rutas: 'Rutas' };

export function daysLeftLabel(days: number) {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `Faltan ${days} días`;
}

export const QUAKE_STATE_LABELS: Record<Quake['estado'], string> = {
  automatico: 'Dato automático, preliminar',
  revisado: 'Revisado',
  sentido: 'Sentido por la población'
};
