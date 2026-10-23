/**
 * Server-side access to the AutoPublicador feeds (docs/FEED_INTEGRATION.md).
 * One typed function per feed over a shared client; validation lives in
 * lib/feed-types.ts and editorial selection in lib/feed-select.ts.
 *
 * Feeds are read only on the server (FEED_BASE_URL, no NEXT_PUBLIC_):
 * client components receive already selected, plain data.
 */
import { cache } from 'react';
import { PostStatus } from '@prisma/client';
import { createFeedClient } from './feed-core';
import {
  actualizacionesSchema,
  historiasSchema,
  masVistoSchema,
  serviciosSchema,
  ultimoMomentoSchema,
  videosSchema
} from './feed-types';
import {
  DAY,
  HOUR,
  selectActiveAlerts,
  selectCuts,
  selectDollar,
  selectHolidays,
  selectPayments,
  selectQuakes,
  selectSectionTrending,
  selectTrending,
  selectUrgentNote,
  selectVideos,
  selectWeather,
  formatUpdated,
  type TrendingEntry,
  type WeatherView
} from './feed-select';
import { formatWireTime } from './format';
import { formatHeadline } from './headline';
import { isDatabaseConfigured, prisma } from './prisma';
import { getLaRiojaWeather } from './weather';
import { publicPostInclude, type PublicPost } from './posts';

const client = createFeedClient({ baseUrl: process.env.FEED_BASE_URL });

/* Oldest copy of each feed worth considering at all. Modules apply their own,
   stricter rules on top (an alert needs a feed updated within 3 h). */
export const getUltimoMomentoFeed = () => client.load('ultimo-momento', ultimoMomentoSchema, 6 * HOUR);
export const getServiciosFeed = () => client.load('servicios', serviciosSchema, 2 * DAY);
export const getMasVistoFeed = () => client.load('mas-visto', masVistoSchema, 3 * DAY);
export const getActualizacionesFeed = () => client.load('actualizaciones', actualizacionesSchema, 30 * DAY);
export const getHistoriasFeed = () => client.load('historias', historiasSchema, 30 * DAY);
export const getVideosFeed = () => client.load('videos', videosSchema, 14 * DAY);

/** Active weather alerts from both feeds that may carry one, deduplicated. */
export async function getActiveAlerts(now = new Date()) {
  const [urgent, services] = await Promise.all([getUltimoMomentoFeed(), getServiciosFeed()]);
  return selectActiveAlerts(
    [
      { alerta: urgent?.alerta, feedActualizado: urgent?.actualizado },
      { alerta: services?.alerta, feedActualizado: services?.actualizado }
    ],
    now
  );
}

export type CurrentWeather = {
  temperatura: number;
  cielo: string | null;
  source: string;
  /** Observation time as the source reports it. */
  observed: string | null;
  view: WeatherView | null;
};

/**
 * One weather source for the whole site: the feed (an observation within
 * 3 hours) first; Open-Meteo, as the header used before, only when the feed
 * has none. Each keeps its own source name and observation time.
 */
export async function getCurrentWeather(now = new Date()): Promise<CurrentWeather | null> {
  const services = await getServiciosFeed();
  const view = selectWeather(services?.clima, now);
  if (view?.now && !view.now.age.aging && view.now.temperatura !== null) {
    return { temperatura: view.now.temperatura, cielo: view.now.cielo, source: view.source, observed: view.now.observado, view };
  }
  const fallback = await getLaRiojaWeather();
  if (!fallback) return null;
  return { temperatura: fallback.temperature, cielo: null, source: 'Open-Meteo', observed: fallback.observed, view };
}

/**
 * Published stories for a set of slugs taken from a feed, in one query.
 * Stories the CMS does not publish are simply absent from the map.
 */
export async function getPublishedPostsBySlugs(slugs: string[], known: PublicPost[] = []) {
  const bySlug = new Map<string, PublicPost>();
  const wanted = new Set(slugs);
  for (const post of known) if (wanted.has(post.slug)) bySlug.set(post.slug, post);
  const missing = [...wanted].filter((slug) => !bySlug.has(slug));
  if (!missing.length || !isDatabaseConfigured()) return bySlug;
  const posts = await prisma.post
    .findMany({
      where: { slug: { in: missing.slice(0, 100) }, status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } },
      include: publicPostInclude
    })
    .catch(() => [] as PublicPost[]);
  for (const post of posts) bySlug.set(post.slug, post);
  return bySlug;
}

export type UrgentStory = { slug: string; path: string; title: string; time: string; dateTime: string };

/**
 * The feed's urgent story, confirmed against the CMS: a story the site does
 * not publish is never linked. Shared by the layout and the home ticker
 * within one request.
 */
export const getUrgentStory = cache(async (): Promise<UrgentStory | null> => {
  const now = new Date();
  const note = selectUrgentNote(await getUltimoMomentoFeed(), now);
  if (!note) return null;
  let title = formatHeadline(note.title);
  if (isDatabaseConfigured()) {
    const post = await prisma.post
      .findFirst({
        where: { slug: note.slug, status: PostStatus.PUBLISHED, publishedAt: { lte: now } },
        select: { title: true, excerpt: true, contentText: true }
      })
      .catch(() => undefined);
    if (post === null) return null;
    if (post) title = formatHeadline(post.title, post.excerpt, post.contentText);
  }
  return { slug: note.slug, path: note.path, title, time: formatWireTime(note.activado, now), dateTime: note.activado };
});

