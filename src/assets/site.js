/* AA Franchise site: language + text swap (all pages). No tracking, no network calls.
   Start language: ?lang= > saved choice (localStorage frkr.site.lang) > browser language (primary tag among th/en/ko/zh/hi) > Korean. */
(function () {
  'use strict';
  var LANGS = ['th', 'en', 'ko', 'zh', 'hi'], KEY = 'frkr.site.lang';
  var S = window.SITE_STR || {}, page = document.body.getAttribute('data-page') || 'index';
  var dict = S[page === 'join' ? 'join' : 'intro'] || {};
  var M = window.Motion;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var lang = window.__L || 'ko', explicit = !!window.__LX;
  function t(k) { var d = dict[lang]; return d && d[k] != null ? d[k] : (dict.ko || dict.en || {})[k] || ''; }
  window.SiteT = t; window.SiteLang = function () { return lang; };
  function metaSet(sel, v) { var m = $(sel); if (m && v) m.setAttribute('content', v); }
  function paint() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang; document.documentElement.setAttribute('data-lang', lang);
    $$('[data-t]').forEach(function (e) { var v = t(e.getAttribute('data-t')); if (v && e.textContent !== v) e.textContent = v; });
    $$('[data-alt]').forEach(function (e) { e.setAttribute('alt', t(e.getAttribute('data-alt'))); });
    $$('[data-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-aria'))); });
    var title = (S.titles && S.titles[page] && S.titles[page][lang]) || t('title');
    if (title) { document.title = title; metaSet('meta[property="og:title"]', title); metaSet('meta[name="twitter:title"]', title); }
    var desc = (S.descs && S.descs[page] && S.descs[page][lang]) || t('desc');
    if (desc) { metaSet('meta[name=description]', desc); metaSet('meta[property="og:description"]', desc); metaSet('meta[name="twitter:description"]', desc); }
    var sel = $('#lang'); if (sel) sel.value = lang;
    if (explicit) $$('a[data-int]').forEach(function (a) { var h = a.getAttribute('data-href') || a.getAttribute('href'); a.setAttribute('data-href', h); var p = h.split('#'), q = p[0].replace(/[?&]lang=\w+/, ''); a.setAttribute('href', q + (q.indexOf('?') < 0 ? '?' : '&') + 'lang=' + lang + (p[1] ? '#' + p[1] : '')); });
    $$('img[data-shot]').forEach(function (e) { var u = 'assets/img/play/kr-' + e.getAttribute('data-shot') + '.webp'; if (e.getAttribute('src') !== u) e.setAttribute('src', u); });
    media();
    if (typeof window.onSitePaint === 'function') window.onSitePaint(lang);
  }
  // Promo video (intro): Thai only (owner rule: promotion in Thai), used for every site language. Autoplay muted loop; paused while off screen; with reduced motion it stays a still poster with controls.
  var vid = $('#promo'), vidKey = '';
  function media() {
    if (!vid) return;
    var k = 'th', first = !vidKey;
    if (k !== vidKey) {
      vidKey = k; var u = 'assets/video/promo-' + k + '.mp4';
      if (!(vid.getAttribute('src') || '').endsWith(u)) { vid.setAttribute('poster', 'assets/img/poster-' + k + '.webp'); vid.setAttribute('src', u); vid.load(); }
    }
    if (M && M.reduced()) { vid.removeAttribute('autoplay'); vid.pause(); vid.controls = true; return; }
    vid.muted = true; if (!first || vid.paused) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
  }
  if (vid && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (x) { if (M && M.reduced()) return; if (x.isIntersecting) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } else vid.pause(); }); }, { threshold: .15 }).observe(vid);
  // count-up for the numbers strip, once, when it scrolls into view (real text is already the final value)
  if ('IntersectionObserver' in window && M) { var cio = new IntersectionObserver(function (es) { es.forEach(function (x) { if (!x.isIntersecting) return; cio.unobserve(x.target); M.roll(x.target, 0, parseFloat(x.target.getAttribute('data-count')), function (v) { return String(Math.round(v)); }, 700); }); }, { threshold: .6 }); $$('[data-count]').forEach(function (e) { cio.observe(e); }); }
  function setLang(l, fade) {
    if (LANGS.indexOf(l) < 0) return; lang = l; explicit = true;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    paint(); if (fade && M) M.langFade($('main'));
  }
  var sel = $('#lang'); if (sel) sel.addEventListener('change', function () { setLang(this.value, true); });
  paint();
  document.documentElement.classList.remove('lw');   // text is final: show the page
})();
