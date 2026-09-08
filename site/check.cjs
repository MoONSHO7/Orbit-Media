// Browser checks against a locally served build; Playwright is a development-only dependency.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = process.env.GALLERY_URL || 'http://127.0.0.1:8766';
  const output = path.resolve(__dirname, '../../output/orbit-media-pages');
  fs.mkdirSync(output, {recursive: true});
  const browser = await chromium.launch({headless: true, ...(process.platform === 'win32' ? {channel: 'msedge'} : {})});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1050}, deviceScaleFactor: 1});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
      value: {writeText: async text => { window.copiedText = text; }},
    }));
    const category = async name => {
      await page.locator(`[data-category="${name}"]`).click();
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => [...document.querySelectorAll('canvas')].some(canvas => {
        const rect = canvas.getBoundingClientRect();
        return rect.top < innerHeight && rect.bottom > 0 && canvas.width > 0 &&
          canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0);
      }));
    };
    const screenshot = async name => {
      await page.waitForFunction(() => [...document.querySelectorAll('.art-card')].filter(card => {
        const rect = card.getBoundingClientRect();
        return !card.hidden && rect.top < innerHeight && rect.bottom > 0;
      }).every(card => card.getAttribute('aria-busy') === 'false'));
      await page.screenshot({path: path.join(output, name + '.png')});
    };
    await page.goto(base, {waitUntil: 'networkidle'});
    assert.equal(await page.locator('.art-card').count(), 40);
    await screenshot('desktop-icons');
    await page.locator('#play').click();
    const frame = await page.locator('canvas').first().evaluate(canvas => canvas.toDataURL());
    await page.waitForTimeout(180);
    assert.equal(await page.locator('canvas').first().evaluate(canvas => canvas.toDataURL()), frame, 'Pause must hold a frame');
    await page.getByRole('button', {name: 'Gold', exact: true}).click();
    await page.waitForFunction(previous => document.querySelector('canvas').toDataURL() !== previous, frame);
    await page.locator('#icon-shape').selectOption('round');
    await page.locator('#search').fill('embers');
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.art-card:visible').count(), 1);
    assert.equal(await page.locator('.art-card:visible').getAttribute('data-shape'), 'square');
    await page.locator('.art-card:visible .copy').click();
    assert.equal(await page.evaluate(() => window.copiedText), 'embers');
    await page.getByRole('button', {name: 'Mint', exact: true}).click();

    await category('dispels');
    assert.equal(await page.locator('.art-card').count(), 2);
    await screenshot('desktop-dispels');
    const casesPath = path.join(output, 'contour-cases.json');
    if (fs.existsSync(casesPath)) {
      for (const test of JSON.parse(fs.readFileSync(casesPath, 'utf8'))) {
        await page.locator('#aspect').selectOption(String(test.ratio));
        await page.locator('#contour').selectOption(test.kind);
        await page.locator('#radius').fill(String(test.radius));
        await page.waitForFunction(expected => [...document.querySelectorAll('.art-card')].every(card => card.dataset.shape === expected), test.shape);
      }
    }
    for (const ratio of ['4', '2.5']) {
      await page.locator('#aspect').selectOption(ratio);
      const shapes = await page.locator('#dispel-shape option').evaluateAll(options => options.map(option => option.value).filter(value => value !== 'auto'));
      for (const shape of shapes) {
        await page.locator('#dispel-shape').selectOption(shape);
        await page.waitForLoadState('networkidle');
        assert.deepEqual(await page.locator('.art-card').evaluateAll(cards => cards.map(card => card.dataset.shape)), [shape, shape]);
      }
    }
    assert.equal(await page.locator('#contour').isDisabled(), true);
    await page.locator('.copy').first().click();
    assert.match(await page.evaluate(() => window.copiedText), /shape = "chamfer-large"/);
    await page.locator('#dispel-shape').selectOption('auto');
    await page.locator('#contour').selectOption('chamfer');
    await page.locator('#radius').fill('8');
    await page.waitForLoadState('networkidle');
    await screenshot('desktop-chamfer');

    await category('fills');
    assert.equal(await page.locator('.art-card').count(), 82);
    await screenshot('desktop-fills');
    await page.locator('#family').selectOption('Raised');
    assert.equal(await page.locator('.art-card:visible').count(), 5);
    await page.locator('#search').fill('high');
    assert.equal(await page.locator('.art-card:visible').count(), 1);
    await page.locator('.art-card:visible .copy').click();
    assert.equal(await page.evaluate(() => window.copiedText), 'Orbit Raised High Crown');
    await page.locator('#fill').fill('0');
    assert.equal(await page.locator('#fill-value').textContent(), '0%');
    await page.locator('#fill').fill('100');
    assert.equal(await page.locator('#fill-value').textContent(), '100%');
    await page.locator('#fill').fill('72');

    await category('borders');
    assert.equal(await page.locator('.art-card').count(), 7);
    assert.equal(await page.locator('.animation-controls').isVisible(), false);
    await page.getByRole('button', {name: 'White', exact: true}).click();
    await screenshot('desktop-borders');
    const borderFrame = await page.locator('canvas').first().evaluate(canvas => canvas.toDataURL());
    await page.locator('#border-width').fill('360');
    await page.waitForFunction(previous => document.querySelector('canvas').toDataURL() !== previous, borderFrame);
    assert.equal(await page.locator('#border-width-value').textContent(), '360');
    await page.locator('#border-height').fill('160');
    await page.locator('#border-scale').fill('150');
    await screenshot('desktop-borders-large');
    await page.locator('#search').fill('chamfer');
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.art-card:visible').count(), 1);
    assert.equal(await page.locator('.art-card:visible').getAttribute('data-shape'), 'slice');
    await screenshot('desktop-border-chamfer-native');
    await page.locator('.art-card:visible .copy').click();
    assert.equal(await page.evaluate(() => window.copiedText), 'Orbit Chamfer Shadow');
    await page.locator('#border-artwork').selectOption('sharedmedia');
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.art-card:visible').getAttribute('data-shape'), 'edge');
    await screenshot('desktop-border-chamfer-sharedmedia');
    await page.locator('#border-width').fill('48');
    await page.locator('#border-height').fill('48');
    await page.locator('#search').fill('');
    await page.waitForLoadState('networkidle');
    await screenshot('desktop-borders-small');
    await page.locator('#border-width').fill('280');
    await page.locator('#border-height').fill('100');
    await page.locator('#border-scale').fill('100');
    await page.locator('#border-artwork').selectOption('native');

    for (const width of [390, 320]) {
      await page.setViewportSize({width, height: 844});
      for (const kind of ['icons', 'dispels', 'fills', 'borders']) {
        await category(kind);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${kind} overflow at ${width}`);
        if (width === 390) await screenshot('mobile-' + kind);
      }
    }
    await page.goto(base + '/docs/media.html', {waitUntil: 'networkidle'});
    assert.match(await page.locator('h1').textContent(), /Orbit: Media/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.goto(base + '/docs/glows.html#status-bar-glows', {waitUntil: 'networkidle'});
    assert.equal(await page.locator('#status-bar-glows').count(), 1);
    assert.equal(await page.getByText('/orbitglow', {exact: true}).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.setViewportSize({width: 1440, height: 1050});
    await screenshot('documentation');
    await page.goto(base + '/#dispels', {waitUntil: 'networkidle'});
    assert.equal(await page.locator('.art-card').count(), 2);
    await page.goto(base + '/#borders', {waitUntil: 'networkidle'});
    assert.equal(await page.locator('.art-card').count(), 7);
    assert.equal(await page.locator('#load-error').isVisible(), false);
    assert.deepEqual(errors, []);

    const reduced = await browser.newPage({reducedMotion: 'reduce'});
    await reduced.goto(base, {waitUntil: 'networkidle'});
    assert.equal(await reduced.locator('#play').getAttribute('aria-pressed'), 'false');
    await reduced.close();
    const failure = await browser.newPage();
    await failure.route('**/catalog.json', route => route.fulfill({status: 503, body: 'Unavailable'}));
    await failure.goto(base, {waitUntil: 'networkidle'});
    assert.equal(await failure.locator('#load-error').isVisible(), true);
    await failure.close();
    console.log('PASS: registered catalogs, pause, tint, corners, source-based contour parity, both aspect variants, copy, search, fill controls, resizable borders and both Chamfer exports, responsive layouts, documentation, deep links, reduced motion, load errors.');
    console.log('Screenshots: ' + output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
