'use strict';

// ===== 本機存檔：設定與本機排行榜（localStorage） =====
const Save = {
  key: 'daioyaki.v1',
  data: { music: 4, sfx: 4, offset: 0, vibrate: true, lang: null, name: '', board: null },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    if (!Array.isArray(this.data.board) || !this.data.board.length) this.seed();
    if (!this.data.lang) {   // 第一次：依瀏覽器語言
      const l = (navigator.language || 'zh').toLowerCase();
      this.data.lang = l.startsWith('ja') ? 'ja' : l.startsWith('zh') ? 'zh' : 'en';
    }
    this.sort();
  },

  store() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },

  // 預設排行榜（讓第一次玩的人也有目標）
  seed() {
    const names = ['TAKOYAKI', 'RAMEN', 'ONIGIRI', 'MOCHI', 'DANGO', 'TAIYAKI', 'GYOZA', 'UDON', 'SOBA', 'TEMPURA',
      'SUSHI', 'KATSU', 'NABE', 'MISO', 'YAKITORI', 'DAIFUKU', 'MATCHA', 'KUNI', 'SAKURA', 'DARUMA'];
    this.data.board = names.map((n, i) => ({ name: n, score: 52000 - i * 2400, oko: Math.max(1, 16 - Math.round(i * 0.75)), seed: true }));
    this.store();
  },

  board() { return this.data.board; },

  sort() {
    const b = this.data.board;
    b.sort((x, y) => y.score - x.score);
    b.length = Math.min(b.length, 20);
  },

  qualifies(score) {
    const b = this.board();
    return score > 0 && (b.length < 20 || score > b[b.length - 1].score);
  },

  add(entry) {
    this.board().push(entry);
    this.sort();
    this.data.name = entry.name;
    this.store();
    return this.board().indexOf(entry);
  },

  // HISCORE = 排行榜第一名（有線上排行榜時用線上的）
  best() {
    const l = Online.enabled && Online.cache && Online.cache.length ? Online.cache : this.board();
    return l.length ? l[0].score : 0;
  },
};

Save.load();
