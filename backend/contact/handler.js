import { contactSchema, invalidFields } from './schema.js';
import { buildContactEmail } from './email.js';

/**
 * The contact-form logic, independent of the hosting platform. Both the Express server
 * (backend/contact/route.js) and the Cloudflare Worker (worker/index.js) call it, after
 * they have checked the content type, body size and rate limit.
 *
 * @param {unknown} body  the parsed JSON body
 * @param {object} options
 * @param {((email: object) => Promise<{id: string}>) | null} options.sendEmail  null when email is not configured
 * @param {(message: string) => void} [options.logError]
 * @returns {Promise<{status: number, body: object}>}
 *
 *   200 { ok: true }                                  email accepted by the email service
 *   400 { ok: false, error: 'validation', fields }    one or more fields are invalid
 *   400 { ok: false, error: 'rejected' }              honeypot field was filled in
 *   502 { ok: false, error: 'email_failed' }          the email service did not accept the email
 *   503 { ok: false, error: 'email_not_configured' }  the server has no email settings
 *
 * Nothing the visitor sends is stored or logged: it only goes into the email.
 */
export async function handleContact(body, { sendEmail, logError = console.error }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { status: 400, body: { ok: false, error: 'validation', fields: [] } };
  }

  // Honeypot. A person never sees this field. We answer with an honest error
  // (not a fake "sent") so that a real visitor whose browser autofilled it is not misled.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { status: 400, body: { ok: false, error: 'rejected' } };
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { ok: false, error: 'validation', fields: invalidFields(parsed.error) } };
  }

  if (!sendEmail) {
    return { status: 503, body: { ok: false, error: 'email_not_configured' } };
  }

  try {
    await sendEmail(buildContactEmail(parsed.data));
  } catch (err) {
    // Log the reason only (no visitor data), and tell the visitor the truth.
    logError(`[contact] ${err?.message ?? 'email failed'}`);
    return { status: 502, body: { ok: false, error: 'email_failed' } };
  }

  return { status: 200, body: { ok: true } };
}

/** Largest accepted request body, in bytes. */
export const MAX_BODY_BYTES = 10 * 1024;
