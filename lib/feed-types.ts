/**
 * Contracts of the JSON feeds the AutoPublicador publishes under
 * FEED_BASE_URL (docs/FEED_INTEGRATION.md). Everything here is untrusted
 * external data validated at runtime:
 *
 * - `version` must be exactly 1 and `actualizado` an ISO 8601 date-time with
 *   an explicit offset; otherwise the whole feed is rejected.
 * - Inside a valid feed, a broken item or block is dropped on its own
 *   (`lenientArray`, `optionalPart`) instead of discarding the rest.
 * - Links to our own stories become a validated slug (toNewsLink); other
 *   URLs must be http(s). Invalid optional URLs become null.
 * - Unknown numbers stay null: nothing is turned into zero or filled in.
 */
import { z } from 'zod';
import { safeExternalUrl, toInstagramLink, toInstagramThumbnail, toNewsLink } from './feed-url';

export const FEED_VERSION = 1;

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SLUG_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Date-time with an explicit offset. Without one, the instant would depend on the server's zone. */
export const isoDateTime = z
  .string()
  .trim()
  .regex(ISO_DATE_TIME)
  .refine((value) => !Number.isNaN(Date.parse(value)));

/** Calendar date (YYYY-MM-DD) that exists: 2026-02-30 is rejected. */
export const isoDate = z
  .string()
  .trim()
  .refine((value) => {
    const match = value.match(ISO_DATE);
    if (!match) return false;
    const [y, m, d] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  });

/** Plain text: trimmed, inner whitespace collapsed, control characters removed. Never HTML. */
const text = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim())
    .pipe(z.string().min(1).max(max));

const optionalText = (max: number) =>
  z
    .unknown()
    .transform((value) => {
      const parsed = text(max).safeParse(value);
      return parsed.success ? parsed.data : null;
    });

const finite = z.number().finite();
/** A number or null. Strings, NaN and Infinity are not numbers here. */
const optionalNumber = z.unknown().transform((value) => (typeof value === 'number' && Number.isFinite(value) ? value : null));

const newsUrl = z.unknown().transform((value, ctx) => {
  const link = toNewsLink(value);
  if (!link) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL de nota inválida' });
    return z.NEVER;
  }
  return link;
});
const optionalNewsUrl = z.unknown().transform((value) => toNewsLink(value));
const externalUrl = z.unknown().transform((value, ctx) => {
  const url = safeExternalUrl(value);
  if (!url) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL inválida' });
    return z.NEVER;
  }
  return url;
});
const optionalExternalUrl = z.unknown().transform((value) => safeExternalUrl(value));

/** Array whose invalid entries are dropped one by one. Not an array: empty. */
function lenientArray<T extends z.ZodTypeAny>(item: T, max = 200) {
  return z.unknown().transform((value) => {
    if (!Array.isArray(value)) return [] as z.output<T>[];
    const valid: z.output<T>[] = [];
    for (const entry of value.slice(0, max)) {
      const parsed = item.safeParse(entry);
      if (parsed.success) valid.push(parsed.data);
    }
    return valid;
  });
}

/** Optional block: absent, null or invalid → null, without rejecting the feed. */
function optionalPart<T extends z.ZodTypeAny>(schema: T) {
  return z.unknown().transform((value) => {
    if (value === null || value === undefined) return null;
    const parsed = schema.safeParse(value);
    return parsed.success ? (parsed.data as z.output<T>) : null;
  });
}

const feedBase = z.object({
  version: z.literal(FEED_VERSION),
  actualizado: isoDateTime
});

/* ─── ultimo-momento.json ─────────────────────────────── */

const urgentNoteSchema = z.object({
  titulo: text(300),
  url: newsUrl,
  seccion: optionalText(80),
  activado: isoDateTime,
  vigente: z.boolean()
});

const ALERT_TYPES = ['alerta', 'aviso a muy corto plazo'] as const;
const ALERT_LEVELS = ['amarilla', 'naranja', 'roja'] as const;

export const weatherAlertSchema = z.object({
  fuente: text(160),
  estado: text(40).transform((value) => value.toLocaleLowerCase('es-AR')),
  tipo: text(60)
    .transform((value) => value.toLocaleLowerCase('es-AR'))
    .pipe(z.enum(ALERT_TYPES)),
  nivel: text(20)
    .transform((value) => value.toLocaleLowerCase('es-AR'))
    .pipe(z.enum(ALERT_LEVELS)),
  fenomeno: text(80),
  zonas: lenientArray(text(120), 80),
  vence: isoDateTime,
  descripcion: optionalText(4000),
  actualizado: isoDateTime
});

