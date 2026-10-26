/**
 * Translation setup (i18next). Imported once in the root layout.
 * In a screen use: `const { t } = useTranslation();` then `t('auth.signIn')`.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en';

export const resources = {
  en: { translation: en },
  // bg: { translation: bg },  <- add Bulgarian here later
} as const;

// Use the phone's language if we support it, otherwise English.
const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
const language = deviceLanguage in resources ? deviceLanguage : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: language,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already protects against XSS
});

export default i18n;
