/**
 * Behavior checks for the feed integration, against the isolated previews
 * only (never production):
 *   node scripts/editorial-preview.mjs 3101              # feed fixtures
 *   node scripts/editorial-preview.mjs 3102 --no-feeds   # every feed 404
 *   node scripts/feed-behavior-qa.mjs [feedsOrigin] [absentOrigin]
 * Instagram is never contacted: its CDN and embed.js are answered locally.
 * Requires PLAYWRIGHT_CORE (and optionally CHROMIUM_PATH), as the density QA.
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const feeds = process.argv[2] || 'http://127.0.0.1:3101';
const absent = process.argv[3] || 'http://127.0.0.1:3102';
for (const origin of [feeds, absent]) {
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Solo se prueba la vista aislada local.');
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const photo = await readFile(new URL('./fixtures/images/photo-2.jpg', import.meta.url));
const FAKE_EMBED = 'window.instgrm={Embeds:{process(){document.querySelectorAll("blockquote.instagram-media").forEach(q=>{const f=document.createElement("iframe");f.title="Instagram";f.style.cssText="width:100%;height:420px;border:0";q.replaceWith(f);});}}};';
const checks = [];
const errors = [];
const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });

async function open(origin, route, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...options.context });
  const requests = [];
  context.on('request', (request) => requests.push(request.url()));
  await context.route(/cdninstagram\.com|fbcdn\.net/, (route) => (options.thumbs === 'fail' ? route.fulfill({ status: 403, body: '' }) : route.fulfill({ status: 200, contentType: 'image/jpeg', body: photo })));
  await context.route(/instagram\.com\/embed\.js/, (route) => (options.embed === 'fail' ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ status: 200, contentType: 'text/javascript', body: options.embed === 'silent' ? 'window.instgrm={Embeds:{process(){}}};' : FAKE_EMBED })));
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`${route}: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(`${route}: ${message.text()}`);
  });
  if (options.clock) await page.clock.install({ time: options.clock });
  await page.goto(origin + route, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.cookie-consent{display:none!important}' });
  return { context, page, requests };
}

const fixtureNow = async () => JSON.parse(await (await fetch(`${feeds}/qa-feed/ultimo-momento.json`)).text());

/* ─── Último momento ─── */
{
  const urgent = await fixtureNow();
  const urgentPath = new URL(urgent.nota.url).pathname;
  const { context, page } = await open(feeds, '/');
  const home = await page.evaluate(() => ({
    pinned: document.querySelector('.breaking-pinned')?.getAttribute('href'),
    tickerLinks: [...document.querySelectorAll('.breaking-items:not([aria-hidden]) a')].map((a) => a.getAttribute('href')),
    bars: document.querySelectorAll('.breaking-bar').length,
    strip: !!document.querySelector('.urgent-strip'),
    leadHref: document.querySelector('.hero-lead a.post-title, .hero-lead .post-title a')?.getAttribute('href')
  }));
  check('portada: la nota urgente queda fija en el ticker existente, sin una segunda franja', home.pinned === urgentPath && home.bars === 1 && !home.strip, home);
  check('portada: la nota fijada no se repite en el ticker ni es la principal', !home.tickerLinks.includes(urgentPath) && home.leadHref !== urgentPath, home);
  const focus = await page.evaluate(() => getComputedStyle(document.querySelector('.breaking-pinned')).animationName);
  check('ticker: la nota fijada no se mueve', focus === 'none', { focus });
  await context.close();

  const other = await open(feeds, '/noticias/noticia-de-prueba-8');
  const strip = await other.page.evaluate(() => document.querySelector('.urgent-strip-link')?.getAttribute('href'));
  check('otra nota: muestra el último momento con enlace a la nota urgente', strip === urgentPath, { strip });
  await other.context.close();

  for (const variant of [urgentPath, `${urgentPath}/`, urgentPath.toUpperCase().replace('/NOTICIAS/', '/noticias/')]) {
    const own = await open(feeds, variant);
    const present = await own.page.evaluate(() => !!document.querySelector('.urgent-strip'));
    const finalPath = new URL(own.page.url()).pathname;
    check(`su propia nota (${variant}): no se anuncia a sí misma`, !present || finalPath.toLowerCase() !== urgentPath, { present, finalPath });
    await own.context.close();
  }
}

