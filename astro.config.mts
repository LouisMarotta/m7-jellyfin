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
                // Astro defaults `base` to "/" when unset. Normalize it so an
                // empty base stays empty and a sub-path keeps its leading slash.
                const raw = config.base ?? "";
                basePath = raw === "/" || raw === "" ? "" : raw.replace(/\/$/, "");
            },
            "astro:build:done": ({ dir }: { dir: URL }) => {
                const indexPath = new URL("index.html", dir);
                if (!fs.existsSync(indexPath)) return;
                let html = fs.readFileSync(indexPath, "utf-8");
                const from = 'window.location.replace("/" + locale + "/")';
                // When base is empty, keep the original absolute redirect.
                // When base is set (e.g. /m7-jellyfin), prefix it so the
                // redirect stays within the deployed sub-path.
                const to = basePath
                    ? `window.location.replace(${JSON.stringify(basePath)} + "/" + locale + "/")`
                    : from;
                if (html.includes(from) && to !== from) {
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
