import fs from 'node:fs';
import crypto from 'node:crypto';
const index=process.argv.indexOf('--bundle');const file=index>=0?process.argv[index+1]:'docs/data/brands.json';if(!file)throw new Error('--bundle needs a path');
if(!process.argv.includes('--bundle')){
 for(const f of ['src/strings.mjs','src/content.mjs','tools/scraper/api-catalog.mjs','tools/scraper/build-brands.mjs','tools/scraper/fetch.mjs','tools/scraper/weekly-lib.mjs','tools/web/data-validate.js','tools/weekly-refresh.mjs'])if(!fs.existsSync(f))throw new Error('Missing publication tool '+f);
}
const data=JSON.parse(fs.readFileSync(file,'utf8'));if(data.brands.length!==data.meta.count)throw new Error('Catalog count mismatch');
if(data.meta.currency!=='KRW'||data.meta.referenceYear!==2025)throw new Error('Wrong year/currency');
const c=data.meta.coverage;for(const k of ['withFranchiseFee','withEducationFee','withDeposit','withOtherStartupCost','withTotalInvestment','withBranches','withAverageSales','withRoyalty'])if(!Number.isInteger(c[k]))throw new Error('Missing coverage '+k);
if(data.meta.conflictingAmountRows!==undefined)throw new Error('Conflicting amounts cannot be published');
const seen=new Set();for(const b of data.brands){if(!/^kr\d{4,20}(?:\.[a-f0-9]{16})?$/.test(b.id)||seen.has(b.id))throw new Error('Brand ID rejected');seen.add(b.id);if(!b.brandMnno||!b.sources?.length||!b.registrationKind)throw new Error('Incomplete provenance');for(const forbidden of ['royalty','branches','averageSales','interiorCost','representative'])if(forbidden in b)throw new Error('Unconfirmed field '+forbidden);if(b.totalInvestment){for(const k of ['franchiseFee','educationFee','deposit','otherStartupCost','totalInvestment'])if(!Number.isSafeInteger(b[k]?.min)||b[k].min<0)throw new Error('Bad monetary amount');if(b.totalInvestment.min!==b.franchiseFee.min+b.educationFee.min+b.deposit.min+b.otherStartupCost.min)throw new Error('Official component sum mismatch');}}
if(!process.argv.includes('--bundle')){const meta=JSON.parse(fs.readFileSync('docs/data/meta.json','utf8')),text=fs.readFileSync(file,'utf8');if(meta.bytes!==Buffer.byteLength(text)||meta.sha256!==crypto.createHash('sha256').update(text).digest('hex'))throw new Error('Public metadata hash mismatch');if(JSON.stringify(meta.coverage)!==JSON.stringify(c))throw new Error('Public metadata coverage mismatch');}
console.log(JSON.stringify({count:data.brands.length,coverage:c,version:data.meta.version}));
