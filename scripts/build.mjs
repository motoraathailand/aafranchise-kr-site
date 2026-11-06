// Builds the whole static site into docs/ (GitHub Pages serves /docs of branch main).
//   index.html (intro = /about), join.html, privacy.html, about/index.html (redirect), 404.html, sitemap.xml, robots.txt, assets/*
// Usage: node scripts/build.mjs        (no dependencies; QR code from scripts/qrcode.mjs = the app's vendored qrcode-generator, MIT)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import qrcode from './qrcode.mjs';
import { INTRO, JOIN } from '../src/strings.mjs';
import { LANGS, SOCIAL, makeContent } from '../src/content.mjs';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), SRC = path.join(ROOT, 'src'), OUT = process.env.SITE_OUT ? path.resolve(process.env.SITE_OUT) : path.join(ROOT, 'docs');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'));
for (const k of ['siteUrl', 'packageName', 'groupEmail', 'groupUrl', 'optInUrl', 'installUrl', 'contactEmail', 'operator', 'policyDate']) if (!cfg[k]) throw new Error('config/site.json: missing ' + k);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const live = process.env.OPTIN_LIVE ? process.env.OPTIN_LIVE === '1' : !!cfg.optInLive;
const L = LANGS.map((x) => x[0]), SITE = cfg.siteUrl;
// ---- completeness: every language has every key / section ----
for (const [name, D] of [['INTRO', INTRO], ['JOIN', JOIN]]) { const keys = Object.keys(D.en); for (const l of L) { if (!D[l]) throw new Error(name + ' lacks ' + l); const miss = keys.filter((k) => !(k in D[l]) || !String(D[l][k]).trim() && D.en[k]); if (miss.length) throw new Error(name + '.' + l + ' misses ' + miss.join()); } }
const C = makeContent({ OPERATOR: cfg.operator, EMAIL: cfg.contactEmail, UPDATED: cfg.policyDate, SITE });
for (const name of ['PRIVACY', 'DELETE']) for (const l of L) { if (!C[name][l]) throw new Error(name + ' lacks ' + l); if (C[name][l].length !== C[name].en.length) throw new Error(name + '.' + l + ' has ' + C[name][l].length + ' sections, en has ' + C[name].en.length); }
const I = INTRO, J = JOIN;
// ---- helpers ----
const ICON = { search: '<circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500"/>', compare: '<rect x="3.500" y="4" width="7" height="16" rx="2"/><rect x="13.500" y="4" width="7" height="16" rx="2"/>', ai: '<path d="M12 3l1.800 4.800L18.500 9.500l-4.700 1.700L12 16l-1.800-4.800L5.500 9.500l4.700-1.700zM18 15l.8 2.200L21 18l-2.200.8L18 21l-.8-2.200L15 18l2.200-.8z"/>', user: '<circle cx="12" cy="8" r="3.600"/><path d="M5 20c.8-3.600 3.700-5.600 7-5.600s6.200 2 7 5.600"/>', doc: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>', offline: '<path d="M2 8.800a15 15 0 0 1 20 0M5 12.500a10 10 0 0 1 14 0M8.500 16a5 5 0 0 1 7 0M12 19.500h.01M3 3l18 18"/>', download: '<path d="M12 4v11M7.500 10.500L12 15l4.500-4.500M5 19.500h14"/>', free: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1"/>', moon: '<path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.200 3 14.800 0 18M12 3c-3 3.200-3 14.800 0 18"/>' };
const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const attr = (tag, key, extra = '', dict = I) => `<${tag} data-t="${key}"${extra ? ' ' + extra : ''}>${esc(dict.ko[key])}</${tag}>`;
const LOGO = `<a class="logo" href="index.html" data-int aria-label="AA 프랜차이즈 - 쉽게하는창업"><svg viewBox="0 0 108 108"><rect width="108" height="108" rx="24" fill="#be185d"/><g fill="#fff"><path d="M26.7 24.1H81.3L90.4 42.3H17.6Z"/><path d="M17.6 42.3a12.13 12.13 0 0 0 24.27 0Z"/><path d="M41.87 42.3a12.13 12.13 0 0 0 24.27 0Z"/><path d="M66.13 42.3a12.13 12.13 0 0 0 24.27 0Z"/><rect x="28" y="63.1" width="52" height="10.4" rx="5.2"/></g></svg><span>AA Franchise<small class="tag">쉽게하는창업</small></span></a>`;
const LANGSEL = (dict) => `<label class="lang"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.200 3 14.800 0 18M12 3c-3 3.200-3 14.800 0 18"/></svg><select id="lang" data-aria="langLabel" aria-label="${esc(dict.ko.langLabel)}">${LANGS.map(([l, n]) => `<option value="${l}"${l === 'ko' ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
const APPS_URL = 'https://motoraathailand.github.io/';
const APPSIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>';
const APPSBTN = (dict, where) => `<a class="apps apps-${where}" data-press data-apps href="${APPS_URL}">${APPSIC}<span data-t="allApps">${esc(dict.ko.allApps)}</span></a>`;
const HEADER = (dict) => `<header class="hd"><div class="hd-in">${LOGO}<div class="hd-r">${APPSBTN(dict, 'hd')}${LANGSEL(dict)}</div></div></header>`;
const FOOTER = (dict, madeKey) => `<footer class="ft"><div class="wrap">${APPSBTN(dict, 'ft')}<div class="links"><a href="privacy.html" data-int data-t="privacy">${esc(dict.ko.privacy)}</a><a href="mailto:${esc(cfg.contactEmail)}" data-t="contact">${esc(dict.ko.contact)}</a></div>${madeKey ? `<p data-t="${madeKey}">${esc(dict.ko[madeKey])}</p>` : ''}</div></footer>`;
// language chosen BEFORE first paint (no flash): ?lang= > saved > browser primary tag > English. Non-English keeps the page hidden (html.lw) until site.js has swapped the baked English text (fails open after 1.5 s).
const HEAD_SCRIPT = `<script>/* language first: ?lang= > saved choice > browser language (th/en/ko/zh/hi by primary subtag) > English */
(function(){var L=['th','en','ko','zh','hi'],l='ko',x=0,d=document.documentElement;try{var m=/[?&]lang=(\\w\\w)/.exec(location.search),s=localStorage.getItem('frkr.site.lang'),a=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language],p='';if(m&&L.indexOf(m[1])>-1){l=m[1];x=1}else if(L.indexOf(s)>-1){l=s;x=1}else for(var i=0;i<a.length;i++){p=String(a[i]||'').toLowerCase().split(/[-_]/)[0];if(L.indexOf(p)>-1){l=p;break}}}catch(e){}window.__L=l;window.__LX=x;d.lang=l==='zh'?'zh-Hans':l;d.setAttribute('data-lang',l);if(l!=='ko'){d.className+=' lw';setTimeout(function(){d.className=d.className.replace(/\\blw\\b/,'')},1500)}})();</script>`;
function shell({ page, file, title, desc, body, dictKey = 'intro', jsonld = '' }) {
  const url = `${SITE}/${file === 'index.html' ? '' : file}`;
  return `<!doctype html>
<html lang="ko" data-lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#2a0a1a">
<meta name="color-scheme" content="light dark">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AA Franchise"><meta property="og:locale" content="en_US">${LANGS.filter(([l]) => l !== 'en').map(([l]) => `<meta property="og:locale:alternate" content="${SOCIAL[l]}">`).join('')}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/assets/img/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="AA 프랜차이즈 - 한국 프랜차이즈 공개정보">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE}/assets/img/og.jpg"><meta name="twitter:image:alt" content="AA 프랜차이즈 - 한국 프랜차이즈 공개정보">
<link rel="alternate" hreflang="x-default" href="${url}">${LANGS.map(([l]) => `<link rel="alternate" hreflang="${l === 'zh' ? 'zh-Hans' : l}" href="${url}?lang=${l}">`).join('')}
<link rel="icon" href="assets/icon.svg" type="image/svg+xml"><link rel="icon" href="assets/img/favicon-32.png" type="image/png" sizes="32x32"><link rel="icon" href="assets/img/icon-192.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="assets/site.webmanifest">
${jsonld}
${HEAD_SCRIPT}
<link rel="stylesheet" href="assets/motion.css">
<link rel="stylesheet" href="assets/site.css">
</head>
<body data-page="${page}" data-lang-root>
${body}
<script src="assets/strings.js"></script>
<script src="assets/motion.js"></script>
<script src="assets/site.js"></script>${page === 'join' ? '\n<script src="assets/join.js"></script>' : ''}
</body>
</html>
`;
}
// ---- intro (index.html) ----
const shotN = (n) => `assets/img/play/kr-${n}.webp`;
const photo = (n, i = 0, alt = 'alt' + n) => `<img data-shot="${n}" src="${shotN(n)}" width="480" height="853" loading="lazy" decoding="async" alt="${esc(I.ko[alt])}" data-alt="${alt}"${i ? ` style="--i:${i}"` : ''}>`;
const JOINBTN = (key, extra = '') => `<a class="btn" data-press data-ripple data-int href="join.html"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON.download}</svg><span data-t="${key}">${esc(I.ko[key])}</span></a>`;
const showcase = [['search', 'cur', 1], ['compare', 'unit', 3], ['ai', 'calc', 5]];
const perks = [['offline', 'pk1'], ['user', 'pk2'], ['doc', 'pk3'], ['globe', 'pk4'], ['free', 'pk5'], ['moon', 'pk6']];
const stats = [[11166, 'stat1'], [18, 'stat2'], [5, 'stat3'], [0, 'stat4']];
const indexBody = `${HEADER(I)}
<main id="main">
<section class="hero"><div class="wrap hero-in">
  <div class="hero-copy" data-stagger="70">
    ${attr('p', 'eyebrow', 'class="eyebrow"')}
    ${attr('h1', 'h1')}
    ${attr('p', 'lead', 'class="lead"')}
    <div class="cta">${JOINBTN('ctaJoin')}<a class="btn ghost" data-press data-ripple href="#features"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg><span data-t="ctaMore">${esc(I.ko.ctaMore)}</span></a></div>
    <p class="ctanote"><i class="dot" aria-hidden="true"></i><span data-t="ctaNote">${esc(I.ko.ctaNote)}</span></p>
    <ul class="chips">${['chip1', 'chip2', 'chip3', 'chip4'].map((k) => attr('li', k)).join('')}</ul>
  </div>

</div></section>
<section class="stats" aria-label="AA Franchise"><div class="wrap"><ul class="stat-row">${stats.map(([n, k], i) => `<li data-reveal style="--i:${i}"><b data-count="${n}">${n}</b>${attr('span', k)}</li>`).join('')}</ul></div></section>
<section class="s" id="features"><div class="wrap">
  ${attr('h2', 'featH')}${attr('p', 'featD', 'class="sub"')}
  <div class="shows">${showcase.map(([ic, k, n], i) => `<article class="show${i % 2 ? ' rev' : ''}">
    <div class="show-txt" data-reveal><div class="ic">${svg(ic)}</div>${attr('h3', k + 'T')}${attr('p', k + 'D')}<ul class="ticks">${[1, 2, 3].map((x) => attr('li', k + x)).join('')}</ul></div>
    <figure class="show-img" data-reveal style="--i:2"><div class="glow" aria-hidden="true"></div>${photo(n)}</figure>
  </article>`).join('')}</div>
</div></section>
<section class="s"><div class="wrap">
  ${attr('h2', 'perksH')}
  <ul class="grid">${perks.map(([ic, k], n) => `<li class="card" data-reveal style="--i:${n % 3}"><div class="ic">${svg(ic)}</div>${attr('h3', k + 't')}${attr('p', k + 'd')}</li>`).join('')}</ul>
</div></section>
<section class="s"><div class="wrap">
  ${attr('h2', 'shotsH')}${attr('p', 'shotsD', 'class="sub"')}
  <div class="shots">${[4, 5, 6].map((n, i) => `<figure data-reveal style="--i:${i}">${photo(n)}</figure>`).join('')}</div>
</div></section>
<section class="band"><div class="wrap narrow">
  ${attr('h2', 'trustH')}
  <ul class="trust">${['trust1', 'trust2', 'trust3', 'trust4'].map((k) => attr('li', k)).join('')}</ul>
  <p style="margin-top:16px"><a href="privacy.html" data-int data-t="trustLink">${esc(I.ko.trustLink)}</a></p>
</div></section>
<section class="s" id="how"><div class="wrap narrow">
  ${attr('h2', 'howH')}${attr('p', 'howD', 'class="sub"')}
  <ol class="how">${[1, 2, 3, 4, 5].map((n) => `<li data-reveal style="--i:${n % 4}"><span class="n" aria-hidden="true">${n}</span>${attr('span', 'hw' + n, 'class="t"')}</li>`).join('')}</ol>
  <div class="center">${JOINBTN('howB')}</div>
</div></section>
<section class="s" id="faq"><div class="wrap narrow">
  ${attr('h2', 'faqH')}
  <div class="faqs">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<details><summary data-t="fq${n}">${esc(I.ko['fq' + n])}</summary><p data-t="fa${n}">${esc(I.ko['fa' + n])}</p></details>`).join('')}</div>
