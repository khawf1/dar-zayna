/**
 * Sends email through the Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 * Uses Node's built-in fetch, so no extra package is needed.
 * Throws EmailError whenever Resend does not confirm the email was accepted.
 */

export class EmailError extends Error {
  constructor(reason, options) {
    super(`Email not sent: ${reason}`, options);
    this.name = 'EmailError';
    this.reason = reason;
  }
}

const RESEND_URL = 'https://api.resend.com/emails';

export function createResendSender({ apiKey, from, to, fetchImpl = fetch, timeoutMs = 10_000 }) {
  if (!apiKey || !from || !to) throw new Error('createResendSender needs apiKey, from and to');

  return async function sendEmail({ subject, text, html, replyTo }) {
    let response;
    try {
      response = await fetchImpl(RESEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], subject, text, html, reply_to: replyTo }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const reason = err?.name === 'TimeoutError' ? 'timeout' : 'network error';
      throw new EmailError(reason, { cause: err });
    }

    if (!response.ok) {
      // The response body can contain details, but never the API key; keep only the status.
      throw new EmailError(`Resend answered ${response.status}`);
    }

    const body = await response.json().catch(() => null);
    if (!body || typeof body.id !== 'string') {
      throw new EmailError('Resend did not return an email id');
    }
    return { id: body.id };
  };
}
