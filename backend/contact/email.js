/**
 * Builds the notification email the restaurant receives for each contact message.
 * Every value typed by the visitor is HTML-escaped before it goes into the HTML version.
 */

const SUBJECT_LABELS = {
  reservation: 'Demande de réservation',
  event: 'Événement privé',
  information: 'Information',
  other: 'Autre',
};

const LANGUAGE_LABELS = { fr: 'Français', ar: 'Arabe', en: 'Anglais' };

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @param {{name:string,email:string,phone:string,subject:string,message:string,language:string}} data
 *   Data that has already passed contactSchema.
 * @param {{siteName?: string}} [options]
 */
export function buildContactEmail(data, { siteName = 'Dar Zayna' } = {}) {
  const subjectLabel = SUBJECT_LABELS[data.subject] ?? 'Message';
  const languageLabel = LANGUAGE_LABELS[data.language] ?? data.language;
  const phone = data.phone || 'non renseigné';

  const rows = [
    ['Nom', data.name],
    ['E-mail', data.email],
    ['Téléphone', phone],
    ['Objet', subjectLabel],
    ['Langue de réponse', languageLabel],
  ];

  const text = [
    `Nouveau message depuis le site ${siteName}`,
    '',
    ...rows.map(([label, value]) => `${label} : ${value}`),
    '',
    'Message :',
    data.message,
    '',
    `Répondez directement à cet e-mail pour écrire à ${data.name}.`,
  ].join('\n');

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:6px 16px 6px 0;color:#5c5a50;font-weight:500;white-space:nowrap">${escapeHtml(label)}</th>` +
        `<td style="padding:6px 0;color:#24251F">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;background:#F7F1E5;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F1E5;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-top:4px solid #354333">
<tr><td style="padding:24px 28px">
<p style="margin:0 0 4px;color:#8A6A35;font-size:12px;letter-spacing:2px;text-transform:uppercase">${escapeHtml(siteName)}</p>
<h1 style="margin:0 0 20px;color:#354333;font-size:20px;font-weight:600">${escapeHtml(subjectLabel)}</h1>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:20px">${htmlRows}</table>
<p style="margin:0 0 6px;color:#5c5a50;font-size:14px;font-weight:500">Message</p>
<div style="white-space:pre-wrap;color:#24251F;font-size:15px;line-height:1.6;border-left:3px solid #C59A55;padding:4px 0 4px 14px">${escapeHtml(data.message)}</div>
<p style="margin:24px 0 0;color:#5c5a50;font-size:13px">Répondez directement à cet e-mail pour écrire à ${escapeHtml(data.name)}.</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

  return {
    subject: `[${siteName}] ${subjectLabel} : ${data.name}`,
    text,
    html,
    replyTo: data.email,
  };
}
