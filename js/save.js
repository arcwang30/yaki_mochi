'use strict';

// ===== 本機存檔：設定與本機排行榜（localStorage；每首歌一個排行榜） =====
const Save = {
  key: 'daioyaki.v1',
  data: { music: 4, sfx: 4, offset: 0, vibrate: true, eco: false, lang: null, tutorialDone: false, name: '', lastSong: null, boards: null },

  // 各曲預設排行榜的分數倍率（曲子越難、音符越多，分數越高）
  SEED_SCALE: { tsukimi: 0.75, yatai: 1, swing: 1.05, funk: 1.12, hyper: 1.2, bossa: 0.75, chindon: 1, ska: 1.05, chip: 1.12, dnb: 1.2,
    musicbox: 0.72, reggae: 0.75, citypop: 1, ondo: 1, samba: 1.05, surf: 1.05, disco: 1.12, boogie: 1.12, jrock: 1.2, hoedown: 1.2,
    gamelan: 0.7, hawaii: 0.75, synthwave: 1, future: 1, anime: 1.06, britpop: 1.12, dancepunk: 1.14, thrash: 1.22, power: 1.2, wametal: 1.2 },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    const d = this.data;
    if (!d.boards || typeof d.boards !== 'object' || Array.isArray(d.boards)) d.boards = {};
    // 舊版只有一首歌的排行榜：搬到「屋台ばやし」
    if (Array.isArray(d.board)) { if (d.board.length && !d.boards.yatai) d.boards.yatai = d.board; delete d.board; }
    if (!d.lang) {   // 第一次：依瀏覽器語言
      const l = (navigator.language || 'zh').toLowerCase();
      d.lang = l.startsWith('ja') ? 'ja' : l.startsWith('zh') ? 'zh' : 'en';
    }
  },

  store() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },

  // 預設排行榜（讓第一次玩的人也有目標）
  seed(id) {
    const names = ['TAKOYAKI', 'RAMEN', 'ONIGIRI', 'MOCHI', 'DANGO', 'TAIYAKI', 'GYOZA', 'UDON', 'SOBA', 'TEMPURA',
      'SUSHI', 'KATSU', 'NABE', 'MISO', 'YAKITORI', 'DAIFUKU', 'MATCHA', 'KUNI', 'SAKURA', 'DARUMA'];
    const k = this.SEED_SCALE[id] || 1;
    this.data.boards[id] = names.map((n, i) => ({ name: n, score: Math.round((52000 - i * 2400) * k / 100) * 100, oko: Math.max(1, Math.round((16 - i * 0.75) * k)), seed: true }));
    this.store();
  },

  board(id) {
    const b = this.data.boards;
    if (!Array.isArray(b[id]) || !b[id].length) this.seed(id);
    return b[id];
  },

  sort(id) {
    const b = this.board(id);
    b.sort((x, y) => y.score - x.score);
    b.length = Math.min(b.length, 20);
  },

  qualifies(score, id) {
    const b = this.board(id);
    return score > 0 && (b.length < 20 || score > b[b.length - 1].score);
  },

  add(entry, id) {
    this.board(id).push(entry);
    this.sort(id);
    this.data.name = entry.name;
    this.store();
    return this.board(id).indexOf(entry);
  },

  // HISCORE = 該曲排行榜第一名（有線上排行榜時用線上的）
  best(id) {
    const c = Online.enabled && Online.cache[id];
    const l = c && c.length ? c : this.board(id);
    return l.length ? l[0].score : 0;
  },
};

Save.load();
