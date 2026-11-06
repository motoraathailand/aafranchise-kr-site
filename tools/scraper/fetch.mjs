import fs from 'node:fs';
import { LIST, parseBrandList, politeFetch } from './scraper-lib.mjs';
const limit = Number(process.env.FTC_LIMIT || 300);
const html = await politeFetch(`${LIST}?pageUnit=${limit}&pageIndex=1`);
const rows = parseBrandList(html);
if (rows.length < Math.min(limit, 100)) throw new Error(`KFTC returned only ${rows.length} usable rows`);
fs.mkdirSync('tools/data/cache', { recursive: true }); fs.writeFileSync('tools/data/cache/latest-list.html', html);
const fetchedAt=new Date().toISOString();fs.writeFileSync('tools/data/cache/listing-meta.json',JSON.stringify({fetchedAt,listedAt:fetchedAt.slice(0,10)}));
if(fs.existsSync('docs/data/brands.json')){const p=JSON.parse(fs.readFileSync('docs/data/brands.json'));p.meta.generatedAt=fetchedAt;p.meta.asofMax=fetchedAt.slice(0,10);p.brands.forEach(b=>{const s=b.sources.find(x=>x.id==='kftc');if(s){s.fetchedAt=fetchedAt;s.asof=fetchedAt.slice(0,10)}});fs.writeFileSync('docs/data/brands.json',JSON.stringify(p));}
console.log(`KFTC public catalog: ${rows.length} rows cached; a later API run can enrich exact fields.`);
