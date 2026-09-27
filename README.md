# UNLOCKD

Static achievement generator, Minecraft first. Dark purple responsive editor, horizontal pixel toast, 32 real item textures, EN/RU search, custom uploads, live preview and 3× PNG export. Original basic Steam style and optional emoji mode retained.

## Run / deploy

No build or runtime dependencies. Serve this directory with any static HTTP server (for example `python3 -m http.server 8000`), then open localhost:8000. Opening index.html with file:// is not supported for catalog fetch. GitHub Pages: deploy main, repository root. All URLs are relative and support /UNLOCKD/. No workflow or Pages settings were changed.

## Structure

- index.html: accessible editor markup
- style.css: UI, responsive layout, platform toast styles
- script.js: catalog, local uploads, live preview, export
- minecraft.js: vanilla frame nine-slicing and bitmap glyph rendering
- assets/minecraft: original Java UI textures and Latin/Cyrillic glyph sheets
- items.json: versioned catalog; each item has id, names.en, names.ru, icon; optional aliases
- assets/items: local Minecraft PNGs
- assets/fonts and assets/vendor: self-hosted font/export library and licenses
- assets/ATTRIBUTION.md: provenance and usage notes
- tests/smoke.cjs: browser regression tests

To expand the catalog, add a PNG to assets/items and an entry to items.json. New localized names are automatically searchable. Keep assets local to prevent tainted-canvas errors.

## Export and limits

Minecraft defaults to the original 160 × 32 proportions, rendered at 320 × 64 for half-pixel Unicode glyphs and exported at 960 × 192 with nearest-neighbor scaling. Preview and PNG share the exact same bitmap renderer; mobile resizing cannot change exported pixels. Classic Java 1.8 frame, modern Java 1.12 frame and purple challenge heading are available. Original Latin/Cyrillic glyph sheets replace Press Start 2P. Unsupported characters use a question-mark glyph. Long titles are ellipsized with an explicit hint rather than changing vanilla proportions.

Description is off by default because vanilla achievement notifications have two lines; enable the explicitly non-vanilla extended mode to include it. Extended mode increases height and preserves frame corners. Steam retains its DOM/html2canvas exporter. Uploads: PNG/JPEG/WebP, up to 5 MiB and 16 MP; processed locally, not sent to a server.

Reference sites supplied for the redesign (minecraft-inside.ru/achievements and mocraft.ru/achievement) could not be inspected due to anti-bot protection/timeouts. The redesign therefore uses original game textures and layout rather than claiming a verified match to those sites.

## Browser tests

Install Playwright Core in your test environment and its Chromium browser/dependencies; then run `node tests/smoke.cjs` (or set NODE_PATH to your installed playwright-core parent). Tests start and stop a local server at the /UNLOCKD/ subpath. Screenshots and sample PNGs go to /tmp, not the repository.

Checks cover catalog icons, English/Russian/empty search, selection, text safety/live preview, local font, pixel-identical preview/export, 960 × 192 vanilla size, classic/modern/challenge variants, extended/empty descriptions, desktop/mobile identical exports, uploads/reset/invalid uploads, emoji, Steam, long text, responsive widths, catalog failure and JS errors.
