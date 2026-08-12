import en from "../locales/en.json";
import it from "../locales/it.json";

const translations: Record<string, Record<string, string>> = {
    en,
    it,
};

export const defaultLocale = "en";

export function translate(locale: string, key: string): string {
    const dict = translations[locale] ?? translations[defaultLocale];
    return dict?.[key] ?? translations[defaultLocale]?.[key] ?? key;
}

export function getT(locale: string): (key: string) => string {
    return (key: string) => translate(locale, key);
}
