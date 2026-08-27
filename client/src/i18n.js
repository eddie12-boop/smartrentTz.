import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav.properties": "Properties",
      "nav.about": "About Us",
      "nav.contact": "Contact",
      "nav.login": "Log in",
      "nav.signup": "Sign up",
      "hero.title1": "FIND A PLACE",
      "hero.title2": "YOU'LL LOVE TO CALL HOME.",
      "hero.subtitle": "Discover verified properties, connect with trusted landlords and manage your rental experience from one platform.",
      "search.placeholder": "Where? (e.g. Masaki, Upanga)",
      "search.type": "Property Type",
      "search.button": "Search",
      "footer.desc": "Find. Rent. Manage. Live Smarter. The modern PropTech platform for Tanzania.",
      "footer.company": "Company",
      "footer.terms": "Terms of Service"
    }
  },
  sw: {
    translation: {
      "nav.properties": "Nyumba Zetu",
      "nav.about": "Kuhusu Sisi",
      "nav.contact": "Mawasiliano",
      "nav.login": "Ingia",
      "nav.signup": "Jisajili",
      "hero.title1": "TAFUTA MAHALI",
      "hero.title2": "UTAKAPOPENDA KUITA NYUMBANI.",
      "hero.subtitle": "Gundua nyumba zilizothibitishwa, ungana na wamiliki waaminifu na usimamie upangaji wako kupitia jukwaa moja.",
      "search.placeholder": "Wapi? (mf. Masaki, Upanga)",
      "search.type": "Aina ya Nyumba",
      "search.button": "Tafuta",
      "footer.desc": "Tafuta. Panga. Simamia. Ishi Kijanja. Jukwaa la kisasa la nyumba kwa Tanzania.",
      "footer.company": "Kampuni",
      "footer.terms": "Vigezo na Masharti"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
