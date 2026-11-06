import { createHash } from 'node:crypto';
export { validateData, MAX_DROP, GROUPS } from '../web/data-validate.js';
export function normBrand(b) { const n = JSON.parse(JSON.stringify(b)); if (Array.isArray(n.sources)) n.sources = n.sources.map(({fetchedAt, ...s}) => s); if (n.fieldSources) n.fieldSources = Object.fromEntries(Object.entries(n.fieldSources).map(([k,v])=>[k,Array.isArray(v)?v.map(({fetchedAt,...s})=>s):v])); return JSON.stringify(n); }
export function diffData(oldD,newD) { const same=(a,b)=>normBrand(a)===normBrand(b); const old=new Map(oldD.brands.map(b=>[b.id,b])), now=new Map(newD.brands.map(b=>[b.id,b])); const added=[...now.keys()].filter(k=>!old.has(k)), removed=[...old.keys()].filter(k=>!now.has(k)),changed=[...now.keys()].filter(k=>old.has(k)&&!same(old.get(k),now.get(k))); return {added,removed,changed,any:!!(added.length+removed.length+changed.length)}; }
export function sanity(oldD,newD,stats=null) {
 const errors=[];
 if (!newD?.meta || !/^kr\d{4,20}$/.test(newD.brands?.[0]?.id || '')) errors.push('invalid Korean data');
 if (newD.brands.length<100) errors.push('too few brands'); if (newD.brands.length<oldD.brands.length*.9) errors.push('brand count dropped too much');
 if (newD.meta.version<=oldD.meta.version) errors.push('version not increased');
 for(const k of ['withRoyalty','withBranches','withFranchiseFee','withTotalInvestment'])if(Number(newD.meta.coverage?.[k]||0)<Number(oldD.meta.coverage?.[k]||0)*.85)errors.push('coverage '+k+' dropped');
 if(newD.meta.feeCoverageRequired!==false&&newD.brands.filter(b=>b.franchiseFee?.min!=null||b.totalInvestment?.min!=null).length<newD.brands.length*.5)errors.push('empty-fees');
 if(newD.meta.asofMax<oldD.meta.asofMax)errors.push('asofMax went backwards');
 if(stats?.problems>0)errors.push('parse problems'); if(stats?.stale>0)errors.push('incomplete scrape'); return errors;
}
export function makeMeta(data,text,checkedAt) { const m={version:data.meta.version,count:data.brands.length,generatedAt:data.meta.generatedAt,asofMax:data.meta.asofMax,feeCoverageRequired:data.meta.feeCoverageRequired===true,bytes:Buffer.byteLength(text),sha256:createHash('sha256').update(text).digest('hex')};if(checkedAt)m.checkedAt=checkedAt;return m; }
