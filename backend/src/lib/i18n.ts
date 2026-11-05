import { z } from 'zod';

/**
 * CONVENTION:
 * Every user-facing text column in database tables (e.g. ghat names, descriptions, news articles,
 * seva types, alert messages) must be a JSONB field adhering to LocalizedText schema.
 *
 * Keys:
 * - 'en': English (Primary, required fallback)
 * - 'te': Telugu (Optional / localized)
 * - 'hi': Hindi (Optional / localized)
 */
export const LocalizedTextSchema = z.object({
  en: z.string().min(1, 'English translation is required'),
  te: z.string().optional(),
  hi: z.string().optional(),
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export type SupportedAppLanguage = 'en' | 'te' | 'hi';

/**
 * Picks the translated string for the requested language.
 * Falls back to English if the translation is missing or empty.
 */
export function pickLanguage(
  field: LocalizedText | null | undefined,
  lang: string = 'en'
): string {
  if (!field || typeof field !== 'object') {
    return '';
  }

  const normalizedLang = lang.toLowerCase().slice(0, 2) as SupportedAppLanguage;

  if (normalizedLang === 'te' && field.te && field.te.trim().length > 0) {
    return field.te;
  }

  if (normalizedLang === 'hi' && field.hi && field.hi.trim().length > 0) {
    return field.hi;
  }

  return field.en || '';
}

/**
 * Validates that all required language keys are present and non-empty.
 */
export function validateLocalized(
  field: any,
  requiredLanguages: string[] = ['en']
): { isValid: boolean; missing: string[] } {
  if (!field || typeof field !== 'object') {
    return { isValid: false, missing: requiredLanguages };
  }

  const missing: string[] = [];

  for (const lang of requiredLanguages) {
    const val = field[lang];
    if (typeof val !== 'string' || val.trim().length === 0) {
      missing.push(lang);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

