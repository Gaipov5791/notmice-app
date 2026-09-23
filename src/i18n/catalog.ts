import type { LocaleId } from './locales';
import type { AppMessages } from './messages/en';
import { enMessages } from './messages/en';

let activeLocale: LocaleId = 'en';
let activeMessages: AppMessages = enMessages;

export function setActiveI18n(locale: LocaleId, messages: AppMessages): void {
  activeLocale = locale;
  activeMessages = messages;
}

export function getActiveI18n(): { locale: LocaleId; messages: AppMessages } {
  return { locale: activeLocale, messages: activeMessages };
}
