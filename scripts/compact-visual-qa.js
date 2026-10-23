// Connected Playwright browser_run_code_unsafe script. Safe preview on 3121.
async (page) => {
  const origin = 'http://127.0.0.1:3121';
  const results = [];
  const errors = [];
  const onError = error => errors.push(String(error));
  page.on('pageerror', onError);
  try {
    await page.goto(origin, { waitUntil: 'networkidle' });
    const reject = page.getByRole('button', { name: /Rechazar/ });
    if (await reject.isVisible()) await reject.click();
    await page.mouse.move(0, 899);
    for (const [name, route] of [['home', '/'], ['category', '/categoria/interior'], ['article', '/noticias/noticia-de-prueba-1']]) {
      for (const width of [360, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const metrics = await page.evaluate(() => {
          const grids = [...document.querySelectorAll('.editorial-grid')];
          const uniform = grids.every(grid => {
            const cards = [...grid.children].map(card => card.getBoundingClientRect());
            return cards.every(card => Math.abs(card.height - cards[0].height) < 1);
          });
          const alignedImages = grids.every(grid => {
            const images = [...grid.querySelectorAll('.post-media')].map(image => image.getBoundingClientRect().height);
            return images.every(height => Math.abs(height - images[0]) < 1);
          });
          const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
          const copyClips = [...document.querySelectorAll('.post-card-copy')].filter(copy => {
            const meta = copy.querySelector('.post-meta');
            return meta && meta.getBoundingClientRect().bottom > copy.getBoundingClientRect().bottom + 1;
          }).length;
          return {
            overflow, uniform, alignedImages, copyClips,
            height: document.documentElement.scrollHeight,
            nowHeight: document.querySelector('.latest-list')?.getBoundingClientRect().height,
            firstImageTop: document.querySelector('.hero-main-slot .post-media, .category-lead .post-media')?.getBoundingClientRect().top,
            headline: document.querySelector('.post-title, .article-title')?.textContent,
            h1: document.querySelectorAll('h1').length
          };
        });
        if (response.status() !== 200 || metrics.overflow || !metrics.uniform || !metrics.alignedImages || metrics.copyClips || metrics.h1 !== 1) {
          throw new Error(`${name}/${width}: ${JSON.stringify(metrics)}`);
        }
        await page.screenshot({ path: `.playwright-mcp/compact/after/${name}-${width}.png` });
        results.push({ name, width, status: response.status(), ...metrics });
      }
    }
    const headers = [];
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin, { waitUntil: 'networkidle' });
      const initial = await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().height);
      await page.evaluate(() => scrollTo(0, 500));
      await page.waitForTimeout(200);
      const shrunk = await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().height);
      if (shrunk >= initial) throw new Error('Header does not shrink');
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(200);
      const returned = await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().height);
      if (Math.abs(initial - returned) > 1) throw new Error('Header does not return');
      headers.push({ width, initial, shrunk, returned });
      for (const [label, selector] of [['focus', '.en-foco-block'], ['headlines', '.lo-ultimo-list']]) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await page.locator(selector).screenshot({ path: `.playwright-mcp/compact/after/${label}-${width}.png`, style: '.site-header,.back-to-top {visibility:hidden!important}' });
      }
      const singleLine = await page.locator('.en-foco-layout .post-title').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).whiteSpace === 'nowrap'));
      if (!singleLine) throw new Error('En foco wraps its titles');
    }
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.mouse.move(0, 899);
    const track = page.locator('.breaking-track');
    const before = await track.evaluate(el => getComputedStyle(el).transform);
    await page.waitForTimeout(250);
    if (before === await track.evaluate(el => getComputedStyle(el).transform)) throw new Error('Ticker is stationary');
    await page.getByRole('button', { name: 'Pausar titulares', exact: true }).click();
    if (await track.evaluate(el => getComputedStyle(el).animationPlayState) !== 'paused') throw new Error('Ticker does not pause');
    await page.getByRole('button', { name: 'Reanudar titulares', exact: true }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    if (await track.evaluate(el => getComputedStyle(el).animationName) !== 'none') throw new Error('Reduced motion not respected');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Menú de categorías', exact: true }).click();
    await page.getByRole('dialog', { name: 'Secciones', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Abrir buscador', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('type') === 'search');
    await page.keyboard.press('Escape');
    if (errors.length) throw new Error(errors.join('\n'));
    return { results, headers, tickerMoves: true, tickerPause: true, reducedMotion: true, focusSingleLine: true, mobileNavigation: true, errors };
  } finally {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    page.off('pageerror', onError);
  }
}
