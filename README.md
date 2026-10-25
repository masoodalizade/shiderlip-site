# شیدرلیپ — Shiderlip

Persian RTL podcast and management-tool library for SME managers, published at https://shiderlip.ir.

## Public website

The existing navy/green design, self-hosted Vazirmatn font, 37 official podcast episodes, and 16 initial tools are retained. The layout player persists across navigation, remembers listening progress locally, and supports seeking, playback speed, volume, and next episode. Search, topic filters, saved tools/episodes, detail pages, and original CSV sample downloads are functional.

The public website is a static React application with prerendered HTML for each initial route. GitHub Pages publishes the repository root, where `index.html`, route folders, compiled `assets/site/`, and `.nojekyll` are committed. No change to the current domain or branch publishing source is required. The GitHub repository remains the source of truth.

## Content management

Open https://shiderlip.ir/admin/.

The admin edits page titles, introductions, About text, images, links, tools, prices, sample tables, sources, and podcast descriptions. Products can be hidden or added. Finished free tools can expose public downloads; unfinished products remain visibly in preparation. All content updates are committed atomically to `main` and trigger the existing Pages publication.

Authentication uses a repository-scoped GitHub fine-grained personal access token. Select only `masoodalizade/shiderlip-site`, grant **Contents: Read and write**, and optionally **Actions: Read and write** for manual RSS refresh. The admin page contains the setup guide and token creation link. The token exists only in memory, is sent only to `api.github.com`, and is cleared when leaving the editor or logging out. It is never written to localStorage, sessionStorage, the repository, or a URL.

Concurrent edits are checked before publication; non-fast-forward updates are rejected rather than overwriting other changes. Content validation rejects unsafe URL schemes, duplicate route IDs, and free products without a download. Public uploads must not contain paid files or personal/private data. Browser bookmarks and progress are local convenience data, not purchase entitlements.

### Content files

- `content/settings.json`: page copy, branding, contact links, and SEO description.
- `content/tools.json`: product catalog, status, public files, sample tables, and resources.
- `content/podcast.json`: verified snapshot of the official Acast RSS.
- `content/editorial.json`: per-episode editorial overrides and visibility. RSS refreshes preserve these overrides.

The admin provides a JSON backup download. Source-controlled history is available in GitHub for recovery.

## Podcast RSS

Official feed: https://feeds.acast.com/public/shows/shiderlip

The feed does not allow browser CORS, so it is fetched by `.github/workflows/sync-rss.yml` every six hours and on manual dispatch. The workflow validates the source, keeps durable enclosure URLs, adds public HTML shells for new episodes, updates the snapshot, and explicitly requests a Pages build after the bot commit. A large unexpected episode-count decrease stops the refresh and preserves existing content.

## Development

Node.js 22.13.0+ and pnpm 11.25.0 (as pinned in `package.json`).

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The browser entry is `static-src/site-app.tsx`; shared experiences and the player are in `components/`. `vite.pages.config.ts` provides lightweight navigation adapters so the established components can run on static hosting while preserving the player.

```bash
pnpm exec tsc --noEmit
pnpm test:cms
pnpm build:pages
```

`pnpm build:pages` generates `pages-dist/`. `pnpm publish:pages` also refreshes committed public files at the repository root. Commit source and generated files together when changing application code. Ordinary admin changes update public content JSON directly and do not need a JavaScript rebuild.

The original Vinext/Workers starter files are retained for future server functionality; `dev:sites` and `build:sites` access that build path. `.openai/hosting.json` retains the original Sites identity. It is separate from the current GitHub Pages deployment.

## Before paid sales

The catalog currently describes planned products and clearly labeled starter samples. Paid sales require the actual finished files and recorded guides, a payment-provider integration, server-side payment verification, and private delivery. Public repository uploads must never be treated as protected paid delivery.

## Verification

CMS tests cover authenticated authorization failures, Persian Unicode, atomic Git commits, concurrent edits, safe URLs, product uniqueness, new routes, preservation of RSS versus editorial content, and RSS parsing. Production builds prerender all initial routes and preserve real MP3 enclosure URLs. No credentials are included in source or public assets.
