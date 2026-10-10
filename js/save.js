'use strict';

// ===== 本機存檔：設定與本機排行榜（localStorage；每首歌一個排行榜） =====
const Save = {
  key: 'daioyaki.v1',
  data: { music: 4, sfx: 4, offset: 0, vibrate: true, voice: true, eco: false, lang: null, res: '1920x1080', bg: 'stall', coins: 0, owned: null, tutorialDone: false, name: '', lastSong: null, boards: null,
    history: [],   // 節奏分析：最近 100 場的遊玩紀錄（見 js/rhythm.js）
    totals: null,  // 累計：場數、廣島燒、最高連擊、每首歌玩幾次
    diff: 1,       // 選曲畫面選的難度（0 簡單、1 普通、2 困難）
    medals: null,  // 曲目獎章：{ 歌曲id: { r: 最佳評價（RATINGS 的索引，越小越好）, fc: 全連擊, ag: 全 GREAT } }
  },

  // 各曲預設排行榜的分數倍率（曲子越難、音符越多，分數越高）
  SEED_SCALE: { tsukimi: 0.75, yatai: 1, swing: 1.05, funk: 1.12, hyper: 1.2, bossa: 0.75, chindon: 1, ska: 1.05, chip: 1.12, dnb: 1.2,
    musicbox: 0.72, reggae: 0.75, citypop: 1, ondo: 1, samba: 1.05, surf: 1.05, disco: 1.12, boogie: 1.12, jrock: 1.2, hoedown: 1.2,
    gamelan: 0.7, hawaii: 0.75, synthwave: 1, future: 1, anime: 1.06, britpop: 1.12, dancepunk: 1.14, thrash: 1.22, power: 1.2, wametal: 1.2 },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    this.normalize();
  },
  // 補齊缺的欄位、修正格式（讀檔與匯入存檔碼後都會呼叫）
  normalize() {
    const d = this.data;
    if (!d.boards || typeof d.boards !== 'object' || Array.isArray(d.boards)) d.boards = {};
    if (!Array.isArray(d.history)) d.history = [];
    if (!d.totals || typeof d.totals !== 'object') d.totals = { plays: 0, oko: 0, maxCombo: 0, songs: {} };
    if (!d.medals || typeof d.medals !== 'object') d.medals = {};
    // 舊版只有一首歌的排行榜：搬到「屋台ばやし」
    if (Array.isArray(d.board)) { if (d.board.length && !d.boards.yatai) d.boards.yatai = d.board; delete d.board; }
    if (!RESOLUTIONS.includes(d.res)) d.res = RESOLUTIONS[0];
    if (!BACKGROUNDS.some(b => b.id === d.bg)) d.bg = 'stall';
    if (!Array.isArray(d.owned)) d.owned = [];   // 用遊戲幣買到的商品（「種類:id」，例如 bg:rock）
    if (!(d.coins >= 0)) d.coins = 0;
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
    // 各難度的排行榜 id = 歌曲id（普通）、歌曲id_easy、歌曲id_hard
    const m = String(id).match(/^(.*?)(_easy|_hard)?$/), k = (this.SEED_SCALE[m[1]] || 1) * (m[2] === '_easy' ? 0.7 : m[2] === '_hard' ? 1.25 : 1);
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

  // ---- 存檔備份：匯出成一串「存檔碼」，在其他裝置或資料被清掉後貼回來還原 ----
  // 排行榜裡的預設名單（seed）不匯出（還原時會重新產生），只留玩家自己的成績
  CODE_HEAD: 'DAIOYAKI1.',
  exportCode() {
    const d = JSON.parse(JSON.stringify(this.data)), boards = {};
    for (const [id, b] of Object.entries(d.boards || {})) { const mine = (b || []).filter(e => !e.seed); if (mine.length) boards[id] = mine; }
    d.boards = boards;
    const json = JSON.stringify(d), bytes = new TextEncoder().encode(json);
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return this.CODE_HEAD + btoa(bin);
  },
  // 解析存檔碼：成功回傳資料物件，失敗回傳 null
  parseCode(code) {
    try {
      code = String(code || '').replace(/\s+/g, '');
      const at = code.indexOf(this.CODE_HEAD); if (at < 0) return null;
      const bin = atob(code.slice(at + this.CODE_HEAD.length)), bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      const d = JSON.parse(new TextDecoder().decode(bytes));
      return d && typeof d === 'object' && d.boards && typeof d.boards === 'object' ? d : null;
    } catch (e) { return null; }
  },
  // 用存檔碼覆蓋目前的存檔（排行榜補回預設名單）
  importData(d) {
    const keep = { lang: this.data.lang, res: this.data.res };   // 語言、解析度跟著這台裝置
    const mine = d.boards; d.boards = {};
    this.data = Object.assign({}, this.data, d, keep);
    this.data.boards = {};
    for (const [id, list] of Object.entries(mine)) { this.seed(id); this.data.boards[id].push(...list); this.sort(id); }
    this.normalize();
    this.store();
  },
};

Save.load();
