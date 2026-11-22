/**
 * Restaurant details. This is the file to edit when the site goes to a real restaurant.
 *
 * While `demo` is true:
 *  - every page shows a banner saying the restaurant is fictional,
 *  - search engines are asked not to index the site (no fake restaurant in Google),
 *  - contact details are shown as placeholders and are not clickable,
 *  - no structured data (schema.org) is published.
 * Set `demo: false` only once every value below is real.
 */
export const site = {
  name: 'Dar Zayna',
  demo: true,

  // Full public address of the site, without a trailing slash: SITE_URL if set (custom domain),
  // otherwise the onrender.com address Render provides during the build, otherwise localhost.
  url: (process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').replace(/\/$/, ''),

  contact: {
    // Shown as text. In demo mode it is deliberately not a real, dialable number.
    phoneDisplay: '+212 5 24 XX XX XX',
    // International format without + or spaces, e.g. '212524000000'. Leave empty in demo mode.
    phoneTel: '',
    email: 'contact@example.com',
    // WhatsApp number in international format without + or spaces, e.g. '212600000000'.
    // Empty: the WhatsApp button opens WhatsApp with the message ready and lets the visitor pick the contact.
    whatsapp: '',
    address: {
      fr: 'Médina de Marrakech, Maroc',
      ar: 'المدينة القديمة، مراكش، المغرب',
      en: 'Marrakech Medina, Morocco',
    },
  },

  // Opening hours. `days` uses ISO weekday numbers (1 = Monday ... 7 = Sunday).
  hours: [
    { days: [2, 3, 4, 5, 6, 7], services: [['12:30', '15:00'], ['19:00', '23:00']] },
    { days: [1], services: [] }, // closed
  ],

  // Prices are in Moroccan dirhams.
  currency: 'MAD',
};
