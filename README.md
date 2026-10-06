# Aniimo Homeland Planner

Static GitHub Pages planner for Aniimo Homeland layout, roster, production, progression, and import/sync workflows.

## Project layout

```text
index.html                         UI shell
css/app.css                       Planner styles
js/app.js                         Core planner/map/roster/advisor UI logic
js/importer.js                    Aniidex sync/import helpers
js/views.js                       Dashboard, production, suggestions, progression, and database views
data/embedded-aniidex-catalog.js  Offline reference snapshot
.github/workflows/                Validation and runner checks
```

The site is intentionally static so it can run from GitHub Pages without a backend.

## Aniidex sync

The preferred direct-sync path uses the optional Chrome/Edge companion in `extension/`. From the planner, enter an Aniimo UID and press **Import from Aniidx**. The companion performs requests in the normal `aniidex.com` browser context, uses Aniidx's own `/api/player/pass` + Cloudflare Turnstile verification when required, then returns the player profile and Homeland snapshot directly to the planner.

The planner and companion never read, export, persist, or replay Aniidx cookies, authorization headers, or Turnstile tokens. If Turnstile requires interaction, the Aniidx tab is brought forward for the user to complete the legitimate challenge.

The bookmarklet + JSON sync-file workflow remains available as a fallback.

### Load the companion

1. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this repository's `extension/` folder.
4. Refresh **Aniimo Homeland Planner**.
5. Open **Import / Sync**, enter a UID, and press **Import from Aniidx**.

## Development

Changes should be developed on a branch and validated before merging to `main`.

The self-hosted runner smoke test verifies:

- runner identity and toolchain
- access to `/mnt/nvme1/aniimo-planner-cache`
- repository checkout
- JavaScript syntax
- expected static-site files and references

The live GitHub Pages site remains on `main` until changes are merged.

## v30.9 work

- Tabbed dashboard/reference views are isolated in `js/views.js`.
- Climate coverage now uses the verified quarter-square (0.25 × 0.25) overlap threshold instead of the older half-square threshold.
