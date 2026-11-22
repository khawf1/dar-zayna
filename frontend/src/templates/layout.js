/** Page shell shared by every page: <head>, header with navigation and language switcher, footer. */
import { site } from '../data/site.js';
import { html, raw, pageUrl, absolute, LANGS, PAGES, star, icon, hoursRows, whatsappUrl } from './helpers.js';

const NAV = ['home', 'menu', 'about', 'gallery', 'contact'];

/** Fonts preloaded per language: the heading and body faces the first screen needs. */
const PRELOAD_FONTS = {
  latin: ['/fonts/cormorant-garamond-latin-600-normal.woff2', '/fonts/jost-latin-400-normal.woff2'],
  ar: ['/fonts/amiri-arabic-700-normal.woff2', '/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2'],
};

function brand(t) {
  return html`<a class="brand" href="${pageUrl(t.lang, 'home')}">
      ${star('brand-mark')}
      <span class="brand-name" lang="${t.lang === 'ar' ? 'ar' : 'fr'}">${t.lang === 'ar' ? 'دار زينة' : site.name}</span>
      <span class="visually-hidden">, ${t.nav.home}</span>
    </a>`;
}

function languageSwitcher(t, page) {
  return html`<ul class="lang-switch" aria-label="${t.nav.language}">
    ${LANGS.map((lang) => {
      const current = lang === t.lang;
      return html`<li><a href="${pageUrl(lang, page)}" hreflang="${lang}" lang="${lang}"${raw(
        current ? ' aria-current="true"' : '',
      )}>${TRANSLATIONS[lang].langName}</a></li>`;
    })}
  </ul>`;
}

let TRANSLATIONS = {};
/** build.js registers all languages so the switcher can show each language in its own name. */
export function registerTranslations(all) {
  TRANSLATIONS = all;
}

function header(t, page) {
  return html`<header class="site-header">
    <div class="container header-inner">
      ${brand(t)}
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-label-open="${t.nav.open}" data-label-close="${t.nav.close}">
        <span class="nav-toggle-lines" aria-hidden="true"></span>
        <span class="visually-hidden nav-toggle-label">${t.nav.open}</span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="${t.nav.label}">
        <ul class="nav-list">
          ${NAV.map(
            (p) =>
              html`<li><a href="${pageUrl(t.lang, p)}"${raw(p === page ? ' aria-current="page"' : '')}>${t.nav[p]}</a></li>`,
          )}
        </ul>
        <div class="nav-extra">
          ${languageSwitcher(t, page ?? 'home')}
          <a class="btn btn-small btn-primary nav-cta" href="${pageUrl(t.lang, 'contact')}?subject=reservation">${t.cta.table}</a>
        </div>
      </nav>
    </div>
  </header>`;
}

function footer(t) {
  const year = new Date().getFullYear();
  return html`<footer class="site-footer">
    <div class="footer-pattern" aria-hidden="true"></div>
    <div class="container footer-grid">
      <div class="footer-brand">
        ${brand(t)}
        <p>${t.footer.tagline}</p>
        <a class="btn btn-whatsapp btn-small" href="${whatsappUrl(t)}" rel="noopener" target="_blank">${icon.whatsapp}${t.cta.whatsapp}</a>
      </div>
      <div>
        <h2 class="footer-title">${t.footer.explore}</h2>
        <ul class="footer-links">
          ${PAGES.map((p) => html`<li><a href="${pageUrl(t.lang, p)}">${t.nav[p]}</a></li>`)}
        </ul>
      </div>
      <div>
        <h2 class="footer-title">${t.footer.visit}</h2>
        <p>${site.contact.address[t.lang]}</p>
        <dl class="footer-hours">
          ${hoursRows(t).map(([days, times]) => html`<div><dt>${days}</dt><dd>${times}</dd></div>`)}
        </dl>
      </div>
    </div>
    <div class="container footer-bottom">
      ${site.demo ? html`<p class="footer-demo">${star('star-inline')}${t.footer.demo}</p>` : ''}
      <p>© ${year} ${site.name}. ${t.footer.rights} · ${t.footer.photos}</p>
    </div>
  </footer>`;
}

/**
 * @param {object} t translation object
 * @param {object} opts
 * @param {string} opts.page  page id ('home', 'menu', ... or '404')
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {*} opts.body  page content (html``)
 * @param {object} opts.assets  { css, js, head } URLs with cache-busting query strings
 * @param {string} [opts.image]  social preview image path
 */
export function layout(t, { page, title, description, body, assets, image = '/img/og-image.jpg' }) {
  const isPage = PAGES.includes(page);
  const canonical = isPage ? absolute(pageUrl(t.lang, page)) : null;
  const fonts = t.lang === 'ar' ? [...PRELOAD_FONTS.ar] : PRELOAD_FONTS.latin;

  return html`<!doctype html>
<html lang="${t.lang}" dir="${t.dir}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
${site.demo || !isPage ? raw('<meta name="robots" content="noindex">\n') : ''}${canonical ? html`<link rel="canonical" href="${canonical}">
${LANGS.map((l) => html`<link rel="alternate" hreflang="${l}" href="${absolute(pageUrl(l, page))}">
`)}<link rel="alternate" hreflang="x-default" href="${absolute(pageUrl('fr', page))}">
` : ''}<meta name="theme-color" content="#354333">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:locale" content="${t.locale}">
${canonical ? html`<meta property="og:url" content="${canonical}">
` : ''}<meta property="og:image" content="${absolute(image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${fonts.map((f) => html`<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>
`)}<link rel="stylesheet" href="${assets.css}">
<script src="${assets.head}"></script>
<script src="${assets.js}" defer></script>
</head>
<body class="page-${page}">
<a class="skip-link" href="#main">${t.skip}</a>
${site.demo ? html`<p class="demo-banner">${t.demoBanner}</p>` : ''}
${header(t, isPage ? page : null)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(t)}
</body>
</html>
`;
}
