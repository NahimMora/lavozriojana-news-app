/**
 * Editorial density QA. Measures the isolated preview (never production).
 *   node scripts/editorial-preview.mjs 3101
 *   node scripts/density-visual-qa.mjs before|after [origin]
 * Requires a local Playwright: PLAYWRIGHT_CORE=<path to playwright-core>
 * and optionally CHROMIUM_PATH=<chrome.exe>. Nothing is installed in the repo.
 */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const label = process.argv[2] || 'after';
const origin = process.argv[3] || 'http://127.0.0.1:3101';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Solo se mide la vista aislada local.');
const out = path.join('docs/qa/density', label);
await mkdir(out, { recursive: true });

const viewports = [[360, 800], [390, 844], [768, 1024], [1024, 768], [1280, 800], [1440, 900]];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const results = { label, origin, pages: [] };
const errors = [];

function measure() {
  const header = document.querySelector('.site-header');
  const vh = innerHeight;
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const titleSel = '.post-title a, a.post-title, .lo-title, .rank-title, .sidebar-hi-title a, .en-foco-item a.efi-title';
  const titles = [...document.querySelectorAll(titleSel)].filter(el => !el.closest('.breaking-bar, .site-header, footer'));
  const visibleTitles = titles.filter(el => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.top >= headerBottom - 1 && r.bottom <= vh + 1;
  });
  const firstCard = [...document.querySelectorAll('main .post-card, #main-content .post-card')]
    .map(el => el.getBoundingClientRect()).find(r => r.height > 0);
  const firstMedia = [...document.querySelectorAll('main .post-media, #main-content .post-media')]
    .map(el => el.getBoundingClientRect()).find(r => r.height > 0);
  const box = sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), height: Math.round(r.height) }; };
  // Rows of comparable cards: max height spread inside the same visual row.
  const rowSpread = sel => [...document.querySelectorAll(sel)].map(grid => {
    const kids = [...grid.children].filter(k => k.getBoundingClientRect().height > 0);
    const rows = new Map();
    for (const k of kids) { const r = k.getBoundingClientRect(); const key = Math.round(r.top); rows.set(key, [...(rows.get(key) || []), Math.round(r.height)]); }
    return Math.max(0, ...[...rows.values()].filter(v => v.length > 1).map(v => Math.max(...v) - Math.min(...v)));
  });
  const lines = el => { const cs = getComputedStyle(el); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2; return Math.round(el.getBoundingClientRect().height / lh); };
  const titleLines = sel => [...document.querySelectorAll(sel)].map(lines);
  const fontSize = sel => { const el = document.querySelector(sel); return el ? parseFloat(getComputedStyle(el).fontSize) : null; };
  const ticker = document.querySelector('.breaking-bar');
  return {
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
    firstCardTop: firstCard ? Math.round(firstCard.top + scrollY) : null,
    firstImageTop: firstMedia ? Math.round(firstMedia.top + scrollY) : null,
    visibleHeadlines: visibleTitles.length,
    blocks: {
      opening: box('.home-opening'), ahora: box('.ahora-block') || box('.hero-right-item:last-child'), leadCard: box('.hero-lead') || box('.hero-main-slot'),
      enFoco: box('.en-foco-block'), titulares: box('.lo-ultimo-list'), destacados: box('.sidebar-highlights'), catHero: box('.cat-hero')
    },
    rowSpread: { grid: rowSpread('.editorial-grid'), sub: rowSpread('.hero-sub-row'), titulares: rowSpread('.lo-ultimo-list') },
    lines: { ahora: titleLines('.list-title'), titulares: titleLines('.lo-title'), enFoco: titleLines('.en-foco-sidebar a:not(.kicker)'), lead: titleLines('.lead-title') },
    fonts: { lead: fontSize('.lead-title'), featured: fontSize('.post-title.featured'), standard: fontSize('.editorial-grid .post-title'), list: fontSize('.list-title'), titulares: fontSize('.lo-title'), kicker: fontSize('.kicker'), meta: fontSize('.post-meta') },
    ticker: ticker ? {
      animated: getComputedStyle(ticker.querySelector('[class*="track"]') || ticker).animationName !== 'none',
      focusableLinks: [...ticker.querySelectorAll('a')].filter(a => !a.closest('[aria-hidden="true"]') && a.tabIndex >= 0).length,
      hiddenCopies: ticker.querySelectorAll('[aria-hidden="true"] a').length,
      height: Math.round(ticker.getBoundingClientRect().height)
    } : null
  };
}

const context = await browser.newContext({ deviceScaleFactor: 1 });
// Instagram's CDN and scripts (feed thumbnails) are never contacted from QA.
await context.route(/cdninstagram\.com|fbcdn\.net|instagram\.com/, route => route.fulfill({ status: 204, body: '' }));
const page = await context.newPage();
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(origin, { waitUntil: 'networkidle' });
const reject = page.getByRole('button', { name: /Rechazar/ });
if (await reject.isVisible().catch(() => false)) await reject.click();

for (const [name, route] of [['home', '/'], ['category', '/categoria/interior']]) {
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    const res = await page.goto(origin + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const m = await page.evaluate(measure);
    await page.screenshot({ path: path.join(out, `${name}-${width}.png`) });
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
    await page.waitForTimeout(450);
    m.headerHeightScrolled = await page.evaluate(() => Math.round(document.querySelector('.site-header').getBoundingClientRect().height));
    // Scroll back up must restore the header without loops.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(450);
    m.headerHeightRestored = await page.evaluate(() => Math.round(document.querySelector('.site-header').getBoundingClientRect().height));
    results.pages.push({ name, width, height, status: res.status(), ...m });
  }
}

// Section crops for side-by-side review.
await page.addStyleTag({ content: '.site-header{position:relative!important}.cookie-consent,.back-to-top{display:none!important}' });
for (const [width, height] of [[390, 844], [1440, 900]]) {
  await page.setViewportSize({ width, height });
  await page.goto(origin + '/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.site-header{position:relative!important}.cookie-consent,.back-to-top{display:none!important}' });
  for (const [key, sel] of [['ahora', '.ahora-block, .hero-right-item:last-child'], ['en-foco', '.en-foco-block'], ['titulares', '.lo-ultimo-list'], ['destacados', '.sidebar-highlights'], ['latest', '.home-latest']]) {
    const el = page.locator(sel).first();
    if (await el.count()) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await el.screenshot({ path: path.join(out, `${key}-${width}.png`) }).catch(() => {}); }
  }
}
results.errors = errors;
await writeFile(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
await browser.close();
console.table(results.pages.map(p => ({ page: p.name, w: p.width, header: p.headerHeight, scrolled: p.headerHeightScrolled, restored: p.headerHeightRestored, firstCard: p.firstCardTop, firstImg: p.firstImageTop, headlines: p.visibleHeadlines, ahora: p.blocks.ahora?.height, catHero: p.blocks.catHero?.height, overflow: p.overflow })));
if (errors.length) console.log('Errores:', errors);
