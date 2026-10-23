/**
 * Screenshots of the feed integration in the isolated preview (never
 * production), first screen of every page at six widths plus full pages at
 * 390 and 1440 px, into docs/qa/feeds/<label>/ as JPEG.
 *   node scripts/feed-visual-qa.mjs after http://127.0.0.1:3101
 *   node scripts/feed-visual-qa.mjs absent http://127.0.0.1:3102
 * Instagram is never contacted: thumbnails are answered with a local photo.
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const label = process.argv[2] || 'after';
const origin = process.argv[3] || 'http://127.0.0.1:3101';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Solo se mide la vista aislada local.');
const out = path.join('docs/qa/feeds', label);
await mkdir(out, { recursive: true });

export const PAGES = [
  ['home', '/'],
  ['articulo', '/noticias/noticia-de-prueba-8'],
  ['articulo-actualizacion', '/noticias/noticia-de-prueba-30'],
  ['articulo-cronologia', '/noticias/noticia-de-prueba-16'],
  ['categoria', '/categoria/politica'],
  ['servicios', '/servicios'],
  ['videos', '/videos']
];
const WIDTHS = [[360, 800], [390, 844], [768, 1024], [1024, 768], [1280, 800], [1440, 900]];
const photo = await readFile(new URL('./fixtures/images/photo-3.jpg', import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const results = [];

for (const [width, height] of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await context.route(/cdninstagram\.com|fbcdn\.net/, (route) => route.fulfill({ status: 200, contentType: 'image/jpeg', body: photo }));
  await context.route(/instagram\.com/, (route) => route.fulfill({ status: 204, body: '' }));
  const page = await context.newPage();
  for (const [name, route] of PAGES) {
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.cookie-consent,.back-to-top{display:none!important}' });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(150);
    const metrics = await page.evaluate(() => {
      const box = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top + scrollY), height: Math.round(r.height) };
      };
      return {
        notices: box('.site-notices'),
        ticker: box('.breaking-bar'),
        strip: box('.services-strip'),
        videos: box('.videos-band, .videos-hero'),
        articleVideo: box('.video-feature.is-article'),
        update: box('.update-notice'),
        timeline: box('.story-timeline-box'),
        firstHeadline: box('.article-title, .hero-lead .post-title, .category-lead .post-title, .service-hero h1'),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    results.push({ name, width, ...metrics });
    await page.screenshot({ path: path.join(out, `${name}-${width}.jpg`), type: 'jpeg', quality: 72 });
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: path.join(out, `${name}-${width}-completa.jpg`), type: 'jpeg', quality: 60, fullPage: true });
    }
  }
  await context.close();
}

await browser.close();
await writeFile(path.join(out, 'results.json'), JSON.stringify({ label, origin, results }, null, 2));
console.table(results.map(({ name, width, notices, strip, videos, firstHeadline, overflow }) => ({ name, width, notices: notices?.height ?? '-', strip: strip?.top ?? '-', videos: videos ? `${videos.top}+${videos.height}` : '-', headline: firstHeadline?.top ?? '-', overflow })));
