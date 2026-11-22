/**
 * Security headers shared by both ways of running the site:
 *  - the Express server applies them with Helmet (backend/app.js),
 *  - the build writes them to dist/_headers for Cloudflare's static file serving (frontend/build.js).
 * Keep any change here: both read this file, so they cannot drift apart.
 */

/** Content Security Policy: everything from our own origin only, no inline scripts or styles. */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
};

export const cspString = () =>
  Object.entries(CSP_DIRECTIVES)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');

/** Helmet expects camelCase directive names. */
export const helmetDirectives = () =>
  Object.fromEntries(
    Object.entries(CSP_DIRECTIVES).map(([name, values]) => [name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), values]),
  );

/** The other headers Helmet sets by default, written out for the static host. */
export const STATIC_SECURITY_HEADERS = {
  'Content-Security-Policy': cspString(),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
  'X-DNS-Prefetch-Control': 'off',
  'X-Permitted-Cross-Domain-Policies': 'none',
};
