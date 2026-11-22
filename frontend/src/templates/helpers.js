/**
 * Small helpers shared by the page templates.
 * `html` is a tagged template that escapes every interpolated value unless it is wrapped in raw().
 */
import images from '../data/images.json' with { type: 'json' };
import { site } from '../data/site.js';

class Raw {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

export const raw = (value) => new Raw(String(value));

export function escape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escape(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    out += render(v) + strings[i + 1];
  });
  return new Raw(out);
}

/* ---------- URLs ---------- */

export const PAGES = ['home', 'menu', 'about', 'gallery', 'contact'];
export const LANGS = ['fr', 'ar', 'en'];

/** URL of a page in a language. French is at the root: /, /menu/; others are /ar/menu/. */
export function pageUrl(lang, page) {
  const prefix = lang === 'fr' ? '/' : `/${lang}/`;
  return page === 'home' ? prefix : `${prefix}${page}/`;
}

export const absolute = (path) => `${site.url}${path}`;

/* ---------- Images ---------- */

/**
 * Responsive <img> for a photo listed in images.json.
 * @param {string} name
 * @param {{alt: string, sizes: string, className?: string, eager?: boolean}} options
 */
export function img(name, { alt, sizes, className = '', eager = false }) {
  const info = images[name];
  if (!info) throw new Error(`Unknown image "${name}". Add it with scripts/optimize_images.py.`);
  const widths = info.widths;
  const fallback = widths.find((w) => w >= 960) ?? widths[widths.length - 1];
  const srcset = widths.map((w) => `/img/${name}-${w}.webp ${w}w`).join(', ');
  const height = Math.round(fallback / info.ratio);
  return html`<img src="/img/${name}-${fallback}.webp" srcset="${srcset}" sizes="${sizes}" width="${fallback}" height="${height}" alt="${alt}"${raw(
    className ? ` class="${escape(className)}"` : '',
  )}${raw(eager ? ' fetchpriority="high"' : ' loading="lazy"')} decoding="async">`;
}

export const largestImage = (name) => {
  const w = images[name].widths;
  return `/img/${name}-${w[w.length - 1]}.webp`;
};

/* ---------- Opening hours ---------- */

/** Formats a list of ISO weekdays as "Mardi – Dimanche" or "Lundi, Mercredi". */
function formatDays(days, t) {
  const sorted = [...days].sort((a, b) => a - b);
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  const name = (d) => t.days[d - 1];
  if (sorted.length > 2 && contiguous) return `${name(sorted[0])} ${t.hours.to} ${name(sorted.at(-1))}`;
  return sorted.map(name).join(', ');
}

/** "12:30 – 15:00" with non-breaking spaces, so a range never splits across two lines. */
const timeRange = (from, to, t) => `${from}\u00a0${t.hours.to}\u00a0${to}`;

/** Rows of [days, times] for an hours table, in weekday order. */
export function hoursRows(t) {
  return [...site.hours]
    .sort((a, b) => Math.min(...a.days) - Math.min(...b.days))
    .map((h) => [
      formatDays(h.days, t),
      h.services.length ? h.services.map(([from, to]) => timeRange(from, to, t)).join(` ${t.hours.and} `) : t.hours.closed,
    ]);
}

/** One-line summary of the main opening days, e.g. "Mardi – Dimanche · 12:30 – 15:00 et 19:00 – 23:00". */
export function hoursSummary(t) {
  const open = site.hours.filter((h) => h.services.length).sort((a, b) => b.days.length - a.days.length)[0];
  if (!open) return '';
  return `${formatDays(open.days, t)} · ${open.services.map(([f, to]) => timeRange(f, to, t)).join(` ${t.hours.and} `)}`;
}

/* ---------- Contact links ---------- */

export function whatsappUrl(t) {
  const number = site.contact.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(t.whatsappText)}`;
}

/* ---------- Ornaments (inline SVG, decorative) ---------- */

/**
 * Points of the eight-pointed star (two overlapping squares), the classic zellige motif,
 * centred in a 24×24 box. Outer points every 45°, inner points between them.
 */
function starPoints(outer = 11.5) {
  const inner = (outer * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}
const STAR = starPoints();

export const star = (className = 'star') =>
  raw(`<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><polygon points="${STAR}" fill="currentColor"/></svg>`);

/** Horizontal divider: line, outlined star with a dot, line. */
export const ornament = () =>
  raw(
    `<div class="ornament" aria-hidden="true"><span></span><svg viewBox="0 0 24 24" focusable="false"><polygon points="${starPoints(10.5)}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/></svg><span></span></div>`,
  );

export const icon = {
  whatsapp: raw(
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.17-1.5A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.07.89.9-3-.2-.31a8.2 8.2 0 1 1 6.85 3.75zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-1.97-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25 0-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48a.92.92 0 0 0-.66.31 2.8 2.8 0 0 0-.87 2.07 4.8 4.8 0 0 0 1 2.56 11 11 0 0 0 4.2 3.7c.59.26 1.05.41 1.4.52.6.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.15-1.17-.06-.1-.22-.17-.47-.29z"/></svg>',
  ),
  arrow: raw(
    '<svg class="icon icon-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ),
  clock: raw(
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  ),
  pin: raw(
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  ),
  phone: raw(
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 3.5h2.8l1.4 4.2-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4.2 1.4v2.8a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  ),
  mail: raw(
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  ),
};
