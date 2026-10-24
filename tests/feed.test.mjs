// node --test tests/feed.test.mjs — feed loading, validation and editorial
// selection with fixed clocks. No database, no network: fetch is a fake.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTs, fixturePath, readFixture } from './helpers/load-ts.mjs';

const core = await loadTs('lib/feed-core.ts');
const types = await loadTs('lib/feed-types.ts');
const select = await loadTs('lib/feed-select.ts');
const urls = await loadTs('lib/feed-url.ts');
const archive = await loadTs('components/news/ArchiveContextNote.tsx');

const NOW = new Date('2026-10-23T16:30:00-03:00');
const at = (iso) => new Date(iso);
const HOUR = 3600_000;
const DAY = 24 * HOUR;

const fixtures = {
  urgent: await readFixture('valid', 'ultimo-momento.json'),
  services: await readFixture('valid', 'servicios.json'),
  updates: await readFixture('valid', 'actualizaciones.json'),
  stories: await readFixture('valid', 'historias.json'),
  trending: await readFixture('valid', 'mas-visto.json'),
  videos: await readFixture('valid', 'videos.json')
};
const parse = (schema, value) => {
  const result = schema.safeParse(value);
  assert.ok(result.success, result.success ? '' : JSON.stringify(result.error.issues[0]));
  return result.data;
};

/* ─── Loader ─────────────────────────────────────────── */

function fakeFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return handler(url, init, calls.length);
  };
  return { fetchImpl, calls };
}
const jsonResponse = (body, status = 200) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const client = (handler, extra = {}) => {
  const fake = fakeFetch(handler);
  const logs = [];
  let clock = NOW.getTime();
  const instance = core.createFeedClient({ baseUrl: 'https://feeds.test/feed/v1/', fetchImpl: fake.fetchImpl, now: () => clock, log: (m) => logs.push(m), memoMs: 0, ...extra });
  return { ...instance, calls: fake.calls, logs, advance: (ms) => (clock += ms) };
};

describe('loader', () => {
  test('valid feed: requests base/name.json with revalidate 300 and a signal', async () => {
    const c = client(() => jsonResponse(fixtures.urgent));
    const data = await c.load('ultimo-momento', types.ultimoMomentoSchema, 6 * HOUR);
    assert.equal(data.nota.url.slug, 'noticia-de-prueba-20');
    assert.equal(c.calls[0].url, 'https://feeds.test/feed/v1/ultimo-momento.json');
    assert.equal(c.calls[0].init.next.revalidate, 300);
    assert.ok(c.calls[0].init.signal);
  });

  for (const [name, handler] of [
    ['404', () => new Response('<html>not found</html>', { status: 404 })],
    ['500', () => new Response('error', { status: 500 })],
    ['invalid JSON', async () => jsonResponse(await readFile(fixturePath('invalid', 'truncated.json'), 'utf8'))],
    ['incompatible version', async () => jsonResponse(await readFixture('invalid', 'version-2.json'))],
    ['version as string', async () => jsonResponse(await readFixture('invalid', 'version-string.json'))],
    ['missing actualizado', async () => jsonResponse(await readFixture('invalid', 'missing-actualizado.json'))],
    ['invalid date', async () => jsonResponse(await readFixture('invalid', 'bad-date.json'))],
    ['date without offset', async () => jsonResponse(await readFixture('invalid', 'date-without-offset.json'))],
    ['network error', () => Promise.reject(new TypeError('fetch failed'))]
  ]) {
    test(`${name}: null, never an exception`, async () => {
      const c = client(handler);
      assert.equal(await c.load('videos', types.videosSchema, 14 * DAY), null);
      assert.equal(c.logs.length, 1);
    });
  }

  test('timeout: aborts after timeoutMs and returns null', async () => {
    const c = client((url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))), { timeoutMs: 30 });
    const started = Date.now();
    assert.equal(await c.load('servicios', types.serviciosSchema, 2 * DAY), null);
    assert.ok(Date.now() - started < 1000);
    assert.equal(c.lastFailure('servicios'), 'timeout');
  });

  test('stale feed: valid file older than its maximum age is not current', async () => {
    const c = client(async () => jsonResponse(await readFixture('invalid', 'stale-ultimo-momento.json')));
    assert.equal(await c.load('ultimo-momento', types.ultimoMomentoSchema, 6 * HOUR), null);
  });

  test('a feed dated in the future is not trusted', async () => {
    const c = client(() => jsonResponse({ ...fixtures.videos, actualizado: '2026-10-24T16:00:00-03:00' }));
    assert.equal(await c.load('videos', types.videosSchema, 14 * DAY), null);
    assert.equal(c.lastFailure('videos'), 'future');
  });

  test('failure falls back to the last valid copy only while it is within the maximum age', async () => {
    let fail = false;
    const c = client(() => (fail ? new Response('down', { status: 500 }) : jsonResponse(fixtures.videos)), { backoffMs: 0 });
    assert.ok(await c.load('videos', types.videosSchema, 2 * HOUR));
    fail = true;
    assert.ok(await c.load('videos', types.videosSchema, 2 * HOUR), 'last valid copy');
    c.advance(2 * HOUR);
    assert.equal(await c.load('videos', types.videosSchema, 2 * HOUR), null, 'too old to stand in');
  });

  test('backoff: a failing feed is not requested again for a minute', async () => {
    const c = client(() => new Response('down', { status: 503 }));
    await c.load('videos', types.videosSchema, DAY);
    await c.load('videos', types.videosSchema, DAY);
    assert.equal(c.calls.length, 1);
    c.advance(61_000);
    await c.load('videos', types.videosSchema, DAY);
    assert.equal(c.calls.length, 2);
  });

  test('concurrent renders share one request', async () => {
    const c = client(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return jsonResponse(fixtures.trending);
    });
    const results = await Promise.all([1, 2, 3].map(() => c.load('mas-visto', types.masVistoSchema, 3 * DAY)));
    assert.equal(c.calls.length, 1);
    assert.ok(results.every((r) => r === results[0]));
  });

  test('base URL: default, trailing slash and dangerous protocols', () => {
    assert.equal(core.normalizeFeedBaseUrl(undefined), 'https://media.lavozriojana.com/feed/v1');
    assert.equal(core.normalizeFeedBaseUrl('https://x.test/feed/v1///'), 'https://x.test/feed/v1');
    assert.equal(core.normalizeFeedBaseUrl('javascript:alert(1)'), 'https://media.lavozriojana.com/feed/v1');
  });
});

