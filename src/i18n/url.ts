import { getRelativeLocaleUrl, pathHasLocale } from "astro:i18n";

/**
 * Returns a base-aware, locale-prefixed URL for the given locale and path.
 * Wraps Astro's built-in `getRelativeLocaleUrl`, which automatically accounts
 * for the `base` option (e.g. `/m7-jellyfin`).
 */
export function localeUrl(locale: string, path = "/"): string {
    return getRelativeLocaleUrl(locale, path);
}

/**
 * Strips the base and locale prefix from a URL pathname, returning the path
 * relative to the locale root. Used to build language-switcher links.
 *
 * Example: "/m7-jellyfin/en/install/linux/" -> "/install/linux/"
 */
export function stripLocaleFromPath(pathname: string): string {
    const locales = ["en", "it"];
    const segments = pathname.split("/").filter(Boolean);
    // Drop the base segment if present (first segment that isn't a locale).
    if (segments.length > 0 && !locales.includes(segments[0])) {
        segments.shift();
    }
    // Drop the locale segment.
    if (segments.length > 0 && locales.includes(segments[0])) {
        segments.shift();
    }
    const trailing = pathname.endsWith("/") ? "/" : "";
    return "/" + segments.join("/") + trailing;
}