export const ultimoMomentoSchema = feedBase.extend({
  nota: optionalPart(urgentNoteSchema),
  alerta: optionalPart(weatherAlertSchema)
});

/* ─── actualizaciones.json ────────────────────────────── */

const updateItemSchema = z.object({
  nota: z.object({ titulo: text(300), url: newsUrl, publicada: isoDateTime.optional().nullable().catch(null) }),
  actualiza: z.object({ titulo: text(300), url: newsUrl }),
  novedad: optionalText(400)
});

export const actualizacionesSchema = feedBase.extend({
  items: lenientArray(updateItemSchema, 500)
});

/* ─── historias.json ──────────────────────────────────── */

/** Only `event:` keys identify one verified event. Older prefixes (`story:`) grouped unrelated facts. */
export const EVENT_STORY_KEY = /^event:[A-Za-z0-9_:-]{1,150}$/;

const storyNoteSchema = z.object({
  titulo: text(300),
  url: newsUrl,
  publicada: isoDateTime,
  novedad: optionalText(400)
});

const storySchema = z.object({
  storyKey: z.string().trim().regex(EVENT_STORY_KEY),
  titulo: text(300),
  actualizado: isoDateTime,
  notas: lenientArray(storyNoteSchema, 100)
});

export const historiasSchema = feedBase.extend({
  origen: optionalText(200),
  items: lenientArray(storySchema, 500)
});

/* ─── mas-visto.json ──────────────────────────────────── */

const trendingItemSchema = z.object({
  titulo: text(300),
  url: newsUrl,
  seccion: optionalText(80),
  publicada: isoDateTime.optional().nullable().catch(null),
  instagram: optionalPart(
    z.object({
      url: z.unknown().transform((value) => toInstagramLink(value)),
      alcance: optionalNumber,
      interacciones: optionalNumber
    })
  )
});

export const masVistoSchema = feedBase.extend({
  metrica: optionalText(160),
  ventanas: z
    .object({
      '24h': lenientArray(trendingItemSchema, 50),
      '7d': lenientArray(trendingItemSchema, 50)
    })
    .catch({ '24h': [], '7d': [] }),
  por_seccion_7d: z.unknown().transform((value) => {
    const bySection: Record<string, z.output<typeof trendingItemSchema>[]> = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return bySection;
    for (const [key, items] of Object.entries(value).slice(0, 60)) {
      if (!SLUG_KEY.test(key)) continue;
      bySection[key] = lenientArray(trendingItemSchema, 30).parse(items);
    }
    return bySection;
  })
});

/* ─── servicios.json ──────────────────────────────────── */

/** Every service block names its source and when it was updated. */
const serviceBlock = z.object({ fuente: text(160), actualizado: isoDateTime });

const forecastDaySchema = z.object({
  fecha: isoDate,
  dia: optionalText(20),
  min: optionalNumber,
  max: optionalNumber,
  lluvia: z.unknown().transform((value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = text(40).safeParse(value);
    return parsed.success ? parsed.data : null;
  })
});

const climaSchema = serviceBlock.extend({
  estacion: optionalText(120),
  observado: isoDateTime.optional().nullable().catch(null),
  temperatura: optionalNumber,
  cielo: optionalText(80),
  humedad: optionalNumber,
  viento: z.unknown().transform((value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = text(80).safeParse(value);
    return parsed.success ? parsed.data : null;
  }),
  pronostico: lenientArray(forecastDaySchema, 14)
});

const quoteSchema = z.object({
  casa: text(40).transform((value) => value.toLocaleLowerCase('es-AR')),
  nombre: text(80),
  compra: optionalNumber,
  venta: optionalNumber,
  actualizado: isoDateTime
});

const dolarSchema = serviceBlock.extend({
  cotizaciones: lenientArray(quoteSchema, 20),
  brecha_blue_pct: optionalNumber
});

const feriadosSchema = serviceBlock.extend({
  proximos: lenientArray(z.object({ fecha: isoDate, nombre: text(200), tipo: optionalText(60) }), 60)
});

const paymentSchema = z.object({
  fecha: isoDate,
  dia: optionalText(20),
  concepto: text(300),
  organismos: lenientArray(z.object({ banco: text(160), items: lenientArray(text(300), 40) }), 30),
  url: optionalExternalUrl
});

