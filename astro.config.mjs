// @ts-check
import i18n from "@mannisto/astro-i18n";
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
    integrations: [
        i18n({
            defaultLocale: "en",
            locales: [
                { code: "en", name: "English", 'endonym': 'English' },
                { code: "it", name: "Italian", 'endonym': 'Italiano' },
            ],
            mode: 'static',
            translations: './src/locales/'
        }),
    ],
});