/* ─── Validation ─────────────────────────────────────── */

describe('validation', () => {
  test('URLs: own stories become a slug; other hosts and protocols are rejected', () => {
    assert.deepEqual(urls.toNewsLink('https://www.lavozriojana.com/noticias/Una-Nota/?utm=1#x'), { slug: 'una-nota', path: '/noticias/una-nota' });
    assert.equal(urls.toNewsLink('https://lavozriojana.com.evil.test/noticias/x'), null);
    assert.equal(urls.toNewsLink('https://lavozriojana.com/categoria/x'), null);
    assert.equal(urls.toNewsLink('https://user:pass@lavozriojana.com/noticias/x'), null);
    assert.equal(urls.toNewsLink('javascript:alert(1)'), null);
    assert.equal(urls.safeExternalUrl('data:text/html,hi'), null);
    assert.equal(urls.safeExternalUrl('https://www.anses.gob.ar/'), 'https://www.anses.gob.ar/');
  });

  test('Instagram: only post and Reel permalinks; thumbnails only from its CDN over https', () => {
    assert.equal(urls.toInstagramLink('https://instagram.com/reels/AbCdE123/?igsh=1').url, 'https://www.instagram.com/reel/AbCdE123/');
    assert.equal(urls.toInstagramLink('https://www.instagram.com/lavozriojana.ok/'), null);
    assert.equal(urls.toInstagramLink('http://www.instagram.com/p/AbCdE123/'), null);
    assert.ok(urls.toInstagramThumbnail('https://scontent-eze1-1.cdninstagram.com/v/a.jpg'));
    assert.equal(urls.toInstagramThumbnail('https://cdninstagram.com.evil.test/a.jpg'), null);
    assert.equal(urls.toInstagramThumbnail('http://scontent.cdninstagram.com/a.jpg'), null);
  });

  test('a broken block or item is dropped without rejecting the feed', async () => {
    const data = parse(types.ultimoMomentoSchema, await readFixture('invalid', 'broken-parts.json'));
    assert.equal(data.nota, null);
    assert.equal(data.alerta, null);
    const services = parse(types.serviciosSchema, fixtures.services);
    assert.equal(services.cortes.avisos.length, 4, 'gas and javascript: notices dropped');
    assert.equal(services.sismos.ultimos_7_dias.length, 5, 'unknown state dropped');
    assert.equal(services.clima.pronostico.length, 5, '2026-02-30 dropped');
    assert.equal(services.pagos.hoy[1].url, null, 'dangerous optional URL becomes null');
  });

  test('numbers: zero is a value, strings and missing values are null', () => {
    const services = parse(types.serviciosSchema, fixtures.services);
    const mayorista = services.dolar.cotizaciones.find((q) => q.casa === 'mayorista');
    assert.equal(mayorista.compra, 0);
    assert.equal(mayorista.venta, null);
    assert.equal(services.dolar.cotizaciones.find((q) => q.casa === 'cripto').compra, null);
    assert.equal(services.clima.pronostico.find((d) => d.fecha === '2026-10-25').min, 0);
  });

  test('empty arrays validate and select nothing', async () => {
    const videos = parse(types.videosSchema, await readFixture('invalid', 'empty-items.json'));
    assert.deepEqual(select.selectVideos(videos, NOW), []);
  });

  test('history keys other than event: are dropped by the schema', () => {
    const stories = parse(types.historiasSchema, fixtures.stories);
    assert.deepEqual(stories.items.map((s) => s.storyKey), ['event:3f2a-ruta-75', 'event:9b1c-otro-hecho']);
    assert.equal(select.isEventStoryKey('story:historia-de-prueba'), false);
    assert.equal(select.isEventStoryKey('event:3f2a'), true);
    assert.equal(select.isEventStoryKey('EVENT:3f2a'), false);
    assert.equal(select.isEventStoryKey(null), false);
  });

  test('text is plain: HTML is kept as characters for React to escape, never parsed', () => {
    const data = parse(types.videosSchema, { version: 1, actualizado: '2026-10-23T16:00:00-03:00', items: [{ ...fixtures.videos.items[0], titulo: '<img src=x onerror=alert(1)>\n Título' }] });
    assert.equal(data.items[0].titulo, '<img src=x onerror=alert(1)> Título');
  });

  test('"En contexto" links from metadata: internal or http(s) only', () => {
    const entries = archive.parseArchiveContext({
      archiveContext: [
        { title: 'Interna', snippet: 'a', url: '/noticias/x' },
        { title: 'Externa', snippet: 'b', url: 'https://example.com' },
        { title: 'Peligrosa', snippet: 'c', url: 'javascript:alert(1)' },
        { title: 'Protocolo relativo', snippet: 'd', url: '//evil.test' }
      ]
    });
    assert.deepEqual(entries.map((e) => e.url), ['/noticias/x', 'https://example.com/', undefined, undefined]);
  });
});

