/* AA Franchise /join: 5 progress ticks + a 14-day counter (remembered on this device only), locked steps while Play testing is not live, copy/share, reset. No network calls. */
(function () {
  'use strict';
  var KEY = 'frkr.join.v2', N = 5, M = window.Motion, t = window.SiteT;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var st = { done: {}, at: 0 };
  try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); for (var i = 1; i <= N; i++) st.done[i] = !!(s.done && s.done[i]); st.at = +s.at || 0; } catch (e) { for (var j = 1; j <= N; j++) st.done[j] = false; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function count() { var c = 0; for (var i = 1; i <= N; i++) if (st.done[i]) c++; return c; }
  function elapsed() { return st.at ? Math.floor((Date.now() - st.at) / 864e5) : 0; }   // whole days since step 4 was ticked
  function paintState() {
    if (st.at && st.done[4] && elapsed() >= 14 && !st.done[5]) { st.done[5] = true; save(); }
    var n = count();
    $$('.step').forEach(function (c) {
      var k = +c.getAttribute('data-step'); c.classList.toggle('done', !!st.done[k]);
      var b = $('.num', c); b.setAttribute('aria-pressed', st.done[k] ? 'true' : 'false'); b.setAttribute('aria-label', t('step').replace('{n}', k) + ' — ' + t(st.done[k] ? 'doneLab' : 'todoLab'));
    });
    $('#progTxt').textContent = t('prog').replace('{n}', n);
    $('#barFill').style.transform = 'scaleX(' + (n / N) + ')';
    $('#all').hidden = n < N;
    // 14-day dots
    var d = st.at && st.done[4] ? Math.min(14, elapsed() + 1) : 0, finished = st.done[5] && st.at && elapsed() >= 14;
    $$('#days .dots li').forEach(function (li, i) { li.classList.toggle('on', i < d); });
    $('#dayTxt').textContent = !d ? t('dayWait') : finished ? t('dayDone') : t('day').replace('{n}', d);
  }
  window.onSitePaint = paintState;
  function mark(k, v) {
    var was = !!st.done[k]; st.done[k] = v;
    if (k === 4) { if (v && !st.at) st.at = Date.now(); if (!v) { st.at = 0; st.done[5] = false; } }
    save(); paintState(); if (v && !was && M) M.pop($('#c' + k + ' .num'));
  }
  $$('.num').forEach(function (b) { b.addEventListener('click', function () { var k = +b.getAttribute('data-chk'); mark(k, !st.done[k]); }); });
  $$('[data-ack]').forEach(function (b) { b.addEventListener('click', function () { mark(+b.getAttribute('data-ack'), true); }); });
  $$('[data-go]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var c = a.closest('.step');
      if (c && c.hasAttribute('data-locked')) { e.preventDefault(); var p = $('#pend'); if (p) { p.classList.remove('nudge'); void p.offsetWidth; p.classList.add('nudge'); if (M) M.scrollTo(p, 'center'); } return; }
      setTimeout(function () { mark(+a.getAttribute('data-go'), true); }, 600);   // the link opens in a new tab; on return the step is ticked (untick with the number)
    });
  });
  $('#reset').addEventListener('click', function () { st = { done: { 1: false, 2: false, 3: false, 4: false, 5: false }, at: 0 }; save(); paintState(); if (M) M.scrollTo($('#steps'), 'start'); });
  function flash(btn, key) { var sp = $('span', btn); sp.textContent = t(key); clearTimeout(btn._t); btn._t = setTimeout(function () { sp.textContent = t('copyEmail'); }, 1800); }
  var ce = $('#copyEmail');
  if (ce) ce.addEventListener('click', function () {
    var mail = $('.addr code').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mail).then(function () { flash(ce, 'emailCopied'); }, function () { flash(ce, 'copyFail'); });
    else flash(ce, 'copyFail');
  });
  var url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'join.html', note = $('#shareNote');
  function say(k) { note.textContent = t(k); clearTimeout(say._t); say._t = setTimeout(function () { note.textContent = ''; }, 3500); }
  $('#share').addEventListener('click', function () {
    var data = { title: t('shareTitle'), text: t('shareText'), url: url };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { say('copied'); }, function () { say('copyFail'); });
    else say('copyFail');
  });
  // Facebook / Instagram / LINE / Messenger in-app browser (or any Android WebView): Google Groups / Play often fail there, so ask to open the page in Chrome first (rule: AA-common-rules, tester recruiting).
  var ua = navigator.userAgent || '', iab = $('#iab');
  if (iab && /Android/i.test(ua) && /FBAN|FBAV|FB_IAB|Instagram|\bLine\/|MessengerLite|; wv\)/i.test(ua)) {
    var pageUrl = location.href.split('#')[0];
    iab.hidden = false;
    $('#iabOpen').setAttribute('href', 'intent://' + pageUrl.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(pageUrl) + ';end');
    $('#iabCopy').addEventListener('click', function () {
      var n = $('#iabNote'), ok = function () { n.textContent = t('iabOk'); }, bad = function () { n.textContent = t('copyFail'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pageUrl).then(ok, bad); else bad();
    });
  }
  paintState();
})();
