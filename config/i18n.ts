// /config/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// Import des fichiers de traduction
import fr from '../translations/fr.json';
import en from '../translations/en.json';

// Détermination de la locale par défaut (utilisateur)
const locales = getLocales();
const currentLocale = locales.length > 0 ? locales[0].languageCode : 'fr';
const fallback = 'fr'; 

// Les ressources de traduction
const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Important pour React Native
    resources,
    lng: currentLocale || fallback, 
    fallbackLng: fallback,
    interpolation: {
      escapeValue: false,
    },
    ns: ['translation'],
    defaultNS: 'translation',
  });

export default i18n;

