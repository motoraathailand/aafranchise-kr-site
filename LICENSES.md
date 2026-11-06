# Third-party licences (aafranchise-site)
- Icons: Lucide (https://lucide.dev), ISC licence; a few icons derive from Feather (MIT). Inlined as SVG in `scripts/build.mjs`.
- Fonts (IBM Plex Sans, IBM Plex Sans Thai): SIL Open Font License 1.1, files in `src/assets/fonts`. Korean / Chinese / Hindi use the phone's own fonts.
- QR code: qrcode-generator (MIT), `scripts/qrcode.mjs`.
- Motion CSS/JS: own code (shared AA motion standard), byte copies of /workspace/shared/motion.
- App screenshots: AA Calc's own screens.

# App update file (read by the AA Calc app once `update.configUrl` is set in the app)
- `docs/app/version.json` -> `{ "latestVersionCode": N, "minVersionCode": M }`. Raise latestVersionCode ONLY after that build is live on Google Play.
  Edit `src/app/version.json`, run `node scripts/build.mjs`, commit, push. (Not wired into the app yet: `update.configUrl` is empty in app-config.js; the Play In-App Update check works without it.)
