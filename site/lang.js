// 語言切換（中文／日本語／English）：每個語言一個 <article data-lang>，標題與日期放在 data-title / data-date。
// 網址加 ?lang=zh|ja|en 指定語言；沒指定時依瀏覽器語言（日文 → ja、中文 → zh、其他 → en）。
(function () {
  var arts = document.querySelectorAll('article[data-lang]'), btns = document.querySelectorAll('nav.langs button');
  var title = document.getElementById('title'), date = document.getElementById('date');
  function show(lang) {
    var cur = null;
    arts.forEach(function (a) { var on = a.dataset.lang === lang; a.hidden = !on; if (on) cur = a; });
    if (!cur) return;
    btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    if (title && cur.dataset.title) title.textContent = cur.dataset.title;
    if (date && cur.dataset.date) date.textContent = cur.dataset.date;
    if (cur.dataset.doctitle) document.title = cur.dataset.doctitle;
    document.documentElement.lang = cur.lang;
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.lang); history.replaceState(null, '', '?lang=' + b.dataset.lang); });
  });
  var q = new URLSearchParams(location.search).get('lang'), nav = (navigator.language || '').toLowerCase();
  show(['zh', 'ja', 'en'].indexOf(q) >= 0 ? q : nav.indexOf('ja') === 0 ? 'ja' : nav.indexOf('zh') === 0 ? 'zh' : 'en');
})();
