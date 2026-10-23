/**
 * Behaviour checks for the density pass, against the isolated preview only.
 *   node scripts/density-behavior-qa.mjs [origin]
 * Same requirements as density-visual-qa.mjs (PLAYWRIGHT_CORE, CHROMIUM_PATH).
 */
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const origin = process.argv[2] || 'http://127.0.0.1:3101';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Solo se mide la vista aislada local.');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); };
const errors = [];

async function open(options = {}, route = '/') {
  const context = await browser.newContext(options);
  // Instagram's CDN and scripts (feed thumbnails) are never contacted from QA.
  await context.route(/cdninstagram\.com|fbcdn\.net|instagram\.com/, route => route.fulfill({ status: 204, body: '' }));
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(origin + route, { waitUntil: 'networkidle' });
  return { context, page };
}

// Ticker: motion, hidden copy, pause, focus.
{
  const { context, page } = await open({ viewport: { width: 1280, height: 800 } });
  const t = await page.evaluate(() => {
    const bar = document.querySelector('.breaking-bar');
    const track = bar.querySelector('.breaking-track');
    const lists = bar.querySelectorAll('.breaking-items');
    return {
      animated: bar.classList.contains('is-animated'),
      animation: getComputedStyle(track).animationName,
      copies: lists.length,
      hiddenCopy: lists[1]?.getAttribute('aria-hidden'),
      // The feed's pinned story sits outside the moving lists: only they are duplicated.
      tabbable: [...bar.querySelectorAll('.breaking-items a')].filter(a => a.tabIndex >= 0).length,
      links: bar.querySelectorAll('.breaking-items a').length,
      duration: getComputedStyle(track).animationDuration
    };
  });
  check('ticker anima con contenido suficiente', t.animated && t.animation === 'ticker', t);
  check('ticker: copia oculta a lectores y fuera del tab', t.copies === 2 && t.hiddenCopy === 'true' && t.tabbable * 2 === t.links, t);
  const x = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.breaking-track')).transform).m41);
  const a = await x(); await page.waitForTimeout(600); const b = await x();
  check('ticker se desplaza', b < a, { a, b });
  await page.getByRole('button', { name: /Pausar titulares/ }).click();
  const c = await x(); await page.waitForTimeout(600); const d = await x();
  check('botón pausa detiene el ticker', Math.abs(c - d) < 0.5 && await page.getByRole('button', { name: /Reanudar titulares/ }).isVisible(), { c, d });
  await page.getByRole('button', { name: /Reanudar titulares/ }).click();
  await page.locator('.breaking-ticker').hover();
  const e = await x(); await page.waitForTimeout(500); const f = await x();
  check('hover pausa el ticker', Math.abs(e - f) < 0.5, { e, f });
  await page.mouse.move(5, 700);
  await page.locator('.breaking-items:not([aria-hidden]) a').first().focus();
  const focus = await page.evaluate(() => {
    const a = document.activeElement; const r = a.getBoundingClientRect(); const box = document.querySelector('.breaking-ticker').getBoundingClientRect();
    return { inTicker: !!a.closest('.breaking-ticker'), visible: r.left >= box.left - 1 && r.left < box.right, animation: getComputedStyle(document.querySelector('.breaking-track')).animationName };
  });
  check('foco de teclado: enlace visible y ticker detenido', focus.inTicker && focus.visible && focus.animation === 'none', focus);
  await context.close();
}
{
  const { context, page } = await open({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const r = await page.evaluate(() => ({
    animation: getComputedStyle(document.querySelector('.breaking-track')).animationName,
    copyDisplay: getComputedStyle(document.querySelector('.breaking-items[aria-hidden]')).display,
    toggle: getComputedStyle(document.querySelector('.ticker-toggle')).display
  }));
  check('movimiento reducido: ticker quieto, sin copia ni botón', r.animation === 'none' && r.copyDisplay === 'none' && r.toggle === 'none', r);
  await context.close();
}

// Header: compact on scroll, no content shift, restores at the top.
for (const width of [390, 1280]) {
  const { context, page } = await open({ viewport: { width, height: 800 } });
  const before = await page.evaluate(() => {
    const el = document.querySelector('.ahora-block, .home-latest');
    return { header: document.querySelector('.site-header').getBoundingClientRect().height, docTop: el.getBoundingClientRect().top + scrollY };
  });
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const el = document.querySelector('.ahora-block, .home-latest');
    return { header: document.querySelector('.site-header').getBoundingClientRect().height, docTop: el.getBoundingClientRect().top + scrollY, shrunk: document.querySelector('.site-header').classList.contains('is-shrunk') };
  });
  check(`cabecera ${width}: se compacta sin mover el contenido`, after.shrunk && after.header < before.header && Math.abs(after.docTop - before.docTop) < 1, { before, after });
  // Oscillate around the threshold: no toggling inside the hysteresis band.
  const states = [];
  for (const y of [60, 90, 60, 90, 40]) {
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(80);
    states.push(await page.evaluate(() => document.querySelector('.site-header').classList.contains('is-shrunk')));
  }
  check(`cabecera ${width}: histéresis estable`, states.every(s => s === states[0]), states);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
  const top = await page.evaluate(() => document.querySelector('.site-header').getBoundingClientRect().height);
  check(`cabecera ${width}: vuelve a su altura arriba`, Math.abs(top - before.header) < 1, { top, initial: before.header });
  if (width === 390) {
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Abrir buscador', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('type') === 'search');
    check('buscador operativo con la cabecera compacta', true);
    await page.keyboard.press('Escape');
    const menu = page.getByRole('button', { name: 'Menú de categorías', exact: true });
    await menu.click();
    const inDialog = await page.evaluate(() => !!document.activeElement?.closest('dialog'));
    await page.keyboard.press('Escape');
    check('menú operativo con la cabecera compacta', inDialog);
  }
  await context.close();
}

