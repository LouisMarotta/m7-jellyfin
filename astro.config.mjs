// @ts-check
import i18n from "@mannisto/astro-i18n";
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
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
