# AA 프랜차이즈 - 쉽게하는창업 — Korea site

GitHub Pages (docs on main). App package `com.motoraa.franchisekr`, version `0.1.1 (2)`. **Korea only. Not uploaded to Google Play.** Intro, tester preparation, privacy and account-deletion pages use five languages. Korean is the default. Play links remain locked (`optInLive=false`).

## Official KFTC API data
`docs/data/brands.json` contains 11,166 records from 2025 brand-list API [15125467](https://www.data.go.kr/data/15125467/openapi.do). For 10,621, startup money is linked only when brand and legal-company name agree with the amount API [15110265](https://www.data.go.kr/data/15110265/openapi.do). `jngBzmnJngAmt`, `jngBzmnEduAmt`, `jngBzmnAssrncAmt`, `jngBzmnEtcAmt` and `smtnAmt` represent franchise, education, deposit, other costs and total respectively, in **thousand KRW**, converted to **KRW won**. Totals are sums of the API's startup components, **not a separate interior amount** and not a promise of all real opening costs. Store count, average sales and royalties are omitted because the brand-list API does not provide them. FairData interior API 15143711 is not used. All personal representative, business registration and corporate registration identifiers are discarded.

`brandMnno` is the official brand ID; `registrationNo` contains the non-personal `jnghdqrtrsMnno` headquarters-management ID, **not a disclosure-document registration number**. `firstRegistrationAt` is the API's franchise-business start date. Total cost never substitutes for royalty/sales/payback.

## Updating
- `DATA_GO_KR_SERVICE_KEY` is configured only as an Actions secret in this repo. Raw API responses are reduced to the approved fields immediately and stored in ignored cache. Never log or commit the key or raw personal identifiers.
- `node tools/weekly-refresh.mjs --force`: fetch both APIs once, with 1.6s+ jitter delays and 10,000 row total bound; validate pages, amounts, totals, matching, count and fees. Inconsistent exact-category duplicate amounts are withheld, never guessed. Never fall back to guessed amounts. Preserve the previous accurate data if API operation fails.
- Workflow: Monday 10:00 Asia/Bangkok (`0 3 * * 1`) plus manual `force`; Node checks run before a token commit; unchanged data only updates `checkedAt` so the app does not re-download the catalog.
- Local site build/tests: `node scripts/build.mjs && node --test tests/site.test.mjs`. Data can be refreshed with the key supplied privately in the shell; no secrets in files or command history. Existing generated data from an already verified local run is safe to build/test.

App repo: https://github.com/motoraathailand/aafranchise-kr
