'use strict';

// ===== 節奏遊戲核心：場景、主角、特效、譜面、時鐘、判定、HUD =====

// ---------- 主角姿勢 ----------
const chef = { queue: [], pose: 'wave', poseT: 0, idlePose: 'wave', lift: 0 };
function setPoses(list) { chef.queue = list.map(p => ({ ...p })); chef.pose = chef.queue[0].pose; chef.poseT = 0; }
function updateChef(dt) {
  if (!chef.queue.length) chef.pose = chef.idlePose;
  else {
    chef.poseT += dt;
    if (chef.poseT >= chef.queue[0].dur) {
      chef.queue.shift(); chef.poseT = 0;
      chef.pose = chef.queue.length ? chef.queue[0].pose : chef.idlePose;
    }
  }
  // 處理動作時快速往上探身，動作結束再落回
  const target = POSE_LIFT[chef.pose] || 0;
  chef.lift += (target - chef.lift) * Math.min(1, dt * (target > chef.lift ? 30 : 14));
}

// ---------- 特效 ----------
const Fx = {
  particles: [], embers: [], popups: [],
  burst(x, y, color, n = 14, spd = 380) {
    if (ECO()) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05), v = rand(spd * 0.35, spd);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.4, 0.8), max: 0.8, color, size: rand(4, 9), g: 1100, kind: 'bit' });
    }
  },
  stars(x, y, n = 8) {
    for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(150, 420); this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, max: 0.5, color: '#fff6b0', size: rand(6, 11), g: 0, kind: 'star' }); }
  },
  steam(x, y, n = 3) { for (let i = 0; i < n; i++) this.particles.push({ x: x + rand(-50, 50), y, vx: rand(-20, 20), vy: rand(-90, -50), life: rand(0.7, 1.2), max: 1.2, size: rand(14, 24), g: -20, kind: 'steam' }); },
  smoke(x, y) { this.particles.push({ x, y, vx: 0, vy: -60, life: 0.8, max: 0.8, size: 18, g: -20, kind: 'smoke' }); },
  sparks(x, y, n = 14) {   // 鐵板火花（鍋鏟翻炒）
    if (ECO()) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI * 0.85, -Math.PI * 0.15), v = rand(250, 520);
      this.particles.push({ x: x + rand(-60, 60), y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.25, 0.5), max: 0.5, color: pick(['#ffd040', '#ff9a2a', '#fff2a0']), size: rand(3, 6), g: 900, kind: 'bit' });
    }
  },
  clear() { this.particles = []; this.popups = []; },
  update(dt) {
    for (const p of this.particles) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const p of this.popups) { p.y -= 60 * dt; p.life -= dt; }
    this.popups = this.popups.filter(p => p.life > 0);
    if (!ECO() && Math.random() < dt * 14) this.embers.push({ x: rand(VIEW.x0, VIEW.x1), y: rand(SH * 0.35, SH * 0.7), vy: rand(-40, -15), vx: rand(-8, 8), life: rand(2, 4), max: 4, size: rand(1.5, 3.5), hue: rand(25, 50) });
    for (const e of this.embers) { e.x += e.vx * dt + Math.sin(Game.time * 2 + e.y * 0.02) * 0.3; e.y += e.vy * dt; e.life -= dt; }
    this.embers = this.embers.filter(e => e.life > 0);
  },
  draw() {
    for (const p of this.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.kind === 'steam' || p.kind === 'smoke') {
        ctx.fillStyle = p.kind === 'steam' ? `rgba(255,255,255,${a * 0.3})` : `rgba(40,40,40,${a * 0.45})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.7 - a * 0.7), 0, 7); ctx.fill();
      } else if (p.kind === 'star') {
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.translate(p.x, p.y); ctx.rotate(Game.time * 8);
        ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? p.size * 0.45 : p.size; ctx.lineTo(Math.cos(i * Math.PI / 5) * r, Math.sin(i * Math.PI / 5) * r); } ctx.fill(); ctx.restore();
      } else { ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); ctx.globalAlpha = 1; }
    }
  },
};

// ---------- 場景（背景、燈籠光暈、主角、鐵板）：選單與遊戲共用 ----------
const Scene = {
  bg: { s: 1, x: 0, y: 0 },
  // 目前的店面背景圖、燈籠光暈位置、兩側街景主題（選的圖還沒載入完，先用原本的攤位）
  // preview：商店裡正在看的背景（還沒裝備），離開商店時清掉
  preview: null,
  theme() {
    const id = this.preview || Save.data.bg, t = BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0], img = IMG['bg_' + t.id] || Assets.bg(t.id);
    return img ? { img, lanterns: t.lanterns, street: { ...STREET_BASE, ...t.street } } : { img: IMG.bg_stall, lanterns: LANTERNS, street: STREET_BASE };
  },
  draw(pulse) {
    this.background(pulse);
    this.chef(pulse);
    this.griddle();
  },
  // lit(i)：第 i 盞燈籠的亮度 0～1（開場用來一盞一盞點亮；省略 = 全亮）
  // sky = false：橫式不畫夜空層（開場時夜空另外畫，野台升起時只有街景移動）
  background(pulse, lit, sky = true) {
    const { img, lanterns, street } = this.theme();
    if (img) {
      const s = Math.max(SW / img.width, SH / img.height); this.bg = { s, x: (SW - img.width * s) / 2, y: (SH - img.height * s) / 2 };
      // 背景先依畫布解析度縮放好存起來（畫面大小），之後每幀 1:1 貼上（省下每幀縮放大圖的運算）
      // 橫式：兩側先畫延伸的夜市街景（js/street.js），攤位原圖疊在中間、左右邊緣淡入街景
      if (!this.bgCache || this.bgCache.res !== RES || this.bgCache.img !== img) {
        const c = document.createElement('canvas'); c.width = Math.round(W * RES); c.height = Math.round(H * RES);
        const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.scale(RES, RES);
        const k = Cam.k, rect = [Cam.x + this.bg.x * k, this.bg.y * k, img.width * s * k, img.height * s * k];
        if (LAND) { Street.paint(g, rect, street); g.drawImage(Street.feather(img, rect[2], rect[3]), rect[0], rect[1], rect[2], rect[3]); }
        else g.drawImage(img, ...rect);
        this.bgCache = { c, res: RES, img };
      }
      if (LAND && sky) {
        if (!this.skyCache || this.skyCache.res !== RES) this.skyCache = { c: Street.skyCanvas(), res: RES };
        ctx.drawImage(this.skyCache.c, VIEW.x0, 0, VIEW.x1 - VIEW.x0, SH);
      }
      ctx.drawImage(this.bgCache.c, VIEW.x0, 0, VIEW.x1 - VIEW.x0, SH);
    } else { ctx.fillStyle = '#1a1f3a'; ctx.fillRect(VIEW.x0, 0, VIEW.x1 - VIEW.x0, SH); }
    // 燈籠光暈：隨節拍一起閃
    const B = this.bg;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 光暈用預先畫好的圖（每種顏色一張）貼上，不再每幀建立 28 個漸層（最耗電的部分）
    lanterns.forEach(([lx, ly, c, r0], i) => {
      const on = lit ? lit(i) : 1; if (on <= 0) return;
      const x = B.x + lx * B.s, y = B.y + ly * B.s;
      const flick = 0.75 + 0.25 * Math.sin(Game.time * 7 + i * 1.7) * Math.sin(Game.time * 3.1 + i);
      const r = (r0 || (i < 10 ? 70 : 42)) * (1 + pulse * 0.25);
      ctx.globalAlpha = clamp(0.42 * on * flick * (0.7 + pulse * 0.5), 0, 1);
      ctx.drawImage(this.glowSprite(c), x - r, y - r, r * 2, r * 2);
    });
    ctx.globalAlpha = 1;
    if (!ECO()) for (const e of Fx.embers) {
      const a = clamp(e.life / e.max, 0, 1) * (0.6 + 0.4 * Math.sin(Game.time * 9 + e.x));
      ctx.fillStyle = `hsla(${e.hue},100%,65%,${a})`; ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, 7); ctx.fill();
    }
    ctx.restore();
  },
  glowCache: {},
  glowSprite(color) {
    if (!this.glowCache[color]) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, hexA(color, 1)); gr.addColorStop(1, hexA(color, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      this.glowCache[color] = c;
    }
    return this.glowCache[color];
  },
  // dx / dy / rot：開場走進來時的位移與搖晃
  chef(pulse, dx = 0, dy = 0, rot = 0) {
    const img = IMG['chef_' + chef.pose] || IMG.chef_idle;
    if (!img) return;
    const w = 620, h = w * img.height / img.width, f = w / img.width;
    const idle = chef.pose === 'idle' || chef.pose === 'wave';
    const sy = idle ? 1 - pulse * 0.02 : 1;
    const bob = idle ? pulse * 6 : 0;
    ctx.save(); ctx.translate(ZONE.x + dx, 543 + h + bob - chef.lift + dy); if (rot) ctx.rotate(rot); ctx.scale(1, sy);
    ctx.translate(-w / 2, -h); // 之後以原圖座標 × f 繪製
    const adj = POSE_ADJ[chef.pose];
    if (adj) {
      ctx.translate(adj.t[0] * f, (adj.t[1] - adj.lift) * f); ctx.scale(adj.s, adj.s);
      ctx.drawImage(img, -adj.a[0] * f, -adj.a[1] * f, w, h);
    } else ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  },
  // 鐵板吧台：原圖的椅腳與柱子在圖的下緣被切掉，看起來像浮在半空。
  // 把椅腳中段（只有直的腳，第 332～345 列）往下拉長 EXT 像素，讓椅子和柱子站到地面，再加上椅子的影子。只做一次
  griddleImg() {
    if (this.griddleCache) return this.griddleCache;
    const img = IMG.griddle, EXT = 56, A = 332, B = 345;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height + EXT;
    const g = c.getContext('2d');
    // 椅子落地的影子（畫在最底下）
    g.fillStyle = 'rgba(0,0,0,.32)';
    for (const [x0, x1] of [[62, 192], [233, 352], [408, 528], [569, 696]]) { g.beginPath(); g.ellipse((x0 + x1) / 2, c.height - 6, (x1 - x0) / 2 + 8, 7, 0, 0, 7); g.fill(); }
    g.drawImage(img, 0, 0, img.width, B, 0, 0, img.width, B);                              // 上半（到椅腳中段）
    g.drawImage(img, 0, A, img.width, B - A, 0, B, img.width, EXT);                        // 拉長的椅腳
    g.drawImage(img, 0, B, img.width, img.height - B, 0, B + EXT, img.width, img.height - B);   // 橫桿與腳底
    return (this.griddleCache = c);
  },
  griddle() {
    if (!IMG.griddle) return;
    const img = this.griddleImg();
    ctx.drawImage(img, 0, GRIDDLE_Y, SW, SW * img.height / img.width);
  },
  // 選單用的節拍脈動（跟著選單音樂的速度）
  idlePulse() { const p = Sound.bgmPulse(); if (p !== null) return p; const ph = Game.time * 92 / 60; return Math.exp(-(ph % 1) * 5); },
};

// 食材的焦黑版（沒按到時烤焦用）：每種只做一次
const burntCache = {};
function burntImg(name) {
  if (!burntCache[name]) {
    const img = IMG[name], c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(20,12,8,.8)'; g.fillRect(0, 0, c.width, c.height);
    burntCache[name] = c;
  }
  return burntCache[name];
}

// ---------- 譜面產生 ----------
let bag = [];
function nextType() { if (!bag.length) bag = TYPES.slice().sort(() => Math.random() - 0.5); return bag.pop(); }

function buildChart(song, t0, diff = 1) {   // diff：難度（0 簡單、1 普通、2 困難）
  const SEC = song.sections, measures = [], notes = [], events = [];
  let t = t0;
  measures.push(measureInfo(song, { kind: 'count', bpm: SEC[0].bpm, start: t, sec: 0, idx: -1 }));
  t += 4 * 60 / SEC[0].bpm;
  SEC.forEach((s, si) => {
    let pat = null;
    for (let m = 0; m < MEASURES; m++) {
      const ms = measureInfo(song, { kind: m === MEASURES - 1 ? 'rest' : 'play', bpm: s.bpm, start: t, sec: si, idx: m });
      measures.push(ms);
      if (ms.kind === 'play') {
        // 節奏型：樂曲可以有自己的一套（song.patterns[lv]，例如金屬的馳騁節奏、電音的反拍），沒有就用通用的 PATTERNS
        if (m % 2 === 0) { const lv = s.lv[(Math.random() * s.lv.length) | 0]; pat = diffPattern(song, lv, diff, ms.bd); }   // 依難度調整（js/songs.js）
        for (const b of pat) {
          // 反拍（.5）依樂曲的搖擺比例落點，跟著音樂的「晃」
          const nt = ms.at(Math.floor(b) * 2 + (b % 1 ? 1 : 0));
          notes.push({ t: nt, throwT: nt - LEAD_BEATS * ms.bd, type: nextType(), side: Math.random() < 0.5 ? -1 : 1, state: 'fly' });
        }
      }
      t += 4 * ms.bd;
    }
  });
  const last = SEC[SEC.length - 1].bpm;
  measures.push(measureInfo(song, { kind: 'outro', bpm: last, start: t, sec: SEC.length - 1, idx: 8 }));
  const end = t + 4 * 60 / last;
  // 樂曲事件：倒數木魚 → 各小節由樂曲編曲 → 結尾
  const add = (tt, f) => events.push({ t: tt, f });
  for (const ms of measures) {
    if (ms.kind === 'count') {
      for (let b = 0; b < 4; b++) add(ms.start + b * ms.bd, (x, d) => SND.wood(x, b === 0, d));
      add(ms.start + 3 * ms.bd, x => Sound.say('go', A.sfx, x));   // 「GO!」的拍點：主角喊「いくで！」
      continue;
    }
    if (ms.kind === 'outro') { song.outro(ms, add); continue; }
    song.arrange(ms, add);
    if (ms.kind === 'rest' && ms.sec < SEC.length - 1) add(ms.start + 2 * ms.bd, x => SND.speedUp(x, ms.bd));
  }
  for (const n of notes) add(n.throwT, x => SND.cue(x, n.type));
  events.sort((a, b) => a.t - b.t);
  return { measures, notes, events, end, evIdx: 0 };
}
// 新手教學的譜面：只有開頭的倒數，之後由 Game.tutExtend 邊玩邊補
const TUT_BPM = 84;
function tutChart(song, t0) {
  const ms = measureInfo(song, { kind: 'count', bpm: TUT_BPM, start: t0, sec: 0, idx: -1 }), events = [];
  for (let b = 0; b < 4; b++) events.push({ t: t0 + b * ms.bd, f: (x, d) => SND.wood(x, b === 0, d) });
  return { measures: [ms], notes: [], events, end: Infinity, evIdx: 0, next: t0 + 4 * ms.bd, idx: 0 };
}
// ---------- 遊戲 ----------
const GRADE_STYLE = { NICE: ['#fff2a8', '#ff9a1a', '#6e2a00'], GOOD: ['#d8f2ff', '#3d8fe0', '#0c2c63'], BAD: ['#eee6ff', '#8e7cc0', '#2b2050'] };
const RESUME_BEATS = 3;   // 暫停後繼續時的倒數拍數

const Game = {
  time: 0,     // 真實時間（動畫用）
  s: null,     // 本局狀態
  result: null,

  song: null,   // 正在玩的樂曲

  // tut = true：新手教學（譜面邊玩邊產生，見 tutExtend）
  newRun(song, tut = false) {
    Sound.init(); Sound.stopBgm(); Sound.duck(false);
    this.song = song || this.song || SONGS[0];
    this.diff = tut ? 1 : curDiff();   // 難度：選曲畫面選的（新手教學一律普通）
    this.rid = recId(this.song, this.diff);   // 這一局的紀錄 id（HISCORE、排行榜、獎章）
    if (!tut) { Save.data.lastSong = this.song.id; Save.store(); }
    bag = [];
    const t0 = A.ctx.currentTime + 0.6;
    this.s = {
      chart: tut ? tutChart(this.song, t0) : buildChart(this.song, t0, this.diff), tut: tut ? { pat: null, sec: 0 } : null,
      off: 0, paused: false, pauseAt: 0, resumeT: 0, ended: false,
      score: 0, combo: 0, maxCombo: 0, grades: { GREAT: 0, NICE: 0, GOOD: 0, BAD: 0 },
      stock: { noodles: 0, cabbage: 0, crepe: 0, bacon: 0 }, oko: 0, errs: [],
      bump: {}, okoAnims: [], gradeFx: null, pressT: -9,
    };
    Object.assign(Sound.sayState, { end: 0, last: {}, src: null, any: -99 });
    Fx.clear();
    chef.queue = []; chef.idlePose = 'idle'; chef.pose = 'idle';
  },

  // 樂曲時鐘（秒）：暫停時停住；繼續時把暫停的時間扣掉
  clock() { const s = this.s; return (s.paused ? s.pauseAt : A.ctx.currentTime) - s.off; },
  // 畫面用的時間：扣掉輸出延遲＋判定校正（藍牙耳機的延遲瀏覽器常常量不到，靠校正補）→ 看到的、聽到的、判定三者一致
  songTime() { return this.clock() - Sound.latency() - Save.data.offset / 1000; },
  measureAt(t) {
    const ms = this.s.chart.measures; let m = ms[0];
    for (const x of ms) { if (x.start <= t) m = x; else break; }
    return m;
  },
  pulse() {
    const st = this.songTime(), m = this.measureAt(st), ph = (st - m.start) / (60 / m.bpm);
    return ph < 0 ? 0 : Math.exp(-(ph % 1) * 5);
  },

  // 把即將播放的樂曲事件排進 AudioContext（提前 0.2 秒）
  schedule() {
    const s = this.s;
    if (!s || s.paused || s.ended || !A.ctx || A.ctx.state !== 'running') return;
    if (s.tut) this.tutExtend();
    const ch = s.chart, now = A.ctx.currentTime;
    while (ch.evIdx < ch.events.length && ch.events[ch.evIdx].t + s.off < now + 0.2) {
      const e = ch.events[ch.evIdx++], at = e.t + s.off;
      if (at >= now - 0.02) e.f(Math.max(at, now), A.music);
    }
  },

  // ---- 暫停 / 繼續 ----
  pause() {
    const s = this.s;
    if (!s || s.ended) return;
    if (s.paused) { this.cancelCount(); return; }   // 倒數中再按一次：取消倒數
    s.paused = true; s.resumeT = 0; s.pauseAt = A.ctx.currentTime;
    Sound.duck(true);
    // 已提前排入、但還沒播放的事件：倒回去，繼續時重新排
    const c = s.pauseAt - s.off, ev = s.chart.events;
    let i = s.chart.evIdx; while (i > 0 && ev[i - 1].t > c) i--;
    s.chart.evIdx = i;
  },
  cancelCount() {
    const s = this.s;
    s.resumeT = 0;
    if (s.countBus) { try { s.countBus.disconnect(); } catch (e) { /* ignore */ } s.countBus = null; }
  },
  // 目前倒數到第幾拍（3 → 2 → 1）；沒在倒數時回傳 0
  countdown() {
    const s = this.s;
    if (!s || !s.paused || s.resumeT <= 0) return 0;
    let k = 0;
    for (const t of s.resumeTicks) if (A.ctx.currentTime >= t.at) k = t.k;
    return k;
  },
  resume() {
    const s = this.s;
    if (!s || !s.paused || s.resumeT > 0) return;
    // 倒數對齊原本的拍子格線：3、2、1 落在拍點上，接下來的拍點正好接回樂曲
    const c = this.clock(), m = this.measureAt(c), bd = 60 / m.bpm;
    const ph = (c - m.start) / bd, frac = ph > 0 ? ph - Math.floor(ph) : 0;
    const now = A.ctx.currentTime;
    s.resumeAt = now + 0.05 + (RESUME_BEATS - 1 + frac) * bd;   // 樂曲在這個時間點接回
    s.resumeTicks = [];
    s.countBus = A.ctx.createGain(); s.countBus.connect(A.ui);   // 取消倒數時整條斷開
    for (let k = RESUME_BEATS; k >= 1; k--) {
      const at = s.resumeAt - (k - 1 + frac) * bd;
      s.resumeTicks.push({ k, at });
      SND.wood(at, k === 1, s.countBus);
    }
    s.resumeT = s.resumeAt - now;
  },

  update(dt) {
    const s = this.s;
    if (!s) return;
    if (s.gradeFx) s.gradeFx.t += s.paused ? 0 : dt;
    if (s.paused) {
      if (s.resumeT > 0) {
        // 依目前速度倒數 3 拍（木魚聲已預先排好），時間到就接回原本的節拍
        const now = A.ctx.currentTime;
        s.resumeT = s.resumeAt - now;
        if (s.resumeT <= 0) {
          s.resumeT = 0; s.off += s.resumeAt - s.pauseAt; s.paused = false;
          Sound.duck(false); this.schedule();
        }
      }
      return;
    }
    const st = this.songTime();
    if (s.comboFx) s.comboFx.t += dt;
    // SPEED UP 的休息小節：主角比讚
    chef.idlePose = this.measureAt(st).kind === 'rest' ? 'nice' : 'idle';
    for (const n of s.chart.notes) {
      if (n.state === 'fly' && st > n.t + WIN.BAD) {
        n.state = 'miss'; n.endT = st; s.grades.BAD++; this.breakCombo(); this.showGrade('BAD');
        setPoses([{ pose: 'bad', dur: 0.6 }]); SND.bad();
      } else if (n.state === 'hit' && !n.stocked && st - n.hitT > 0.55) { n.stocked = true; this.addStock(n.type); }
    }
    for (const a of s.okoAnims) a.t += dt;
    s.okoAnims = s.okoAnims.filter(a => a.t < 1.2);
    if (!s.tut && st > s.chart.end + 0.4) this.finish();
  },
  // 新手教學：樂曲時鐘往前 2 小節內的小節還沒產生就補上（節奏型 = 教學畫面目前指定的 s.tut.pat；null = 只有音樂）
  tutExtend() {
    const s = this.s, ch = s.chart, song = this.song, bd = 60 / TUT_BPM;
    let added = false;
    while (ch.next < this.clock() + 8 * bd) {
      const ms = measureInfo(song, { kind: 'play', bpm: TUT_BPM, start: ch.next, sec: s.tut.sec, idx: ch.idx++ });
      ch.measures.push(ms);
      song.arrange(ms, (t, f) => ch.events.push({ t, f }));
      for (const b of s.tut.pat || []) {
        const nt = ms.at(b * 2), n = { t: nt, throwT: nt - LEAD_BEATS * bd, type: nextType(), side: Math.random() < 0.5 ? -1 : 1, state: 'fly' };
        ch.notes.push(n);
        ch.events.push({ t: n.throwT, f: x => SND.cue(x, n.type) });
      }
      ch.next += 4 * bd; added = true;
    }
    // 只重排還沒排進音訊的部分（新加的事件都在未來）
    if (added) { const rest = ch.events.splice(ch.evIdx).sort((a, b) => a.t - b.t); ch.events.push(...rest); }
  },

  // ---- 打擊（tMs = 按下的時間，performance.now 時間軸）----
  hit(tMs) {
    const s = this.s;
    if (!s || s.paused || s.ended || !A.ctx) return;
    s.pressT = this.time;
    const delay = Math.max(0, (performance.now() - tMs) / 1000);
    const jt = this.clock() - delay - Sound.latency() - Save.data.offset / 1000;
    let best = null, bd = 1e9;
    for (const n of s.chart.notes) {
      if (n.state !== 'fly') continue;
      const d = Math.abs(jt - n.t);
      if (d <= WIN.BAD && d < bd) { best = n; bd = d; }
      if (n.t > jt + 1) break;
    }
    if (!best) { SND.whiff(); setPoses([{ pose: 'spatula', dur: 0.12 }]); return; }
    const grade = bd <= WIN.GREAT ? 'GREAT' : bd <= WIN.NICE ? 'NICE' : bd <= WIN.GOOD ? 'GOOD' : 'BAD';
    s.errs.push(jt - best.t);
    this.judge(best, grade);
  },
  judge(n, grade) {
    const s = this.s;
    s.grades[grade]++;
    this.showGrade(grade);
    if (grade === 'BAD') {
      n.state = 'bad'; n.endT = this.songTime(); n.dir = n.side * -1;
      this.breakCombo(); SND.bad(); Sound.vibrate(40);
      setPoses([{ pose: 'bad', dur: 0.6 }]);
      return;
    }
    n.state = 'hit'; n.hitT = this.songTime(); n.dir = Math.random() < 0.5 ? -1 : 1;
    s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo);
    const pts = POINTS[grade] + Math.min(s.combo, COMBO_CAP) * COMBO_BONUS;
    s.score += pts;
    Fx.popups.push({ text: '+' + pts, x: ZONE.x + rand(-40, 40), y: ZONE.y - 70, life: 0.8 });
    SND.hit(n.type, grade); Sound.vibrate(12);
    const act = ING[n.type].pose;
    Fx.burst(ZONE.x, ZONE.y, ING[n.type].color, grade === 'GREAT' ? 18 : 10);
    if (act === 'spatula') Fx.sparks(ZONE.x, ZONE.y - 10, grade === 'GREAT' ? 18 : 10);
    if (grade === 'GREAT') Fx.stars(ZONE.x, ZONE.y - 20, 10);
    Fx.steam(ZONE.x, ZONE.y - 10, 2);
    // 主角做「處理動作」（切 / 炒 / 淋醬）；好壞交給大字判定顯示。
    // 每 COMBO_STEP 連擊才接一個跳起握拳的歡呼姿勢。
    const poses = [{ pose: act, dur: ACTION_HOLD }];
    if (s.combo % COMBO_STEP === 0) {
      poses.push({ pose: 'great', dur: 0.5 });
      s.comboFx = { n: s.combo, t: 0 };
      SND.kane(A.ctx.currentTime + 0.05, 1.6, A.sfx);
      Sound.say('combo', A.sfx, A.ctx.currentTime + 0.12);   // 「いいね！」「ええやん！」「その調子や！」（有冷卻，不會每 10 連擊都講）
    }
    setPoses(poses);
  },
  showGrade(g) { this.s.gradeFx = { g, t: 0 }; },
  // 斷連擊：連擊數夠多（10 以上）才喊「おっと！」
  breakCombo() {
    const s = this.s;
    if (s.combo >= COMBO_STEP) Sound.say('oops', A.sfx);
    s.combo = 0;
  },
  addStock(type) {
    const s = this.s;
    s.stock[type]++; s.bump[type] = this.time;
    if (TYPES.every(k => s.stock[k] > 0)) {
      TYPES.forEach(k => s.stock[k]--);
      s.oko++; s.score += OKO_BONUS; s.bump.oko = this.time + 0.9;
      s.okoAnims.push({ t: 0 });
      SND.fanfare(A.ctx.currentTime);
      Sound.say('oko', A.sfx, A.ctx.currentTime + 0.15);   // 「へい、お待ち！」「できあがりや！」
      setPoses([{ pose: 'cheer', dur: 0.8 }]);
    }
  },
  finish() {
    const s = this.s;
    s.ended = true;
    const e = s.errs, avg = e.length ? e.reduce((a, b) => a + b, 0) / e.length : 0;
    const ratio = s.score / maxScoreFor(s.chart.notes.length);
    this.result = { song: this.song.id, score: s.score, oko: s.oko, grades: { ...s.grades }, maxCombo: s.maxCombo, avgErr: Math.round(avg * 1000), hits: e.length,
      ratio, rating: ratingFor(ratio) };
    // 曲目獎章：最佳評價、全連擊（沒有 BAD／漏接）、全 GREAT
    const R = this.result, n = s.chart.notes.length, md = Save.data.medals[this.rid] || {};
    R.fc = s.grades.BAD === 0 && n > 0; R.ag = s.grades.GREAT === n && n > 0;
    R.newFc = R.fc && !md.fc; R.newAg = R.ag && !md.ag;
    Save.data.medals[this.rid] = { r: Math.min(md.r === undefined ? 99 : md.r, R.rating), fc: !!(md.fc || R.fc), ag: !!(md.ag || R.ag) };
    Rhythm.record(this.song, s, ratio);   // 節奏分析用的遊玩紀錄（裡面會存檔）
    App.goto('result');
  },
  // HUD 的歌名（簡單／困難時加上難度）
  songLabel() { return '♪ ' + this.song.title + (this.diff !== 1 && !this.s.tut ? '［' + tr(DIFFS[this.diff].name) + '］' : ''); },

  // ---------- 繪製 ----------
  draw() {
    const s = this.s, st = this.songTime(), pulse = s.paused ? 0 : this.pulse();
    worldBegin();   // 場景與演出：世界座標
    Scene.draw(pulse);
    this.drawZone(pulse, st);
    this.drawNotes(st);
    Fx.draw();
    this.drawGrade();
    this.drawComboFx();
    this.drawPopups();
    this.drawBanner(st);
    this.drawButton(pulse);
    ctx.restore();
    this.drawHUD(pulse, st);   // HUD：畫面座標（橫式放在左右兩側）
    worldBegin(); this.drawOkoAnims(); ctx.restore();   // 廣島燒飛進右上角的成品欄（蓋在 HUD 上）
    this.drawPauseBtn();
  },
  drawPopups() {
    for (const p of Fx.popups) txt(p.text, p.x, p.y, 26, `rgba(255,240,140,${clamp(p.life * 2, 0, 1)})`, { stroke: 'rgba(80,30,0,.8)', lw: 7 });
  },
  drawZone(pulse, st) {
    const w = ZONE.w * (1 + pulse * 0.06), h = ZONE.h * (1 + pulse * 0.06);
    // 下一個食材越靠近，落點陰影越大
    let near = null;
    for (const n of this.s.chart.notes) if (n.state === 'fly' && st >= n.throwT) { near = n; break; }
    ctx.save();
    if (near) {
      const p = clamp((st - near.throwT) / (near.t - near.throwT), 0, 1);
      ctx.fillStyle = `rgba(0,0,0,${0.12 + p * 0.25})`;
      ctx.beginPath(); ctx.ellipse(ZONE.x, ZONE.y + 22, 40 + p * 60, 8 + p * 10, 0, 0, 7); ctx.fill();
    }
    // 金色光暈：快取的光暈圖跟著節拍放大、變亮（原本每幀用 shadowBlur 模糊，是遊戲中最耗電的一筆）
    if (!ECO()) {
      ctx.save(); ctx.translate(ZONE.x, ZONE.y); ctx.scale(w / ZONE.w, h / ZONE.h); ctx.globalAlpha = 0.6 + pulse * 0.4;
      UI.glow(-ZONE.w / 2, -ZONE.h / 2, ZONE.w, ZONE.h, 20, '#ffcf4a', 26, { ring: 5 });
      ctx.restore();
    }
    ctx.strokeStyle = `rgba(255,214,90,${0.65 + pulse * 0.35})`; ctx.lineWidth = 5; ctx.setLineDash([16, 10]);
    ctx.lineDashOffset = -this.time * 30;
    rrect(ZONE.x - w / 2, ZONE.y - h / 2, w, h, 20); ctx.stroke();
    ctx.restore();
  },
  drawNotes(st) {
    const landY = ZONE.y + 8;
    for (const n of this.s.chart.notes) {
      if (st < n.throwT - 0.05) break;
      const ing = ING[n.type];
      if (n.state === 'fly') {
        const p = (st - n.throwT) / (n.t - n.throwT);
        if (p < 0) continue;
        if (p <= 1) {
          const x0 = n.side < 0 ? VIEW.x0 - 140 : VIEW.x1 + 140, y0 = 700;
          const x = x0 + (ZONE.x - x0) * p, y = y0 + (landY - y0) * p - Math.sin(Math.PI * p) * 300;
          drawImgW(IMG[ing.raw], x, y - 30, ing.rawW * (0.75 + 0.25 * p), (1 - p) * n.side * -5.5);
        } else {
          // 落在鐵板上、等待按下（輕輕彈跳）
          const k = st - n.t;
          drawImgW(IMG[ing.raw], ZONE.x, landY - 30 - Math.abs(Math.sin(k * 25)) * 6 * Math.exp(-k * 10), ing.rawW);
        }
      } else if (n.state === 'hit') {
        const k = st - n.hitT, SL = 0.28;   // SL 秒後才滑出畫面，先讓玩家看到處理過程
        if (k > 1.3) continue;
        const pop = k < 0.15 ? 1.25 - k / 0.15 * 0.25 : 1;
        const slide = k > SL ? Math.pow((k - SL) * 2.2, 2) * 500 : 0;
        let x = ZONE.x + n.dir * slide, y = landY - 25 - (k > SL ? slide * 0.05 : 0), sy = 1;
        if (ing.pose === 'spatula' && k < SL) {   // 鍋鏟：在鐵板上翻一圈
          const p = k / SL; y -= Math.sin(p * Math.PI) * 85; sy = Math.cos(p * Math.PI * 2);
          if (Math.abs(sy) < 0.06) sy = 0.06;
        }
        drawImgW(IMG[ing.done], x, y, ing.doneW * pop, 0, 1, sy);
        if (k < SL + 0.12) this.drawAction(ing.pose, k, x, y);
      } else {
        const k = st - n.endT;
        if (k > 1) continue;
        if (n.state === 'bad') {
          drawImgW(IMG[ing.raw], ZONE.x + n.dir * k * 700, landY - 30 - k * 500 + k * k * 1400, ing.rawW, n.dir * k * 12, 1 - k);
        } else { // 沒按：烤焦變黑後消失
          // 原圖淡出、預先做好的焦黑版疊上去（原本用 ctx.filter 每幀調亮度，很耗電）
          const yy = landY - 30 + k * 20;
          drawImgW(IMG[ing.raw], ZONE.x, yy, ing.rawW, 0, 1 - k);
          if (!ECO()) drawImgW(burntImg(ing.raw), ZONE.x, yy, ing.rawW, 0, (1 - k) * Math.min(1, k * 1.6));
          if (!this.s.paused && Math.random() < 0.3) Fx.smoke(ZONE.x + rand(-60, 60), ZONE.y);
        }
      }
    }
  },
  // 判定框上的處理特效：刀光（切）、醬汁一筆畫上（淋醬）；鍋鏟的翻面在 drawNotes 裡
  drawAction(act, k, x, y) {
    ctx.save(); ctx.lineCap = 'round';
    if (act === 'knife') {
      for (let j = 0; j < 2; j++) {
        const kk = k - j * 0.07; if (kk < 0 || kk > 0.2) continue;
        const p = kk / 0.2, dir = j ? -1 : 1;
        const ax = x - 140 * dir, ay = y - 70, bx = x + 140 * dir, by = y + 30;
        const e = Math.min(1, p * 2.2), ex = ax + (bx - ax) * e, ey = ay + (by - ay) * e;
        const sx = ax + (bx - ax) * Math.max(0, p * 2.2 - 0.9), sy = ay + (by - ay) * Math.max(0, p * 2.2 - 0.9);
        ctx.globalAlpha = 1 - p;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
        if (!ECO()) { ctx.strokeStyle = 'rgba(191,232,255,.35)'; ctx.lineWidth = 9 * (1 - p) + 16; ctx.stroke(); }   // 刀光的光暈（粗的半透明線，不用模糊）
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9 * (1 - p) + 2; ctx.stroke();
      }
    } else if (act === 'sauce') {
      const p = Math.min(1, k / 0.22), fade = k > 0.3 ? Math.max(0, 1 - (k - 0.3) / 0.1) : 1;
      const pts = []; for (let i = 0; i <= 8; i++) pts.push([x - 92 + i * 23, y - 10 + (i % 2 ? -16 : 12)]);
      const m = p * 8;
      ctx.globalAlpha = fade;
      const line = dy => {
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1] + dy);
        for (let i = 1; i <= Math.ceil(m); i++) {
          const f = Math.min(1, m - (i - 1)), [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
          ctx.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + dy);
        }
      };
      ctx.lineWidth = 8;
      line(2); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();   // 影子（位移，不用模糊）
      line(0); ctx.strokeStyle = '#4a2010'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke();   // 醬汁光澤
    }
    ctx.restore();
  },
  drawComboFx() {
    const fx = this.s.comboFx; if (!fx || fx.t > 0.9) return;
    const sc = fx.t < 0.12 ? 0.5 + fx.t / 0.12 * 0.7 : 1.2 - Math.min(0.2, (fx.t - 0.12) * 0.6);
    const a = fx.t > 0.7 ? 1 - (fx.t - 0.7) / 0.2 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(ZONE.x, 500); ctx.rotate(-0.05); ctx.scale(sc, sc);
    txt(tr('{0} COMBO!', fx.n), 0, 0, 62, '#ffe066', { stroke: '#c43a1a', lw: 14 });
    ctx.restore();
  },
  drawGrade() {
    const fx = this.s.gradeFx; if (!fx || fx.t > 0.6) return;
    const s = fx.t < 0.1 ? 0.6 + fx.t / 0.1 * 0.5 : 1.1 - Math.min(0.1, (fx.t - 0.1));
    const a = fx.t > 0.45 ? 1 - (fx.t - 0.45) / 0.15 : 1, y = 770 - fx.t * 30;
    drawGradeText(fx.g, ZONE.x, y, s, a);
  },
  drawHUD(pulse, st) {
    if (LAND) return this.drawHUDLand(pulse, st);
    const s = this.s;
    // 左上：SCORE / HISCORE（窄版，避開招牌）
    pill(8, 8, 162, 50); txt('SCORE', 26, 27, 12, '#ffd25a', { align: 'left' }); txt(pad(s.score, 7), 156, 50, 22, '#fff', { align: 'right' });
    if (!s.tut) { pill(8, 62, 162, 40); txt('HISCORE', 26, 78, 10, '#ffb0a0', { align: 'left' }); txt(pad(Math.max(Save.best(this.rid), s.score), 7), 156, 96, 16, '#fff', { align: 'right' }); }
    // 右上：廣島燒成品（較顯眼）＋四種食材
    const ob = s.bump.oko ? Math.max(0, 1 - Math.abs(this.time - s.bump.oko) * 4) : 0;
    ctx.fillStyle = 'rgba(16,22,52,.82)'; rrect(568, 8, 144, 70, 20); ctx.fill(); ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 4; ctx.stroke();
    drawImgW(IMG.okonomiyaki, 612, 43, 84 * (1 + ob * 0.3), 0);
    txt('×' + s.oko, 704, 60, 32 + ob * 10, '#fff', { align: 'right', stroke: '#c43a1a', lw: 7 });
    TYPES.forEach((k, i) => {
      const x = 600 + (i % 2) * 72, y = 106 + Math.floor(i / 2) * 46;
      const b = s.bump[k] ? Math.max(0, 1 - (this.time - s.bump[k]) * 4) : 0;
      ctx.fillStyle = 'rgba(16,22,52,.72)'; rrect(x - 30, y - 20, 68, 40, 12); ctx.fill();
      drawImgW(IMG[ING[k].done], x - 4, y, 48 * (1 + b * 0.35));
      txt(String(s.stock[k]), x + 34, y + 15, 18, s.stock[k] ? '#fff' : '#8a8fae', { align: 'right', stroke: '#101634', lw: 5 });
    });
    // 左側：TEMPO、進度、COMBO
    const m = this.measureAt(st), ch = s.chart;
    txt('TEMPO ' + m.bpm, 14, 126, 16, '#fff', { align: 'left', stroke: '#101634', lw: 6 });
    const prog = clamp((st - ch.measures[0].start) / (ch.end - ch.measures[0].start), 0, 1);
    ctx.fillStyle = 'rgba(16,22,52,.7)'; rrect(14, 136, 156, 9, 4.5); ctx.fill();
    ctx.fillStyle = '#ffb84a'; rrect(14, 136, Math.max(9, 156 * prog), 9, 4.5); ctx.fill();
    ctx.font = `15px ${FONT}`; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#101634'; ctx.lineWidth = 5; ctx.strokeText(this.songLabel(), 14, 172);
    ctx.fillStyle = this.song.color; ctx.fillText(this.songLabel(), 14, 172);
    if (s.combo >= 3) {
      const k = 1 + pulse * 0.08;
      ctx.save(); ctx.translate(100, 300); ctx.scale(k, k);
      txt(String(s.combo), 0, 0, 48, '#ffe066', { stroke: '#7a2a00', lw: 10 }); txt('COMBO', 0, 28, 18, '#fff', { stroke: '#7a2a00', lw: 6 });
      ctx.restore();
    }
  },
  // 橫式 HUD：左側 = 分數、速度、進度、連擊；右側 = 廣島燒成品＋四種食材（攤位兩側的街景上）
  drawHUDLand(pulse, st) {
    const s = this.s, m = this.measureAt(st), ch = s.chart;
    // 兩側街景壓暗，HUD 比較清楚（攤位本身不壓）
    for (const [x0, x1] of [[0, Cam.x], [W, W - Cam.x]]) {
      const gr = ctx.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(6,8,26,.72)'); gr.addColorStop(1, 'rgba(6,8,26,.3)');
      ctx.fillStyle = gr; ctx.fillRect(Math.min(x0, x1), 0, Cam.x, H);
    }
    UI.panel(40, 36, 420, 112, 30, 'rgba(16,22,52,.8)');
    txt('SCORE', 72, 76, 24, '#ffd25a', { align: 'left' }); txt(pad(s.score, 7), 432, 132, 56, '#fff', { align: 'right' });
    if (!s.tut) {
      UI.panel(40, 160, 420, 66, 24, 'rgba(16,22,52,.72)');
      txt('HISCORE', 72, 203, 18, '#ffb0a0', { align: 'left' }); txt(pad(Math.max(Save.best(this.rid), s.score), 7), 432, 207, 32, '#fff', { align: 'right' });
    }
    const y0 = s.tut ? 196 : 272;
    txt('TEMPO ' + m.bpm, 44, y0 + 14, 28, '#fff', { align: 'left', stroke: '#101634', lw: 8 });
    const prog = clamp((st - ch.measures[0].start) / (ch.end - ch.measures[0].start), 0, 1);
    if (!s.tut) {
      ctx.fillStyle = 'rgba(16,22,52,.7)'; rrect(44, y0 + 32, 416, 14, 7); ctx.fill();
      ctx.fillStyle = '#ffb84a'; rrect(44, y0 + 32, Math.max(14, 416 * prog), 14, 7); ctx.fill();
    }
    txt(this.songLabel(), 44, y0 + 88, 28, this.song.color, { align: 'left', stroke: '#101634', lw: 8 });
    if (s.combo >= 3) {
      const k = 1 + pulse * 0.08;
      ctx.save(); ctx.translate(270, 640); ctx.scale(k, k);
      txt(String(s.combo), 0, 0, 120, '#ffe066', { stroke: '#7a2a00', lw: 20 }); txt('COMBO', 0, 60, 40, '#fff', { stroke: '#7a2a00', lw: 10 });
      ctx.restore();
    }
    // 右下：四種食材 2×2，下面是廣島燒成品（大）。放在下方，不擋從右邊飛進來的食材（食材從畫面中段往上飛）
    const ob = s.bump.oko ? Math.max(0, 1 - Math.abs(this.time - s.bump.oko) * 4) : 0;
    ctx.fillStyle = 'rgba(16,22,52,.82)'; rrect(1480, OKO_HUD.y - 75, 400, 150, 34); ctx.fill(); ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 5; ctx.stroke();
    drawImgW(IMG.okonomiyaki, OKO_HUD.x, OKO_HUD.y, OKO_HUD.w * (1 + ob * 0.3), 0);
    txt('×' + s.oko, 1858, OKO_HUD.y + 43, 72 + ob * 20, '#fff', { align: 'right', stroke: '#c43a1a', lw: 14 });
    TYPES.forEach((k, i) => {
      const x = 1578 + (i % 2) * 204, y = OKO_HUD.y - 259 + Math.floor(i / 2) * 104;
      const b = s.bump[k] ? Math.max(0, 1 - (this.time - s.bump[k]) * 4) : 0;
      ctx.fillStyle = 'rgba(16,22,52,.72)'; rrect(x - 86, y - 44, 186, 88, 24); ctx.fill();
      drawImgW(IMG[ING[k].done], x - 14, y, 104 * (1 + b * 0.35));
      txt(String(s.stock[k]), x + 88, y + 30, 44, s.stock[k] ? '#fff' : '#8a8fae', { align: 'right', stroke: '#101634', lw: 10 });
    });
  },
  drawOkoAnims() {
    for (const a of this.s.okoAnims) {
      let x, y, w;
      if (a.t < 0.55) { const k = ease(Math.min(1, a.t / 0.25)); x = ZONE.x; y = OKO_FX_Y; w = 330 * k * (1 + 0.08 * Math.sin(a.t * 30) * (1 - a.t / 0.55)); }
      else {   // 飛進 HUD 的成品欄（畫面座標換成世界座標）
        const k = ease((a.t - 0.55) / 0.4), [tx, ty] = toWorld(OKO_HUD.x, OKO_HUD.y), tw = OKO_HUD.w / Cam.k;
        x = ZONE.x + (tx - ZONE.x) * k; y = OKO_FX_Y + (ty - OKO_FX_Y) * k; w = 330 + (tw - 330) * k;
      }
      if (a.t >= 0.95) continue;
      if (a.t < 0.55) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.55; ctx.drawImage(Scene.glowSprite('#ffdc78'), x - 240, y - 240, 480, 480); ctx.restore();
      }
      drawImgW(IMG.okonomiyaki, x, y, w);
      if (a.t < 0.55) {   // 文字畫在圖上面，不被廣島燒蓋住
        txt('廣島燒完成！', x, y - 112, 40, '#fff', { stroke: '#c43a1a', lw: 10 });
        txt('+' + OKO_BONUS, x, y - 74, 28, '#ffe066', { stroke: '#7a2a00', lw: 7 });
      }
    }
  },
  drawBanner(st) {
    const s = this.s, m = this.measureAt(st), ph = (st - m.start) / (60 / m.bpm);
    if (s.paused || st < s.chart.measures[0].start) return;
    if (m.kind === 'count') {
      const b = Math.floor(ph), k = ph - b, label = ['3', '2', '1', 'GO!'][b];
      if (label) { const sc = 1.4 - k * 0.4; ctx.save(); ctx.translate(ZONE.x, 540); ctx.scale(sc, sc); txt(label, 0, 0, 96, '#fff', { stroke: '#c43a1a', lw: 16 }); ctx.restore(); }
    } else if (m.kind === 'rest' && m.sec < this.song.sections.length - 1) {
      const sc = 1 + Math.abs(Math.sin(ph * Math.PI)) * 0.12;
      ctx.save(); ctx.translate(ZONE.x, 540); ctx.rotate(-0.06); ctx.scale(sc, sc);
      txt('SPEED UP!', 0, 0, 64, '#ffe066', { stroke: '#c43a1a', lw: 14 }); ctx.restore();
    } else if (m.kind === 'outro') {
      txt('打烊囉！', ZONE.x, 540, 64, '#fff', { stroke: '#1f3a8a', lw: 14 });
    }
  },
  drawButton(pulse) {
    const pressed = this.time - this.s.pressT < 0.1;
    ctx.save(); ctx.translate(ZONE.x, BTN_Y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = pressed ? 0.6 : 0.15 + pulse * 0.2;   // 光暈貼圖（不每幀建漸層）
    ctx.drawImage(Scene.glowSprite('#ff783c'), -120, -120, 240, 240);
    ctx.restore();
    drawButtonImg(ZONE.x, BTN_Y, 230 * (pressed ? 0.95 : 1 + pulse * 0.03), pressed ? 0.88 : 1);
  },
  drawPauseBtn() {
    const { x, y, r } = PAUSE_BTN;
    ctx.save();
    ctx.fillStyle = 'rgba(16,22,52,.8)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e8b64a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; rrect(x - 10, y - 11, 7, 22, 2); ctx.fill(); rrect(x + 3, y - 11, 7, 22, 2); ctx.fill();
    ctx.restore();
  },
};

// GREAT 圖補上白色外框（和 NICE / GOOD / BAD 文字的白邊一致）：把圖的剪影往四周錯開疊成白底，只做一次
let greatOutlined = null;
function greatSprite() {
  const img = IMG.great_text;
  if (!greatOutlined) {
    const R = Math.round(9 * img.width / 330), c = document.createElement('canvas');   // 白邊寬 ≈ 文字版的白邊（以畫面 330px 寬計）
    c.width = img.width + R * 2; c.height = img.height + R * 2;
    const g = c.getContext('2d');
    for (const r of [R, R * 0.5]) for (let i = 0; i < 32; i++) g.drawImage(img, R + Math.cos(i / 32 * Math.PI * 2) * r, R + Math.sin(i / 32 * Math.PI * 2) * r);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-over'; g.drawImage(img, R, R);
    greatOutlined = { c, k: c.width / img.width };
  }
  return greatOutlined;
}
// GOOD / NICE / BAD 文字（與 GREAT 圖同風格）
function drawGradeText(g, x, y, s = 1, a = 1, size = 86) {
  if (g === 'GREAT' && IMG.great_text) { const o = greatSprite(); drawImgW(o.c, x, y, size * 3.85 * s * o.k, 0, a); return; }
  const [c1, c2, c3] = GRADE_STYLE[g], text = g === 'NICE' ? 'NICE!' : g;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = size * 0.3; ctx.strokeText(text, 0, 0);
  ctx.strokeStyle = c3; ctx.lineWidth = size * 0.15; ctx.strokeText(text, 0, 0);
  const gr = ctx.createLinearGradient(0, -size * 0.47, 0, size * 0.47); gr.addColorStop(0, c1); gr.addColorStop(0.55, c2); gr.addColorStop(1, c3);
  ctx.fillStyle = gr; ctx.fillText(text, 0, 0); ctx.restore();
}