/* ─── Alertas ─── */
{
  const { context, page } = await open(feeds, '/noticias/noticia-de-prueba-8');
  const band = await page.evaluate(() => {
    const el = document.querySelector('.weather-alert');
    return el && { count: document.querySelectorAll('.weather-alert').length, text: el.querySelector('.weather-alert-line').textContent, level: el.className, label: getComputedStyle(el.querySelector('.weather-alert-label')).backgroundColor, expanded: el.querySelector('.weather-alert-toggle').getAttribute('aria-expanded'), detailHidden: el.querySelector('.weather-alert-detail').hidden };
  });
  check('alerta: una sola banda aunque llegue en dos feeds, texto derivado del feed', band && band.count === 1 && /^Alerta naranja por viento · Vinchina y General Lamadrid · Vigente hasta las \d{2}:\d{2}/.test(band.text), band);
  check('alerta naranja: color #F07C00 con texto oscuro', band && band.label === 'rgb(240, 124, 0)', band);
  const toggle = page.locator('.weather-alert-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  const opened = await page.evaluate(() => ({ expanded: document.querySelector('.weather-alert-toggle').getAttribute('aria-expanded'), hidden: document.querySelector('.weather-alert-detail').hidden, controls: document.getElementById(document.querySelector('.weather-alert-toggle').getAttribute('aria-controls')) !== null }));
  check('alerta: el detalle se expande con teclado (aria-expanded, aria-controls)', band && band.expanded === 'false' && band.detailHidden && opened.expanded === 'true' && !opened.hidden && opened.controls, opened);
  await context.close();

  const services = await open(feeds, '/servicios');
  const servicesBand = await services.page.evaluate(() => ({ band: !!document.querySelector('.weather-alert'), section: document.querySelectorAll('#alertas .alert-card').length }));
  check('/servicios: la alerta aparece completa en su sección y no repetida en la banda', !servicesBand.band && servicesBand.section === 1, servicesBand);
  await services.context.close();

  // The page stays open past the alert's end: it must leave the page.
  const urgent = await fixtureNow();
  const hideAt = Math.min(Date.parse(urgent.alerta.vence), Date.parse(urgent.actualizado) + 3 * 3600_000);
  const timed = await open(feeds, '/noticias/noticia-de-prueba-8', { clock: Date.now() });
  const before = await timed.page.evaluate(() => !!document.querySelector('.weather-alert'));
  await timed.page.clock.fastForward(hideAt - Date.now() + 2000);
  await timed.page.waitForTimeout(100);
  const after = await timed.page.evaluate(() => !!document.querySelector('.weather-alert'));
  check('alerta: desaparece al vencer con la página abierta', before && !after, { before, after, hideAt: new Date(hideAt).toISOString() });
  await timed.context.close();
}

/* ─── Actualizaciones y cronologías ─── */
{
  const original = await open(feeds, '/noticias/noticia-de-prueba-30');
  const notice = await original.page.evaluate(() => {
    const el = document.querySelector('.update-notice');
    return el && { href: el.querySelector('a').getAttribute('href'), text: el.textContent, count: document.querySelectorAll('.update-notice').length, inHeader: !!el.closest('.article-header') };
  });
  check('actualización: la original enlaza a la más reciente (nota → actualiza)', notice && notice.href === '/noticias/noticia-de-prueba-2' && /Imputaron a los cinco detenidos/.test(notice.text) && notice.count === 1 && notice.inHeader, notice);
  await original.context.close();
  for (const [route, why] of [['/noticias/noticia-de-prueba-2', 'la propia actualización'], ['/noticias/noticia-de-prueba-12', 'autorreferencia'], ['/noticias/noticia-de-prueba-4', 'relación invertida'], ['/noticias/noticia-de-prueba-8', 'sin datos']]) {
    const { context, page } = await open(feeds, route);
    const present = await page.evaluate(() => !!document.querySelector('.update-notice'));
    check(`actualización: sin aviso en ${why}`, !present, { route });
    await context.close();
  }

  const event = await open(feeds, '/noticias/noticia-de-prueba-16');
  const timeline = await event.page.evaluate(() => {
    const items = [...document.querySelectorAll('.story-timeline-item')];
    return {
      count: items.length,
      times: items.map((item) => item.querySelector('time').getAttribute('datetime')),
      current: items.filter((item) => item.querySelector('[aria-current="page"]')).length,
      novedades: items.map((item) => item.querySelector('.story-timeline-news')?.textContent || null),
      links: items.map((item) => item.querySelector('a')?.getAttribute('href') || null),
      context: !!document.querySelector('.context-note-box')
    };
  });
  const ordered = timeline.times.every((time, index, list) => index === 0 || Date.parse(list[index - 1]) <= Date.parse(time));
  check('cronología event:: orden antigua → reciente, nota actual incluida y marcada', timeline.count >= 3 && ordered && timeline.current === 1, timeline);
  check('cronología: sin duplicados ni notas de otro hecho, novedad del feed', new Set(timeline.links).size === timeline.links.length && !timeline.links.includes('/noticias/noticia-de-prueba-61') && timeline.novedades.some(Boolean), timeline);
  check('cronología y "En contexto" no conviven', !timeline.context, timeline);
  await event.context.close();
  const legacy = await open(feeds, '/noticias/noticia-de-prueba-12');
  check('clave story:: sin cronología', !(await legacy.page.evaluate(() => !!document.querySelector('.story-timeline-box'))));
  await legacy.context.close();
}

/* ─── Instagram: videos y ranking ─── */
{
  const { context, page, requests } = await open(feeds, '/');
  const layout = await page.evaluate(() => {
    const band = document.querySelector('.videos-band');
    const strip = document.querySelector('.services-strip');
    const latest = document.querySelector('.home-latest');
    return {
      title: band?.querySelector('h2')?.textContent,
      noInstagramTitle: ![...document.querySelectorAll('h2')].some((h) => h.textContent.trim() === 'En Instagram'),
      afterStrip: !!(band && strip && strip.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING),
      beforeLatest: !!(band && latest && band.compareDocumentPosition(latest) & Node.DOCUMENT_POSITION_FOLLOWING),
      cards: band?.querySelectorAll('.video-card').length,
      dark: band ? getComputedStyle(band).backgroundColor : null
    };
  });
  check('portada: la banda se llama "Videos" y va justo después de servicios, antes de Últimas noticias', layout.title === 'Videos' && layout.noInstagramTitle && layout.afterStrip && layout.beforeLatest && layout.cards === 5 && layout.dark === 'rgb(17, 24, 39)', layout);

  const ranking = page.locator('.ranking-tabs');
  await ranking.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => ({
    title: document.querySelector('.ranking-tabs h2')?.textContent,
    tabs: [...document.querySelectorAll('.ranking-tablist [role="tab"]')].map((tab) => [tab.textContent, tab.getAttribute('aria-selected')]),
    siteVisible: !!document.querySelector('.ranking-panel:not([hidden]) .rank-list')
  }));
  await page.getByRole('tab', { name: 'Más leídas' }).focus();
  await page.keyboard.press('ArrowRight');
  const state = await page.evaluate(() => {
    const panel = document.querySelector('.ranking-panel:not([hidden])');
    return {
      selected: document.querySelector('.ranking-tablist [aria-selected="true"]')?.textContent,
      note: panel?.querySelector('.trending-note')?.textContent,
      items: panel?.querySelectorAll('.trending [role="tabpanel"]:not([hidden]) li').length,
      // Reach figures of the fixture (11701, 30500…) must never reach the reader.
      numbers: ['11701', '11.701', '8020', '5400', '30500', '20100', '15000'].some((figure) => (panel?.textContent || '').includes(figure))
    };
  });
  check('ranking: "Más leídas" y "En Instagram" como pestañas separadas por fuente', before.title === 'Lo más visto' && before.siteVisible && before.tabs[0][0] === 'Más leídas' && before.tabs[0][1] === 'true' && before.tabs[1][0] === 'En Instagram', before);
  check('Instagram: se nombra la fuente, sin cifras de alcance, hasta cinco notas (flechas)', state.selected === 'En Instagram' && /alcance/.test(state.note) && state.items === 5 && !state.numbers, state);
  await page.locator('.ranking-panel:not([hidden])').getByRole('tab', { name: 'Hoy' }).focus();
  await page.keyboard.press('ArrowRight');
  const period = await page.evaluate(() => ({ selected: document.querySelector('.trending-tabs [aria-selected="true"]')?.textContent, visible: [...document.querySelectorAll('.trending [role="tabpanel"]')].filter((panel) => !panel.hidden).length }));
  check('pestañas Hoy/Semana dentro de Instagram: flechas y un solo panel visible', period.selected === 'Semana' && period.visible === 1, period);

  check('videos: ningún script de Instagram antes de abrir un video', !requests.some((url) => url.includes('instagram.com/embed.js')));
  await page.locator('.videos-band .video-card-media').nth(1).click();
  await page.waitForSelector('.video-dialog iframe', { timeout: 5000 }).catch(() => null);
  const dialog = await page.evaluate(() => ({ open: document.querySelector('.video-dialog')?.open, iframe: !!document.querySelector('.video-dialog iframe'), links: [...document.querySelectorAll('.video-dialog-links a')].map((a) => a.textContent) }));
  check('videos: el reproductor se carga al abrir, con enlace a Instagram y a la noticia', dialog.open && dialog.iframe && dialog.links.includes('Ver en Instagram') && dialog.links.includes('Leé la noticia'), dialog);
  await page.keyboard.press('Escape');
  await page.locator('.videos-band .video-card-media').nth(2).click();
  await page.waitForTimeout(400);
  check('videos: embed.js se pide una sola vez', requests.filter((url) => url.includes('instagram.com/embed.js')).length === 1, { count: requests.filter((url) => url.includes('instagram.com/embed.js')).length });
  const credit = await page.evaluate(() => [...document.querySelectorAll('.video-card-meta a')].map((a) => [a.textContent, a.getAttribute('href')]));
  check('videos de X: crédito «Video: X» con su enlace original', credit.some(([label, href]) => label === 'Video: X' && href.startsWith('https://x.com/')), credit);
  await context.close();

  // Inside the story the video belongs to: player in place, no dialog.
  const own = await open(feeds, '/noticias/noticia-de-prueba-3');
  const inArticle = await own.page.evaluate(() => {
    const feature = document.querySelector('.article-main .video-feature.is-article');
    return { present: !!feature, inBody: !!feature?.closest('.article-main'), permalink: feature?.querySelector('a[href*="instagram.com"]')?.getAttribute('href'), rail: document.querySelectorAll('.article-videos .video-card').length };
  });
  await own.page.locator('.video-feature.is-article .video-feature-play').click();
  await own.page.waitForSelector('.video-feature.is-article iframe', { timeout: 5000 }).catch(() => null);
  const played = await own.page.evaluate(() => ({ iframe: !!document.querySelector('.video-feature.is-article iframe'), dialog: !!document.querySelector('.video-dialog') }));
  check('nota con video propio: bloque dentro del cuerpo y reproductor en el lugar', inArticle.present && inArticle.inBody && inArticle.permalink === 'https://www.instagram.com/p/De2pKcEjffC/' && played.iframe && !played.dialog, { inArticle, played });
  check('nota: carril "Videos" con otros videos, sin repetir el propio', inArticle.rail === 4 && !(await own.page.evaluate(() => [...document.querySelectorAll('.article-videos a[href*="instagram"]')].some((a) => a.href.includes('De2pKcEjffC')))), inArticle);
  await own.context.close();
  const plain = await open(feeds, '/noticias/noticia-de-prueba-8');
  const plainState = await plain.page.evaluate(() => ({ feature: !!document.querySelector('.video-feature'), rail: document.querySelectorAll('.article-videos .video-card').length }));
  check('nota sin video propio: sin bloque, con carril de videos', !plainState.feature && plainState.rail === 4, plainState);
  await plain.context.close();

  const page2 = await open(feeds, '/videos');
  const hero = await page2.page.evaluate(() => ({ featured: document.querySelector('.videos-hero .video-feature.is-featured .video-feature-title')?.textContent, grid: document.querySelectorAll('.videos-more .video-card').length, h1: document.querySelector('h1')?.textContent }));
  check('/videos: el último video encabeza la página y el resto va en la grilla', hero.h1 === 'Videos' && hero.featured === 'Un perrito se vuelve viral por ayudar con el mate' && hero.grid === 5, hero);
  await page2.context.close();

  const broken = await open(feeds, '/videos', { thumbs: 'fail', embed: 'fail' });
  const fallbacks = await broken.page.evaluate(() => ({ cards: document.querySelectorAll('.video-card, .video-feature').length, fallback: document.querySelectorAll('.video-thumb-fallback').length, imgs: document.querySelectorAll('.video-card img, .video-feature img').length }));
  check('miniaturas vencidas: panel neutro, sin imagen rota', fallbacks.cards > 0 && fallbacks.fallback === fallbacks.cards && fallbacks.imgs === 0, fallbacks);
  await broken.page.locator('.video-card-media').first().click();
  await broken.page.waitForSelector('.instagram-embed.is-failed', { timeout: 5000 }).catch(() => null);
  const failed = await broken.page.evaluate(() => document.querySelector('.instagram-embed-status')?.textContent || '');
  check('embed bloqueado: la tarjeta sigue útil con enlace a Instagram', /Miralo en Instagram/.test(failed), { failed });
  await broken.context.close();

  const silent = await open(feeds, '/videos', { embed: 'silent' });
  await silent.page.locator('.video-feature-play').click();
  await silent.page.waitForSelector('.instagram-embed.is-failed', { timeout: 12000 }).catch(() => null);
  check('publicación que no se puede incrustar: aviso y enlace tras la espera', await silent.page.evaluate(() => !!document.querySelector('.instagram-embed.is-failed')));
  await silent.context.close();
}