/* ─── Último momento y alertas ───────────────────────── */

describe('urgent story', () => {
  const feed = parse(types.ultimoMomentoSchema, fixtures.urgent);

  test('active story', () => {
    assert.deepEqual(select.selectUrgentNote(feed, NOW), { title: feed.nota.titulo, slug: 'noticia-de-prueba-20', path: '/noticias/noticia-de-prueba-20', activado: feed.nota.activado });
  });
  test('not vigente, feed not refreshed for 3 h, or activated 12 h ago: nothing', () => {
    assert.equal(select.selectUrgentNote({ ...feed, nota: { ...feed.nota, vigente: false } }, NOW), null);
    assert.equal(select.selectUrgentNote(feed, at('2026-10-23T19:10:00-03:00')), null);
    assert.equal(select.selectUrgentNote({ ...feed, actualizado: '2026-10-24T05:00:00-03:00' }, at('2026-10-24T05:10:00-03:00')), null);
    assert.equal(select.selectUrgentNote({ ...feed, nota: null }, NOW), null);
  });
});

describe('weather alerts', () => {
  const urgent = parse(types.ultimoMomentoSchema, fixtures.urgent);
  const services = parse(types.serviciosSchema, fixtures.services);
  const candidates = (alertaA = urgent.alerta, alertaB = services.alerta, feedA = urgent.actualizado, feedB = services.actualizado) => [
    { alerta: alertaA, feedActualizado: feedA },
    { alerta: alertaB, feedActualizado: feedB }
  ];

  test('same alert in both feeds is shown once, with text derived from the feed', () => {
    const alerts = select.selectActiveAlerts(candidates(), NOW);
    assert.equal(alerts.length, 1);
    const [alert] = alerts;
    assert.equal(alert.label, 'Alerta naranja');
    assert.equal(`${alert.headline} · ${select.formatZones(alert.zones)} · ${alert.until}`, 'Alerta naranja por viento · Vinchina y General Lamadrid · Vigente hasta las 02:59 del sábado 24');
    assert.equal(alert.sourceShort, 'SMN');
    assert.equal(alert.updated, urgent.alerta.actualizado, 'the most recently updated copy wins');
    assert.equal(alert.hideAt, Math.min(Date.parse(urgent.alerta.vence), Date.parse(urgent.actualizado) + 3 * HOUR));
  });

  test('same-day expiry reads "hasta las HH:MM"; aviso a muy corto plazo reads "Aviso"', () => {
    const aviso = { ...urgent.alerta, tipo: 'aviso a muy corto plazo', nivel: 'amarilla', vence: '2026-10-23T18:45:30-03:00' };
    const [alert] = select.selectActiveAlerts(candidates(aviso, null), NOW);
    assert.equal(alert.headline, 'Aviso amarilla por viento');
    assert.equal(alert.until, 'Vigente hasta las 18:45');
  });

  test('expired, not active, stale feed or old alert record: not shown', () => {
    assert.deepEqual(select.selectActiveAlerts(candidates(), at('2026-10-24T03:00:00-03:00')), []);
    assert.deepEqual(select.selectActiveAlerts(candidates({ ...urgent.alerta, estado: 'finalizada' }, null), NOW), []);
    assert.deepEqual(select.selectActiveAlerts(candidates(urgent.alerta, null, '2026-10-23T12:00:00-03:00'), NOW), []);
    assert.deepEqual(select.selectActiveAlerts(candidates({ ...urgent.alerta, actualizado: '2026-10-22T10:00:00-03:00' }, null), NOW), []);
    assert.deepEqual(select.selectActiveAlerts(candidates(null, null), NOW), []);
  });

  test('most severe first; different alerts are all kept', () => {
    const red = { ...urgent.alerta, nivel: 'roja', fenomeno: 'tormentas', zonas: ['Capital'] };
    const alerts = select.selectActiveAlerts(candidates(urgent.alerta, red), NOW);
    assert.deepEqual(alerts.map((a) => a.level), ['roja', 'naranja']);
  });

  test('levels and types outside the contract invalidate the alert', () => {
    assert.equal(types.weatherAlertSchema.safeParse({ ...fixtures.urgent.alerta, nivel: 'verde' }).success, false);
    assert.equal(types.weatherAlertSchema.safeParse({ ...fixtures.urgent.alerta, tipo: 'pronóstico' }).success, false);
    assert.equal(types.weatherAlertSchema.safeParse({ ...fixtures.urgent.alerta, nivel: 'Roja' }).success, true);
  });

  test('zones list', () => {
    assert.equal(select.formatZones(['A']), 'A');
    assert.equal(select.formatZones(['A', 'B', 'C']), 'A, B y C');
    assert.equal(select.formatZones(['A', 'B', 'C', 'D', 'E']), 'A, B y 3 zonas más');
  });
});