export type PostSummary = { slug: string; title: string; excerpt: string | null; publishedAt: Date | null; storyKey: string | null };

/** Title, date and story key of published stories named by a feed, in one light query. */
export async function getPublishedPostSummaries(slugs: string[]): Promise<Map<string, PostSummary>> {
  const unique = [...new Set(slugs)].slice(0, 100);
  if (!unique.length || !isDatabaseConfigured()) return new Map();
  const posts = await prisma.post
    .findMany({
      where: { slug: { in: unique }, status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } },
      select: { slug: true, title: true, excerpt: true, publishedAt: true, storyKey: true }
    })
    .catch(() => [] as PostSummary[]);
  return new Map(posts.map((post) => [post.slug, post]));
}

/** Everything /servicios and the home summary need, selected for `now`. */
export async function getServicesView(now = new Date()) {
  const [services, alerts, current] = await Promise.all([getServiciosFeed(), getActiveAlerts(now), getCurrentWeather(now)]);
  const holidays = selectHolidays(services?.feriados, now);
  return {
    alerts,
    current,
    weather: selectWeather(services?.clima, now),
    dollar: selectDollar(services?.dolar, now),
    payments: selectPayments(services?.pagos, now),
    holidays: holidays.length && services?.feriados ? { items: holidays, source: services.feriados.fuente, updated: services.feriados.actualizado } : null,
    quakes: selectQuakes(services?.sismos, now),
    cuts: selectCuts(services?.cortes, now)
  };
}

export type ServicesView = Awaited<ReturnType<typeof getServicesView>>;

/* ─── Instagram: videos and trending stories ──────────── */

export type VideoCardData = {
  key: string;
  title: string;
  permalink: string;
  thumbnail: string | null;
  /** Internal path of the related story, only when the CMS publishes it. */
  notePath: string | null;
  /** Credit for videos taken from X, with its original link when valid. */
  credit: { label: string; href: string | null } | null;
  dateTime: string;
  dateLabel: string;
};

/** Video cards, newest first; related stories are confirmed against the CMS in one query. */
export async function getVideoCards(now: Date, limit: number, known: PublicPost[] = []): Promise<VideoCardData[]> {
  const videos = selectVideos(await getVideosFeed(), now, limit);
  if (!videos.length) return [];
  const posts = await getPublishedPostsBySlugs(
    videos.map((video) => video.url_nota?.slug).filter((slug): slug is string => !!slug),
    known
  );
  return videos.map((video) => {
    const post = video.url_nota ? posts.get(video.url_nota.slug) : undefined;
    return {
      key: video.instagram.url.shortcode,
      // The video keeps its own title; the related story only informs its casing.
      title: formatHeadline(video.titulo, post?.excerpt, post?.contentText),
      permalink: video.instagram.url.url,
      thumbnail: video.instagram.miniatura,
      notePath: post ? `/noticias/${post.slug}` : null,
      credit: video.origen === 'x' ? { label: 'X', href: video.fuente_video } : null,
      dateTime: video.publicado,
      dateLabel: formatUpdated(video.publicado, now)
    };
  });
}

/**
 * Videos for a story page: the one the feed ties to this story (url_nota),
 * shown inside the article, and other recent videos for the rail below it.
 */
export async function getArticleVideos(slug: string, now: Date, railSize = 4) {
  const cards = await getVideoCards(now, railSize + 8);
  const path = `/noticias/${slug}`;
  const related = cards.find((card) => card.notePath === path) ?? null;
  return { related, others: cards.filter((card) => card !== related).slice(0, railSize) };
}

export type TrendingStory = { slug: string; path: string; title: string; category: { name: string; slug: string } | null };

function toTrendingStories(entries: TrendingEntry[], posts: Map<string, PublicPost>): TrendingStory[] {
  return entries.map((entry) => {
    const post = posts.get(entry.slug);
    return {
      slug: entry.slug,
      path: entry.path,
      // The CMS title (and its context for sentence case) when the story exists; the feed's otherwise.
      title: post ? formatHeadline(post.title, post.excerpt, post.contentText) : formatHeadline(entry.title),
      category: post ? { name: post.category.name, slug: post.category.slug } : null
    };
  });
}

/** Instagram ranking for the home page: today (24 h) and the week (7 days). */
export async function getTrendingLists(known: PublicPost[] = [], limit = 5) {
  const lists = selectTrending(await getMasVistoFeed(), limit);
  if (!lists) return null;
  const posts = await getPublishedPostsBySlugs([...lists.day, ...lists.week].map((entry) => entry.slug), known);
  return { day: toTrendingStories(lists.day, posts), week: toTrendingStories(lists.week, posts) };
}

/** Instagram ranking of one section over the last 7 days; empty when the feed has none. */
export async function getSectionTrending(sectionSlug: string, known: PublicPost[] = [], limit = 5) {
  const entries = selectSectionTrending(await getMasVistoFeed(), sectionSlug, limit);
  if (!entries.length) return [];
  return toTrendingStories(entries, await getPublishedPostsBySlugs(entries.map((entry) => entry.slug), known));
}
