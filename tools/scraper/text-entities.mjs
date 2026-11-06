/** Deterministic HTML entity decoding for public source text (not general HTML rendering). */
const NAMED = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', copy: '©', reg: '®', trade: '™' });
export function decodeEntities(value) {
 if (typeof value !== 'string') return value;
 for (let i = 0; i < 3; i++) {
  const out = value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z][\da-z]+));/gi, (all, dec, hex, name) => {
   if (dec != null || hex != null) { const n = Number.parseInt(dec ?? hex, dec != null ? 10 : 16); if (!Number.isSafeInteger(n) || n === 0 || n > 0x10ffff || n >= 0xd800 && n <= 0xdfff) return all; return String.fromCodePoint(n); }
   return NAMED[name.toLowerCase()] ?? all;
  });
  if (out === value) break; value = out;
 }
 return value;
}
export function decodeTextDeep(value) {
 if (typeof value === 'string') return decodeEntities(value);
 if (Array.isArray(value)) return value.map(decodeTextDeep);
 if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decodeTextDeep(v)]));
 return value;
}