/* ─── Actualizaciones ────────────────────────────────── */

describe('updates', () => {
  const feed = parse(types.actualizacionesSchema, fixtures.updates);
  const published = new Map([
    ['noticia-de-prueba-10', { title: 'Primera', publishedAt: at('2026-10-22T06:00:00-03:00') }],
    ['noticia-de-prueba-2', { title: 'Segunda', publishedAt: at('2026-10-22T14:00:00-03:00') }],
    ['noticia-de-prueba-3', { title: 'Encadenada', publishedAt: at('2026-10-22T13:00:00-03:00') }],
    ['noticia-de-prueba-50', { title: 'Vieja', publishedAt: at('2026-10-20T16:00:00-03:00') }]
  ]);

  test('the original links forward (nota → actualiza), following chains', () => {
    const candidates = select.selectUpdateCandidates(feed, 'noticia-de-prueba-30');
    assert.deepEqual(candidates.map((c) => c.slug).sort(), ['noticia-de-prueba-10', 'noticia-de-prueba-2', 'noticia-de-prueba-3']);
    assert.deepEqual(select.selectUpdateCandidates(feed, 'noticia-de-prueba-2'), [], 'the update itself gets no notice');
  });

  test('several updates: the most recent by CMS publication date, not array order', () => {
    const latest = select.pickLatestUpdate(select.selectUpdateCandidates(feed, 'noticia-de-prueba-30'), published, at('2026-10-21T13:00:00-03:00'));
    assert.equal(latest.slug, 'noticia-de-prueba-2');
    assert.equal(latest.novedad, 'Imputaron a los cinco detenidos');
    assert.equal(latest.path, '/noticias/noticia-de-prueba-2');
  });

  test('self links, inverted relations and unpublished stories give no notice', () => {
    assert.deepEqual(select.selectUpdateCandidates(feed, 'noticia-de-prueba-12'), []);
    const inverted = select.selectUpdateCandidates(feed, 'noticia-de-prueba-4');
    assert.equal(select.pickLatestUpdate(inverted, published, at('2026-10-22T14:00:00-03:00')), null);
    assert.equal(select.pickLatestUpdate(select.selectUpdateCandidates(feed, 'noticia-de-prueba-30'), new Map(), null), null);
  });

  test('cycles do not loop', () => {
    const cyclic = parse(types.actualizacionesSchema, {
      version: 1,
      actualizado: '2026-10-23T16:00:00-03:00',
      items: [
        { nota: { titulo: 'a', url: 'https://lavozriojana.com/noticias/a' }, actualiza: { titulo: 'b', url: 'https://lavozriojana.com/noticias/b' }, novedad: null },
        { nota: { titulo: 'b', url: 'https://lavozriojana.com/noticias/b' }, actualiza: { titulo: 'a', url: 'https://lavozriojana.com/noticias/a' }, novedad: null }
      ]
    });
    assert.deepEqual(select.selectUpdateCandidates(cyclic, 'a').map((c) => c.slug), ['b']);
  });
});

