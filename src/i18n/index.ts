// Configuração i18n com suporte a locales
import ptBR from '@/locales/pt-BR.json';
import en from '@/locales/en.json';

export const defaultLocale = 'pt-BR';
export const supportedLocales = ['pt-BR', 'en'] as const;
export type Locale = typeof supportedLocales[number];

const translations: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  'en': en,
};

let currentLocale: Locale = defaultLocale;

export function setLocale(locale: Locale): void {
  if (supportedLocales.includes(locale)) {
    currentLocale = locale;
    localStorage.setItem('locale', locale);
  }
}

export function getLocale(): Locale {
  const saved = localStorage.getItem('locale') as Locale;
  if (saved && supportedLocales.includes(saved)) {
    currentLocale = saved;
  }
  return currentLocale;
}

export function t(key: string, locale?: Locale): string {
  const loc = locale || currentLocale;
  const keys = key.split('.');
  let value: any = translations[loc];
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  return value || key;
}

export default { defaultLocale, supportedLocales, setLocale, getLocale, t };
