# CLAUDE.md

## Project overview

Personal website for jokvalen.no, built with **Quartz v5** (not v4: config is `quartz.config.yaml`, there is no `quartz.config.ts` / `quartz.layout.ts`). Content is Markdown notes in `content/`, linked with `[[wikilinks]]`, and can be opened as an Obsidian vault. Deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to `master`.

The old Jekyll site lives in `master`'s history. Quartz upstream is the `upstream` remote (branch `v5`).

## Dev commands

```bash
npm ci                          # install dependencies (first time)
npx quartz build --serve        # local preview on http://localhost:8080 (restart after editing quartz.config.yaml)
git pull upstream v5            # update Quartz
npm run images                  # regenerate favicon + social card (scripts/og/make-images.mjs)
```

## Custom code (everything else is stock Quartz)

- `quartz/static/home-graph.js` — full-size graph on the homepage (force-graph, data from `/static/contentIndex.json`). Clicking a node shows the note in an info box; "Åpne siden" only shows when the text is cut off.
- `content/index.md` — homepage intro text plus the graph markup and script tags.
- `quartz/styles/custom.scss` — homepage layout, info box, header bar, 800px note column.
- `quartz/cfg.ts` + `quartz/plugins/emitters/componentResources.ts` — added an `amplitude` analytics provider, and a script that makes dark mode the default. These are core Quartz files, so expect merge conflicts here on `git pull upstream v5`.
- `quartz/components/Head.tsx` (core file, expect merge conflicts) — canonical link, homepage URL as `/` (not `/index`), `og:locale`, `og:type=profile` on Om meg, no title suffix on the homepage, `seoTitle` frontmatter override, and JSON-LD from `quartz/components/structuredData.ts` (WebSite + Person on the homepage, ProfilePage on Om meg). Keep the Person facts there in sync with `content/Om meg.md` and `content/llms.txt`.
- `content/robots.txt` and `content/llms.txt` — copied as-is to the site root.

## Decisions

- Minimal site on purpose: search, reader mode, explorer, sidebar graph, backlinks, table of contents, breadcrumbs, date and reading time are disabled. Date/reading time might come back for a future blog.
- `enableSPA: false` so the homepage graph script runs on every page load.
- Notes with `draft: true` are not published (old posts in `content/blogg/`).
- Meta descriptions: use `socialDescription` frontmatter, not `description` (note-properties would show `description` on the page). Only needed where the first paragraph makes a poor description, e.g. hub pages that are just link lists.
- Old Jekyll URLs (`/om/`, `/2013/06/06/….html` etc.) redirect via `aliases` frontmatter. `aliases` is left out of note-properties' visible fields for that reason.
- Social previews: the og-image plugin is off; every page shares one dark PNG card, `quartz/static/og-image.png` (PNG because LinkedIn handles WebP unreliably). The favicon (`quartz/static/icon.png`, also used for `favicon.ico`) is a small node graph matching the card.
- Titles: `pageTitleSuffix` is " – Jo Kvalen" (the name on LinkedIn); the homepage uses `seoTitle` instead.
- Name: "Jo Aleksander Bakke Kvalen" is the main name, "Jo Kvalen" the alternate (JSON-LD `alternateName`). Employers appear only as background; client work is described by industry.

## Open items

- Analytics is off (`analytics: null`) until there is a consent banner (Norwegian cookie rules). The Amplitude settings are kept, commented out, in quartz.config.yaml.
- The Amplitude key only works in the US data center, so `serverZone: US`.
- Before first deploy: repo Settings → Pages → Source → "GitHub Actions".

## Gotchas

- In Git Bash, `cd` into this folder fails because fnm's cd hook trips on `.node-version`. Use absolute paths instead.
