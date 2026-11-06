# AA 프랜차이즈 - 쉽게하는창업 — Korea site

GitHub Pages (docs on main). App package `com.motoraa.franchisekr`, version `0.1.0 (1)`. **Korea only. Never uploaded to Google Play by this setup.** Intro, tester preparation, privacy and account-deletion pages use five languages. Korean is the default. Play links are locked (`optInLive=false`); do not turn them on until a real release exists.

## Official KFTC data
`docs/data/brands.json` contains **300 real Korean brands** from the public `가맹사업정보제공시스템` information-disclosure list. Only verified company, brand, industry, registration number and initial registration date are recorded, plus source URL and fetched/as-of dates. **No guessed franchise fee, investment, royalty, sales or store count.** Aggregate category totals are never presented as brand values and personal representative names are discarded.

- Source: https://franchise.ftc.go.kr/mnu/00013/program/userRqst/list.do
- `node tools/weekly-refresh.mjs` requests robots first, uses identifying UA, a 1.6 s+ jitter delay, bounded public listing only, retries, exits on errors/blocks. Cache is local and ignored.
- `tools/scraper/enrich-api.mjs` is an **optional initial integration**. Exact money can be added only with the user's own `DATA_GO_KR_SERVICE_KEY` and checked official API field mappings. Current API enrichment fetches but does not apply unverified mappings; no key is included.
- Workflow: Monday 10:00 Bangkok (`0 3 * * 1`) plus manual `force`. Checks run before commit with `GITHUB_TOKEN`; unchanged data updates `checkedAt` heartbeat only so apps do not re-download.

Run `node scripts/build.mjs && node --test tests/site.test.mjs`. App repo: https://github.com/motoraathailand/aafranchise-kr
