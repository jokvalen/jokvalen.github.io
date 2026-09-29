# README #

### What is this repository for? ###

* Repo is for my [personal webpage](https://jokvalen.no)

### How do I get set up? ###

* Webpage uses [Quartz v5](https://quartz.jzhao.xyz/) to turn Markdown notes into a website.
* Content lives in `content/` and can be opened as an Obsidian vault. Link notes with `[[Note name]]`.
* Site settings (title, analytics, plugins, layout) are in `quartz.config.yaml`. Custom styles are in `quartz/styles/custom.scss`.
* Favicon is generated from `quartz/static/icon.png`.

#### To update content ####
* Install dependencies (first time): `npm ci`
* Start local server: `npx quartz build --serve` and open http://localhost:8080
* Deployment: push to `master`. The GitHub Action in `.github/workflows/deploy.yml` builds and publishes to GitHub Pages.
* Notes with `draft: true` in the frontmatter are not published.

#### To update Quartz ####
* `git pull upstream v5` (the `upstream` remote points to https://github.com/jackyzha0/quartz)
