import fs from 'node:fs';
import { buildCatalog } from './api-catalog.mjs';
import { groupFor } from './scraper-lib.mjs';
const cache='tools/data/cache';
const load=(kind)=>fs.readdirSync(cache).filter(f=>new RegExp(`^api-${kind}-(\\d+)-(\\d+)\\.json$`).test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).flatMap(f=>JSON.parse(fs.readFileSync(`${cache}/${f}`,'utf8')).records);
const rows=load('brand'); if(rows.length<100)throw new Error('Use npm run scrape with the approved secret first; never fabricate API brand rows');
const oi=process.argv.indexOf('--out');const out=oi>=0?process.argv[oi+1]:'web/data/brands.json';if(!out||out.startsWith('--'))throw new Error('--out path required');
const data=buildCatalog(rows,load('money'),{groupFor,version:Number(process.env.DATA_VERSION||new Date().toISOString().slice(0,10).replaceAll('-',''))});
fs.mkdirSync(out.substring(0,out.lastIndexOf('/'))||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify(data));
console.log(`Built ${data.brands.length} API brands; ${data.meta.coverage.withTotalInvestment} matched KFTC startup totals. Money fields retain spec-approved fields only.`);

const metaPath='.next-meta.json'; const text=fs.readFileSync(out,'utf8');const{makeMeta}=await import('./weekly-lib.mjs');fs.writeFileSync(metaPath,JSON.stringify(makeMeta(data,text),null,1)+'\n');
