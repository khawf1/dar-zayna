/**
 * Dar Zayna — page behaviour. No framework; each feature only runs if its markup is on the page.
 *  1. Mobile navigation
 *  2. Menu category filter
 *  3. Gallery lightbox
 *  4. Contact form (validation + sending to /api/contact)
 */

/* ---------- 1. Mobile navigation ---------- */

function initNavigation() {
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!header || !toggle || !nav) return;

  const label = toggle.querySelector('.nav-toggle-label');
  const desktop = window.matchMedia('(min-width: 960px)');

  const setOpen = (open) => {
    // The panel starts right under the header, whatever the demo banner above it is doing.
    document.documentElement.style.setProperty('--nav-top', `${header.getBoundingClientRect().bottom}px`);
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? toggle.dataset.labelClose : toggle.dataset.labelOpen;
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Closing when a link is followed avoids a stuck panel on back navigation.
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

/* ---------- 2. Menu filter ---------- */

function initMenuFilter() {
  const bar = document.querySelector('[data-menu-filter]');
  if (!bar) return;
  const buttons = [...bar.querySelectorAll('[data-filter]')];
  const categories = [...document.querySelectorAll('[data-category]')];

  const apply = (filter) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    // On narrow screens the row scrolls sideways: keep the active button in view.
    buttons.find((b) => b.dataset.filter === filter)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
    categories.forEach((c) => {
      c.hidden = filter !== 'all' && c.dataset.category !== filter;
    });
  };

  bar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    const filter = button.dataset.filter;
    apply(filter);
    // Keep the URL shareable: /menu/#tagines opens on that category.
    history.replaceState(null, '', filter === 'all' ? location.pathname : `#${filter}`);
    const target = filter === 'all' ? categories[0] : categories.find((c) => c.dataset.category === filter);
    target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  bar.hidden = false;
  const initial = location.hash.slice(1);
  if (initial && categories.some((c) => c.dataset.category === initial)) apply(initial);
}

/* ---------- 3. Gallery lightbox ---------- */

function initLightbox() {
  const dialog = document.querySelector('.lightbox');
  const links = [...document.querySelectorAll('.gallery-link')];
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return;

  const image = dialog.querySelector('.lightbox-image');
  const text = dialog.querySelector('.lightbox-text');
  const counter = dialog.querySelector('.lightbox-counter');
  const counterTemplate = dialog.dataset.counter;
  let index = 0;
  let opener = null;

  const show = (i) => {
    index = (i + links.length) % links.length;
    const link = links[index];
    const thumb = link.querySelector('img');
    image.src = link.dataset.full;
    image.alt = thumb.alt;
    text.textContent = link.closest('figure').querySelector('figcaption').textContent;
    counter.textContent = counterTemplate.replace('{i}', index + 1).replace('{n}', links.length);
  };

  links.forEach((link, i) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      opener = link;
      show(i);
      dialog.showModal();
    }),
  );

  const rtl = document.documentElement.dir === 'rtl';
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1));
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (event) => {
    // Arrow keys follow the reading direction.
    if (event.key === 'ArrowRight') show(index + (rtl ? -1 : 1));
    if (event.key === 'ArrowLeft') show(index + (rtl ? 1 : -1));
  });
  // Click on the dark area (outside the photo and buttons) closes.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.classList.contains('lightbox-inner')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    opener?.focus();
  });
}

/* ---------- 4. Contact form ---------- */

const LIMITS = { nameMin: 2, nameMax: 80, emailMax: 254, messageMin: 10, messageMax: 2000 };
const FIELDS = ['name', 'email', 'phone', 'subject', 'message', 'language'];