/* ─── Cronologías ────────────────────────────────────── */

describe('story timeline', () => {
  const feed = parse(types.historiasSchema, fixtures.stories);
  const key = 'event:3f2a-ruta-75';
  const post = (slug, iso, storyKey = key, title = slug) => ({ slug, title, excerpt: null, publishedAt: iso ? at(iso) : null, storyKey });
  const current = post('noticia-de-prueba-16', '2026-10-22T00:00:00-03:00');
  const sameKey = [post('noticia-de-prueba-27', '2026-10-21T13:00:00-03:00'), post('noticia-de-prueba-5', '2026-10-22T11:00:00-03:00')];
  const feedPosts = new Map([
    ['noticia-de-prueba-27', sameKey[0]],
    ['noticia-de-prueba-5', sameKey[1]],
    ['noticia-de-prueba-40', post('noticia-de-prueba-40', '2026-10-20T00:00:00-03:00', null)],
    ['noticia-de-prueba-61', post('noticia-de-prueba-61', '2026-10-19T00:00:00-03:00', 'event:otro')]
  ]);
  const build = (overrides = {}) =>
    select.buildStoryTimeline({ storyKey: key, current, sameKey, feedStory: select.findVerifiedStory(feed, key, current.slug), feedPosts, ...overrides });

  test('event: key: oldest first, current included and marked, feed novedad attached', () => {
    const entries = build();
    assert.deepEqual(entries.map((e) => e.slug), ['noticia-de-prueba-40', 'noticia-de-prueba-27', 'noticia-de-prueba-16', 'noticia-de-prueba-5']);
    assert.deepEqual(entries.filter((e) => e.current).map((e) => e.slug), ['noticia-de-prueba-16']);
    assert.equal(entries[1].novedad, 'Vecinos denunciaron el deterioro del tramo');
    assert.equal(entries[2].novedad, null, 'an empty novedad is not shown');
  });

  test('no duplicates, no story from another event, nothing the CMS does not publish', () => {
    const slugs = build().map((e) => e.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    assert.ok(!slugs.includes('noticia-de-prueba-61'));
    assert.ok(!slugs.includes('nota-que-no-existe'));
  });

  test('story: and missing keys never build a timeline', () => {
    assert.deepEqual(build({ storyKey: 'story:historia-de-prueba' }), []);
    assert.deepEqual(build({ storyKey: null }), []);
  });

  test('the feed is used only when its record includes the current story', () => {
    assert.equal(select.findVerifiedStory(feed, 'event:9b1c-otro-hecho', current.slug), null);
    assert.equal(select.findVerifiedStory(feed, key, 'noticia-de-prueba-99'), null);
  });

  test('two stories, the current one included, are enough', () => {
    const entries = select.buildStoryTimeline({ storyKey: key, current, sameKey: [sameKey[0]], feedStory: null, feedPosts: new Map() });
    assert.equal(entries.length, 2);
    assert.deepEqual(select.buildStoryTimeline({ storyKey: key, current, sameKey: [], feedStory: null, feedPosts: new Map() }), []);
  });
});

/* ─── Lo más visto en Instagram ──────────────────────── */

describe('trending on Instagram', () => {
  const feed = parse(types.masVistoSchema, fixtures.trending);

  test('ranked by reach, not file order; duplicates and other sites removed', () => {
    const { day, week } = select.selectTrending(feed, 5);
    assert.deepEqual(day.map((e) => e.slug), ['noticia-de-prueba-3', 'noticia-de-prueba-6', 'noticia-de-prueba-8', 'nota-que-no-existe', 'noticia-de-prueba-9']);
    assert.equal(week.length, 5);
    assert.ok(!day.some((e) => e.title === 'URL de otro sitio'));
  });

  test('only shown when the metric is Instagram; it is never relabelled as visits', () => {
    assert.equal(select.selectTrending({ ...feed, metrica: 'visitas a la web' }), null);
    assert.equal(select.selectTrending({ ...feed, metrica: null }), null);
  });

  test('sections: empty or unknown sections give nothing; invalid keys are dropped', () => {
    assert.deepEqual(select.selectSectionTrending(feed, 'politica').map((e) => e.slug), ['noticia-de-prueba-23', 'noticia-de-prueba-1', 'noticia-de-prueba-45']);
    assert.deepEqual(select.selectSectionTrending(feed, 'interior'), []);
    assert.deepEqual(select.selectSectionTrending(feed, 'deportes'), []);
    assert.equal(Object.keys(feed.por_seccion_7d).includes('Clave Inválida'), false);
  });
});

/* ─── Servicios ──────────────────────────────────────── */

describe('services', () => {
  const services = parse(types.serviciosSchema, fixtures.services);

  test('weather: observation 1.5 h old is current; forecast from today in La Rioja', () => {
    const view = select.selectWeather(services.clima, NOW);
    assert.equal(view.now.temperatura, 27.4);
    assert.equal(view.now.age.aging, false);
    assert.deepEqual(view.forecast.map((d) => d.fecha), ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26']);
    assert.deepEqual(view.today, { min: 14, max: 30 });
    assert.equal(select.formatDegrees(0), '0°');
  });

  test('weather: labelled after 3 h, current conditions dropped after 12 h', () => {
    assert.equal(select.selectWeather(services.clima, at('2026-10-23T19:30:00-03:00')).now.age.aging, true);
    assert.equal(select.selectWeather(services.clima, at('2026-10-24T04:00:00-03:00')).now, null);
  });

  test('dollar: Oficial and Blue first, exact values, zero kept, empty and old quotes dropped', () => {
    const view = select.selectDollar(services.dolar, NOW);
    assert.deepEqual(view.quotes.map((q) => q.casa), ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'mayorista']);
    assert.equal(select.formatArs(view.quotes[0].venta), '$ 1.490,00');
    assert.equal(select.formatArs(1550), '$ 1.550,00');
    assert.equal(view.quotes.find((q) => q.casa === 'mayorista').compra, 0);
    assert.equal(view.quotes.find((q) => q.casa === 'contadoconliqui').age.aging, true, '5.5 h old');
    assert.equal(view.gap, 4.03);
    assert.equal(select.selectDollar({ ...services.dolar, cotizaciones: services.dolar.cotizaciones.filter((q) => q.casa !== 'blue') }, NOW).gap, null);
  });

  test('holidays: calendar dates in La Rioja, past ones excluded, duplicates removed', () => {
    const holidays = select.selectHolidays(services.feriados, NOW);
    assert.deepEqual(holidays.map((h) => [h.fecha, h.daysLeft]), [['2026-10-24', 1], ['2026-11-23', 31], ['2026-12-08', 46]]);
    // 23:30 in La Rioja is already the 24th in UTC: still the 23rd here.
    assert.equal(select.selectHolidays(services.feriados, at('2026-10-23T23:30:00-03:00'))[0].daysLeft, 1);
    assert.equal(select.selectHolidays(services.feriados, at('2026-10-24T00:10:00-03:00'))[0].daysLeft, 0);
    assert.equal(select.daysLeftLabel(0), 'Hoy');
  });

  test('payments: today by each date, not by the array; yesterday is dropped', () => {
    const view = select.selectPayments(services.pagos, NOW);
    assert.deepEqual(view.today.map((p) => p.fecha), ['2026-10-23']);
    assert.deepEqual(view.upcoming.map((p) => p.fecha), ['2026-10-26', '2026-10-27']);
    const nextDay = select.selectPayments(services.pagos, at('2026-10-26T09:00:00-03:00'));
    assert.deepEqual(nextDay.today.map((p) => p.concepto), ['Asignaciones de prueba, documentos terminados en 5']);
    assert.equal(select.selectPayments(services.pagos, at('2026-12-01T09:00:00-03:00')), null, 'block too old');
  });

  test('quakes: last 7 days, newest first, no duplicates, automatic marked preliminary', () => {
    const view = select.selectQuakes(services.sismos, NOW);
    assert.deepEqual(view.items.map((q) => q.id), ['prueba-1', 'prueba-2', 'prueba-3']);
    assert.equal(select.QUAKE_STATE_LABELS[view.items[1].estado], 'Dato automático, preliminar');
    assert.equal(select.isNotableQuake(view.items[0], NOW), true);
    assert.equal(select.isNotableQuake(view.items[1], NOW), false);
  });

  test('cuts: notices of the last 72 h only, newest first', () => {
    const view = select.selectCuts(services.cortes, NOW);
    assert.deepEqual(view.items.map((c) => c.servicio), ['luz', 'rutas', 'agua']);
    assert.equal(select.selectCuts(services.cortes, at('2026-10-27T09:00:00-03:00')), null);
  });

  test('home summary: relevance order, four items, only fresh data', () => {
    const items = select.selectServicesSummary(
      {
        weather: { temperatura: 27.4, cielo: 'parcialmente nublado' },
        today: { min: 14, max: 30 },
        dollar: select.selectDollar(services.dolar, NOW),
        payments: select.selectPayments(services.pagos, NOW),
        holidays: select.selectHolidays(services.feriados, NOW),
        quakes: select.selectQuakes(services.sismos, NOW),
        cuts: select.selectCuts(services.cortes, NOW)
      },
      NOW
    );
    assert.deepEqual(items.map((i) => i.key), ['clima', 'pagos', 'cortes', 'sismo']);
    assert.equal(items[0].value, '27,4° · parcialmente nublado');
    const quiet = select.selectServicesSummary({ weather: null, today: null, dollar: select.selectDollar(services.dolar, NOW), payments: null, holidays: select.selectHolidays(services.feriados, NOW), quakes: null, cuts: null }, NOW);
    assert.deepEqual(quiet.map((i) => i.value), ['Oficial $ 1.490,00', 'sáb 24 oct · Feriado de prueba de mañana']);
    assert.deepEqual(select.selectServicesSummary({ weather: null, today: null, dollar: null, payments: null, holidays: [], quakes: null, cuts: null }, NOW), []);
  });

  test('age labels', () => {
    assert.equal(select.formatAge('2026-10-23T11:30:00-03:00', NOW), 'hace 5 h');
    assert.equal(select.formatUpdated('2026-10-23T16:00:00-03:00', NOW), 'hoy, 16:00');
    assert.equal(select.formatUpdated('2026-10-22T09:05:00-03:00', NOW), '22 oct, 09:05');
  });
});

/* ─── Videos ─────────────────────────────────────────── */

describe('videos', () => {
  const feed = parse(types.videosSchema, fixtures.videos);

  test('valid items only, newest first, one per post, nothing from the future', () => {
    const videos = select.selectVideos(feed, NOW);
    // The first one is a real public post of @lavozriojana.ok, used to preview the real embed.
    assert.deepEqual(videos.map((v) => v.instagram.url.shortcode), ['De2pKcEjffC', 'C0ffeeVid01', 'C0ffeeVid02', 'C0ffeeVid03', 'C0ffeeVid04', 'C0ffeeVid05']);
  });

  test('links and credits: normalized permalink, invalid thumbnail and source become null', () => {
    const byCode = Object.fromEntries(select.selectVideos(feed, NOW).map((v) => [v.instagram.url.shortcode, v]));
    const [first, fromX, otherThumb, badSource] = ['C0ffeeVid01', 'C0ffeeVid02', 'C0ffeeVid03', 'C0ffeeVid04'].map((code) => byCode[code]);
    assert.equal(first.url_nota.path, '/noticias/noticia-de-prueba-2');
    assert.equal(fromX.instagram.url.url, 'https://www.instagram.com/reel/C0ffeeVid02/');
    assert.equal(fromX.origen, 'x');
    assert.equal(fromX.fuente_video, 'https://x.com/usuario_de_prueba/status/1234567890');
    assert.equal(otherThumb.instagram.miniatura, null);
    assert.equal(badSource.fuente_video, null);
  });
});

/* ─── Video de Instagram: mp4 firmado, embed y CSP ─────── */

const player = await loadTs('lib/instagram-player.ts');
const csp = await loadTs('lib/csp.ts');

describe('instagram video', () => {
  const base = fixtures.videos.items[0];
  const withInstagram = (instagram) => ({ version: 1, actualizado: '2026-10-23T15:30:00-03:00', items: [{ ...base, instagram: { ...base.instagram, ...instagram } }] });

  test('feed-types: a valid mp4 and its expiry are kept', () => {
    const [item] = parse(types.videosSchema, withInstagram({})).items;
    assert.match(item.instagram.video, /^https:\/\/instagram\.fsla2-1\.fna\.fbcdn\.net\/.+\.mp4\?/);
    assert.equal(item.instagram.video_vence, '2026-10-25T12:15:44-03:00');
  });

  test('feed-types: mp4 from another domain or invalid expiry is null, the entry stays', () => {
    const other = parse(types.videosSchema, withInstagram({ video: 'https://videos.example.com/reel.mp4' })).items;
    assert.equal(other.length, 1);
    assert.equal(other[0].instagram.video, null);
    const insecure = parse(types.videosSchema, withInstagram({ video: 'http://scontent.cdninstagram.com/reel.mp4' })).items;
    assert.equal(insecure[0].instagram.video, null);
    const badDate = parse(types.videosSchema, withInstagram({ video_vence: 'mañana' })).items;
    assert.equal(badDate.length, 1);
    assert.equal(badDate[0].instagram.video_vence, null);
    const missing = parse(types.videosSchema, withInstagram({ video: undefined, video_vence: undefined })).items;
    assert.equal(missing[0].instagram.video, null);
    assert.equal(missing[0].instagram.video_vence, null);
  });

  test('the mp4 is offered only if its signature lasts beyond 15 minutes', () => {
    const video = 'https://scontent.cdninstagram.com/v/reel.mp4?oe=1';
    const at = (minutes) => new Date(NOW.getTime() + minutes * 60_000).toISOString();
    assert.equal(select.selectVideoSource({ video, video_vence: at(10) }, NOW), null);
    assert.equal(select.selectVideoSource({ video, video_vence: at(30 * 60) }, NOW), video);
    assert.equal(select.selectVideoSource({ video, video_vence: null }, NOW), null, 'no expiry: not used');
    assert.equal(select.selectVideoSource({ video: null, video_vence: at(30 * 60) }, NOW), null);
  });

  test('embed URL for posts and Reels', () => {
    assert.equal(urls.instagramEmbedUrl(urls.toInstagramLink('https://www.instagram.com/p/De2pKcEjffC/')), 'https://www.instagram.com/p/De2pKcEjffC/embed/');
    assert.equal(urls.instagramEmbedUrl(urls.toInstagramLink('https://instagram.com/reels/DQxAbc123/?igsh=1')), 'https://www.instagram.com/reel/DQxAbc123/embed/');
  });

  test('player: mp4 first, iframe on error or without mp4, message on timeout', () => {
    assert.equal(player.initialStage('https://scontent.cdninstagram.com/v/reel.mp4'), 'video');
    assert.equal(player.initialStage(null), 'iframe');
    assert.equal(player.nextStage('video', 'video-error'), 'iframe');
    assert.equal(player.nextStage('iframe', 'iframe-timeout'), 'failed');
    assert.equal(player.nextStage('iframe', 'iframe-message'), 'iframe');
    assert.equal(player.nextStage('video', 'iframe-timeout'), 'video', 'a stale timer never hides a playing video');
    assert.equal(player.nextStage('failed', 'video-error'), 'failed');
    assert.equal(player.IFRAME_TIMEOUT_MS, 8000);
  });

  test('player: only messages from instagram.com count, MEASURE sets a bounded height', () => {
    assert.deepEqual(player.readEmbedMessage('https://www.instagram.com', '{"details":{"height":708},"type":"MEASURE"}'), { fromInstagram: true, height: 708 });
    assert.deepEqual(player.readEmbedMessage('https://www.instagram.com', '{"details":{},"type":"LOADING"}'), { fromInstagram: true, height: null });
    assert.deepEqual(player.readEmbedMessage('https://www.instagram.com', '{"details":{"height":99999},"type":"MEASURE"}'), { fromInstagram: true, height: 1200 });
    assert.deepEqual(player.readEmbedMessage('https://www.instagram.com', 'no es json'), { fromInstagram: true, height: null });
    assert.deepEqual(player.readEmbedMessage('https://evil.test', '{"details":{"height":700},"type":"MEASURE"}'), { fromInstagram: false, height: null });
  });

  test('CSP: Instagram in img-src, media-src and frame-src; never in script-src', () => {
    const policy = csp.buildContentSecurityPolicy({ isDev: false, mediaUrl: 'https://media.lavozriojana.com' });
    const directive = (name) => policy.split('; ').find((part) => part.startsWith(`${name} `)) || '';
    for (const name of ['img-src', 'media-src']) {
      assert.match(directive(name), /https:\/\/\*\.cdninstagram\.com/);
      assert.match(directive(name), /https:\/\/\*\.fbcdn\.net/);
    }
    assert.match(directive('media-src'), /^media-src 'self' blob: https:\/\/media\.lavozriojana\.com /, 'own CMS videos are allowed too');
    assert.match(directive('frame-src'), /https:\/\/www\.instagram\.com/);
    assert.doesNotMatch(directive('script-src'), /instagram|fbcdn/);
    assert.doesNotMatch(directive('script-src'), /unsafe-eval/, 'production keeps no unsafe-eval');
    // What was already there stays: Google tags and ads, default-src and framing rules.
    assert.match(policy, /^default-src 'self'; /);
    assert.match(directive('script-src'), /https:\/\/www\.googletagmanager\.com/);
    assert.match(directive('frame-src'), /https:\/\/googleads\.g\.doubleclick\.net/);
    assert.match(policy, /frame-ancestors 'self'; base-uri 'self'; form-action 'self'$/);
    assert.match(csp.buildContentSecurityPolicy({ isDev: true, mediaUrl: 'x' }), /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  });
});
