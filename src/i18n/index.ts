/**
 * Translation setup (i18next). Imported once in the root layout.
 * In a screen use: `const { t } = useTranslation();` then `t('auth.signIn')`.
 */
// Same SQLite-backed `localStorage` the login session uses; here it remembers the chosen language.
import 'expo-sqlite/localStorage/install';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import bg from './locales/bg';
import en from './locales/en';

export const resources = {
  en: { translation: en },
  bg: { translation: bg },
} as const;

export type Language = keyof typeof resources;
export const LANGUAGES = Object.keys(resources) as Language[];

const STORAGE_KEY = 'language';

function isLanguage(value: string | null | undefined): value is Language {
  return !!value && value in resources;
}

// 1. The language the user picked before, 2. the phone's language, 3. English.
function startLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isLanguage(saved)) return saved;
  const device = getLocales()[0]?.languageCode;
  return isLanguage(device) ? device : 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: startLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already protects against XSS
});

/** Switch the whole app to another language and remember it for next time. */
export async function setLanguage(language: Language): Promise<void> {
  localStorage.setItem(STORAGE_KEY, language);
  // Every screen using `useTranslation()` re-renders with the new texts.
  await i18n.changeLanguage(language);
}

export default i18n;