/* ─── Categorías ─── */
{
  const politics = await open(feeds, '/categoria/politica');
  const side = await politics.page.evaluate(() => ({ trends: document.querySelectorAll('.trending-section li').length, mostRead: document.querySelectorAll('.rank-list li').length, title: document.querySelector('.trending-section h2')?.textContent }));
  check('categoría con tendencias: Instagram aparte de "Más leídas" (6)', side.trends === 3 && side.mostRead === 6 && side.title === 'Tendencias en Instagram', side);
  await politics.context.close();
  const interior = await open(feeds, '/categoria/interior');
  const empty = await interior.page.evaluate(() => ({ trends: !!document.querySelector('.trending-section'), mostRead: document.querySelectorAll('.rank-list li').length }));
  check('categoría sin tendencias: sin hueco, "Más leídas" completa', !empty.trends && empty.mostRead === 10, empty);
  await interior.context.close();
}

/* ─── Feeds ausentes ─── */
for (const route of ['/', '/noticias/noticia-de-prueba-16', '/noticias/noticia-de-prueba-30', '/categoria/politica', '/servicios', '/videos']) {
  const { context, page } = await open(absent, route);
  const state = await page.evaluate(() => ({
    status: document.title,
    // The CMS timeline does not depend on the feeds; only the feed's novedad does.
    modules: ['.site-notices', '.services-strip', '.videos-band', '.video-feature', '.article-videos', '.ranking-tabs', '.update-notice', '.story-timeline-news', '.trending', '.breaking-pinned'].filter((selector) => document.querySelector(selector)),
    cmsTimeline: document.querySelectorAll('.story-timeline-item').length,
    news: document.querySelectorAll('.post-card, .article-title').length,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  }));
  const pageOk = route === '/servicios' ? await page.evaluate(() => !!document.querySelector('#clima, .service-empty')) : route === '/videos' ? await page.evaluate(() => !!document.querySelector('.videos-empty a[href*="instagram.com"]')) : state.news > 0;
  check(`sin feeds ${route}: funciona y no reserva espacio`, !state.modules.length && pageOk && !state.overflow, state);
  await context.close();
}