</div></section>
<section class="joincta"><div class="wrap">
  ${attr('h2', 'joinH')}${attr('p', 'joinD')}
  ${JOINBTN('joinB')}
</div></section>
</main>
${FOOTER(I, 'made')}`;
// ---- join (join.html) ----
// optInLive (config/site.json) is THE switch: false = steps 3-4 dimmed + "Coming soon" + note; true = they are real links. Env OPTIN_LIVE=1/0 overrides it (tests only).
const stepIcon = {
  1: '<circle cx="9" cy="9" r="3.200"/><circle cx="17" cy="10" r="2.400"/><path d="M3.500 19c0-3.300 2.500-5.500 5.500-5.500s5.500 2.200 5.500 5.500M15 15c3-.6 5.500 1 5.500 4"/>',
  2: '<circle cx="12" cy="8" r="3.600"/><path d="M5 20c.8-3.600 3.700-5.600 7-5.600s6.200 2 7 5.600"/>',
  3: '<path d="M12 3l2.600 5.300 5.800.8-4.200 4.100 1 5.800L12 16.300 6.800 19l1-5.800L3.600 9.100l5.800-.8z"/>',
  4: ICON.download,
  5: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/>' };
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';
function stepCard(n, { href, locked, extra = '', action = 'link' }) {
  const bKey = 's' + n + 'b' + (locked ? 'Soon' : '');
  const act = action === 'link'
    ? `<a class="btn" data-press data-ripple data-go="${n}" data-url="${esc(href)}" href="${locked ? '#pend' : esc(href)}" ${locked ? 'aria-disabled="true"' : 'target="_blank" rel="noopener"'}>${ARROW}<span data-t="${bKey}">${esc(J.ko[bKey])}</span></a>`
    : action === 'ack' ? `<button class="btn" type="button" data-press data-ripple data-ack="${n}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg><span data-t="s${n}b">${esc(J.ko['s' + n + 'b'])}</span></button>` : '';
  return `<li class="step${action === 'none' ? ' noact' : ''}" id="c${n}" data-step="${n}"${locked ? ' data-locked' : ''}>
      <div class="pic" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${stepIcon[n]}</svg></div>
      <div class="body">
        <div class="head"><button class="num" type="button" data-press data-chk="${n}"><span>${n}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg></button>${attr('h2', 's' + n + 't', '', J)}${locked ? attr('em', 'badgeSoon', 'class="chip"', J) : ''}</div>
        ${attr('p', 's' + n + 'd', 'class="desc"', J)}
        ${extra}${act}
      </div>
    </li>`;
}
const COPYIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.500"/><path d="M5 15V6.500A2.500 2.500 0 0 1 7.500 4H15"/></svg>';
const x1 = `<div class="addr"><span class="lab" data-t="emailLabel">${esc(J.ko.emailLabel)}</span><code>${esc(cfg.groupEmail)}</code><button type="button" class="mini" id="copyEmail" data-press>${COPYIC}<span data-t="copyEmail">${esc(J.ko.copyEmail)}</span></button></div>`;
const x2 = `<details class="how2"><summary data-t="s2how">${esc(J.ko.s2how)}</summary><ul>${[1, 2, 3].map((k) => attr('li', 's2c' + k, '', J)).join('')}</ul></details>`;
const x5 = `<div class="days" id="days"><ol class="dots" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<li style="--i:${Math.min(i, 10)}"></li>`).join('')}</ol><p class="daytxt" id="dayTxt" aria-live="polite"></p></div>`;
const q = qrcode(0, 'M'); q.addData(SITE + '/join.html'); q.make(); const qn = q.getModuleCount(), qz = 2; let qd = '';
for (let r = 0; r < qn; r++) for (let c = 0; c < qn; c++) if (q.isDark(r, c)) qd += `M${c + qz} ${r + qz}h1v1h-1z`;
const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qn + 2 * qz} ${qn + 2 * qz}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${qd}" fill="#17150f"/></svg>\n`;
const stKey = live ? 'stLive' : 'stPend';
const joinBody = `${HEADER(J)}
<main id="main">
<section class="jhero"><div class="wrap narrow" data-stagger="60">
  ${attr('h1', 'h1', '', J)}
  ${attr('p', 'sub', 'class="sub"', J)}
  <p class="status${live ? ' on' : ''}" id="status" role="status"><i class="dot" aria-hidden="true"></i><span data-t="${stKey}">${esc(J.ko[stKey])}</span></p>
  <div class="gmail" role="note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.500l8 6 8-6"/></svg><div>${attr('b', 'gm', '', J)}${attr('span', 'gmD', '', J)}</div></div>
  <div class="iab" id="iab" role="alert" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.500v5M12 16h.01"/></svg><div><b data-t="iabT">${esc(J.ko.iabT)}</b><span data-t="iabD">${esc(J.ko.iabD)}</span><div class="iabrow"><a class="btn" id="iabOpen" href="#" data-t="iabB">${esc(J.ko.iabB)}</a><button type="button" class="btn ghost" id="iabCopy" data-t="iabC">${esc(J.ko.iabC)}</button></div><small id="iabNote" aria-live="polite"></small></div></div>
  <div class="prog"><div class="bar" aria-hidden="true"><i id="barFill"></i></div><p id="progTxt" aria-live="polite"></p></div>
</div></section>
<section class="wrap narrow steps" id="steps">
  <ol class="cards" data-stagger>
    ${stepCard(1, { href: cfg.groupUrl, locked: false, extra: x1 })}
    ${stepCard(2, { action: 'ack', extra: x2 })}
    ${stepCard(3, { href: cfg.optInUrl, locked: !live })}
    ${stepCard(4, { href: cfg.installUrl, locked: !live })}
    ${stepCard(5, { action: 'none', extra: x5 })}
  </ol>
  <p class="pend" id="pend" role="note"${live ? ' hidden' : ''} data-t="pend">${esc(J.ko.pend)}</p>
  <div class="all" id="all" hidden role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg><div>${attr('b', 'allT', '', J)}${attr('p', 'allD', '', J)}</div></div>
  <div class="why" data-reveal><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg><div>${attr('b', 'whyH', '', J)}${attr('p', 'whyD', '', J)}</div></div>
  <div class="faq trouble"><h2 data-t="tH">${esc(J.ko.tH)}</h2><div class="faqs">${[1, 2, 3, 4, 5, 6].map((n) => `<details id="t${n}"><summary data-t="tq${n}">${esc(J.ko['tq' + n])}</summary><p data-t="ta${n}">${esc(J.ko['ta' + n])}</p></details>`).join('')}</div></div>
  <div class="retry"><b data-t="retryH">${esc(J.ko.retryH)}</b><p class="desc" data-t="retryD">${esc(J.ko.retryD)}</p><button class="btn soft" id="reset" type="button" data-press><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span data-t="retryB">${esc(J.ko.retryB)}</span></button></div>
  <div class="two">
    <div class="panel center-card" id="shareCard"><h2 data-t="shareH">${esc(J.ko.shareH)}</h2><div class="row"><button class="btn" id="share" type="button" data-press data-ripple><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg><span data-t="share">${esc(J.ko.share)}</span></button></div><p class="note" id="shareNote" aria-live="polite"></p></div>
    <div class="panel qr center-card" id="qrCard"><h2 data-t="qrH">${esc(J.ko.qrH)}</h2><p class="note" data-t="qrD">${esc(J.ko.qrD)}</p><img src="assets/join-qr.svg" width="168" height="168" loading="lazy" alt="${esc(J.ko.qrAlt)}" data-alt="qrAlt"></div>
  </div>
  <div class="faq"><h2 data-t="faqH">${esc(J.ko.faqH)}</h2><div class="faqs">${[1, 2, 3, 4, 5].map((n) => `<details><summary data-t="q${n}">${esc(J.ko['q' + n])}</summary><p data-t="a${n}">${esc(J.ko['a' + n])}</p></details>`).join('')}</div></div>
</section>
</main>
${FOOTER(J, '')}`;
// ---- legal pages (privacy.html) ----
const mail = (s) => esc(s).replace(new RegExp(esc(cfg.contactEmail).replace(/\./g, '\\.'), 'g'), `<a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>`);
const blocks = (bs) => bs.map((b) => typeof b === 'string' ? `<p>${mail(b)}</p>` : b.ul ? `<ul>${b.ul.map((x) => `<li>${mail(x)}</li>`).join('')}</ul>` : `<ol>${b.ol.map((x) => `<li>${mail(x)}</li>`).join('')}</ol>`).join('');
function legal({ file, titleKey, content }) {
  const sections = LANGS.map(([l]) => { const U = C.UI[l]; return `<section class="lg" lang="${l === 'zh' ? 'zh-Hans' : l}" id="s-${l}"><h1>${esc(U[titleKey])}</h1><p class="meta">${esc(U.app)} · ${esc(U.updated)}: ${esc(cfg.policyDate)}</p>${content[l].map(([h, b]) => `<h2>${esc(h)}</h2>${blocks(b)}`).join('')}</section>`; }).join('\n');
  const body = `<header class="hd"><div class="hd-in"><a class="back" href="index.html" data-int>← <span data-t="home">${esc(I.ko.home)}</span></a><div class="hd-r">${APPSBTN(I, 'hd')}${LANGSEL(I)}</div></div></header>
<main id="main" class="wrap narrow legal${file === 'privacy.html' ? ' privacy' : ' delete'}">
${sections}
</main>
${FOOTER(I, '')}`;
  const titles = Object.fromEntries(LANGS.map(([l]) => [l, `${C.UI[l][titleKey]} — AA Franchise`]));
  return { html: shell({ page: file === 'privacy.html' ? 'privacy' : 'delete', file, title: titles.en, desc: titles.en + '. ' + C.UI.ko.updated + ': ' + cfg.policyDate, body }), titles };
}
const priv = legal({ file: 'privacy.html', titleKey: 'privacyTitle', content: C.PRIVACY });
const del = legal({ file: 'delete.html', titleKey: 'deleteTitle', content: C.DELETE });
// ---- write ----
const KEEP = path.join(OUT, 'data'), KEEP_TMP = path.join(OUT, '..', '.keep-data-' + process.pid); const hadData = fs.existsSync(KEEP); if (hadData) fs.renameSync(KEEP, KEEP_TMP); // docs/data/ (brand data JSON for the app) is published by the app repo's scripts/weekly-refresh.sh, not generated here: keep it
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'about'), { recursive: true });
const W = (f, s) => fs.writeFileSync(path.join(OUT, f), s);
const LD = { '@context': 'https://schema.org', '@type': 'MobileApplication', name: 'AA 프랜차이즈 - 쉽게하는창업', alternateName: 'AA Franchise Korea', applicationCategory: 'BusinessApplication', operatingSystem: 'Android 7.0+', inLanguage: L, description: I.ko.desc, url: SITE + '/', image: SITE + '/assets/img/og.jpg', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, author: { '@type': 'Person', name: cfg.operator } };
W('index.html', shell({ page: 'index', file: 'index.html', title: I.ko.title, desc: I.ko.desc, body: indexBody, jsonld: `<script type="application/ld+json">${JSON.stringify(LD)}</script>` }));
W('join.html', shell({ page: 'join', file: 'join.html', title: J.ko.title, desc: J.ko.desc, body: joinBody }));
W('privacy.html', priv.html); W('delete.html', del.html);
W('about/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AA Franchise</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}/"><meta http-equiv="refresh" content="0; url=../"><script>location.replace('../'+location.search+location.hash)</script></head><body><p><a href="../">AA Franchise</a></p></body></html>\n`);
W('404.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AA Franchise — page not found</title><meta name="robots" content="noindex"><style>body{font:18px/1.6 system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#fdf6f9;color:#2a0a1a;text-align:center}a{color:#9d174d;font-weight:600}</style></head><body><main><h1>AA Franchise</h1><p>Page not found.</p><p><a href="${SITE}/">Home</a> · <a href="${SITE}/join.html">Join the test</a> · <a href="${SITE}/privacy.html">Privacy</a></p></main></body></html>\n`);
W('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
W('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.w3.org/2005/sitemap/0.9">\n${['', 'join.html', 'privacy.html', 'delete.html'].map((p) => `  <url><loc>${SITE}/${p}</loc><lastmod>${cfg.policyDate}</lastmod></url>`).join('\n')}\n</urlset>\n`);
W('.nojekyll', '');
fs.writeFileSync(path.join(OUT, 'assets/strings.js'), '/* generated by scripts/build.mjs from src/strings.mjs and src/content.mjs: do not edit */\nwindow.SITE_STR = ' + JSON.stringify({ intro: INTRO, join: JOIN, titles: { index: Object.fromEntries(L.map((l) => [l, INTRO[l].title])), join: Object.fromEntries(L.map((l) => [l, JOIN[l].title])), privacy: priv.titles, delete: del.titles }, descs: { index: Object.fromEntries(L.map((l) => [l, INTRO[l].desc])), join: Object.fromEntries(L.map((l) => [l, JOIN[l].desc])) } }) + ';\n');
fs.writeFileSync(path.join(OUT, 'assets/join-qr.svg'), qrSvg);
for (const f of ['site.css', 'site.js', 'join.js', 'icon.svg', 'motion.css', 'motion.js']) fs.copyFileSync(path.join(SRC, 'assets', f), path.join(OUT, 'assets', f));
fs.mkdirSync(path.join(OUT, 'app'), { recursive: true }); for (const f of ['version.json']) { JSON.parse(fs.readFileSync(path.join(SRC, 'app', f), 'utf8')); fs.copyFileSync(path.join(SRC, 'app', f), path.join(OUT, 'app', f)); }   // the AA Franchise app reads these two files (in-app update notice + notices/changelog)
W('assets/site.webmanifest', JSON.stringify({ name: 'AA 프랜차이즈 - 쉽게하는창업', short_name: 'AA Franchise KR', start_url: './', display: 'browser', background_color: '#2a0a1a', theme_color: '#2a0a1a', icons: [{ src: 'img/icon-192.png', sizes: '192x192', type: 'image/png' }] }) + '\n');
fs.cpSync(path.join(SRC, 'assets/fonts'), path.join(OUT, 'assets/fonts'), { recursive: true }); fs.cpSync(path.join(SRC, 'assets/img'), path.join(OUT, 'assets/img'), { recursive: true });
if (hadData) fs.renameSync(KEEP_TMP, KEEP);
console.log(`built docs/: 3 pages x ${L.length} languages (${L.join(', ')}); optInLive=${live}${process.env.OPTIN_LIVE ? ' (env override)' : ''}; policy date ${cfg.policyDate}`);
