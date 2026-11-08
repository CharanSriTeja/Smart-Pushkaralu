import { LocalizedString } from '../types/ghats';
import { SupportedLanguage } from '../i18n';

/**
 * Extracts the user's localized text from a multi-language JSON field {en, te, hi}.
 * Strictly falls back to English when the selected language string is missing or empty.
 */
export function getLocalizedText(
  field?: LocalizedString | string | null,
  lang: SupportedLanguage = 'en'
): string {
  if (!field) return '';
  if (typeof field === 'string') return field;

  if (lang === 'te' && field.te && field.te.trim().length > 0) {
    return field.te;
  }

  if (lang === 'hi' && field.hi && field.hi.trim().length > 0) {
    return field.hi;
  }

  return field.en || Object.values(field)[0] || '';
}

/**
 * Format date for display in the pilgrim's chosen locale
 */
export function formatVerifiedDate(dateString?: string | null, lang: string = 'en'): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

