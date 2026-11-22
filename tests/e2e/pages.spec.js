// Every page in every language: loads cleanly, correct language and direction,
// no console errors, no missing images, no broken links, no horizontal scroll, no axe violations.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LANGS = { fr: { prefix: '/', dir: 'ltr' }, ar: { prefix: '/ar/', dir: 'rtl' }, en: { prefix: '/en/', dir: 'ltr' } };
const PAGES = ['', 'menu/', 'about/', 'gallery/', 'contact/'];
const ALL = Object.entries(LANGS).flatMap(([lang, { prefix, dir }]) => PAGES.map((p) => ({ lang, dir, url: prefix + p })));

/** Opens a page and records console errors and failed requests. */
async function open(page, url) {
  const problems = [];
  page.on('console', (msg) => msg.type() === 'error' && problems.push(`console: ${msg.text()}`));
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('response', (res) => res.status() >= 400 && problems.push(`${res.status()} ${res.url()}`));
  page.on('requestfailed', (req) => problems.push(`failed: ${req.url()}`));
  const response = await page.goto(url);
  return { response, problems };
}

for (const { lang, dir, url } of ALL) {
  test.describe(`${url}`, () => {
    test('loads with the right language, one h1 and no errors', async ({ page }) => {
      const { response, problems } = await open(page, url);
      expect(response.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('html')).toHaveAttribute('dir', dir);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.title()).not.toBe('');
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
      // Demo mode: banner visible and search engines told not to index.
      await expect(page.locator('.demo-banner')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      // Scroll through so lazy images load, then check every image decoded.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
      });
      await page.waitForLoadState('networkidle');
      const broken = await page.$$eval('img', (imgs) =>
        imgs.filter((i) => i.getAttribute('src') && (!i.complete || i.naturalWidth === 0)).map((i) => i.currentSrc || i.src),
      );
      expect(broken, 'images that failed to load').toEqual([]);
      const noAlt = await page.$$eval('img:not([alt])', (imgs) => imgs.length);
      expect(noAlt, 'images without alt attribute').toBe(0);
      expect(problems).toEqual([]);
    });

    test('has no horizontal scroll at 360, 768 and 1280 px', async ({ page }) => {
      await page.goto(url);
      for (const width of [360, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(0);
      }
    });

    test('passes axe accessibility checks (WCAG 2.1 A/AA)', async ({ page }) => {
      await page.goto(url);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      expect(summary).toEqual([]);
    });
  });
}

test('every internal link and asset answers 200', async ({ page, request }) => {
  const urls = new Set();
  for (const { url } of ALL) {
    await page.goto(url);
    const found = await page.$$eval('a[href], link[href], img[src], script[src]', (els) =>
      els.flatMap((el) => {
        const list = [el.getAttribute('href') || el.getAttribute('src')];
        if (el.srcset) list.push(...el.srcset.split(',').map((s) => s.trim().split(' ')[0]));
        return list;
      }),
    );
    found
      .filter((h) => h && !h.startsWith('#') && !/^(https?:|mailto:|tel:)/.test(h))
      .forEach((h) => urls.add(new URL(h, page.url()).pathname + new URL(h, page.url()).search));
  }
  expect(urls.size).toBeGreaterThan(50);
  const failures = [];
  for (const u of urls) {
    const res = await request.get(u);
    if (res.status() !== 200) failures.push(`${res.status()} ${u}`);
  }
  expect(failures).toEqual([]);
});

test('external links open safely', async ({ page }) => {
  await page.goto('/');
  const unsafe = await page.$$eval('a[target="_blank"]', (links) =>
    links.filter((a) => !(a.rel || '').includes('noopener')).map((a) => a.href),
  );
  expect(unsafe).toEqual([]);
  const wa = await page.locator('a[href^="https://wa.me/"]').first().getAttribute('href');
  expect(wa).toContain('?text=');
});

test('language switcher keeps the same page', async ({ page }) => {
  await page.goto('/menu/');
  await page.getByRole('link', { name: 'English' }).first().click();
  await expect(page).toHaveURL(/\/en\/menu\/$/);
  await page.getByRole('link', { name: 'العربية' }).first().click();
  await expect(page).toHaveURL(/\/ar\/menu\/$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('[aria-current="true"][hreflang="ar"]').first()).toBeVisible();
});

test('404 pages answer 404 in the right language', async ({ page }) => {
  let res = await page.goto('/does-not-exist');
  expect(res.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Cette page n’existe pas');
  res = await page.goto('/ar/does-not-exist');
  expect(res.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  res = await page.goto('/en/nope/');
  expect(res.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('This page does not exist');
});

test('robots.txt blocks indexing while in demo mode', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(await res.text()).toContain('Disallow: /');
});
