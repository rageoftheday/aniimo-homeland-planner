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

The planner supports JSON sync files captured from Aniidex. The bookmarklet/helper runs on `aniidex.com` so it can use the user's normal signed-in browser session. The planner does not need cookies, authorization headers, Cloudflare tokens, or other account secrets.

Direct UID import from the GitHub Pages origin is retained as a capability check, but it may be blocked by Aniidex cross-origin/session requirements. The same-origin sync helper is the preferred path.

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
