import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

/**
 * Localisation for Best Legacy Divine School.
 *
 * Audience: parents in Mowe, Ogun State + nearby Lagos.
 * - English: working language of the school + government
 * - Yoruba: dominant local language for older relatives + grandparents
 * - Nigerian Pidgin: extremely common across all classes; tests well in usability
 *
 * NB: 'pcm' is the IETF code for Nigerian Pidgin. Keep that spelling.
 */
const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        about: 'About',
        admissions: 'Admissions',
        gallery: 'Gallery',
        virtual_tour: 'Virtual Tour',
        contact: 'Contact',
        signin: 'Sign in',
        apply: 'Apply Now',
      },
    },
  },
  yo: {
    translation: {
      nav: {
        home: 'Ilé',
        about: 'Nípa Wa',
        admissions: 'Ìforúkọsílẹ̀',
        gallery: 'Àwọn Àwòrán',
        virtual_tour: 'Ìbẹ̀wò Tó Ní Èlò',
        contact: 'Bá Wa Sọ̀rọ̀',
        signin: 'Wọlé',
        apply: 'Forúkọ Sílẹ̀',
      },
    },
  },
  pcm: {
    translation: {
      nav: {
        home: 'Home',
        about: 'About Us',
        admissions: 'Admission',
        gallery: 'Photos',
        virtual_tour: 'School Tour',
        contact: 'Talk to Us',
        signin: 'Sign in',
        apply: 'Apply Now',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'yo', 'pcm'],
    interpolation: { escapeValue: false },
  });

export default i18n;
