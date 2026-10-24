/**
 * Behavior checks for the feed integration, against the isolated previews
 * only (never production):
 *   node scripts/editorial-preview.mjs 3101              # feed fixtures
 *   node scripts/editorial-preview.mjs 3102 --no-feeds   # every feed 404
 *   node scripts/feed-behavior-qa.mjs [feedsOrigin] [absentOrigin]
 * Instagram is never contacted: its CDN (thumbnails, mp4) and embed page are answered locally.
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
const reel = await readFile(new URL('./fixtures/images/vertical.mp4', import.meta.url));
// Stand-in for Instagram's embed page: it posts the same MEASURE message the real one does.
const EMBED_PAGE = (post) => `<!doctype html><title>Instagram</title><body style="margin:0;background:#fafafa">embed ${post}<script>parent.postMessage(JSON.stringify({details:{},type:'LOADING'}),'*');parent.postMessage(JSON.stringify({details:{height:640},type:'MEASURE'}),'*');</script></body>`;
const checks = [];
const errors = [];
const cspViolations = [];
const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });

/**
 * Instagram is never contacted. Options:
 *   thumbs: 'fail'                       thumbnails answer 403 (expired signature)
 *   mp4: 'fail'                          the signed mp4 answers 403 (expired on an open page)
 *   embed: 'fail' | 'silent' | 'hang'    the embed page is blocked, answers without messages, or never answers
 */