/* ─── Responsive ─── */
for (const width of [360, 390, 768, 1024, 1280, 1440]) {
  for (const route of ['/', '/servicios', '/videos', '/noticias/noticia-de-prueba-16', '/categoria/politica']) {
    const { context, page } = await open(feeds, route, { context: { viewport: { width, height: 800 } } });
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      tiny: [...document.querySelectorAll('.site-notices *, .services-strip *, .videos-band *, .video-feature *, .article-videos *, .ranking-tabs *, .service-page *, .videos-page *, .update-notice *, .story-timeline-box *, .trending-section *')]
        .filter((el) => [...el.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()) && el.getBoundingClientRect().height > 0 && parseFloat(getComputedStyle(el).fontSize) < 11)
        .map((el) => el.className)
        .slice(0, 4)
    }));
    check(`${width}px ${route}: sin scroll horizontal ni textos < 11 px`, !state.overflow && !state.tiny.length, state);
    await context.close();
  }
}

await browser.close();
const result = { feeds, absent, checks, errors };
await mkdir('docs/qa/feeds', { recursive: true });
await writeFile('docs/qa/feeds/behavior.json', JSON.stringify(result, null, 2));
for (const c of checks) console.log(c.ok ? 'OK  ' : 'FAIL', c.name, c.ok ? '' : JSON.stringify(c.detail));
console.log(`${checks.filter((c) => c.ok).length}/${checks.length}`);
console.log(errors.length ? `Errores de consola: ${errors.join(' | ')}` : 'Sin errores de consola ni de hidratación');
