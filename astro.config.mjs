// @ts-check
import i18n from "@mannisto/astro-i18n";
import { defineConfig } from 'astro/config';

// https://astro.build/config
let base = process?.env?.CI 
    ? '/m7-jellyfin' 
    : '';
export default defineConfig({
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
