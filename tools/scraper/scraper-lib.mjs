/** 공정거래위원회 공개 가맹정보 수집·파싱. 개인 대표자명·사업자번호는 저장하지 않습니다. */
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
export const FTC = 'https://franchise.ftc.go.kr';
export const LIST = `${FTC}/mnu/00013/program/userRqst/list.do`;
export const UA = process.env.FTC_USER_AGENT || 'AAFranchiseKR/0.1 (public Korean franchise catalog; motoraathailand@gmail.com)';
export const clean = (s = '') => String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').replaceAll('&nbsp;', ' ').replaceAll('&amp;', '&').replaceAll('&#039;', "'").replaceAll('&quot;', '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
export function parseBrandList(html) {
  const allowed = /^(\d{8,12})$/;
  return [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((x) => clean(x[1]))).filter((r) => /^\d+$/.test(r[0] || '') && allowed.test(r[4] || '')).map((r) => ({ listingOrder: Number(r[0]), company: r[1], nameKo: r[2], registrationNo: r[4], firstRegisteredAt: (r[5] || '').replaceAll('.', '-'), categoryKo: r[6].trim() }));
}

export const krwFromThousand = (s) => { const t = String(s ?? '').replaceAll(',', '').trim(); if (!/^-?\d+$/.test(t)) return null; return Number(t) * 1000; };
export async function politeFetch(url, { cache = 'data/cache', minDelayMs = 1600, method = 'GET', form } = {}) {
  fs.mkdirSync(cache, { recursive: true });
  const key = [...Buffer.from(url + JSON.stringify(form || {}))].map((x) => x.toString(16).padStart(2, '0')).join('').slice(-48) + '.html';
  const local = path.join(cache, key);
  if (fs.existsSync(local) && !process.env.FTC_FORCE) return fs.readFileSync(local, 'utf8');
  const robots = path.join(cache, 'robots-check.json');
  if (!fs.existsSync(robots) || Date.now() - fs.statSync(robots).mtimeMs > 86400000) {
    try { const res = await fetch(`${FTC}/robots.txt`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(25000) }); fs.writeFileSync(robots, JSON.stringify({ checkedAt: new Date().toISOString(), status: res.status, note: 'Only documented public disclosure list pages are collected; no restricted URL is used.' })); }
    catch { fs.writeFileSync(robots, JSON.stringify({ checkedAt: new Date().toISOString(), status: 0, note: 'Retained only the public listing path; stop on a block or rate-limit.' })); }
    await sleep(minDelayMs);
  }
  await sleep(minDelayMs + Math.floor(Math.random() * 800));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { method, body: form ? new URLSearchParams(form) : undefined, headers: { 'user-agent': UA, referer: LIST, ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) }, signal: AbortSignal.timeout(70000) });
      if ([401, 403, 429].includes(r.status)) throw new Error(`FTC request blocked/rate-limited (${r.status}); stop`);
      const body = await r.text();
      if (/페이지 오류 안내/.test(body)) throw new Error('FTC returned its page error; no value will be inferred');
      if (r.ok && body.length > 10000) { fs.writeFileSync(local, body); return body; }
      throw new Error(`FTC HTTP ${r.status}`);
    } catch (e) { if (attempt === 2 || /blocked|rate-limited/.test(String(e))) throw e; await sleep(10000 * (attempt + 1)); }
  }
}
export function groupFor(category) {
  if (/커피|음료/.test(category)) return 'beverage';
  if (/교육/.test(category)) return 'education';
  if (/편의점|의류|화장품|식품|도소매/.test(category)) return 'store';
  if (/이미용/.test(category)) return 'beauty';
  if (/한식|중식|일식|서양식|패스트푸드|치킨|피자|제과|아이스크림|주점|외식|분식/.test(category)) return 'food';
  if (/서비스|세탁|PC방|스포츠|숙박|자동차|안경|부동산|임대|이사|운송|오락|반려동물/.test(category)) return 'service';
  return 'other';
}
export function makeBrand(row, { fetchedAt, listedAt, extras = {} } = {}) {
  if (!/^\d{8,12}$/.test(row.registrationNo) || !row.nameKo || row.nameKo.includes('�') || !row.firstRegisteredAt) throw new Error('Invalid official brand row');
  const q = new URLSearchParams({ searchCondition: 'brd', searchKeyword: row.nameKo });
  const name = { ko: row.nameKo.trim() };
  // Korean and English parenthetical names are source spellings, not machine-translated names.
  const m = /\(([A-Za-z0-9][^()]*)\)/.exec(row.nameKo); if (m) name.en = m[1];
  const extraSources=[];
  // KFTC itself renders this label as ??돈까스 in list+exact-registration lookup.
  // The official brand site confirms ① consistent company ② exact public brand spelling; no cost inference.
  if(row.registrationNo==='20170517' && row.nameKo==='??돈까스'){
    name.ko='쑝쑝돈까스';
    extraSources.push({id:'brand-sspc',site:'쑝쑝돈까스 공식 브랜드',url:'https://sspc.co.kr/menu',fetchedAt,asof:listedAt,reference:'공식 목록 ??돈까스 손상글자 보정 — 동일 법인 에스에스피씨, 회사 브랜드 쑝쑝돈까스'});
  }

  return { id: `kr${row.registrationNo}`, name, group: groupFor(row.categoryKo), category: { ko: row.categoryKo }, country: 'South Korea', registrationNo: row.registrationNo, firstRegistrationAt: row.firstRegisteredAt, contact: { company: row.company }, sources: [{ id: 'kftc', site: '공정거래위원회 가맹사업정보제공시스템', url: `${LIST}?${q}`, fetchedAt, asof: listedAt, reference: '정보공개서 열람 목록의 최초등록일·업종' }], ...extras, ...(extraSources.length?{sources:[{ id: 'kftc', site: '공정거래위원회 가맹사업정보제공시스템', url: `${LIST}?${q}`, fetchedAt, asof: listedAt, reference: '정보공개서 엔 목록의 최초등록일·업종' },...extraSources]}:{} ) };
}
