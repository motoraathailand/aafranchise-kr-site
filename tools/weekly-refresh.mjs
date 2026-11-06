import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
import {decodeTextDeep} from './scraper/text-entities.mjs';
import {diffData,sanity,makeMeta} from './scraper/weekly-lib.mjs';
let prev={meta:{version:0},brands:[]};
const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),D=path.join(ROOT,'docs/data'),T=path.join(ROOT,'.next-brands.json'),args=process.argv.slice(2),dry=args.includes('--dry-run'),force=args.includes('--force')||process.env.FORCE==='true';
prev=fs.existsSync(path.join(D,'brands.json'))?decodeTextDeep(JSON.parse(fs.readFileSync(path.join(D,'brands.json')))):{meta:{version:0},brands:[]};
if(!prev.meta.scope?.includes('KFTC'))prev={meta:{version:0},brands:[]};
const run=a=>{const r=spawnSync(process.execPath,a,{cwd:ROOT,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)};
if(!args.includes('--no-scrape'))run(['tools/scraper/fetch.mjs']);
run(['tools/scraper/build-brands.mjs','--out',T]);
run(['tools/check-publication.mjs','--bundle',T]);let next=JSON.parse(fs.readFileSync(T));
const requested=Number(process.env.DATA_VERSION||new Date().toISOString().slice(0,10).replaceAll('-',''));
const dated=String(requested).length===8?requested*100+1:requested;
next={...next,meta:{...next.meta,version:Math.max(dated,prev.meta.version+1)}};
const errs=sanity(prev,next);if(errs.length){console.error(errs.join('\n'));process.exit(1)}
const d=diffData(prev,next),changed=d.any||force,text=JSON.stringify(next),checkedAt=new Date().toISOString(),m=makeMeta(next,text,checkedAt);
if(!changed){m.version=prev.meta.version;m.generatedAt=prev.meta.generatedAt;m.asofMax=prev.meta.asofMax;m.sha256=makeMeta(prev,JSON.stringify(prev)).sha256}
fs.mkdirSync(D,{recursive:true});const log={changed,version:changed?next.meta.version:prev.meta.version,count:next.brands.length,checkedAt,heartbeat:true};
if(!dry){if(changed){fs.writeFileSync(path.join(D,'brands.json'),text);fs.writeFileSync(path.join(D,'meta.json'),JSON.stringify(m,null,1)+'\n')}else{const old=JSON.parse(fs.readFileSync(path.join(D,'meta.json')));fs.writeFileSync(path.join(D,'meta.json'),JSON.stringify({...old,checkedAt},null,1)+'\n')}}
log.message=changed?`KFTC catalog: ${next.brands.length} verified brands, v${next.meta.version}`:`KFTC catalog unchanged (v${m.version}), heartbeat ${checkedAt}`;
console.log(JSON.stringify(log));if(process.env.GITHUB_OUTPUT)for(const[k,v]of Object.entries(log))fs.appendFileSync(process.env.GITHUB_OUTPUT,`${k}=${v}\n`);