/** Same rules as backend/contact/schema.js, so visitors see problems before sending. */
function validate(values) {
  const invalid = [];
  const name = values.name.trim();
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) invalid.push('name');
  const email = values.email.trim();
  if (!email || email.length > LIMITS.emailMax || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) invalid.push('email');
  const phone = values.phone.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, '').length;
    if (!/^\+?[\d\s().-]+$/.test(phone) || digits < 6 || digits > 15 || phone.length > 25) invalid.push('phone');
  }
  if (!['reservation', 'event', 'information', 'other'].includes(values.subject)) invalid.push('subject');
  const message = values.message.trim();
  if (message.length < LIMITS.messageMin || message.length > LIMITS.messageMax) invalid.push('message');
  if (!['fr', 'ar', 'en'].includes(values.language)) invalid.push('language');
  return invalid;
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const messagesEl = document.getElementById('contact-messages');
  if (!form || !messagesEl) return;

  const t = JSON.parse(messagesEl.textContent);
  const summary = document.getElementById('form-summary');
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[type="submit"]');
  const textarea = form.elements.message;
  const counter = document.getElementById('cf-message-count');

  // Pre-select the subject from ?subject=reservation (links "Request a table").
  const preset = new URLSearchParams(location.search).get('subject');
  if (preset && form.elements.subject.querySelector(`option[value="${CSS.escape(preset)}"]`)) {
    form.elements.subject.value = preset;
  }

  const updateCounter = () => {
    counter.textContent = t.counter.replace('{n}', textarea.value.length).replace('{max}', LIMITS.messageMax);
  };
  textarea.addEventListener('input', updateCounter);
  updateCounter();

  const setFieldError = (name, message) => {
    const input = form.elements[name];
    const error = document.getElementById(`cf-${name}-error`);
    if (!input || !error) return;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      error.textContent = message;
      error.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      error.textContent = '';
      error.hidden = true;
    }
  };

  const showErrors = (invalid) => {
    FIELDS.forEach((f) => setFieldError(f, invalid.includes(f) ? t.errors[f] : ''));
    const list = summary.querySelector('ul');
    list.replaceChildren(
      ...invalid
        .filter((f) => t.errors[f])
        .map((f) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#cf-${f}`;
          a.textContent = t.errors[f];
          a.addEventListener('click', (e) => {
            e.preventDefault();
            form.elements[f].focus();
          });
          li.append(a);
          return li;
        }),
    );
    summary.hidden = invalid.length === 0;
  };

  const showStatus = (kind, ...lines) => {
    status.className = `form-status is-${kind}`;
    status.replaceChildren(
      ...lines.filter(Boolean).map((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        return p;
      }),
    );
  };

  // Re-check a field when the visitor leaves it, once they have tried to send.
  let attempted = false;
  form.addEventListener('focusout', (event) => {
    if (!attempted || !FIELDS.includes(event.target.name)) return;
    const invalid = validate(readValues());
    setFieldError(event.target.name, invalid.includes(event.target.name) ? t.errors[event.target.name] : '');
  });

  const readValues = () => Object.fromEntries(FIELDS.map((f) => [f, form.elements[f].value]));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    attempted = true;
    status.replaceChildren();
    status.className = 'form-status';

    const values = readValues();
    const invalid = validate(values);
    showErrors(invalid);
    if (invalid.length) {
      summary.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = t.sending;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...values, website: form.elements.website.value }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok === true) {
        const wasReservation = values.subject === 'reservation';
        form.reset();
        form.elements.language.value = document.documentElement.lang;
        updateCounter();
        attempted = false;
        showStatus('success', t.status.success, wasReservation ? t.status.successReservation : '');
      } else if (response.status === 400 && data.error === 'validation' && Array.isArray(data.fields)) {
        const known = data.fields.filter((f) => FIELDS.includes(f));
        if (known.length) {
          showErrors(known);
          summary.focus();
        } else {
          showStatus('error', t.status.unknown);
        }
      } else {
        showStatus('error', t.status[data.error] || t.status.unknown);
      }
    } catch {
      showStatus('error', t.status.network);
    } finally {
      clearTimeout(timer);
      submit.disabled = false;
      submit.textContent = t.submit;
    }
  });
}

initNavigation();
initMenuFilter();
initLightbox();
initContactForm();
