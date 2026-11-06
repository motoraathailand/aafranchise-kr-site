import fs from 'node:fs';
import { LIST, parseBrandList, politeFetch } from './scraper-lib.mjs';
const limit = Number(process.env.FTC_LIMIT || 300);
const html = await politeFetch(`${LIST}?pageUnit=${limit}&pageIndex=1`);
const rows = parseBrandList(html);
if (rows.length < Math.min(limit, 100)) throw new Error(`KFTC returned only ${rows.length} usable rows`);
fs.mkdirSync('tools/data/cache', { recursive: true }); fs.writeFileSync('tools/data/cache/latest-list.html', html);
console.log(`KFTC public catalog: ${rows.length} rows cached; a later API run can enrich exact fields.`);
