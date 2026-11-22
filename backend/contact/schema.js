import { z } from 'zod';

/** Subjects the visitor can pick. The keys are what the browser sends. */
export const SUBJECTS = ['reservation', 'event', 'information', 'other'];
export const LANGUAGES = ['fr', 'ar', 'en'];

export const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 254,
  phoneMax: 25,
  messageMin: 10,
  messageMax: 2000,
};

// Removes control characters (including line breaks) from single-line fields,
// so nothing can be smuggled into the email subject or headers.
const singleLine = (s) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

/** Server-side validation for POST /api/contact. Every field is checked here, whatever the browser did. */
export const contactSchema = z.strictObject({
  name: z.string().transform(singleLine).pipe(z.string().min(LIMITS.nameMin).max(LIMITS.nameMax)),
  email: z.string().trim().max(LIMITS.emailMax).pipe(z.email()),
  phone: z
    .string()
    .transform(singleLine)
    .pipe(
      z.union([
        z.literal(''),
        // Digits with optional +, spaces, dots, dashes and brackets; 6 to 15 digits in total.
        z
          .string()
          .max(LIMITS.phoneMax)
          .regex(/^\+?[\d\s().-]+$/)
          .refine((v) => {
            const digits = v.replace(/\D/g, '').length;
            return digits >= 6 && digits <= 15;
          }),
      ]),
    )
    .optional()
    .default(''),
  subject: z.enum(SUBJECTS),
  // Keeps line breaks but removes other control characters.
  message: z
    .string()
    .transform((s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim())
    .pipe(z.string().min(LIMITS.messageMin).max(LIMITS.messageMax)),
  language: z.enum(LANGUAGES),
  // Honeypot: hidden from people, often filled in by bots. Checked in the route.
  website: z.string().max(200).optional().default(''),
});

/** Returns the names of the fields that failed validation, e.g. ['email', 'message']. */
export function invalidFields(error) {
  const fields = new Set();
  for (const issue of error.issues) {
    // Unknown keys are reported on the object itself; name them so the client can ignore them.
    if (issue.code === 'unrecognized_keys') issue.keys.forEach((k) => fields.add(k));
    else if (issue.path.length) fields.add(String(issue.path[0]));
  }
  return [...fields];
}