// Ahora on phones: five entries, the rest one tap away.
{
  const { context, page } = await open({ viewport: { width: 390, height: 844 } });
  const visible = () => page.evaluate(() => [...document.querySelectorAll('#ahora-list > *')].filter(el => getComputedStyle(el).display !== 'none').length);
  const first = await visible();
  const more = page.locator('.ahora-more');
  await more.click();
  const expanded = await visible();
  check('Ahora móvil: 5 visibles y despliega el resto', first === 5 && expanded > 5 && await more.getAttribute('aria-expanded') === 'true', { first, expanded });
  // Truncated headlines keep the full text in the link.
  const clamp = await page.evaluate(() => [...document.querySelectorAll('.post-title > a, a.post-title')].map(a => ({ clipped: a.scrollHeight > a.clientHeight + 1, text: a.textContent.length })).filter(x => x.clipped).length);
  check('titulares recortados conservan el texto completo en el DOM', clamp >= 0, { clipped: clamp });
  // Focus ring of a clamped link is not cut by its heading.
  await page.locator('.ahora-more').focus();
  for (let i = 0; i < 40 && !(await page.evaluate(() => !!document.activeElement?.matches('.post-title > a'))); i++) await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => { const a = document.activeElement; const s = getComputedStyle(a); return { outline: s.outlineStyle, parentOverflow: getComputedStyle(a.parentElement).overflow }; });
  check('foco visible en titulares recortados', ring.outline !== 'none' && ring.parentOverflow === 'visible', ring);
  await context.close();
}

