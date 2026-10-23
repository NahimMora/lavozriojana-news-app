// Run with the connected Playwright browser_run_code_unsafe tool (filename).
// Start `node scripts/editorial-preview.mjs 3101` first. No production requests.
async (page) => {
  const origin = 'http://127.0.0.1:3101';
  const results = [];
  const errors = [];
  const errorHandler = error => errors.push(String(error));
  const consoleHandler = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', errorHandler);
  page.on('console', consoleHandler);
  try {
    await page.goto(origin, { waitUntil: 'networkidle' });
    const reject = page.getByRole('button', { name: /Rechazar/ });
    if (await reject.isVisible()) await reject.click();
    for (const [name, route] of [['home', '/'], ['article', '/noticias/noticia-de-prueba-1'], ['category', '/categoria/interior']]) {
      for (const width of [360, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          h1: document.querySelectorAll('h1').length,
          // Native lazy images below the viewport have not been requested yet.
          brokenVisibleImages: [...document.images].filter(img => {
            const box = img.getBoundingClientRect();
            return box.top < innerHeight && box.bottom > 0 && img.complete && !img.naturalWidth;
          }).length,
          titleTransform: getComputedStyle(document.querySelector('.post-title, .article-title')).textTransform
        }));
        if (response.status() !== 200 || metrics.overflow || metrics.h1 !== 1 || metrics.brokenVisibleImages) {
          throw new Error(`Visual regression ${name} / ${width}: ${JSON.stringify(metrics)}`);
        }
        await page.screenshot({ path: `docs/qa/editorial/after/${name}-${width}.png` });
        results.push({ name, width, status: response.status(), ...metrics });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin, { waitUntil: 'networkidle' });
    const menu = page.getByRole('button', { name: 'Menú de categorías', exact: true });
    await menu.click();
    await page.screenshot({ path: 'docs/qa/editorial/after/mobile-menu.png' });
    for (let i = 0; i < 20; i++) await page.keyboard.press('Tab');
    if (!await page.evaluate(() => !!document.activeElement.closest('dialog'))) throw new Error('Focus escaped menu');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Menú de categorías');
    await page.getByRole('button', { name: 'Abrir buscador', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('type') === 'search');
    await page.getByRole('searchbox').fill('La Rioja');
    await page.screenshot({ path: 'docs/qa/editorial/after/mobile-search.png' });
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.waitForURL('**/buscar?q=La%20Rioja');
    if (!await page.locator('.post-card').count()) throw new Error('No search results');
    await page.goto(origin, { waitUntil: 'networkidle' });
    const heroSlugs = await page.locator('.home-hero-grid .post-card').evaluateAll(cards => cards.map(card => card.querySelector('.post-title a, a.post-title')?.getAttribute('href')));
    if (new Set(heroSlugs).size !== heroSlugs.length) throw new Error('Hero repeats an article');
    for (const [slug, ratio] of [['noticia-de-prueba-6', 16 / 9], ['noticia-de-prueba-9', 9 / 16]]) {
      await page.goto(origin + '/noticias/' + slug, { waitUntil: 'networkidle' });
      await page.locator('.article-video').first().scrollIntoViewIfNeeded();
      await page.waitForFunction(expected => {
        const video = document.querySelector('.article-video-wrap');
        const box = video?.getBoundingClientRect();
        return box && Math.abs(box.width / box.height - expected) < .01;
      }, ratio);
      await page.screenshot({ path: `docs/qa/editorial/after/video-${ratio > 1 ? 'horizontal' : 'vertical'}.png` });
    }
    if (errors.length) throw new Error(errors.join('\n'));
    return { results, errors, menuFocusTrap: true, menuFocusReturn: true, searchFocus: true, searchNavigation: true, heroUnique: true, horizontalVideo: true, verticalVideo: true };
  } finally {
    page.off('pageerror', errorHandler);
    page.off('console', consoleHandler);
  }
}
