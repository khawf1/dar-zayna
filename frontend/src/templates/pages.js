/** The five pages and the 404 page. Each returns { title, description, body }. */
import { site } from '../data/site.js';
import { menu } from '../data/menu.js';
import {
  html,
  raw,
  pageUrl,
  img,
  largestImage,
  hoursRows,
  hoursSummary,
  whatsappUrl,
  star,
  ornament,
  icon,
} from './helpers.js';

const ALL_ITEMS = menu.flatMap((c) => c.items.map((item) => ({ ...item, category: c.id })));
const item = (id) => {
  const found = ALL_ITEMS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown menu item "${id}"`);
  return found;
};

const FEATURED = ['lamb-with-prunes-and-almonds', 'chicken-with-preserved-lemon-and-olives', 'seven-vegetable-couscous'];
const PREVIEW = ['harira', 'zaalouk', 'chicken-and-almond-pastilla', 'tangia-marrakchia', 'couscous-tfaya', 'mint-tea'];
const GALLERY = [
  'tagine-kefta',
  'lounge',
  'tea-pour',
  'courtyard',
  'tagine-prunes',
  'lantern',
  'spices',
  'pastries-tea',
  'hall',
  'cooking',
  'ceramics',
  'tea-glass',
];
const GALLERY_PREVIEW = ['lounge', 'tea-pour', 'courtyard', 'spices', 'tagine-prunes'];

/* ---------- Shared blocks ---------- */

function sectionHeading(eyebrow, title, { text, center = false, id } = {}) {
  return html`<div class="section-heading${center ? ' is-center' : ''}">
    <p class="eyebrow">${eyebrow}</p>
    <h2${raw(id ? ` id="${id}"` : '')}>${title}</h2>
    ${text ? html`<p class="section-text">${text}</p>` : ''}
  </div>`;
}

function pageHero(eyebrow, title, lead) {
  return html`<section class="page-hero">
    <div class="container">
      <p class="eyebrow">${eyebrow}</p>
      <h1 class="display">${title}</h1>
      ${ornament()}
      <p class="lead">${lead}</p>
    </div>
  </section>`;
}

function contactList(t) {
  const c = site.contact;
  const phone = c.phoneTel ? html`<a href="tel:+${c.phoneTel}" dir="ltr">${c.phoneDisplay}</a>` : html`<span dir="ltr">${c.phoneDisplay}</span>`;
  // In demo mode the email is example.com (a reserved domain), so a mailto link is harmless but pointless.
  const email = site.demo ? html`<span dir="ltr">${c.email}</span>` : html`<a href="mailto:${c.email}" dir="ltr">${c.email}</a>`;
  return html`<ul class="contact-list">
    <li>${icon.pin}<div><span class="contact-label">${t.info.address}</span>${c.address[t.lang]}</div></li>
    <li>${icon.phone}<div><span class="contact-label">${t.info.phone}</span>${phone}</div></li>
    <li>${icon.mail}<div><span class="contact-label">${t.info.email}</span>${email}</div></li>
  </ul>
  ${site.demo ? html`<p class="demo-note">${star('star-inline')}${t.info.demo}</p>` : ''}`;
}

function hoursTable(t) {
  return html`<dl class="hours">
    ${hoursRows(t).map(([days, times]) => html`<div class="hours-row"><dt>${days}</dt><dd>${times}</dd></div>`)}
  </dl>`;
}

function whatsappButton(t, className = '') {
  return html`<a class="btn btn-whatsapp ${className}" href="${whatsappUrl(t)}" rel="noopener" target="_blank">${icon.whatsapp}<span>${t.cta.whatsapp}</span></a>`;
}

function priceTag(t, value) {
  return html`<span class="price">${t.price(value)}</span>`;
}

function vegBadge(t, dish) {
  return dish.veg ? html`<span class="badge-veg" title="${t.veg}"><span class="visually-hidden">${t.veg}</span><span aria-hidden="true">V</span></span>` : '';
}

/* ---------- Home ---------- */

export function home(t) {
  const h = t.home;
  const body = html`
<section class="hero">
  <div class="hero-pattern" aria-hidden="true"></div>
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">${h.hero.eyebrow}</p>
      <h1 class="display">${h.hero.title}</h1>
      <p class="lead">${h.hero.lead}</p>
      <div class="actions">
        <a class="btn btn-primary" href="${pageUrl(t.lang, 'menu')}">${t.cta.seeMenu}${icon.arrow}</a>
        <a class="btn btn-ghost" href="${pageUrl(t.lang, 'contact')}?subject=reservation">${t.cta.table}</a>
      </div>
      <p class="hero-hours">${icon.clock}<span>${hoursSummary(t)}</span></p>
    </div>
    <div class="hero-media">
      <div class="arch arch-hero">${img('tagine-kefta', { alt: h.hero.imageAlt, sizes: '(min-width: 960px) 40vw, 90vw', eager: true })}</div>
      <div class="arch arch-badge" aria-hidden="true">${img('tea-glass', { alt: '', sizes: '160px' })}</div>
    </div>
  </div>
</section>

<section class="section intro">
  <div class="container narrow">
    ${sectionHeading(h.intro.eyebrow, h.intro.title, { center: true })}
    ${ornament()}
    <p class="intro-text">${h.intro.text}</p>
  </div>
  <div class="container">
    <ul class="pillars">
      ${h.intro.pillars.map(
        (p, i) => html`<li class="pillar">
          <span class="pillar-number" aria-hidden="true">${star('pillar-star')}<span>${i + 1}</span></span>
          <h3>${p.title}</h3>
          <p>${p.text}</p>
        </li>`,
      )}
    </ul>
  </div>
</section>

<section class="section featured has-pattern" aria-labelledby="featured-title">
  <div class="container">
    ${sectionHeading(h.featured.eyebrow, h.featured.title, { text: h.featured.text, center: true, id: 'featured-title' })}
    <ul class="dish-cards">
      ${FEATURED.map((id) => {
        const dish = item(id);
        return html`<li class="dish-card">
          <div class="arch arch-card">${img(dish.image, { alt: dish.name[t.lang], sizes: '(min-width: 960px) 30vw, (min-width: 640px) 45vw, 90vw' })}</div>
          <div class="dish-card-body">
            <h3>${dish.name[t.lang]}</h3>
            <p>${dish.desc[t.lang]}</p>
            ${priceTag(t, dish.price)}
          </div>
        </li>`;
      })}
    </ul>
  </div>
</section>

<section class="section menu-preview" aria-labelledby="preview-title">
  <div class="container preview-grid">
    <div class="preview-media">
      <div class="arch arch-tall">${img('tagine-pumpkin', { alt: item('beef-with-pumpkin').name[t.lang], sizes: '(min-width: 960px) 34vw, 90vw' })}</div>
    </div>
    <div class="preview-list">
      ${sectionHeading(h.preview.eyebrow, h.preview.title, { id: 'preview-title' })}
      <ul class="menu-items is-compact">
        ${PREVIEW.map((id) => {
          const dish = item(id);
          return html`<li class="menu-item">
            <div class="menu-item-head"><h3>${dish.name[t.lang]}${vegBadge(t, dish)}</h3><span class="leader" aria-hidden="true"></span>${priceTag(t, dish.price)}</div>
            <p>${dish.desc[t.lang]}</p>
          </li>`;
        })}
      </ul>
      <a class="link-arrow" href="${pageUrl(t.lang, 'menu')}">${t.cta.fullMenu}${icon.arrow}</a>
    </div>
  </div>
</section>

<section class="section story is-dark" aria-labelledby="story-title">
  <div class="story-pattern" aria-hidden="true"></div>
  <div class="container story-grid">
    <div class="arch arch-story">${img('courtyard', { alt: h.story.imageAlt, sizes: '(min-width: 960px) 40vw, 90vw' })}</div>
    <div class="story-copy">
      ${sectionHeading(h.story.eyebrow, h.story.title, { id: 'story-title' })}
      <p>${h.story.text}</p>
      <a class="btn btn-gold" href="${pageUrl(t.lang, 'about')}">${t.cta.story}${icon.arrow}</a>
    </div>
  </div>
</section>

<section class="section gallery-preview" aria-labelledby="gallery-title">
  <div class="container">
    <div class="split-heading">
      ${sectionHeading(h.galleryPreview.eyebrow, h.galleryPreview.title, { id: 'gallery-title' })}
      <a class="link-arrow" href="${pageUrl(t.lang, 'gallery')}">${t.cta.gallery}${icon.arrow}</a>
    </div>
    <ul class="mosaic">
      ${GALLERY_PREVIEW.map(
        (name) => html`<li>${img(name, { alt: t.gallery.items[name], sizes: '(min-width: 960px) 25vw, 50vw' })}</li>`,
      )}
    </ul>
  </div>
</section>

<section class="section visit has-pattern" aria-labelledby="visit-title">
  <div class="container visit-grid">
    <div class="visit-copy">
      ${sectionHeading(h.visit.eyebrow, h.visit.title, { text: h.visit.text, id: 'visit-title' })}
      <div class="actions">
        <a class="btn btn-primary" href="${pageUrl(t.lang, 'contact')}">${t.cta.contact}${icon.arrow}</a>
        ${whatsappButton(t)}
      </div>
    </div>
    <div class="card">
      <h3 class="card-title">${t.hours.title}</h3>
      ${hoursTable(t)}
      ${contactList(t)}
    </div>
  </div>
</section>`;
  return { title: h.title, description: h.description, body };
}

/* ---------- Menu ---------- */

export function menuPage(t) {
  const m = t.menuPage;
  const body = html`
${pageHero(m.eyebrow, m.h1, m.lead)}
<div class="menu-filter-bar" data-menu-filter hidden>
  <div class="container">
    <div class="menu-filter" role="group" aria-label="${m.filterLabel}">
      <button type="button" class="chip" data-filter="all" aria-pressed="true">${m.all}</button>
      ${menu.map((c) => html`<button type="button" class="chip" data-filter="${c.id}" aria-pressed="false">${c.title[t.lang]}</button>`)}
    </div>
  </div>
</div>
<section class="section menu-sections">
  <div class="container">
    ${menu.map(
      (category, index) => html`<section class="menu-category${index % 2 ? ' is-flipped' : ''}" id="${category.id}" data-category="${category.id}" aria-labelledby="cat-${category.id}">
        <div class="menu-category-media">
          <div class="arch arch-tall">${img(category.image, { alt: category.imageAlt[t.lang], sizes: '(min-width: 960px) 30vw, 90vw' })}</div>
        </div>
        <div class="menu-category-body">
          <h2 id="cat-${category.id}" class="menu-category-title">${star('title-star')}${category.title[t.lang]}</h2>
          <ul class="menu-items">
            ${category.items.map(
              (dish) => html`<li class="menu-item${dish.image ? ' has-photo' : ''}">
                ${dish.image ? html`<div class="menu-item-photo">${img(dish.image, { alt: '', sizes: '88px' })}</div>` : ''}
                <div class="menu-item-text">
                  <div class="menu-item-head"><h3>${dish.name[t.lang]}${vegBadge(t, dish)}</h3><span class="leader" aria-hidden="true"></span>${priceTag(t, dish.price)}</div>
                  <p>${dish.desc[t.lang]}</p>
                </div>
              </li>`,
            )}
          </ul>
        </div>
      </section>`,
    )}
    <p class="menu-note">${star('star-inline')}${m.note} <span class="menu-note-veg"><span class="badge-veg" aria-hidden="true">V</span> ${t.veg}</span></p>
    <div class="actions is-center">
      <a class="btn btn-primary" href="${pageUrl(t.lang, 'contact')}?subject=reservation">${t.cta.table}</a>
      ${whatsappButton(t)}
    </div>
  </div>
</section>`;
  return { title: m.title, description: m.description, body };
}

/* ---------- About ---------- */

export function about(t) {
  const a = t.about;
  const body = html`
${pageHero(a.eyebrow, a.h1, a.lead)}
<section class="section about-sections">
  <div class="container">
    ${a.sections.map(
      (s, i) => html`<article class="about-row${i % 2 ? ' is-flipped' : ''}">
        <div class="arch arch-tall">${img(s.image, { alt: s.imageAlt, sizes: '(min-width: 960px) 40vw, 90vw' })}</div>
        <div class="about-copy">
          <p class="about-index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
          <h2>${s.title}</h2>
          <p>${s.text}</p>
        </div>
      </article>`,
    )}
  </div>
</section>
<section class="section values is-dark" aria-labelledby="values-title">
  <div class="story-pattern" aria-hidden="true"></div>
  <div class="container">
    <h2 class="values-title" id="values-title">${a.valuesTitle}</h2>
    ${ornament()}
    <ul class="value-list">
      ${a.values.map((v) => html`<li>${star('value-star')}<h3>${v.title}</h3><p>${v.text}</p></li>`)}
    </ul>
  </div>
</section>
<section class="section">
  <div class="container narrow">
    <aside class="notice" aria-labelledby="demo-title">
      <h2 id="demo-title">${star('star-inline')}${a.demoTitle}</h2>
      <p>${a.demoText}</p>
    </aside>
    <div class="actions is-center">
      <a class="btn btn-primary" href="${pageUrl(t.lang, 'menu')}">${t.cta.seeMenu}${icon.arrow}</a>
      <a class="btn btn-ghost" href="${pageUrl(t.lang, 'contact')}">${t.cta.contact}</a>
    </div>
  </div>
</section>`;
  return { title: a.title, description: a.description, body };
}

/* ---------- Gallery ---------- */

export function gallery(t) {
  const g = t.gallery;
  const body = html`
${pageHero(g.eyebrow, g.h1, g.lead)}
<section class="section gallery-section">
  <div class="container">
    <ul class="gallery-grid">
      ${GALLERY.map(
        (name, i) => html`<li class="gallery-item">
          <figure>
            <a href="${largestImage(name)}" class="gallery-link" data-index="${i}" data-full="${largestImage(name)}">
              ${img(name, { alt: g.items[name], sizes: '(min-width: 960px) 30vw, (min-width: 640px) 45vw, 90vw' })}
              <span class="visually-hidden">${g.open}</span>
            </a>
            <figcaption>${g.items[name]}</figcaption>
          </figure>
        </li>`,
      )}
    </ul>
  </div>
</section>
<dialog class="lightbox" aria-label="${g.h1}" data-counter="${g.counter('{i}', '{n}')}">
  <div class="lightbox-inner">
    <figure class="lightbox-figure">
      <img class="lightbox-image" src="" alt="">
      <figcaption class="lightbox-caption"><span class="lightbox-text"></span> <span class="lightbox-counter"></span></figcaption>
    </figure>
    <button type="button" class="lightbox-btn lightbox-prev" aria-label="${g.prev}">${icon.arrow}</button>
    <button type="button" class="lightbox-btn lightbox-next" aria-label="${g.next}">${icon.arrow}</button>
    <button type="button" class="lightbox-btn lightbox-close" aria-label="${g.close}"><span aria-hidden="true">×</span></button>
  </div>
</dialog>`;
  return { title: g.title, description: g.description, body };
}

/* ---------- Contact ---------- */

export function contact(t) {
  const c = t.contact;
  const f = c.fields;
  const req = raw('<span class="required" aria-hidden="true">*</span>');
  const field = (id, label, control, { hint, required = true } = {}) => html`<div class="field" data-field="${id}">
      <label for="cf-${id}">${label}${required ? req : ''}</label>
      ${control}
      ${hint ? html`<p class="field-hint" id="cf-${id}-hint">${hint}</p>` : ''}
      ${id === 'message' ? html`<p class="field-counter" id="cf-message-count">${c.counter(0, 2000)}</p>` : ''}
      <p class="field-error" id="cf-${id}-error" hidden></p>
    </div>`;
  const describedBy = (id, hint) => `${hint ? `cf-${id}-hint ` : ''}cf-${id}-error`;

  // Messages for main.js, read from a non-executable JSON block (allowed by the CSP).
  const messages = {
    errors: c.errors,
    status: c.status,
    sending: c.sending,
    submit: c.submit,
    counter: c.counter('{n}', '{max}'),
  };

  const body = html`
${pageHero(c.eyebrow, c.h1, c.lead)}
<section class="section contact-section">
  <div class="container contact-grid">
    <div class="card form-card">
      <h2 class="card-title">${c.formTitle}</h2>
      <p class="form-required">${c.required}</p>
      <noscript><p class="notice">${c.noscript}</p></noscript>
      <form class="contact-form" id="contact-form" action="/api/contact" method="post" novalidate>
        <div class="form-summary" id="form-summary" tabindex="-1" hidden>
          <p>${c.errors.summary}</p>
          <ul></ul>
        </div>
        <div class="field-row">
          ${field('name', f.name, html`<input id="cf-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80" aria-describedby="${describedBy('name')}">`)}
          ${field('email', f.email, html`<input id="cf-email" name="email" type="email" autocomplete="email" required maxlength="254" dir="ltr" aria-describedby="${describedBy('email')}">`)}
        </div>
        <div class="field-row">
          ${field(
            'phone',
            f.phone,
            html`<input id="cf-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="25" dir="ltr" aria-describedby="${describedBy('phone', true)}">`,
            { hint: f.phoneHint, required: false },
          )}
          ${field(
            'subject',
            f.subject,
            html`<select id="cf-subject" name="subject" required aria-describedby="${describedBy('subject')}">
              <option value="">${f.subjectPlaceholder}</option>
              ${Object.entries(c.subjects).map(([value, label]) => html`<option value="${value}">${label}</option>`)}
            </select>`,
          )}
        </div>
        ${field(
          'message',
          f.message,
          html`<textarea id="cf-message" name="message" rows="6" required minlength="10" maxlength="2000" aria-describedby="${describedBy('message', true)} cf-message-count"></textarea>`,
          { hint: f.messageHint },
        )}
        ${field(
          'language',
          f.language,
          html`<select id="cf-language" name="language" required aria-describedby="${describedBy('language')}">
            ${['fr', 'ar', 'en'].map(
              (l) => html`<option value="${l}"${raw(l === t.lang ? ' selected' : '')}>${{ fr: 'Français', ar: 'العربية', en: 'English' }[l]}</option>`,
            )}
          </select>`,
        )}
        <div class="hp-field" aria-hidden="true">
          <label for="cf-website">${f.website}</label>
          <input id="cf-website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
        <p class="form-note">${star('star-inline')}${c.reservationNote}</p>
        <p class="form-privacy">${c.privacy}</p>
        <button class="btn btn-primary btn-block" type="submit">${c.submit}</button>
        <div class="form-status" role="status" aria-live="polite"></div>
      </form>
      <script type="application/json" id="contact-messages">${raw(JSON.stringify(messages).replace(/</g, '\\u003c'))}</script>
    </div>
    <aside class="contact-aside">
      <div class="card">
        <h2 class="card-title">${c.asideTitle}</h2>
        ${contactList(t)}
      </div>
      <div class="card">
        <h2 class="card-title">${t.hours.title}</h2>
        ${hoursTable(t)}
      </div>
      ${whatsappButton(t, 'btn-block')}
    </aside>
  </div>
</section>`;
  return { title: c.title, description: c.description, body };
}

/* ---------- 404 ---------- */

export function notFound(t) {
  const n = t.notFound;
  const body = html`<section class="section not-found">
    <div class="container narrow">
      ${star('not-found-star')}
      <p class="eyebrow">404</p>
      <h1 class="display">${n.h1}</h1>
      <p class="lead">${n.text}</p>
      <div class="actions is-center"><a class="btn btn-primary" href="${pageUrl(t.lang, 'home')}">${n.back}</a></div>
    </div>
  </section>`;
  return { title: n.title, description: n.text, body };
}

export const pages = { home, menu: menuPage, about, gallery, contact };
