// @ts-check
import fs from "node:fs";
import i18n from "@mannisto/astro-i18n";
import { defineConfig } from 'astro/config';
import type { AstroConfig, AstroIntegration } from "astro";

// https://astro.build/config
let isCi = process?.env?.CI;
let site = isCi
    ? 'https://louismarotta.github.io'
    : undefined;
let base = isCi 
    ? '/m7-jellyfin' 
    : '';

function fixRootRedirect(): AstroIntegration {
    let basePath = "";
    return {
        name: "fix-root-redirect",
        hooks: {
            "astro:config:setup": ({ config }: { config: AstroConfig }) => {
                basePath = config.base ?? "";
            },
            "astro:build:done": ({ dir }: { dir: URL }) => {
                const indexPath = new URL("index.html", dir);
                if (!fs.existsSync(indexPath)) return;
                let html = fs.readFileSync(indexPath, "utf-8");
                const from = 'window.location.replace("/" + locale + "/")';
                const to = `window.location.replace(${JSON.stringify(basePath)} + "/" + locale + "/")`;
                if (html.includes(from)) {
                    html = html.replace(from, to);
                    fs.writeFileSync(indexPath, html);
                }
            },
        },
    };
}

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
        fixRootRedirect(),
    ],
});
