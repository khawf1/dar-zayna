/**
 * Reads the server settings from environment variables.
 * Secrets (the Resend API key) only ever come from the environment, never from files in the repo.
 */

/** Turns the TRUST_PROXY setting into what Express expects (false, a hop count, or a string). */
function parseTrustProxy(value) {
  if (value === undefined || value === '' || value === 'false') return false;
  if (value === 'true') return true;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : value;
}

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function loadConfig(env = process.env) {
  const email = {
    apiKey: env.RESEND_API_KEY?.trim() || '',
    to: env.CONTACT_TO_EMAIL?.trim() || '',
    from: env.CONTACT_FROM_EMAIL?.trim() || '',
  };

  return {
    port: positiveInt(env.PORT, 3000),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    rateLimit: {
      windowMs: positiveInt(env.CONTACT_RATE_WINDOW_MINUTES, 15) * 60 * 1000,
      limit: positiveInt(env.CONTACT_RATE_LIMIT, 5),
    },
    email,
    // The contact form only claims to work when all three email settings exist.
    emailConfigured: Boolean(email.apiKey && email.to && email.from),
  };
}
