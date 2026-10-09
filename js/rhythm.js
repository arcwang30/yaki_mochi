'use strict';

// ===== 節奏分析：記錄每一場的節奏表現，統計出「音感等級」、進步曲線、時間差分布、各星級命中率 =====
// 每打完一首（新手教學除外）存一筆到 Save.data.history（最多 100 場，只存在本機）。

const Rhythm = {
  MAX: 100,          // 保留幾場
  RECENT: 20,        // 音感等級用最近幾場判斷
  CHART: 30,         // 進步曲線畫最近幾場
  BIN: 30, BINS: 12, // 時間差分布：每 30ms 一格，-180 ～ +180ms

  // 等級（由上往下判斷，符合就停）
  LEVELS: [
    { name: '人體節拍器', color: '#c8321e', test: a => a.acc >= 92 && a.sd <= 28 && Math.abs(a.bias) <= 15,
      text: '分毫不差！你的身體裡住著一台節拍器，連鐵板都跟著你的拍子滋滋響。' },
    { name: '音感絕佳', color: '#e07a10', test: a => a.acc >= 85 && a.sd <= 40,
      text: '又準又穩，客人都說看你煎廣島燒像在看表演！' },
    { name: '節奏穩健', color: '#2e9a3e', test: a => a.acc >= 72,
      text: '大部分都踩在拍子上，再穩一點就是名攤師傅了。' },
    { name: '漸入佳境', color: '#1f9ab8', test: a => a.trend !== null && a.trend >= 5,
      text: '最近越打越準！手感正在升溫，繼續保持。' },
    { name: '還在暖身', color: '#2a6fd6', test: a => a.acc >= 55,
      text: '時快時慢，鍋鏟還在找節奏。跟著大鼓「咚、咚」數拍子試試看！' },
    { name: '音感待加強', color: '#7a6aa8', test: () => true,
      text: '節拍好像跑去隔壁攤了……先從 ★1 的慢歌開始練練手吧！' },
  ],

  // 一場的準確度：GREAT 100%、NICE 80%、GOOD 50%、BAD 0%
  accOf(g) { const n = g[0] + g[1] + g[2] + g[3]; return n ? (g[0] + g[1] * 0.8 + g[2] * 0.5) / n * 100 : 0; },

  record(song, s, ratio) {
    const e = s.errs.map(x => x * 1000), n = e.length;
    const avg = n ? e.reduce((a, b) => a + b, 0) / n : 0;
    const sd = n > 1 ? Math.sqrt(e.reduce((a, b) => a + (b - avg) * (b - avg), 0) / n) : 0;
    const h = new Array(this.BINS).fill(0);
    for (const x of e) h[clamp(Math.floor((x + this.BIN * this.BINS / 2) / this.BIN), 0, this.BINS - 1)]++;
    const G = s.grades, g = [G.GREAT, G.NICE, G.GOOD, G.BAD];
    const d = Save.data;
    d.history.push({ t: Date.now(), id: song.id, st: song.stars, g, avg: Math.round(avg), sd: Math.round(sd), h, r: Math.round(ratio * 100), mc: s.maxCombo });
    if (d.history.length > this.MAX) d.history.splice(0, d.history.length - this.MAX);
    const T = d.totals;
    T.plays++; T.oko += s.oko; T.maxCombo = Math.max(T.maxCombo, s.maxCombo); T.songs[song.id] = (T.songs[song.id] || 0) + 1;
    Save.store();
  },

  // 統計（沒有紀錄時回傳 null）
  analyze() {
    const all = Save.data.history;
    if (!all.length) return null;
    const recent = all.slice(-this.RECENT), mean = (arr, f) => arr.reduce((a, x) => a + f(x), 0) / arr.length;
    // 時間差以命中數加權（音符多的場次影響較大）
    const hits = p => p.g[0] + p.g[1] + p.g[2] + p.g[3];
    const wsum = recent.reduce((a, p) => a + hits(p), 0) || 1;
    const a = {
      count: all.length, recentN: recent.length,
      acc: mean(recent, p => this.accOf(p.g)),
      bias: recent.reduce((s, p) => s + p.avg * hits(p), 0) / wsum,
      sd: recent.reduce((s, p) => s + p.sd * hits(p), 0) / wsum,
      great: recent.reduce((s, p) => s + p.g[0], 0) / wsum * 100,
      trend: null,
    };
    // 進步趨勢：最近 5 場 vs 再之前 5 場（至少 6 場才算）
    if (all.length >= 6) { const last = all.slice(-5), prev = all.slice(-10, -5); a.trend = mean(last, p => this.accOf(p.g)) - mean(prev, p => this.accOf(p.g)); }
    a.level = this.LEVELS.find(L => L.test(a));
    a.curve = all.slice(-this.CHART).map(p => this.accOf(p.g));
    a.hist = new Array(this.BINS).fill(0);
    for (const p of recent) p.h.forEach((v, i) => { a.hist[i] += v; });
    a.stars = [1, 2, 3, 4, 5].map(st => { const ps = all.filter(p => p.st === st); return { st, n: ps.length, acc: ps.length ? mean(ps, p => this.accOf(p.g)) : null }; });
    const T = Save.data.totals, fav = Object.entries(T.songs).sort((x, y) => y[1] - x[1])[0];
    a.totals = { plays: T.plays, oko: T.oko, maxCombo: T.maxCombo, fav: fav ? songById(fav[0]) : null };
    a.advice = this.advice(a);
    return a;
  },

  // 給玩家的建議（最多兩句）
  advice(a) {
    const out = [];
    if (a.bias > 25) out.push(tr('你習慣偏晚約 {0}ms：到「設定 → 自動校正」量一次會更準', Math.round(a.bias)));
    else if (a.bias < -25) out.push(tr('你習慣偏早約 {0}ms：別急，聽到拍子再按', Math.round(-a.bias)));
    if (a.sd > 55) out.push(tr('時間差忽早忽晚：跟著大鼓「咚、咚」在心裡數拍子'));
    const weak = a.stars.find(s => s.n >= 2 && s.acc < 60);
    if (weak && out.length < 2) out.push(tr('★{0} 開始比較吃力：多練幾首 ★{1} 的歌再挑戰', weak.st, Math.max(1, weak.st - 1)));
    if (!out.length) out.push(tr('保持這個手感，挑戰更高的星級吧！'));
    return out.slice(0, 2);
  },
};