// Equal heights of comparable cards and thumbnail alignment.
for (const width of [390, 1440]) {
  const { context, page } = await open({ viewport: { width, height: 900 } });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 30)); } });
  const m = await page.evaluate(() => {
    const spread = [...document.querySelectorAll('.editorial-grid, .lo-ultimo-list')].map(grid => {
      const rows = new Map();
      for (const k of grid.children) { const r = k.getBoundingClientRect(); if (!r.height) continue; const key = Math.round(r.top); rows.set(key, [...(rows.get(key) || []), r.height]); }
      return Math.max(0, ...[...rows.values()].filter(v => v.length > 1).map(v => Math.max(...v) - Math.min(...v)));
    });
    const misaligned = [...document.querySelectorAll('.post-card')].filter(card => {
      const media = card.querySelector(':scope > .post-media'); const body = card.querySelector(':scope > .post-body');
      if (!media || !body) return false;
      const a = media.getBoundingClientRect(), b = body.getBoundingClientRect();
      return Math.abs(a.top - b.top) > 1 && Math.abs(a.left - b.left) > 1 && b.top < a.top; // side by side: text must not start above the image
    }).length;
    const overlaps = [...document.querySelectorAll('.post-card, .lo-ultimo-item, .en-foco-item, .sidebar-hi-item')].filter((el, i, all) => {
      const r = el.getBoundingClientRect(); const next = all[i + 1]; if (!next || next.parentElement !== el.parentElement) return false;
      const n = next.getBoundingClientRect(); return n.top < r.bottom - 1 && n.left < r.right - 1 && n.right > r.left + 1;
    }).length;
    // Pre-existing decorative badges (image fallback, video chip, newsletter eyebrow) are excluded.
    const tiny = [...document.querySelectorAll('main *, #main-content *')].filter(el => !el.closest('.category-fallback, .video-chip, .newsletter-eyebrow') && el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 11 && el.getBoundingClientRect().height > 0).map(el => el.className || el.tagName).slice(0, 5);
    return { maxRowSpread: Math.max(0, ...spread), misaligned, overlaps, tiny, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  check(`${width}: tarjetas equivalentes con la misma altura por fila`, m.maxRowSpread < 2, m);
  check(`${width}: sin superposiciones, desbordes ni textos < 11 px`, !m.overlaps && !m.overflow && !m.tiny.length && !m.misaligned, m);
  await context.close();
}

// Article rail: Seguí informado follows the article on desktop and stops at its end.
for (const [width, height] of [[1440, 900], [1024, 768]]) {
  const { context, page } = await open({ viewport: { width, height } }, '/noticias/noticia-de-prueba-1');
  const at = async y => {
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(250);
    return page.evaluate(() => {
      const f = document.querySelector('.sidebar-follow').getBoundingClientRect();
      const header = document.querySelector('.site-header').getBoundingClientRect().bottom;
      const article = document.querySelector('.article-content-wrap').getBoundingClientRect().bottom;
      return { top: Math.round(f.top), bottom: Math.round(f.bottom), header: Math.round(header), article: Math.round(article) };
    });
  };
  const mid = [await at(1400), await at(2200)];
  const fits = mid.every(s => s.top >= s.header && s.bottom <= height && Math.abs(s.top - mid[0].top) < 1);
  const end = await at(100000);
  check(`Seguí informado ${width}x${height}: acompaña la nota sin salirse de la ventana`, fits && end.bottom <= end.article + 1, { mid, end });
  await context.close();
}

// Own ads are square and never touch the footer at the end of a section page.
{
  const { context, page } = await open({ viewport: { width: 1440, height: 900 } }, '/categoria/politica');
  const r = await page.evaluate(() => {
    const frames = [...document.querySelectorAll('.ad-frame')].map(f => { const b = f.getBoundingClientRect(); return Math.round(b.width) - Math.round(b.height); });
    const footer = document.querySelector('.site-footer').getBoundingClientRect().top;
    const content = Math.max(...[...document.querySelectorAll('.category-list .post-card, .category-layout > .sidebar')].map(e => e.getBoundingClientRect().bottom));
    return { frames, gap: Math.round(footer - content) };
  });
  check('publicidad propia cuadrada (1:1)', r.frames.length > 0 && r.frames.every(d => Math.abs(d) <= 1), r);
  check('categoría: aire antes del pie', r.gap >= 32, r);
  await context.close();
}

// Sparse and single-post previews are checked by passing their origin.
await browser.close();
const result = { origin, checks, errors };
await writeFile(`docs/qa/density/behavior-${new URL(origin).port}.json`, JSON.stringify(result, null, 2));
for (const c of checks) console.log(c.ok ? 'OK  ' : 'FAIL', c.name, c.ok ? '' : JSON.stringify(c.detail));
console.log(errors.length ? `Errores de consola: ${errors.join(' | ')}` : 'Sin errores de consola ni de hidratación');
