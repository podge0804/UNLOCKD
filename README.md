# UNLOCKD

Static achievement generator, Minecraft first. Dark purple responsive editor, horizontal pixel toast, 32 real item textures, EN/RU search, custom uploads, live preview and 3× PNG export. Original basic Steam style and optional emoji mode retained.

## Run / deploy

No build or runtime dependencies. Serve this directory with any static HTTP server (for example `python3 -m http.server 8000`), then open localhost:8000. Opening index.html with file:// is not supported for catalog fetch. GitHub Pages: deploy main, repository root. All URLs are relative and support /UNLOCKD/. No workflow or Pages settings were changed.

## Structure

- index.html: accessible editor markup
- style.css: UI, responsive layout, platform toast styles
- script.js: catalog, local uploads, live preview, export
- items.json: versioned catalog; each item has id, names.en, names.ru, icon; optional aliases
- assets/items: local Minecraft PNGs
- assets/fonts and assets/vendor: self-hosted font/export library and licenses
- assets/ATTRIBUTION.md: provenance and usage notes
- tests/smoke.cjs: browser regression tests

To expand the catalog, add a PNG to assets/items and an entry to items.json. New localized names are automatically searchable. Keep assets local to prevent tainted-canvas errors.

## Export and limits

Minecraft width: 520 CSS pixels → 1560 PNG pixels. Height adapts to text without clipping; description can be empty. Preview scales down on phones, export does not. Icon pixels are preserved at export resolution. Uploads: PNG/JPEG/WebP, up to 5 MiB and 16 MP; processed locally, not sent to a server. Toast is inspired by Minecraft with an additional description, not an exact vanilla UI reproduction.

## Browser tests

Install Playwright Core in your test environment and its Chromium browser/dependencies; then run `node tests/smoke.cjs` (or set NODE_PATH to your installed playwright-core parent). Tests start and stop a local server at the /UNLOCKD/ subpath. Screenshots and sample PNGs go to /tmp, not the repository.

Checks cover catalog icons, English/Russian/empty search, selection, text safety/live preview, local font, desktop/mobile identical exports, uploads/reset/invalid uploads, emoji, Steam, long text, responsive widths, catalog failure and JS errors.
