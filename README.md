# شیدرلیپ

Persian, RTL podcast and management-tool library for SME managers. Uses the supplied navy/green brand and self-hosted Vazirmatn font.

## Current behavior

- Four challenge families connect concrete problems to tools and related published episodes.
- 37 verified podcast episodes from the official Acast RSS are bundled as a resilient snapshot. `GET /api/podcast` refreshes server-side with a 30-minute memory cache and falls back to the snapshot on upstream failures.
- Real MP3 enclosures play in a persistent layout player across internal navigation. Controls include seeking, speed, volume, and resume positions.
- Search, category/season filters, sorting, pagination, detail pages, bookmarks, and original CSV starter previews work.
- Bookmarks and listening progress are stored in the current browser only. No account synchronization or purchase entitlements are claimed.
- Sixteen planned products were selected from the owner's 240-product workbook. All are explicitly preparing, with proposed prices. There is no active payment or purchase-completion flow.

## Content

- `lib/data/podcast.json`: verified RSS snapshot; preserve episode IDs and durable enclosure URLs.
- `lib/data/tools.json`: curated product data, planned contents/voice, legal resource links, and clearly illustrative sample tables.
- `public/media/`: supplied logo and official podcast cover.
- `lib/site-data.ts`: shared types and topic associations. Related episode order follows editorial source priority.

Before activating sales, add the final paid files and recorded guides, implement a payment-provider verification flow and protected delivery, and replace preparing status with verified product availability. Do not mark a local bookmark as a purchase.

## Development and validation

This repository contains the complete source of the published Shiderlip website, including the podcast feed snapshot, management-tool catalog, brand assets, and font.

### Run locally

Use Node.js 22.13.0 or newer and the pnpm version pinned in `package.json`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173`. To check types and build for production:

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

The production build targets Cloudflare Workers through Vinext. `pnpm start` runs the built Worker locally; it does not publish it. The repository is source code, and pushing it to GitHub does not by itself deploy a working website on GitHub Pages. The podcast refresh API and server-rendered routes need a compatible runtime.

For updates to the existing Sites-hosted website, use the Sites setup/build/publish helpers. Preserve `.openai/hosting.json` and its existing `project_id`.

### Published website

https://shiderlip.oakenhill35.chatgpt.site

The existing hosted site's access settings are managed separately from this repository. Payments remain inactive until the paid files, voice guides, and verified payment flow are ready.

Meaningful checks completed for the first version: TypeScript, production build, RSS parser parity against all 37 source episodes, catalog source reconciliation, browser navigation/search/bookmarks/sample download, actual audio playback and navigation continuity, and narrow mobile layouts.
