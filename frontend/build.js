/**
 * Builds the static site into dist/: one HTML file per page and language, plus CSS, JS, images and fonts.
 * No dependencies: run with `npm run build`.
 *
 * French pages live at the root (/menu/), Arabic under /ar/, English under /en/.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import fr from './src/i18n/fr.js';
import ar from './src/i18n/ar.js';
import en from './src/i18n/en.js';
import { site } from './src/data/site.js';
import { layout, registerTranslations } from './src/templates/layout.js';
import { pages, notFound } from './src/templates/pages.js';
import { pageUrl, absolute, LANGS, PAGES } from './src/templates/helpers.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(here, 'static');
const outDir = path.resolve(here, '..', 'dist');

const translations = { fr, ar, en };
registerTranslations(translations);

/* ---------- 1. Every language must have exactly the same keys as French ---------- */

function keysOf(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) return keysOf(v, key);
    if (Array.isArray(v)) return [`${key}[${v.length}]`, ...v.flatMap((x, i) => (x && typeof x === 'object' ? keysOf(x, `${key}[${i}]`) : []))];
    return [key];
  });
}
const reference = new Set(keysOf(fr));
for (const [lang, t] of Object.entries(translations)) {
  const keys = new Set(keysOf(t));
  const missing = [...reference].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !reference.has(k));
  if (missing.length || extra.length) {
    throw new Error(`Translation "${lang}" does not match fr.js.\nMissing: ${missing.join(', ')}\nExtra: ${extra.join(', ')}`);
  }
}

/* ---------- 2. Copy static files and fingerprint CSS/JS ---------- */

fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(staticDir, outDir, { recursive: true });

const versioned = (file) => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(staticDir, file))).digest('hex').slice(0, 10);
  return `/${file}?v=${hash}`;
};
const assets = { css: versioned('css/main.css'), js: versioned('js/main.js'), head: versioned('js/head.js') };

/* ---------- 3. Write pages ---------- */

function write(urlPath, content) {
  const file = path.join(outDir, urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.toString());
}

let count = 0;
for (const lang of LANGS) {
  const t = translations[lang];
  for (const page of PAGES) {
    const { title, description, body } = pages[page](t);
    write(pageUrl(lang, page), layout(t, { page, title, description, body, assets }));
    count++;
  }
  const nf = notFound(t);
  write(`${lang === 'fr' ? '' : `${lang}/`}404.html`, layout(t, { page: '404', ...nf, assets }));
}

/* ---------- 4. robots.txt and sitemap ---------- */

if (site.demo) {
  // A demo restaurant must not appear in search results.
  fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
} else {
  fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`);
  const urls = LANGS.flatMap((lang) =>
    PAGES.map((page) => {
      const alternates = LANGS.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absolute(pageUrl(l, page))}"/>`,
      ).join('\n');
      return `  <url>\n    <loc>${absolute(pageUrl(lang, page))}</loc>\n${alternates}\n  </url>`;
    }),
  );
  fs.writeFileSync(
    path.join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
  );
}

console.log(`Built ${count} pages in ${LANGS.length} languages into ${path.relative(process.cwd(), outDir) || '.'}/`);
