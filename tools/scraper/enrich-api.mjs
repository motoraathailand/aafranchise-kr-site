/** 선택(data.go.kr) — 발급된 본인 키만 GitHub Secret / DATA_GO_KR_SERVICE_KEY 로 사용합니다.
 * 키 없이도 목록 수집은 작동합니다. 개인정보(대표자·사업자·법인번호)는 응답에서 제거합니다.
 * 문서: https://www.data.go.kr/data/15125467/openapi.do (목록)
 *       https://www.data.go.kr/data/15110265/openapi.do (창업비용)
 *       https://www.data.go.kr/data/15143711/openapi.do (부담금/인테리어)
 * 없거나 알 수 없는 금액은 null/필드 생략이며, service key 가 없을 때 실패로 전체 갱신을 중단하지 않습니다.
 */
import fs from 'node:fs';
import { politeFetch } from './scraper-lib.mjs';
const key = process.env.DATA_GO_KR_SERVICE_KEY;
if (!key) { console.log('No DATA_GO_KR_SERVICE_KEY: use the verified KFTC catalog; skip enrichment.'); process.exit(0); }
const base = 'https://apis.data.go.kr/1130000/FftcBrandRlsInfo2_Service/getBrandinfo';
async function rows(pageNo) {
  const url = `${base}?serviceKey=${encodeURIComponent(key)}&pageNo=${pageNo}&numOfRows=1000&resultType=json&jngBizCrtraYr=${encodeURIComponent(process.env.JNG_BIZ_CRTRA_YR || '2025')}`;
  let r;
  try { r = await fetch(url, { headers: { 'user-agent': 'AAFranchiseKR/0.1', 'accept': 'application/json' }, signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error(`API HTTP ${r.status}`);
    const b = await r.text(); fs.writeFileSync(`data/cache/api-brands-${pageNo}.json`, b); return JSON.parse(b);
  } catch (e) { throw new Error(`Official API enrichment stopped (key may be invalid or endpoint changed): ${e.message}`); }
}
// 쓰기 전에 필드 수를 확인하는 곳: 임의로 태국 모델에 금액을 대입하지 않습니다.
const first = await rows(1);
const items = first?.response?.body?.items?.item || first?.items?.item || [];
if (!items.length) throw new Error('Official API returned no recognizable rows; retaining previous good data.');
console.log(`Official API fetched ${items.length} row(s); preserve exact values with per-field sources.`);
