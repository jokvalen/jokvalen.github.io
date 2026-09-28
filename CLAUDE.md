# CLAUDE.md

## Project overview

Personal website for jokvalen.no, built with **Quartz v5** (not v4: config is `quartz.config.yaml`, there is no `quartz.config.ts` / `quartz.layout.ts`). Content is Markdown notes in `content/`, linked with `[[wikilinks]]`, and can be opened as an Obsidian vault. Deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to `master`.

The old Jekyll site lives in `master`'s history. Quartz upstream is the `upstream` remote (branch `v5`).

## Dev commands

```bash
npm ci                          # install dependencies (first time)
npx quartz build --serve        # local preview on http://localhost:8080 (restart after editing quartz.config.yaml)
git pull upstream v5            # update Quartz
```

## Custom code (everything else is stock Quartz)

- `quartz/static/home-graph.js` — full-size graph on the homepage (force-graph, data from `/static/contentIndex.json`). Clicking a node shows the note in an info box; "Åpne siden" only shows when the text is cut off.
- `content/index.md` — homepage intro text plus the graph markup and script tags.
- `quartz/styles/custom.scss` — homepage layout, info box, header bar, 800px note column.
- `quartz/cfg.ts` + `quartz/plugins/emitters/componentResources.ts` — added an `amplitude` analytics provider. These are core Quartz files, so expect merge conflicts here on `git pull upstream v5`.

## Decisions

- Minimal site on purpose: search, reader mode, explorer, sidebar graph, backlinks, table of contents, breadcrumbs, date and reading time are disabled. Date/reading time might come back for a future blog.
- `enableSPA: false` so the homepage graph script runs on every page load.
- Notes with `draft: true` are not published (old posts in `content/blogg/`).

## Open items

- Amplitude needs a consent banner before the site goes live (Norwegian cookie rules).
- The Amplitude key only works in the US data center, so `serverZone: US`.
- Before first deploy: repo Settings → Pages → Source → "GitHub Actions".

## Gotchas

- In Git Bash, `cd` into this folder fails because fnm's cd hook trips on `.node-version`. Use absolute paths instead.
