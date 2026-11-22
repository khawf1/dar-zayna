// Navigation, menu filter, gallery lightbox and the contact form, as a visitor uses them.
import { test, expect } from '@playwright/test';

// Against a deployed site (BASE_URL), never send real messages to the restaurant inbox.
const LIVE = Boolean(process.env.BASE_URL);

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 740 }, hasTouch: true });

  test('opens, closes with Escape and navigates', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-nav');
    await expect(toggle).toBeVisible();
    await expect(nav).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();

    await toggle.click();
    await nav.getByRole('link', { name: 'La carte' }).click();
    await expect(page).toHaveURL(/\/menu\/$/);
    await expect(page.locator('h1')).toHaveText('Saveurs de Marrakech');
  });

  test('works in Arabic too', async ({ page }) => {
    await page.goto('/ar/');
    await page.locator('.nav-toggle').click();
    await page.locator('#site-nav').getByRole('link', { name: 'معرض الصور' }).click();
    await expect(page).toHaveURL(/\/ar\/gallery\/$/);
  });
});

test.describe('menu filter', () => {
  test('shows one category, and all again', async ({ page }) => {
    await page.goto('/menu/');
    const filter = page.getByRole('group', { name: 'Filtrer par catégorie' });
    await expect(filter).toBeVisible();
    await expect(page.locator('[data-category]:visible')).toHaveCount(6);

    await filter.getByRole('button', { name: 'Tajines' }).click();
    await expect(filter.getByRole('button', { name: 'Tajines' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-category]:visible')).toHaveCount(1);
    await expect(page.locator('#tagines')).toBeVisible();
    await expect(page).toHaveURL(/#tagines$/);

    await filter.getByRole('button', { name: 'Toute la carte' }).click();
    await expect(page.locator('[data-category]:visible')).toHaveCount(6);
  });

  test('a shared link opens on its category', async ({ page }) => {
    await page.goto('/en/menu/#desserts');
    await expect(page.locator('[data-category]:visible')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Desserts' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('on a phone, the active filter button is scrolled into view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    for (const url of ['/menu/#drinks', '/ar/menu/#drinks']) {
      await page.goto(url);
      const row = await page.locator('.menu-filter').boundingBox();
      const chip = await page.locator('.chip[aria-pressed="true"]').boundingBox();
      expect(chip.x, url).toBeGreaterThanOrEqual(row.x - 1);
      expect(chip.x + chip.width, url).toBeLessThanOrEqual(row.x + row.width + 1);
    }
  });

  test('every dish shows a price', async ({ page }) => {
    await page.goto('/menu/');
    const items = page.locator('.menu-sections .menu-item');
    const count = await items.count();
    expect(count).toBe(22);
    await expect(page.locator('.menu-sections .menu-item .price')).toHaveCount(count);
  });
});

test.describe('gallery lightbox', () => {
  test('opens, moves, closes and returns focus', async ({ page }) => {
    await page.goto('/gallery/');
    const first = page.locator('.gallery-link').first();
    await first.click();
    const dialog = page.locator('dialog.lightbox');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.lightbox-counter')).toHaveText('1 sur 12');
    await expect(dialog.locator('.lightbox-image')).toHaveJSProperty('complete', true);

    await dialog.getByRole('button', { name: 'Photo suivante' }).click();
    await expect(dialog.locator('.lightbox-counter')).toHaveText('2 sur 12');
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('.lightbox-counter')).toHaveText('1 sur 12');
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('.lightbox-counter')).toHaveText('12 sur 12');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(first).toBeFocused();
  });

  test('arrow keys follow the reading direction in Arabic', async ({ page }) => {
    await page.goto('/ar/gallery/');
    await page.locator('.gallery-link').first().click();
    await page.keyboard.press('ArrowLeft'); // "next" in right-to-left reading
    await expect(page.locator('.lightbox-counter')).toHaveText('2 من 12');
  });
});

test.describe('contact form', () => {
  const fill = async (page, overrides = {}) => {
    const v = {
      name: 'Salma Benali',
      email: 'salma@example.com',
      phone: '+212 6 12 34 56 78',
      subject: 'information',
      message: 'Bonjour, proposez-vous des plats sans gluten ?',
      ...overrides,
    };
    await page.locator('#cf-name').fill(v.name);
    await page.locator('#cf-email').fill(v.email);
    await page.locator('#cf-phone').fill(v.phone);
    await page.locator('#cf-subject').selectOption(v.subject);
    await page.locator('#cf-message').fill(v.message);
  };
  const submit = (page) => page.locator('#contact-form [type="submit"]').click();
  const status = (page) => page.locator('.form-status');

  test('empty form: errors on each required field, summary focused, nothing sent', async ({ page }) => {
    let posted = false;
    page.on('request', (r) => r.url().endsWith('/api/contact') && (posted = true));
    await page.goto('/contact/');
    await submit(page);
    const summary = page.locator('#form-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    for (const f of ['name', 'email', 'subject', 'message']) {
      await expect(page.locator(`#cf-${f}`)).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator(`#cf-${f}-error`)).toBeVisible();
    }
    await expect(page.locator('#cf-phone')).not.toHaveAttribute('aria-invalid', 'true');
    expect(posted).toBe(false);
  });

  test('invalid email and phone are explained', async ({ page }) => {
    await page.goto('/en/contact/');
    await fill(page, { email: 'salma@', phone: 'abc' });
    await submit(page);
    await expect(page.locator('#cf-email-error')).toHaveText(/valid email address/);
    await expect(page.locator('#cf-phone-error')).toHaveText(/valid number/);
    // Fixing a field clears its error when leaving it.
    await page.locator('#cf-email').fill('salma@example.com');
    await page.locator('#cf-phone').focus();
    await expect(page.locator('#cf-email-error')).toBeHidden();
  });

  test('message counter updates', async ({ page }) => {
    await page.goto('/contact/');
    await page.locator('#cf-message').fill('Bonjour');
    await expect(page.locator('#cf-message-count')).toHaveText('7 / 2000 caractères');
  });

  test('"Request a table" pre-selects the subject', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hero').getByRole('link', { name: 'Demander une table' }).click();
    await expect(page).toHaveURL(/\/contact\/\?subject=reservation$/);
    await expect(page.locator('#cf-subject')).toHaveValue('reservation');
    await expect(page.locator('#cf-language')).toHaveValue('fr');
  });

  test('a valid message is sent through the real API and confirmed', async ({ page }) => {
    test.skip(LIVE, 'Would send a real email; test this once by hand after deploying.');
    await page.goto('/contact/?subject=reservation');
    await fill(page, { subject: 'reservation', message: 'Une table pour quatre, samedi à 20 h.' });
    const responsePromise = page.waitForResponse('**/api/contact');
    await submit(page);
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(status(page)).toHaveClass(/is-success/);
    await expect(status(page)).toContainText('Votre message a bien été envoyé');
    // A table request is never presented as a confirmed booking.
    await expect(status(page)).toContainText('n’est pas encore réservée');
    await expect(page.locator('#cf-name')).toHaveValue('');
  });

  test('when the email service fails, the visitor is told it was not sent', async ({ page }) => {
    test.skip(LIVE, 'Needs the test server\'s simulated email failure.');
    await page.goto('/en/contact/');
    await fill(page, { message: 'Testing SIMULATE_EMAIL_FAILURE please ignore.' });
    const responsePromise = page.waitForResponse('**/api/contact');
    await submit(page);
    expect((await responsePromise).status()).toBe(502);
    await expect(status(page)).toHaveClass(/is-error/);
    await expect(status(page)).toContainText('could not be sent');
    await expect(status(page)).not.toContainText('Thank you');
    // The visitor's text is kept so they can try again.
    await expect(page.locator('#cf-message')).toHaveValue(/SIMULATE_EMAIL_FAILURE/);
  });

  for (const [code, error, text] of [
    [503, 'email_not_configured', 'pas encore activé'],
    [429, 'rate_limited', 'Réessayez dans quelques minutes'],
  ]) {
    test(`shows an honest message for ${error}`, async ({ page }) => {
      await page.route('**/api/contact', (route) =>
        route.fulfill({ status: code, contentType: 'application/json', body: JSON.stringify({ ok: false, error }) }),
      );
      await page.goto('/contact/');
      await fill(page);
      await submit(page);
      await expect(status(page)).toContainText(text);
      await expect(status(page)).not.toContainText('Merci');
    });
  }

  test('network failure is reported', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.abort('internetdisconnected'));
    await page.goto('/contact/');
    await fill(page);
    await submit(page);
    await expect(status(page)).toContainText('vérifiez votre connexion');
    await expect(page.locator('#contact-form [type="submit"]')).toBeEnabled();
  });

  test('server-side validation errors are shown on the fields', async ({ page }) => {
    await page.route('**/api/contact', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: '{"ok":false,"error":"validation","fields":["email"]}' }),
    );
    await page.goto('/contact/');
    await fill(page);
    await submit(page);
    await expect(page.locator('#cf-email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('the Arabic form speaks Arabic and replies in Arabic by default', async ({ page }) => {
    await page.goto('/ar/contact/');
    await expect(page.locator('#cf-language')).toHaveValue('ar');
    await submit(page);
    await expect(page.locator('#cf-name-error')).toHaveText('أدخلوا اسمكم (حرفان على الأقل).');
  });

  test('the honeypot stays out of reach of people', async ({ page }) => {
    await page.goto('/contact/');
    const hp = page.locator('#cf-website');
    await expect(hp).toHaveAttribute('tabindex', '-1');
    // The input sits in a 1 px clipped wrapper hidden from assistive technology.
    const wrapper = page.locator('.hp-field');
    await expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    const box = await wrapper.boundingBox();
    expect(box === null || (box.width <= 1 && box.height <= 1)).toBe(true);
  });
});
