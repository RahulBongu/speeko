// Locale identifiers & per-locale helpers. UI language is English by default;
// course content can be authored in any of the listed locales.

export type Locale =
  | 'en'
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'te' // Telugu
  | 'ta' // Tamil
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'gu' // Gujarati
  | 'pa' // Punjabi (Gurmukhi)
  | 'or'; // Odia

export const INDIAN_LOCALES: readonly Locale[] = [
  'hi', 'bn', 'mr', 'te', 'ta', 'kn', 'ml', 'gu', 'pa', 'or',
] as const;

export const ALL_LOCALES: readonly Locale[] = ['en', ...INDIAN_LOCALES] as const;

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  mr: 'मराठी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  gu: 'ગુજરાતી',
  pa: 'ਪੰਜਾਬੀ',
  or: 'ଓଡ଼ିଆ',
};

export const LOCALE_SCRIPT: Record<Locale, string> = {
  en: 'Latin',
  hi: 'Devanagari',
  bn: 'Bengali',
  mr: 'Devanagari',
  te: 'Telugu',
  ta: 'Tamil',
  kn: 'Kannada',
  ml: 'Malayalam',
  gu: 'Gujarati',
  pa: 'Gurmukhi',
  or: 'Odia',
};

export const LOCALE_ENGLISH_NAME: Record<Locale, string> = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  mr: 'Marathi',
  te: 'Telugu',
  ta: 'Tamil',
  kn: 'Kannada',
  ml: 'Malayalam',
  gu: 'Gujarati',
  pa: 'Punjabi',
  or: 'Odia',
};

// Native digit sets per locale. 'en' uses ASCII digits.
export const NATIVE_DIGITS: Record<Locale, readonly string[]> = {
  en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  hi: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  bn: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
  mr: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  te: ['౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯'],
  ta: ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'],
  kn: ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'],
  ml: ['൦', '൧', '൨', '൩', '൪', '൫', '൬', '൭', '൮', '൯'],
  gu: ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'],
  pa: ['੦', '੧', '੨', '੩', '੪', '੫', '੬', '੭', '੮', '੯'],
  or: ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'],
};

export function toNativeDigits(value: number | string, locale: Locale): string {
  const digits = NATIVE_DIGITS[locale];
  return String(value).replace(/[0-9]/g, (ch) => digits[Number(ch)] ?? ch);
}

export function isIndianLocale(locale: Locale): boolean {
  return locale !== 'en';
}

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (ALL_LOCALES as readonly string[]).includes(v);
}
