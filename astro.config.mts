// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
let isCi = process?.env?.CI;
let site = isCi
    ? 'https://louismarotta.github.io'
    : undefined;
let base = isCi 
    ? '/m7-jellyfin' 
    : '';

export default defineConfig({
    outDir: './dist',
    site: site,
    base: base,
    i18n: {
        defaultLocale: "en",
        locales: ["en", "it"],
        routing: {
            prefixDefaultLocale: true,
        },
    },
});
