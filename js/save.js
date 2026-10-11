'use strict';

// ===== 本機存檔：設定與成績（localStorage） =====
const Save = {
  key: 'daioyaki.v1',
  data: { music: 4, sfx: 4, offset: 0, vibrate: true, voice: true, eco: false, lang: null, res: '1920x1080', bg: 'stall', hitSound: 'classic', pet: 'none', coins: 0, owned: null, tutorialDone: false, lastSong: null,
    best: null,    // 自己的最佳成績（HISCORE）：{ 紀錄id: { score, oko, combo } }（紀錄 id 見 songs.js 的 recId）
    history: [],   // 節奏分析：最近 100 場的遊玩紀錄（見 js/rhythm.js）
    totals: null,  // 累計：場數、廣島燒、最高連擊、每首歌玩幾次
    diff: 1,       // 選曲畫面選的難度（0 簡單、1 普通、2 困難）
    medals: null,  // 曲目獎章：{ 歌曲id: { r: 最佳評價（RATINGS 的索引，越小越好）, fc: 全連擊, ag: 全 GREAT } }
  },


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
    if (!d.best || typeof d.best !== 'object' || Array.isArray(d.best)) d.best = {};
    if (!Array.isArray(d.history)) d.history = [];
    if (!d.totals || typeof d.totals !== 'object') d.totals = { plays: 0, oko: 0, maxCombo: 0, songs: {} };
    if (!d.medals || typeof d.medals !== 'object') d.medals = {};
    // 舊版的排行榜（boards／更舊的單一 board）：取玩家自己的最高分當成 HISCORE（預設名單 seed 不算），之後刪掉
    const old = Object.assign({}, d.boards && typeof d.boards === 'object' ? d.boards : {}, Array.isArray(d.board) ? { yatai: d.board } : {});
    for (const [id, list] of Object.entries(old)) {
      const mine = (Array.isArray(list) ? list : []).filter(e => e && !e.seed && e.score > 0);
      const top = mine.reduce((a, e) => (!a || e.score > a.score ? e : a), null);
      if (top && (!d.best[id] || top.score > d.best[id].score)) d.best[id] = { score: top.score, oko: top.oko || 0, combo: top.combo || 0 };
    }
    delete d.boards; delete d.board; delete d.name;
    if (!RESOLUTIONS.includes(d.res)) d.res = RESOLUTIONS[0];
    if (!BACKGROUNDS.some(b => b.id === d.bg)) d.bg = 'stall';
    if (!HIT_SOUNDS.some(h => h.id === d.hitSound)) d.hitSound = 'classic';   // 打擊音效包
    if (!PETS.some(p => p.id === d.pet)) d.pet = 'none';   // 陪伴寵物
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

  // HISCORE = 自己這一首（這個難度）的最高分；沒玩過 = 0
  best(id) { return (this.data.best[id] && this.data.best[id].score) || 0; },
  // 記下這一局：比最高分高就更新。回傳是否刷新紀錄
  recordBest(id, r) {
    if (!(r.score > this.best(id))) return false;
    this.data.best[id] = { score: r.score, oko: r.oko, combo: r.maxCombo };
    this.store();
    return true;
  },

  // ---- 存檔備份：匯出成一串「存檔碼」，在其他裝置或資料被清掉後貼回來還原 ----
  // 舊版的存檔碼（含排行榜 boards）也能匯入：normalize() 會把裡面玩家自己的成績搬成 HISCORE
  CODE_HEAD: 'DAIOYAKI1.',
  exportCode() {
    const json = JSON.stringify(this.data), bytes = new TextEncoder().encode(json);
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
      return d && typeof d === 'object' && !Array.isArray(d) && (d.best || d.boards || d.history) ? d : null;
    } catch (e) { return null; }
  },
  // 用存檔碼覆蓋目前的存檔
  importData(d) {
    const keep = { lang: this.data.lang, res: this.data.res };   // 語言、解析度跟著這台裝置
    this.data = Object.assign({}, this.data, d, keep);
    if (!d.best) this.data.best = {};   // 舊版存檔碼：從它的排行榜重建（normalize）
    this.normalize();
    this.store();
  },
};

Save.load();