const pagosSchema = serviceBlock.extend({
  hoy: lenientArray(paymentSchema, 60),
  proximos: lenientArray(paymentSchema, 120)
});

const QUAKE_STATES = { 'automático': 'automatico', automatico: 'automatico', revisado: 'revisado', sentido: 'sentido' } as const;

const quakeSchema = z.object({
  id: z.union([text(80), finite.transform(String)]),
  fecha: isoDateTime,
  magnitud: finite.min(0).max(10),
  profundidad_km: optionalNumber,
  lugar: text(240),
  estado: text(20).transform((value, ctx) => {
    const state = QUAKE_STATES[value.toLocaleLowerCase('es-AR') as keyof typeof QUAKE_STATES];
    if (!state) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'estado de sismo desconocido' });
      return z.NEVER;
    }
    return state;
  })
});

const sismosSchema = serviceBlock.extend({
  ultimos_7_dias: lenientArray(quakeSchema, 200)
});

const cutSchema = z.object({
  servicio: text(20)
    .transform((value) => value.toLocaleLowerCase('es-AR'))
    .pipe(z.enum(['luz', 'agua', 'rutas'])),
  titulo: text(300),
  zona: optionalText(200),
  url: externalUrl,
  publicado: isoDateTime
});

const cortesSchema = serviceBlock.extend({
  avisos: lenientArray(cutSchema, 100)
});

export const serviciosSchema = feedBase.extend({
  clima: optionalPart(climaSchema),
  alerta: optionalPart(weatherAlertSchema),
  dolar: optionalPart(dolarSchema),
  feriados: optionalPart(feriadosSchema),
  pagos: optionalPart(pagosSchema),
  sismos: optionalPart(sismosSchema),
  cortes: optionalPart(cortesSchema)
});

/* ─── videos.json ─────────────────────────────────────── */

const videoSchema = z.object({
  titulo: text(300),
  publicado: isoDateTime,
  origen: text(10)
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(['nota', 'x'])),
  instagram: z.object({
    url: z.unknown().transform((value, ctx) => {
      const link = toInstagramLink(value);
      if (!link) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL de Instagram inválida' });
        return z.NEVER;
      }
      return link;
    }),
    miniatura: z.unknown().transform((value) => toInstagramThumbnail(value)),
    tipo: optionalText(20)
  }),
  url_nota: optionalNewsUrl,
  fuente_video: optionalExternalUrl
});

export const videosSchema = feedBase.extend({
  items: lenientArray(videoSchema, 100)
});

/* ─── Types ───────────────────────────────────────────── */

export type UltimoMomentoFeed = z.output<typeof ultimoMomentoSchema>;
export type UrgentNoteEntry = NonNullable<UltimoMomentoFeed['nota']>;
export type WeatherAlert = z.output<typeof weatherAlertSchema>;
export type ActualizacionesFeed = z.output<typeof actualizacionesSchema>;
export type UpdateItem = ActualizacionesFeed['items'][number];
export type HistoriasFeed = z.output<typeof historiasSchema>;
export type StoryItem = HistoriasFeed['items'][number];
export type MasVistoFeed = z.output<typeof masVistoSchema>;
export type TrendingItem = MasVistoFeed['ventanas']['24h'][number];
export type ServiciosFeed = z.output<typeof serviciosSchema>;
export type ClimaBlock = NonNullable<ServiciosFeed['clima']>;
export type DolarBlock = NonNullable<ServiciosFeed['dolar']>;
export type Quote = DolarBlock['cotizaciones'][number];
export type FeriadosBlock = NonNullable<ServiciosFeed['feriados']>;
export type PagosBlock = NonNullable<ServiciosFeed['pagos']>;
export type Payment = PagosBlock['hoy'][number];
export type SismosBlock = NonNullable<ServiciosFeed['sismos']>;
export type Quake = SismosBlock['ultimos_7_dias'][number];
export type CortesBlock = NonNullable<ServiciosFeed['cortes']>;
export type Cut = CortesBlock['avisos'][number];
export type VideosFeed = z.output<typeof videosSchema>;
export type VideoItem = VideosFeed['items'][number];

export type FeedName = 'ultimo-momento' | 'actualizaciones' | 'historias' | 'mas-visto' | 'servicios' | 'videos';
