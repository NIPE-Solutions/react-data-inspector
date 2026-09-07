# Website deployment

The website uses the `react-data-inspector` project in the NIPE Solutions Vercel team. The production hostname is `react-data-inspector.nipesolutions.com`.

## Build and delivery

- Repository: `NIPE-Solutions/react-data-inspector`.
- Production branch: `main`; pushes to other repository branches receive previews after verification. Pull requests run checks without receiving deployment secrets.
- Repository root is the Vercel project root. `vercel.json` runs `npm ci` and `npm run build:website`, publishing only `website/dist`.
- The `/playground` rewrite supports direct links and page reloads. Static icons retain their own URLs.
- GitHub Actions verifies React 18 and 19, TypeScript, unit/component tests, browser interactions, packaging and SSR. The final `Verified` job succeeds only when both matrix jobs pass.
- The `Deploy website` job depends on `Verified`. It builds the static website and uses the Vercel deployment API to upload only compiled assets. The deployment script waits for READY and records the resulting URL. This avoids the Vercel CLI account/team preflight that rejects project-scoped tokens ([upstream issue](https://github.com/vercel/vercel/issues/17506)). The Hobby plan does not support native Git integration for private organization repositories, so Actions owns deployment.

The GitHub `VERCEL_TOKEN` secret is scoped to this project and expires on 2027-09-07. Rotate it before expiry through Vercel and update the GitHub secret. `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are repository variables. Optional diagnostic artifact uploads are non-blocking when GitHub storage is unavailable; tests, builds and packaging remain required.

The website deployment does not publish the npm package or change its alpha classification. Application secrets are unnecessary for this static site. Keep `.vercel/` local and ignored.

## Domain

The GoDaddy DNS zone is `nipesolutions.com`. Add only the `react-data-inspector` CNAME pointing to `1f534ff4ad4b189a.vercel-dns-017.com`; preserve unrelated records. Vercel manages HTTPS after DNS verification.

## Icons

`website/public/logo.svg` is the shared source for the header, hero, and browser mark. Run `sh scripts/generate-icons.sh` with librsvg and ImageMagick installed to regenerate the 16/32/48 px favicon, 180 px Apple touch icon, and 192/512 px manifest icons. Generated assets are committed, so deployment does not require those tools.

## Verification and rollback

Check the custom hostname, a direct `/playground` URL, JavaScript/CSS asset responses, favicon and manifest after deployment. Confirm Vercel deployed the intended Git commit and the GitHub verification passed. Roll back to an earlier verified deployment in Vercel if necessary; fix the source through Git before the next production deployment.
