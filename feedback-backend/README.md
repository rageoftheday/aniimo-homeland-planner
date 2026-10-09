# Guest Suggestions backend — Cloudflare deployment

This is an opt-in service. The GitHub Pages tab displays **not yet enabled** until the following steps are completed. No private keys or access tokens belong in the repository.

## Security model

- Public users submit without an account; every suggestion and comment is **pending** until admin approval.
- Cloudflare **Turnstile** challenge is verified on the server, plus a hidden honeypot field and an IP-hash rate limit (3 submissions per hour).
- D1 persists records; public GET lists only approved suggestions and approved comments. No HTML is rendered from user text (escaped in planner UI, textContent in admin console).
- Cloudflare **Access** protects BOTH `/admin` and `/api/admin/*`. Additionally, the Worker cryptographically verifies the Access JWT signature, issuer, audience, and configured administrator email on **every** administrative request.
- Admin console is hosted by the Worker itself at `/admin` so the sign-in cookie and moderation fetches are same-origin. It supports approve/hide, status changes, lock/unlock, and permanent deletion.
- A SHA-256 hash of a salted client IP is used for short-term rate limiting; plaintext IPs are not saved. Schedule cleanup for the rate-limit table if desired.
- `SITE_ORIGIN` must match `https://rageoftheday.github.io`, not its full path. The optional `TURNSTILE_HOSTNAME` must match the public site hostname.

## One-time owner setup

1. Create a D1 database with Wrangler: `npx wrangler d1 create aniimo-feedback`. Put its generated ID into `wrangler.toml`.
2. From `feedback-backend/`, run `npm install` and `npm run db:remote` to apply `schema.sql`.
3. Register a Turnstile widget for hostname `rageoftheday.github.io`. Set the *public* site key in `js/suggestions-config.js`. Put the secret into the Worker using `npx wrangler secret put TURNSTILE_SECRET`.
4. Add a long random server-side salt with `npx wrangler secret put HASH_SALT` (not in GitHub).
5. In Cloudflare Zero Trust, create an **Access application for the deployed Worker URL**, protecting `/admin` AND `/api/admin/*` (the simpler and safer setup is protecting the admin route group with a dedicated application and confirming both paths). Allow **only your own email**. Configure `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and `ADMIN_EMAIL` in `wrangler.toml` from the exact Cloudflare Access application. Configure one-time email PIN or your preferred identity provider.
6. Deploy with `npm run deploy`. Open `<worker-base-url>/admin` in a private browsing window and **verify it requires Cloudflare Access authentication**. Try an unauthorized account and verify both the page and `/api/admin/suggestions` are denied.
7. Set public `window.PLANNER_SUGGESTIONS_API` to the HTTPS Worker base URL (without trailing slash). Commit only the public base URL and Turnstile site key; never commit secrets.
8. Test: submit a guest post → public GET **does not show it** → admin approves → public GET shows it → submit comment → invisible until approval → delete test post. Test rate limiting and spam rejection.

**Do not enable the public config before steps 1–6 are complete.** The public UI intentionally fails closed while unconfigured.

Note: Cloudflare Access policies and key provisioning cannot be set from the static GitHub repository alone. The owner must perform the Cloudflare account setup before posting/login is operational.
