/** 공정위·공공데이터포털의 승인된 두 API만 사용. 키·대표자·사업자·법인번호는 기록하지 않음.
 * 목록 15125467: brandMnno, jnghdqrtrsMnno, brandNm, corpNm, indutyLclasNm,
 * indutyMlsfcNm, majrGdsNm, jngBizStrtDate (YYYYMMDD).
 * 금액 15110265: yr, brandNm, corpNm, indutyLclasNm, indutyMlsfcNm,
 * jngBzmnJngAmt=가맹금액, jngBzmnEduAmt=교육금액, jngBzmnAssrncAmt=보증금액,
 * jngBzmnEtcAmt=기타금액, smtnAmt=합계금액. 공정위 원표시 단위는 천원; 내부 KRW 원 환산.
 * 합계를 별도 인테리어 비용이나 일반 매장 현실의 총 투자예산으로 의역하지 않음.
 */
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import { UA } from './scraper-lib.mjs';
export const LIST_DOC = 'https://www.data.go.kr/data/15125467/openapi.do';
export const MONEY_DOC = 'https://www.data.go.kr/data/15110265/openapi.do';
export const LIST_API = 'https://apis.data.go.kr/1130000/FftcBrandRlsInfo2_Service/getBrandinfo';
export const MONEY_API = 'https://apis.data.go.kr/1130000/FftcBrandFntnStatsService/getBrandFntnStats';
const LIST_FIELDS = ['jngBizCrtraYr','brandMnno','jnghdqrtrsMnno','brandNm','indutyLclasNm','indutyMlsfcNm','majrGdsNm','jngBizStrtDate','corpNm'];
const MONEY_FIELDS = ['yr','indutyLclasNm','indutyMlsfcNm','brandNm','corpNm','jngBzmnJngAmt','jngBzmnEduAmt','jngBzmnAssrncAmt','jngBzmnEtcAmt','smtnAmt'];
export const validBrandId = (id) => /^kr\d{4,20}(?:\.[a-f0-9]{16})?$/.test(String(id));
export const amountKey = (x) => ['brandNm','corpNm'].map((k) => String(x[k] || '').normalize('NFKC').replace(/\s/g, '').replace(/주식회사|\(주\)|㈜|유한회사/g, '')).join('|');
export const numericAmount = (x, key) => {
  const v = x[key]; if (v == null || v === '') return null;
  if (!/^-?\d+(?:,\d{3})*$/.test(String(v))) throw new Error(`Unexpected ${key} value; not importing it`);
  const n = Number(String(v).replaceAll(',', ''));
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Unsafe ${key}; not importing it`);
  return Math.round(n * 1000); // 공정위 가맹정보 브랜드 금액 표시 단위: 천원 → 원.
};
export const amountValues = (x) => ({
  fee: numericAmount(x, 'jngBzmnJngAmt'), education: numericAmount(x, 'jngBzmnEduAmt'),
  deposit: numericAmount(x, 'jngBzmnAssrncAmt'), other: numericAmount(x, 'jngBzmnEtcAmt'), total: numericAmount(x, 'smtnAmt'),
});
async function request(url, params, key, attempt = 0) {
  const q = new URLSearchParams({ ...params, serviceKey: key }); // never log this URL
  let r;
  try { r = await fetch(`${url}?${q}`, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(70000) }); }
  catch (e) { if (attempt < 3) { await sleep(3000 * (attempt + 1)); return request(url, params, key, attempt + 1); } throw new Error('Official API network failure: no old or guessed values substituted.'); }
  const text = await r.text(); let j;
  try { j = JSON.parse(text); } catch { throw new Error(`Official API HTTP ${r.status} returned non-JSON: ${r.headers.get('content-type') || 'unknown type'}`); }
  const err = j?.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (err) throw new Error(`Official API error ${err.returnReasonCode || ''}: ${err.returnAuthMsg || err.errMsg || 'rejected request'}`);
  if (!r.ok || j.resultCode !== '00') throw new Error(`Official API HTTP ${r.status}, result ${j.resultCode || 'unknown'}: no rows published`);
  return j;
}
async function collectKind(kind, url, year, key, fields, cache) {
  const yearParam = kind === 'brand' ? 'jngBizCrtraYr' : 'yr';
  const p = { pageNo: '1', numOfRows: '1000', resultType: 'json', [yearParam]: String(year) };
  const first = await request(url, p, key); const total = Number(first.totalCount);
  if (!Number.isInteger(total) || total < 1 || total > 50000) throw new Error(`Official ${kind} totalCount outside expected bound`);
  const pages = Math.ceil(total / 1000), all = [];
  for (let page = 1; page <= pages; page++) {
    const j = page === 1 ? first : await request(url, { ...p, pageNo: String(page) }, key);
    const items = Array.isArray(j.items) ? j.items : j.items?.item || [];
    if (!Array.isArray(items) || items.length > 1000 || (page < pages && !items.length)) throw new Error(`Official ${kind} page has unexpected shape`);
    const safe = items.map((r) => Object.fromEntries(fields.filter((k) => Object.hasOwn(r, k)).map((k) => [k, r[k]])));
    fs.writeFileSync(`${cache}/api-${kind}-${year}-${page}.json`, JSON.stringify({ records: safe })); all.push(...safe);
    if (page < pages) await sleep(1600 + Math.floor(Math.random() * 800));
  }
  if (all.length !== total) throw new Error(`Incomplete official ${kind}: ${all.length}/${total}`);
  return all;
}
export function buildCatalog(listRows, moneyRows, { now = new Date().toISOString(), version, groupFor }) {
  const seen = new Set(), brands = [], rejected = [];
  const amounts = new Map(), conflicts = [];
  const moneyYears = new Set(moneyRows.map((r) => String(r.yr)));
  if (moneyYears.size !== 1 || [...moneyYears][0] !== String(listRows[0]?.jngBizCrtraYr)) throw new Error('Amount/list base years differ');
  for (const r of moneyRows) {
    if (String(r.yr) !== String(listRows[0]?.jngBizCrtraYr)) throw new Error('Amount/list base years differ');
    const v = amountValues(r); if (Object.values(v).some((x) => x == null)) throw new Error('Incomplete approved money field map');;
    const category = `${r.indutyLclasNm}|${r.indutyMlsfcNm}`; if(!r.indutyLclasNm||!r.indutyMlsfcNm) throw new Error('Official startup row lacks its category'); const key = `${amountKey(r)}|${category}`;
    const prev = amounts.get(key);
    if (prev && JSON.stringify(prev) !== JSON.stringify(v)) { conflicts.push({ brand: r.brandNm, company: r.corpNm, category }); amounts.delete(key); }
    else if (!conflicts.some((x) => `${amountKey(x)}|${x.category}` === key)) amounts.set(key, v);
  }
  // Keep an unmatched category's brand in the directory, but never guess its costs.
  function match(r) { const key = `${amountKey(r)}|${r.indutyLclasNm}|${r.indutyMlsfcNm}`; return amounts.get(key) || null; }
  for (const r of listRows) {
    const name = String(r.brandNm || '').trim(), company = String(r.corpNm || '').trim(), category = String(r.indutyMlsfcNm || '').trim();
    if (!name || !company || !category || name.includes('�') || /^\?+$/.test(name)) { rejected.push('invalid brand label/company/category'); continue; }
    if (!/^BRD_[A-Za-z0-9_]+$/.test(r.brandMnno || '')) { rejected.push('missing official brand management ID'); continue; }
    const started = String(r.jngBizStrtDate || '');
    if (started && !/^\d{8}$/.test(started)) { rejected.push('invalid franchise start date'); continue; }
    const stable = r.brandMnno.startsWith('BRD_') ? r.brandMnno.slice(4) : r.brandMnno; let base = /^\d{4,20}$/.test(stable) ? `kr${stable}` : `kr${r.jngBizStrtDate || r.brandMnno}`; if (!/^kr\d{4,20}$/.test(base)) base = `kr${createHash('sha256').update(r.brandMnno).digest('hex').slice(0,16)}`; if (seen.has(base)) base += '.' + createHash('sha256').update(`${r.brandMnno}|${r.jnghdqrtrsMnno || ''}|${company}|${r.indutyLclasNm}|${category}`).digest('hex').slice(0, 16); if (!validBrandId(base)) throw new Error('Unexpected official brand management identifier');
    if (seen.has(base)) { rejected.push('duplicate official brand identifier'); continue; }
    seen.add(base);
    const en = /\(([A-Za-z0-9][^()]*)\)/.exec(name)?.[1];
    const managementId = r.jnghdqrtrsMnno || r.brandMnno.replace('_', '-');
    const year = Number(r.jngBizCrtraYr), amountSource = { id: 'data-go-kr-money', site: '공정거래위원회_가맹정보_브랜드별 창업 금액 현황 제공 서비스 (15110265)', url: MONEY_DOC, fetchedAt: now, asof: `${year}-12-31`, reference: `${year}년 브랜드명·법인명·업종 일치 · 가맹비/교육비/보증금/기타비용/합계 · 천원 원자료를 원 단위로 환산` };
    const listSource = { id: 'kftc', site: '공정거래위원회 가맹사업정보제공시스템 / 공공데이터포털 (15125467)', url: LIST_DOC, fetchedAt: now, asof: `${year}-12-31`, reference: `${year}년 브랜드명·법인명·업종·가맹사업개시일·브랜드관리번호; 개인 대표자·사업자·법인번호는 미수록` };
    const b = { id: base, brandMnno: r.brandMnno, name: { ko: name, ...(en ? { en } : {}) }, group: groupFor(category), category: { ko: category, sector: r.indutyLclasNm, product: r.majrGdsNm }, country: 'South Korea', registrationNo: managementId, ...(started ? { firstRegistrationAt: `${started.slice(0,4)}-${started.slice(4,6)}-${started.slice(6,8)}` } : {}), registrationKind: 'franchise headquarters management identifier (not a disclosure-document registration number)', contact: { company }, sources: [listSource] };
    const m = match(r);
    if (m) {
      b.sources.push(amountSource); b.amountAsOf = `${year}`; b.amountCurrencyUnit = 'KRW (source: thousand KRW)';
      if (m.fee != null) b.franchiseFee = { min: m.fee, max: m.fee };
      if (m.education != null) b.educationFee = { min: m.education, max: m.education };
      if (m.deposit != null) b.deposit = { min: m.deposit, max: m.deposit };
      if (m.other != null) b.otherStartupCost = { min: m.other, max: m.other };
      if (m.total != null) b.totalInvestment = { min: m.total, max: m.total, label: 'KFTC startup-amount components total (합계금액; interior breakdown not imported)' };
    }
    // Preserve the one independently sourced correction from the bounded KFTC discovery list.
    if (base === 'kr20170517' && company.includes('에스에스피씨') && /쑝쑝/.test(name)) {
      b.sources.push({ id: 'brand-sspc', site: '쑝쑝돈까스 공식 브랜드', url: 'https://sspc.co.kr/menu', fetchedAt: now, asof: `${year}-12-31`, reference: '과거 공식 목록 손상글자 ??돈까스의 같은 법인 공식 브랜드 표기 확인' });
    }
    brands.push(b);
  }
  const has = (k) => brands.filter((b) => b[k]?.min != null).length, nowDate = now.slice(0, 10);
  const coverage = { catalogFieldsVerified: brands.length, withFranchiseFee: has('franchiseFee'), withTotalInvestment: has('totalInvestment'), withEducationFee: has('educationFee'), withDeposit: has('deposit'), withOtherStartupCost: has('otherStartupCost'), withRoyalty: 0, withBranches: 0, withAverageSales: 0 };
  return { meta: { schema: 1, version: version ?? Number(nowDate.replaceAll('-', '')), generatedAt: now, count: brands.length, scope: 'Korea — KFTC brand list and precisely matched startup-amount fields; headquarters-management IDs are not disclosure-document registration numbers', country: 'South Korea', currency: 'KRW', referenceYear: Number(listRows[0]?.jngBizCrtraYr), feeCoverageRequired: true, coverage, sources: [{ id: 'kftc-list-api', name: '공정거래위원회_가맹정보_브랜드 목록 정보 제공 서비스 (15125467)', url: LIST_DOC }, { id: 'kftc-amount-api', name: '공정거래위원회_가맹정보_브랜드별 창업 금액 현황 제공 서비스 (15110265)', url: MONEY_DOC, unit: '천원 → KRW 원', fields: ['jngBzmnJngAmt:가맹금액','jngBzmnEduAmt:교육금액','jngBzmnAssrncAmt:보증금액','jngBzmnEtcAmt:기타금액','smtnAmt:합계금액'] }], asofMax: nowDate, skippedApi: [{ id: '15143711', reason: 'FairData pseudonymized-data application was not approved; interior-cost breakdown not imported or guessed.' }], rejectedRows: rejected.length, omittedConflictRows: conflicts.length, note: 'The approved brand-list API does not supply outlet count, average sales, royalty, or a standalone interior amount. totalInvestment represents only the KFTC startup-amount components total (합계금액), not all real on-site costs. Unknown fields are omitted. Values are shown at base-year 2025 (브랜드·법인·대/중분류 업종이 모두 일치하는 경우에만 연결; 불일치 또는 충돌 금액은 미표시).' }, brands };
}
export async function collectOfficial({ key = process.env.DATA_GO_KR_SERVICE_KEY, year = Number(new Date().getUTCFullYear()) - 1, cache = 'data/cache', fetchImpl } = {}) {
  if (!key) return null; fs.mkdirSync(cache, { recursive: true });
  const [brands, money] = await Promise.all([
    collectKind('brand', LIST_API, year, key, LIST_FIELDS, cache),
    collectKind('money', MONEY_API, year, key, MONEY_FIELDS, cache),
  ]);
  return { brands, money };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  try { const r = await collectOfficial(); if (!r) { console.log('No DATA_GO_KR_SERVICE_KEY: API catalog skipped; existing accurate catalog retained.'); } else console.log(`Official API catalog: ${r.brands.length} brand rows; ${r.money.length} amount rows. Sensitive identifiers discarded.`); }
  catch (e) { console.error(e.message); process.exitCode = process.env.DATA_GO_KR_REQUIRED === '1' ? 1 : 0; }
}
