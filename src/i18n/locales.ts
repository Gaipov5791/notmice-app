/** Supported UI languages. Polish and French join this list only after their dictionaries exist. */
export const SUPPORTED_LOCALES = [
  { id: 'en', code: 'EN', label: 'English' },
  { id: 'de', code: 'DE', label: 'Deutsch' },
] as const;

export type LocaleId = (typeof SUPPORTED_LOCALES)[number]['id'];

export const DEFAULT_LOCALE: LocaleId = 'en';

export const LOCALE_STORAGE_KEY = 'notmice.locale';

export function isLocaleId(value: string | null): value is LocaleId {
  return SUPPORTED_LOCALES.some((locale) => locale.id === value);
}