async function open(origin, route, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...options.context });
  const requests = [];
  context.on('request', (request) => requests.push(request.url()));
  await context.route(/cdninstagram\.com|fbcdn\.net/, (r) => {
    if (/\.mp4(\?|$)/.test(r.request().url())) {
      return options.mp4 === 'fail' ? r.fulfill({ status: 403, body: '' }) : r.fulfill({ status: 200, contentType: 'video/mp4', body: reel, headers: { 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' } });
    }
    return options.thumbs === 'fail' ? r.fulfill({ status: 403, body: '' }) : r.fulfill({ status: 200, contentType: 'image/jpeg', body: photo });
  });
  await context.route(/^https:\/\/www\.instagram\.com\//, (r) => {
    const url = r.request().url();
    if (!/\/embed\/$/.test(url)) return r.fulfill({ status: 204, body: '' });
    if (options.embed === 'fail') return r.abort('blockedbyclient');
    if (options.embed === 'hang') return undefined;
    return r.fulfill({ status: 200, contentType: 'text/html', body: options.embed === 'silent' ? '<!doctype html><p>Esta publicación no está disponible</p>' : EMBED_PAGE(url) });
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`${route}: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (/Content Security Policy|Refused to (load|frame|connect|execute)/i.test(text)) cspViolations.push(`${route}: ${text.slice(0, 200)}`);
    else if (message.type() === 'error' && !/Failed to load resource/.test(text)) errors.push(`${route}: ${text}`);
  });
  if (options.clock) await page.clock.install({ time: options.clock });
  const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.cookie-consent{display:none!important}' });
  return { context, page, requests, csp: response?.headers()['content-security-policy'] || '' };
}

const fixtureNow = async () => JSON.parse(await (await fetch(`${feeds}/qa-feed/ultimo-momento.json`)).text());

/* ─── Último momento ─── */
{
  const urgent = await fixtureNow();
  const urgentPath = new URL(urgent.nota.url).pathname;
  const { context, page } = await open(feeds, '/');
  const home = await page.evaluate(() => {
    const li = document.querySelector('.breaking-items:not([aria-hidden]) li:first-child');
    return {
      first: li && { urgent: li.classList.contains('is-urgent'), href: li.querySelector('a').getAttribute('href') },
      tickerLinks: [...document.querySelectorAll('.breaking-items:not([aria-hidden]) a')].map((a) => a.getAttribute('href')),
      bars: document.querySelectorAll('.breaking-bar').length,
      strip: !!document.querySelector('.urgent-strip'),
      leadHref: document.querySelector('.hero-lead a.post-title, .hero-lead .post-title a')?.getAttribute('href')
    };
  });
  check('portada: la nota urgente abre el ticker, marcada, sin una segunda franja', home.first?.urgent && home.first.href === urgentPath && home.bars === 1 && !home.strip, home);
  check('portada: la nota urgente aparece una sola vez en el ticker y no es la principal', home.tickerLinks.filter((href) => href === urgentPath).length === 1 && home.leadHref !== urgentPath, home);
  const moving = async (target) => target.evaluate(async () => {
    const track = document.querySelector('.breaking-track');
    const x = () => new DOMMatrix(getComputedStyle(track).transform).m41;
    const start = x();
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { name: getComputedStyle(track).animationName, moved: Math.abs(x() - start), duration: getComputedStyle(track.parentElement).getPropertyValue('--ticker-duration') };
  });
  const desktopMove = await moving(page);
  check('ticker: se desplaza en escritorio a velocidad medida', desktopMove.name === 'ticker' && desktopMove.moved > 5, desktopMove);
  await page.locator('.ticker-toggle').click();
  const pausedMove = await moving(page);
  check('ticker: el botón lo pausa', pausedMove.moved < 1, pausedMove);
  await context.close();

  const phone = await open(feeds, '/', { context: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } });
  await phone.page.locator('.breaking-ticker').tap().catch(() => {});
  await phone.page.goto(feeds + '/', { waitUntil: 'networkidle' });
  const phoneMove = await moving(phone.page);
  check('ticker: también se mueve en el teléfono, con la urgente incluida', phoneMove.name === 'ticker' && phoneMove.moved > 5, phoneMove);
  await phone.context.close();

  const other = await open(feeds, '/noticias/noticia-de-prueba-8');
  const outside = await other.page.evaluate(() => ({ strip: !!document.querySelector('.urgent-strip'), alert: !!document.querySelector('.weather-alert'), notices: !!document.querySelector('.site-notices') }));
  check('otra nota: sin franja de último momento ni alerta (solo en la portada)', !outside.strip && !outside.alert && !outside.notices, outside);
  await other.context.close();
}

/* ─── Alertas ─── */
{
  const { context, page } = await open(feeds, '/');
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
  const timed = await open(feeds, '/', { clock: Date.now() });
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

  // Our own CMS videos (/qa/*.mp4 in the preview) may preload in their cards: only Instagram's count here.
  const isInstagramPlayback = (url) => /(cdninstagram\.com|fbcdn\.net)\/.+\.mp4(\?|$)/.test(url) || /instagram\.com\/(p|reel|tv)\/[^/]+\/embed\//.test(url) || /instagram\.com\/embed\.js/.test(url);
  check('videos: ni mp4 ni reproductor de Instagram se piden antes de reproducir', !requests.some(isInstagramPlayback), requests.filter(isInstagramPlayback));
  await page.locator('.videos-band .video-card-media').nth(1).click();
  await page.waitForSelector('.video-dialog iframe', { timeout: 5000 }).catch(() => null);
  await page.waitForFunction(() => document.querySelector('.video-dialog iframe')?.style.height === '640px', null, { timeout: 5000 }).catch(() => null);
  const dialog = await page.evaluate(() => ({
    open: document.querySelector('.video-dialog')?.open,
    iframe: document.querySelector('.video-dialog iframe')?.getAttribute('src'),
    height: document.querySelector('.video-dialog iframe')?.style.height,
    links: [...document.querySelectorAll('.video-dialog-links a')].map((a) => a.textContent),
    privacy: document.querySelector('.video-dialog-privacy')?.textContent
  }));
  check('sin mp4: iframe directo de Instagram, alto según su mensaje MEASURE', dialog.open && /^https:\/\/www\.instagram\.com\/reel\/C0ffeeVid01\/embed\/$/.test(dialog.iframe) && dialog.height === '640px' && dialog.links.includes('Ver en Instagram') && dialog.links.includes('Leé la noticia'), dialog);
  check('texto de privacidad del reproductor', dialog.privacy === 'El video se reproduce desde los servidores de Instagram (Meta) y se carga solo cuando lo reproducís.', dialog);
  await page.keyboard.press('Escape');
  check('embed.js nunca se pide', !requests.some((url) => url.includes('instagram.com/embed.js')));
  const credit = await page.evaluate(() => [...document.querySelectorAll('.video-card-meta a')].map((a) => [a.textContent, a.getAttribute('href')]));
  check('videos de X: crédito «Video: X» con su enlace original', credit.some(([label, href]) => label === 'Video: X' && href.startsWith('https://x.com/')), credit);
  await context.close();

  // Level 1: the signed mp4 in a native <video>, inside the story it belongs to.
  const own = await open(feeds, '/noticias/noticia-de-prueba-3');
  const inArticle = await own.page.evaluate(() => {
    const feature = document.querySelector('.article-main .video-feature.is-article');
    return { present: !!feature, permalink: feature?.querySelector('a[href*="instagram.com"]')?.getAttribute('href'), rail: document.querySelectorAll('.article-videos .video-card').length };
  });
  await own.page.locator('.video-feature.is-article .video-feature-play').click();
  await own.page.waitForFunction(() => (document.querySelector('.video-feature.is-article video')?.readyState || 0) >= 1, null, { timeout: 8000 }).catch(() => null);
  const played = await own.page.evaluate(() => {
    const video = document.querySelector('.video-feature.is-article video');
    return {
      video: !!video,
      src: video?.getAttribute('src'),
      ready: video?.readyState,
      controls: video?.controls,
      crossorigin: video?.hasAttribute('crossorigin'),
      ratio: video?.parentElement?.style.aspectRatio,
      iframe: !!document.querySelector('.video-feature.is-article iframe'),
      dialog: !!document.querySelector('.video-dialog')
    };
  });
  check('nota con video propio: bloque dentro del cuerpo', inArticle.present && inArticle.permalink === 'https://www.instagram.com/p/De2pKcEjffC/', inArticle);
  check('nivel 1: el mp4 firmado se reproduce en <video> nativo, 9:16, sin iframe ni diálogo', played.video && /fbcdn\.net\/.+\.mp4\?/.test(played.src) && played.ready >= 1 && played.controls && !played.crossorigin && /0\.56|9 \/ 16|360 \/ 640/.test(played.ratio || '') && !played.iframe && !played.dialog, played);
  check('nota: carril "Videos" con otros videos, sin repetir el propio', inArticle.rail === 4 && !(await own.page.evaluate(() => [...document.querySelectorAll('.article-videos a[href*="instagram"]')].some((a) => a.href.includes('De2pKcEjffC')))), inArticle);
  await own.context.close();

  // Level 1 → 2: the signature expired while the page was open (the CDN answers 403).
  const expired = await open(feeds, '/noticias/noticia-de-prueba-3', { mp4: 'fail' });
  await expired.page.locator('.video-feature.is-article .video-feature-play').click();
  await expired.page.waitForSelector('.video-feature.is-article iframe', { timeout: 8000 }).catch(() => null);
  const fallback = await expired.page.evaluate(() => ({ video: !!document.querySelector('.video-feature.is-article video'), iframe: document.querySelector('.video-feature.is-article iframe')?.getAttribute('src') }));
  check('nivel 2: mp4 vencido → iframe oficial del mismo post', !fallback.video && fallback.iframe === 'https://www.instagram.com/p/De2pKcEjffC/embed/', fallback);
  await expired.context.close();

  const plain = await open(feeds, '/noticias/noticia-de-prueba-8');
  const plainState = await plain.page.evaluate(() => ({ feature: !!document.querySelector('.video-feature'), rail: document.querySelectorAll('.article-videos .video-card').length }));
  check('nota sin video propio: sin bloque, con carril de videos', !plainState.feature && plainState.rail === 4, plainState);
  await plain.context.close();

  const page2 = await open(feeds, '/videos');
  const hero = await page2.page.evaluate(() => ({ featured: document.querySelector('.videos-hero .video-feature.is-featured .video-feature-title')?.textContent, grid: document.querySelectorAll('.videos-more .video-card').length, h1: document.querySelector('h1')?.textContent }));
  check('/videos: el último video encabeza la página y el resto va en la grilla', hero.h1 === 'Videos' && hero.featured === 'Un perrito se vuelve viral por ayudar con el mate' && hero.grid === 5, hero);
  const policy = page2.csp;
  const directive = (name) => policy.split('; ').find((part) => part.startsWith(`${name} `)) || '';
  check('CSP servida: Instagram en img-src, media-src y frame-src; no en script-src', /\*\.fbcdn\.net/.test(directive('img-src')) && /\*\.cdninstagram\.com/.test(directive('media-src')) && /www\.instagram\.com/.test(directive('frame-src')) && !/instagram|fbcdn/.test(directive('script-src')), { img: directive('img-src'), media: directive('media-src'), frame: directive('frame-src'), script: directive('script-src') });
  await page2.context.close();

  const broken = await open(feeds, '/videos', { thumbs: 'fail', mp4: 'fail', embed: 'fail' });
  const fallbacks = await broken.page.evaluate(() => ({ cards: document.querySelectorAll('.video-card, .video-feature').length, fallback: document.querySelectorAll('.video-thumb-fallback').length, imgs: document.querySelectorAll('.video-card img, .video-feature img').length }));
  check('miniaturas vencidas: panel neutro, sin imagen rota', fallbacks.cards > 0 && fallbacks.fallback === fallbacks.cards && fallbacks.imgs === 0, fallbacks);
  // Instagram blocked (as with DevTools request blocking): the iframe still fires load, but no message arrives.
  await broken.page.locator('.video-feature-play').click();
  await broken.page.waitForSelector('.instagram-player-status', { timeout: 14000 }).catch(() => null);
  const failed = await broken.page.evaluate(() => ({ text: document.querySelector('.instagram-player-status')?.textContent || '', href: document.querySelector('.instagram-player-status a')?.getAttribute('href') }));
  check('nivel 3: Instagram bloqueado → mensaje con enlace al post', /No se pudo mostrar el video/.test(failed.text) && failed.href === 'https://www.instagram.com/p/De2pKcEjffC/', failed);
  await broken.context.close();

  const silent = await open(feeds, '/videos', { mp4: 'fail', embed: 'silent' });
  await silent.page.locator('.video-feature-play').click();
  await silent.page.waitForSelector('.instagram-player-status', { timeout: 14000 }).catch(() => null);
  check('nivel 3: publicación que no se puede incrustar → mensaje tras la espera', await silent.page.evaluate(() => /Miralo en Instagram/.test(document.querySelector('.instagram-player-status')?.textContent || '')));
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
    modules: ['.site-notices', '.services-strip', '.videos-band', '.video-feature', '.article-videos', '.ranking-tabs', '.update-notice', '.story-timeline-news', '.trending'].filter((selector) => document.querySelector(selector)),
    // Service cards may only show the weather, which falls back to Open-Meteo as the header does.
    cards: [...document.querySelectorAll('.svc-card')].map((card) => card.querySelector('.svc-card-label')?.textContent),
    cmsTimeline: document.querySelectorAll('.story-timeline-item').length,
    news: document.querySelectorAll('.post-card, .article-title').length,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  }));
  const pageOk = route === '/servicios' ? await page.evaluate(() => !!document.querySelector('#clima, .service-empty')) : route === '/videos' ? await page.evaluate(() => !!document.querySelector('.videos-empty a[href*="instagram.com"]')) : state.news > 0;
  check(`sin feeds ${route}: funciona y no reserva espacio`, !state.modules.length && state.cards.every((label) => label === 'Clima en La Rioja') && pageOk && !state.overflow, state);
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

check('ninguna violación de CSP en la consola', !cspViolations.length, cspViolations.slice(0, 5));

await browser.close();
const result = { feeds, absent, checks, errors, cspViolations };
await mkdir('docs/qa/feeds', { recursive: true });
await writeFile('docs/qa/feeds/behavior.json', JSON.stringify(result, null, 2));
for (const c of checks) console.log(c.ok ? 'OK  ' : 'FAIL', c.name, c.ok ? '' : JSON.stringify(c.detail));
console.log(`${checks.filter((c) => c.ok).length}/${checks.length}`);
console.log(errors.length ? `Errores de consola: ${errors.join(' | ')}` : 'Sin errores de consola ni de hidratación');
