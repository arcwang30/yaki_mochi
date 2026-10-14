'use strict';

// ===== 畫面管理（淡入淡出轉場）與各畫面 =====
const App = {
  cur: null, name: '', pending: null, fade: 1,

  goto(name, arg) { if (this.pending) return; this.pending = { name, arg }; },
  start(name, arg) { this.name = name; this.cur = Screens[name]; if (this.cur.enter) this.cur.enter(arg); this.fade = 1; },
  // 直接切換（不淡出淡入）：用在畫面構圖相同的接續，例如夜空 → 開場
  cut(name, arg) {
    if (this.cur && this.cur.leave) this.cur.leave();
    this.pending = null; this.fade = 0;
    this.name = name; this.cur = Screens[name];
    Input.onHit = null; Input.lockUntil = performance.now() + 250; Input.pressed.clear(); Input.taps.length = 0;
    if (this.cur.enter) this.cur.enter(arg);
  },

  frame(dt) {
    if (this.pending) {
      this.fade = Math.min(1, this.fade + dt / 0.22);
      if (this.fade >= 1) {
        if (this.cur && this.cur.leave) this.cur.leave();
        const p = this.pending; this.pending = null;
        this.name = p.name; this.cur = Screens[p.name];
        Input.onHit = null;
        Input.lockUntil = performance.now() + 250;
        Input.pressed.clear(); Input.taps.length = 0;
        if (this.cur.enter) this.cur.enter(p.arg);
      }
    } else if (this.fade > 0) this.fade = Math.max(0, this.fade - dt / 0.22);
    if (this.cur) this.cur.frame(dt);
    if (this.fade > 0) { ctx.fillStyle = `rgba(8,10,30,${this.fade})`; ctx.fillRect(0, 0, W, H); }
    Achieve.draw(dt);   // 成就解鎖通知（蓋在所有畫面最上面）
  },
};

const Screens = {};

// 暫停選單的按鈕位置：直式照原本座標；橫式整排置中、往上移
const PX = W / 2 - 200, PY = y => lay(y, y - 162);

// 選單共用背景：攤位場景（主角揮手）＋暗化
function menuBackdrop(dimA) {
  worldBegin(); Scene.draw(Scene.idlePulse()); ctx.restore();
  if (dimA) UI.dim(dimA);
}

// ---------- 夜空（開始畫面與開場共用）：漸層、星星、月亮、遠處的燈籠串 ----------
// pan：開場鏡頭往下帶（野台升起的距離，0～H）；遠近不同的東西往上移的速度不同（視差）：星星最慢、月亮中等、燈籠串最快
function drawNightSky(pan = 0) {
  const t = Game.time;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#070b24'); g.addColorStop(0.6, '#1a1446'); g.addColorStop(1, '#2a1838');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const R = mulberry(77);
  for (let i = 0; i < 90; i++) {
    const x = R() * W, y0 = R() * H * 0.7, s = 0.6 + R() * 1.8, tw = 0.45 + 0.55 * Math.sin(t * (1 + R() * 2) + i);
    const y = ((y0 - pan * 0.18) % H + H) % H;   // 往上移出畫面的星星從下面補回來
    ctx.fillStyle = `rgba(255,255,240,${0.25 + tw * 0.6})`; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
  }
  // 月亮
  const my = -pan * 0.42, mx = lay(586, 1730);
  ctx.save(); ctx.translate(0, my);
  if (!ECO()) { ctx.globalAlpha = 0.7; ctx.drawImage(Scene.glowSprite('#fff0be'), mx - 112, lay(150, 120) - 112, 224, 224); ctx.globalAlpha = 1; }   // 月暈（貼圖，不用模糊）
  ctx.fillStyle = '#fff4cf'; ctx.beginPath(); ctx.arc(mx, lay(150, 120), 52, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(230,210,160,.45)'; ctx.beginPath(); ctx.arc(mx - 16, lay(140, 110), 9, 0, 7); ctx.arc(mx + 14, lay(170, 140), 6, 0, 7); ctx.fill();
  ctx.restore();
  // 遠處燈籠串（垂墜曲線＋光點）
  [[lay(700, 560), 0.55, 0.62], [lay(860, 720), 0.75, 0.85]].forEach(([yb, sc, par], k) => {
    const y0 = yb - pan * par;
    if (y0 < -120) return;
    ctx.strokeStyle = 'rgba(20,10,30,.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-20, y0 - 60); ctx.quadraticCurveTo(W / 2, y0 + 60, W + 20, y0 - 60); ctx.stroke();
    for (let i = 0; i <= 12; i++) {
      const u = i / 12, x = -20 + u * (W + 40), y = (1 - u) * (1 - u) * (y0 - 60) + 2 * u * (1 - u) * (y0 + 60) + u * u * (y0 - 60) + 14 * sc;
      const fl = 0.75 + 0.25 * Math.sin(t * 6 + i * 2 + k);
      ctx.globalAlpha = 0.7 * fl; ctx.drawImage(Scene.glowSprite('#ff8c3c'), x - 26 * sc, y - 26 * sc, 52 * sc, 52 * sc); ctx.globalAlpha = 1;   // 光暈貼圖（不每幀建漸層）
      ctx.fillStyle = i % 4 === 1 ? '#ffd040' : '#ff6a30'; ctx.beginPath(); ctx.ellipse(x, y, 7 * sc, 9 * sc, 0, 0, 7); ctx.fill();
    }
  });
}
// 對話框
function speechBubble(x, y, str, a = 1) {
  str = tr(str);
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `30px ${FONT}`;
  const w = ctx.measureText(str).width + 50, h = 64;
  ctx.fillStyle = '#fffdf3'; rrect(x - w / 2, y - h / 2, w, h, 26); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 46, y + h / 2 - 2); ctx.lineTo(x - 66, y + h / 2 + 26); ctx.lineTo(x - 16, y + h / 2 - 2); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#1f2a5a'; rrect(x - w / 2, y - h / 2, w, h, 26); ctx.stroke();
  ctx.restore();
  UI.text(str, x, y + 2, 30, { fill: '#c8321e', stroke: null, raw: true, alpha: a });
}

// ---------- 開始畫面：開場一開始的夜空＋「點一下開始」（這一下同時解除瀏覽器的音效限制） ----------
// ---------- 團隊 LOGO（開機畫面兼載入畫面，只出現一次）：經典品牌開場 ----------
// 深色底，LOGO 淡入（0.94 → 1 倍微微放大）→ 停留（下方細細的載入進度條）→ 淡出到全黑 → 標題的夜空淡入。
// 載入完成、而且 LOGO 至少停留 HOLD 秒才離開，所以不會比原本的載入畫面多等。無聲（瀏覽器在第一次點擊前不能出聲）
// 載入完成後點一下 / 任意鍵可以提早淡出。ready 由 js/main.js 在素材與字型載入完成時設定
Screens.logo = {
  t: 0, shown: -1, leaving: -1, ready: false, IN: 0.6, HOLD: 1.6, OUT: 0.5,
  BOX: lay(500, 560),   // LOGO 縮放到最長邊 = 這個大小
  enter() { this.t = 0; this.shown = -1; this.leaving = -1; },
  frame(dt) {
    this.t += dt;
    const img = IMG.team_logo;
    if (img && this.shown < 0) this.shown = this.t;   // LOGO 圖載入好的時間（開始淡入）
    const la = this.shown < 0 ? 0 : this.t - this.shown;
    if (this.leaving < 0 && this.ready && this.shown >= 0 && (la >= this.HOLD || (la > 0.3 && (Input.was('anykey') || Input.taps.length)))) this.leaving = this.t;
    const out = this.leaving < 0 ? 0 : clamp((this.t - this.leaving) / this.OUT, 0, 1);
    if (out >= 1) { Screens.title.fromLogo = true; App.cut('title'); return; }
    // 底色：深藍，中間微亮
    const bg = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.7);
    bg.addColorStop(0, '#1a2048'); bg.addColorStop(1, '#070915');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const fin = ease(clamp(la / this.IN, 0, 1)), a = fin * (1 - out);
    if (img && a > 0) {
      const s = (0.94 + 0.06 * fin) * this.BOX / Math.max(img.width, img.height), w = img.width * s, h = img.height * s, cx = W / 2, cy = H * 0.45;
      ctx.save(); ctx.globalAlpha = a; ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); ctx.restore();
    }
    // 載入進度條（載入完就淡掉）
    const prog = Assets.names.length ? Assets.loaded / Assets.names.length : 1;
    this.barA = clamp((this.barA === undefined ? 1 : this.barA) + (this.ready ? -dt * 3 : dt * 3), 0, 1);
    if (this.barA > 0 && !this.ready) {
      const bw = lay(260, 360), bx = W / 2 - bw / 2, by = H * 0.45 + this.BOX / 2 + 36;   // LOGO 下方
      ctx.save(); ctx.globalAlpha = this.barA * 0.9;
      ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(bx, by, bw, 6, 3); ctx.fill();
      ctx.fillStyle = '#ffd23f'; rrect(bx, by, Math.max(6, bw * prog), 6, 3); ctx.fill();
      ctx.restore();
    }
    if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${ease(out)})`; ctx.fillRect(0, 0, W, H); }   // 淡出到全黑
  }
};

Screens.title = {
  enter() { this.t0 = Game.time; },
  frame() {
    drawNightSky();
    const label = Input.touchMode ? 'TAP TO START' : Input.padConnected ? 'PRESS START' : 'PRESS ANY KEY';
    const since = Game.time - (this.t0 || 0), fin = clamp((since - (this.fromLogo ? 0.5 : 0)) / 0.6, 0, 1);   // 提示字在夜空亮起後淡入
    UI.text(label, W / 2, lay(1000, 860), 44, { fill: '#fff', stroke: '#c43a1a', sw: 10, alpha: fin * (0.55 + 0.45 * Math.sin(Game.time * 4)), raw: true });
    if (this.fromLogo && since < 0.8) { ctx.fillStyle = `rgba(0,0,0,${1 - ease(since / 0.8)})`; ctx.fillRect(0, 0, W, H); }   // LOGO 淡出後，夜空從全黑淡入
    if (Input.was('anykey') || Input.taps.length) { Sound.unlock(); App.cut('intro'); }
  }
};

// ---------- 開場煙火（夜空）：火箭升空 → 爆開成火花（含閃光、閃爍火花）＋升空哨音、爆炸聲、劈啪聲 ----------
const Fireworks = {
  // 施放時間（開場秒數）、位置（x、爆開高度）、顏色；最後一發在野台蓋住天空前爆開
  PLAN: [[0.0, 230, 330, ['#ffb84a', '#fff1a0']], [0.25, 510, 260, ['#ff5a7a', '#ffd0e0']], [0.5, 360, 190, ['#7affb0', '#e8fff0']],
         [0.8, 150, 240, ['#7ad8ff', '#ffffff']], [1.05, 580, 200, ['#ffd23f', '#ff7a30']], [1.3, 300, 150, ['#c890ff', '#ffe0ff']],
         [1.55, 470, 230, ['#ff7a30', '#ffe066']], [1.8, 360, 170, ['#ff5a7a', '#ffd23f']]],
  rockets: [], sparks: [], flashes: [], next: 0,
  reset() { this.rockets = []; this.sparks = []; this.flashes = []; this.next = 0; },
  update(dt, t, bus) {
    while (this.next < this.PLAN.length && t >= this.PLAN[this.next][0]) {
      const [, px, pp, cols] = this.PLAN[this.next++], dur = rand(0.55, 0.72);
      const x = px * W / SW, peak = pp * H / SH;   // 施放位置以直式畫面設計，橫式等比換算
      this.rockets.push({ x0: x + rand(-40, 40), x, y0: H + 20, peak, t: 0, dur, cols, trail: [] });
      if (bus) this.whistle(bus, dur);
    }
    for (const r of this.rockets) {
      r.t += dt;
      const p = Math.min(1, r.t / r.dur), e = 1 - (1 - p) * (1 - p);
      r.cx = r.x0 + (r.x - r.x0) * e; r.cy = r.y0 + (r.peak - r.y0) * e;
      r.trail.push([r.cx, r.cy]); if (r.trail.length > 10) r.trail.shift();
      if (p >= 1 && !r.done) { r.done = true; this.burst(r.cx, r.cy, r.cols); if (bus) this.boom(bus); }
    }
    this.rockets = this.rockets.filter(r => !r.done);
    for (const s of this.sparks) {
      const drag = Math.pow(0.12, dt);   // 空氣阻力：速度很快衰減
      s.vx *= drag; s.vy = s.vy * drag + 140 * dt;
      s.px = s.x; s.py = s.y; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    }
    this.sparks = this.sparks.filter(s => s.life > 0);
    for (const f of this.flashes) f.life -= dt;
    this.flashes = this.flashes.filter(f => f.life > 0);
  },
  burst(x, y, cols) {
    const n = ECO() ? 45 : 90, big = rand(330, 420), glitter = Math.random() < 0.5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.06, 0.06), v = big * rand(0.75, 1.05);
      this.sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(1.0, 1.5), max: 1.5, col: cols[i % 2 ? 1 : 0], glitter: glitter && i % 3 === 0 });
    }
    this.flashes.push({ x, y, life: 0.25 });
  },
  draw() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const f of this.flashes) {
      ctx.globalAlpha = 0.55 * (f.life / 0.25);
      ctx.drawImage(Scene.glowSprite('#fff0c8'), f.x - 200, f.y - 200, 400, 400); ctx.globalAlpha = 1;
    }
    for (const r of this.rockets) {   // 升空的火光尾巴
      r.trail.forEach(([x, y], i) => { ctx.fillStyle = `rgba(255,210,140,${(i + 1) / r.trail.length * 0.8})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + i * 0.25, 0, 7); ctx.fill(); });
    }
    for (const s of this.sparks) {
      let a = Math.min(1, s.life / s.max * 1.4);
      if (s.glitter) a *= 0.4 + 0.6 * Math.abs(Math.sin(s.life * 40));   // 閃爍火花
      ctx.strokeStyle = hexA(s.col, a); ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(s.px - (s.x - s.px) * 2, s.py - (s.y - s.py) * 2); ctx.lineTo(s.x, s.y); ctx.stroke();
    }
    ctx.restore();
  },
  // ---- 音效 ----
  whistle(bus, dur) { const t = A.ctx.currentTime; osc('sine', 520, t, dur, 0.035, bus, { to: 1500, att: 0.05 }); nz(t, dur, 0.05, bus, { f: 2600, to: 4200, q: 3 }); },
  boom(bus) {
    const t = A.ctx.currentTime;
    osc('sine', 95, t, 0.55, 0.45, bus, { to: 34, bend: 0.4 });
    nz(t, 0.7, 0.32, bus, { type: 'lowpass', f: 900, to: 180 });
    for (let i = 0; i < 7; i++) nz(t + 0.22 + Math.random() * 0.6, 0.02, 0.07, bus, { type: 'highpass', f: 5000 });   // 劈啪聲
  },
};
// ---------- 開場：野台升起 → 燈籠點亮 → 主角走進來揮手 → 暖簾落下 → 主選單（點一下即可跳過） ----------
Screens.intro = {
  t: 0, cues: null,
  T: { rise: 2.8, lights: 0.8, walk0: 3.6, walk1: 5.4, noren: 6.1, end: 7.6 },   // 野台升起 2.8 秒（同時施放煙火）
  enter() {
    this.t = 0; this.cues = {}; this.skipLock = 0.35;
    Fireworks.reset();
    chef.queue = []; chef.idlePose = 'idle'; chef.pose = 'idle'; chef.lift = 0;
    Sound.init();   // 使用者還沒點過畫面時是暫停狀態（無聲），第一次點擊時由 main.js 解鎖
    Sound.stopBgm();
    this.bus = null;
    if (A.ctx) { this.bus = A.ctx.createGain(); this.bus.connect(A.ui); noiseRumble(this.T.rise, this.bus); }
  },
  // 開場的音效走自己的音量節點：跳過時立刻收掉（例如還在響的轟隆聲）
  leave() {
    const b = this.bus; this.bus = null;
    if (b) { b.gain.setTargetAtTime(0, A.ctx.currentTime, 0.05); setTimeout(() => { try { b.disconnect(); } catch (e) { /* ignore */ } }, 400); }
  },
  once(key, fn) { if (!this.cues[key]) { this.cues[key] = true; fn(); } },
  frame(dt) {
    this.t += dt;
    const t = this.t, T = this.T;
    // 跳過（開場一開始的 0.35 秒不收，避免把開始畫面的那一下當成跳過）
    this.skipLock -= dt;
    if (this.skipLock <= 0 && (Input.was('anykey') || Input.taps.length)) { this.finish(); return; }

    // 1. 野台由下往上緩緩升起；夜空的月亮、燈籠串跟著往上移（鏡頭往下帶的感覺）
    // 修飾（不像一張圖被推上來）：只升 68% 的高度＋一開始從暗處淡入、從 1.06 倍慢慢縮回原尺寸（鏡頭感）、
    // 上緣漸層融進夜空、上緣跟著一條煙霧帶；落地後上緣恢復原圖、煙霧往兩側散開
    const p = clamp(t / T.rise, 0, 1), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const rise = (1 - e) * H * 0.68, zoom = 1 + 0.06 * Math.pow(1 - p, 2), appear = clamp(t / 0.6, 0, 1);
    const landed = clamp((t - T.rise) / 0.6, 0, 1), smokeOut = clamp((t - T.rise) / 1.1, 0, 1);
    // 由暗到亮：升起時是暗的剪影、慢慢變亮（落地時約一半），燈籠一盞盞點亮時其餘的暗也跟著退掉
    const dark = Math.max(0, 0.82 - 0.37 * e - 0.45 * clamp((t - T.rise) / T.lights, 0, 1));
    const stage = () => { ctx.translate(SW / 2, SH); ctx.scale(zoom, zoom); ctx.translate(-SW / 2, -SH); };   // 以畫面下緣中央為基準縮放
    drawNightSky(H * e);
    // 0. 野台升起的同時，夜空施放煙火（畫在野台後面，野台升上來就自然被擋住）
    Fireworks.update(dt, t, this.bus);
    Fireworks.draw();
    // 落地：咚一聲＋揚塵＋震動
    let shake = 0;
    if (t >= T.rise) {
      this.once('land', () => {
        if (this.bus) { SND.kick(A.ctx.currentTime, 1, this.bus); SND.don(A.ctx.currentTime, 0.8, this.bus); }
        for (let i = 0; i < lay(26, 60); i++) Fx.particles.push({ x: rand(VIEW.x0, VIEW.x1), y: SH - rand(0, 30), vx: rand(-60, 60), vy: rand(-140, -40), life: rand(0.6, 1.2), max: 1.2, size: rand(14, 26), g: -10, kind: 'steam' });
      });
      shake = Math.max(0, 1 - (t - T.rise) / 0.35) * Math.sin(t * 70) * 7;
    }
    // 2. 燈籠一盞一盞亮起
    const LS = Scene.theme().lanterns, litStart = T.rise, per = T.lights / LS.length;
    const lit = i => clamp((t - litStart - i * per) / 0.15, 0, 1);
    LS.forEach((_, i) => { if (t >= litStart + i * per && i % 3 === 0) this.once('l' + i, () => { if (this.bus) osc('sine', 700 + (i % 5) * 90, A.ctx.currentTime, 0.08, 0.12, this.bus); }); });

    const riseW = rise / Cam.k;   // 世界座標的升起距離
    worldBegin();
    ctx.save(); ctx.translate(shake * 0.4, riseW + shake); stage(); ctx.globalAlpha = appear;
    Scene.background(0.3, lit, false, 1 - landed, false);   // 燈籠光暈等鐵板、壓暗之後再畫
    ctx.restore();
    // 3. 主角從右邊一蹦一跳走進來（在吧台後面）
    if (t >= T.walk0) {
      const wp = clamp((t - T.walk0) / (T.walk1 - T.walk0), 0, 1), e = 1 - Math.pow(1 - wp, 2);
      const walking = wp < 1, phase = (t - T.walk0) * 5.2;
      const dx = (1 - e) * lay(SW * 0.75, 820), hop = walking ? -Math.abs(Math.sin(phase * Math.PI)) * 18 : 0, rot = walking ? Math.sin(phase * Math.PI) * 0.05 : 0;
      if (walking) { const step = Math.floor(phase); this.once('step' + step, () => { if (this.bus) SND.wood(A.ctx.currentTime, false, this.bus); }); }
      if (!walking) {
        this.once('wave', () => {
          chef.idlePose = 'wave';
          if (this.bus) {
            const now = A.ctx.currentTime;
            Sound.playVoice('irasshaimase', this.bus, now);   // 「いらっしゃいませ！」語音，和對話框同時出現
            SND.don(now, 0.55, this.bus); SND.kane(now + 1.05, 0.9, this.bus);   // 太鼓放輕、鉦挪到語音之後，不蓋住人聲
          }
          Sound.startBgm();   // 主選單音樂從這裡開始，接到主選單不中斷
        });
      }
      Scene.chef(0, dx, hop, rot);
    }
    ctx.save(); ctx.translate(shake * 0.4, riseW + shake); stage(); ctx.globalAlpha = appear;
    Scene.griddle(); Scene.darkness(dark); Scene.lanternGlow(0.3, lit); Scene.edgeSmoke(Scene.bg.y, smokeOut, clamp(t / 1.0, 0, 1));   // 雲霧約 1 秒內聚攏
    ctx.restore();
    Fx.draw();
    // 4. 歡迎光臨！
    if (t >= T.walk1 && t < T.end) {
      const k = clamp((t - T.walk1) / 0.2, 0, 1), a = t > T.end - 0.4 ? (T.end - t) / 0.4 : 1;
      ctx.save(); ctx.translate(500, 560); ctx.scale(0.6 + 0.4 * ease(k), 0.6 + 0.4 * ease(k));
      speechBubble(0, 0, '歡迎光臨！', a); ctx.restore();
    }
    ctx.restore();   // 世界座標結束
    // 5. 暖簾從上方落下、彈一下
    if (t >= T.noren) {
      const k = clamp((t - T.noren) / 0.6, 0, 1);
      const bounce = k < 1 ? Math.sin(k * Math.PI * 2.5) * (1 - k) * 40 : 0;
      const y = lerp(-180, TITLE.y, Math.min(1, k * 1.6)) + bounce;
      this.once('noren', () => { if (this.bus) nz(A.ctx.currentTime, 0.25, 0.25, this.bus, { f: 900, to: 300, q: 1 }); });
      UI.noren(TITLE.x, y, TITLE.w, TITLE.h, 'リズム屋台');
    }
    UI.text('SKIP ▶▶', W - 20, H - 26, 20, { align: 'right', fill: 'rgba(255,255,255,.75)', stroke: 'rgba(0,0,0,.6)', sw: 4, raw: true });
    if (t >= T.end) this.finish();
  },
  finish() {   // App.goto 在轉場中會忽略重複呼叫
    chef.idlePose = 'wave'; chef.queue = [];
    App.goto('menu');
  },
};
// 野台升起時低沉的轟隆聲
function noiseRumble(dur, dest) {
  const t = A.ctx.currentTime;
  nz(t, dur, 0.35, dest, { type: 'lowpass', f: 180, to: 420, q: 0.8 });
  osc('sine', 48, t, dur, 0.25, dest, { att: 0.4 });
}

// 標題暖簾的位置（開場落下的位置 = 主選單的位置）：直式在攤位招牌下方；橫式在左側街景上
const TITLE = lay({ x: W / 2, y: 252, w: 460, h: 118, ty: 404 }, { x: 310, y: 210, w: 540, h: 140, ty: 440 });

// ---------- 主選單 ----------
// 按鈕放在畫面最下方（攤位前的吧台與板凳上），不擋主角：
// 第 1 排 = 朱漆「開始遊戲」大木牌；第 2 排 = 掛在竹竿上的四塊木札
// 遊戲幣圖示：金色硬幣（外圈深金、內圈刻線、左上高光）
function drawCoin(x, y, r) {
  ctx.save();
  ctx.fillStyle = '#b8860b'; ctx.beginPath(); ctx.arc(x, y + r * 0.12, r, 0, 7); ctx.fill();   // 厚度（下緣）
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, '#fff6b0'); g.addColorStop(0.45, '#ffd23f'); g.addColorStop(1, '#e0a020');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#a8740a'; ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.beginPath(); ctx.arc(x, y, r * 0.68, 0, 7); ctx.stroke();
  ctx.restore();
}
// 硬幣圖示＋數字（不寫「遊戲幣」）；align = left / center / right（對齊整組的寬度）；回傳寬度
function coinText(n, x, y, fs, o = {}) {
  const txt = String(n), r = fs * 0.52, gap = fs * 0.28;
  ctx.font = `${fs}px ${FONT}`;
  const w = r * 2 + gap + ctx.measureText(txt).width, x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  if (o.alpha !== undefined) { ctx.save(); ctx.globalAlpha *= o.alpha; }
  drawCoin(x0 + r, y, r);
  UI.text(txt, x0 + r * 2 + gap, y + 1, fs, { align: 'left', fill: o.fill || '#fff27a', stroke: null, raw: true });
  if (o.alpha !== undefined) ctx.restore();
  return w;
}
// 持有遊戲幣的膠囊（主選單、商店右上角共用）：右邊對齊 xr
function coinPill(xr, y, h, fs) {
  ctx.font = `${fs}px ${FONT}`;
  const w = fs * 1.32 + ctx.measureText(String(CoinShop.coins())).width + 40;
  UI.panel(xr - w, y, w, h, h / 2, 'rgba(16,22,52,.88)', '#e8b64a');
  coinText(CoinShop.coins(), xr - w / 2, y + h / 2, fs, { align: 'center' });
}

Screens.menu = {
  sel: 0, n: 0, lastTag: 1,
  TAGS: [['操作說明', 'sub.howto', 'howto'], ['成就', 'sub.achievements', 'achievements'], ['節奏分析', 'sub.rhythm', 'rhythm'], ['設定', 'sub.settings', 'settings'], ['CREDIT', 'sub.credits', 'credits']],
  enter() { this.sel = 0; chef.idlePose = 'wave'; chef.queue = []; Sound.init(); Sound.duck(false); Sound.startBgm(); },
  frame() {
    if (LAND) return this.frameLand();
    menuBackdrop(0);
    const gr = ctx.createLinearGradient(0, 930, 0, H);   // 下方壓暗，讓木牌清楚
    gr.addColorStop(0, 'rgba(8,10,30,0)'); gr.addColorStop(1, 'rgba(8,10,30,.82)');
    ctx.fillStyle = gr; ctx.fillRect(0, 930, W, H - 930);
    UI.noren(TITLE.x, TITLE.y, TITLE.w, TITLE.h, 'リズム屋台');
    UI.tanzaku(TITLE.x, TITLE.ty, '節奏熱炒遊戲', lay(22, 28));

    UI.begin(this);
    if (UI.button(this, '開始遊戲', 170, 980, 380, 92, { lacquer: true, sub: 'sub.start', size: 40 })) App.goto(Save.data.tutorialDone ? 'songs' : 'tutorial');   // 第一次先玩新手教學
    UI.pole(16, 1098, W - 32);
    this.TAGS.forEach(([label, sub, dest], k) => {
      if (UI.button(this, label, 24 + k * 136, 1122, 128, 94, { tag: true, sub, size: 25, ropeH: 24 })) App.goto(dest);   // 5 塊木札
    });
    this.achBadge(24 + this.achIdx() * 136 + 118, 1124);
    this.shopButton(24, 40, 128, 86);
    this.coinBadge();
    this.nav();
    UI.navHint();
  },
  // 橫式：左側標題暖簾；右側一欄木牌（上下鍵移動）。桌面版多一個「結束遊戲」
  frameLand() {
    menuBackdrop(0);
    const gr = ctx.createLinearGradient(1240, 0, W, 0);   // 右側壓暗，讓木牌清楚
    gr.addColorStop(0, 'rgba(8,10,30,0)'); gr.addColorStop(0.35, 'rgba(8,10,30,.55)'); gr.addColorStop(1, 'rgba(8,10,30,.8)');
    ctx.fillStyle = gr; ctx.fillRect(1240, 0, W - 1240, H);
    UI.noren(TITLE.x, TITLE.y, TITLE.w, TITLE.h, 'リズム屋台');
    UI.tanzaku(TITLE.x, TITLE.ty, '節奏熱炒遊戲', 28);
    UI.begin(this);
    const top = DESKTOP_APP ? 230 : 270;
    if (UI.button(this, '開始遊戲', 1400, top, 440, 116, { lacquer: true, sub: 'sub.start', size: 46 })) App.goto(Save.data.tutorialDone ? 'songs' : 'tutorial');
    this.TAGS.forEach(([label, sub, dest], k) => {
      if (UI.button(this, label, 1430, top + 150 + k * 100, 380, 84, { sub, size: 32 })) App.goto(dest);
    });
    this.achBadge(1430 + 370, top + 150 + this.achIdx() * 100 + 6);
    if (DESKTOP_APP && UI.button(this, '結束遊戲', 1430, top + 150 + this.TAGS.length * 100, 380, 84, { sub: 'sub.quit', size: 32, back: true })) window.desktop.quit();
    this.shopButton(52, 46, 156, 100);
    this.coinBadge();
    UI.nav(this);
    UI.navHint();
  },
  // 右上角：目前的遊戲幣（只有硬幣圖示＋數字；COIN_SHOP 打開才顯示）；直式放在招牌上方的空隙
  coinBadge() { if (COIN_SHOP) coinPill(W - lay(14, 40), lay(10, 44), lay(42, 60), lay(22, 30)); },
  // 「成就」木札右上角：新解鎖的數量（進成就畫面看過就消失）
  achIdx() { return this.TAGS.findIndex(t => t[2] === 'achievements'); },
  achBadge(x, y) {
    const n = Achieve.newCount(); if (!n) return;
    const r = 15 + Math.sin(Game.time * 5) * 1.5;
    ctx.fillStyle = '#e8302a'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    UI.text(String(Math.min(n, 99)), x, y + 1, 17, { fill: '#fff', stroke: null, raw: true });
  },
  // 左上角獨立的「商店」木札（直式、橫式都排在最後一個：直式 = 6、橫式在 UI.nav 的最後）
  // 位置在角落不顯眼，加上提示效果：掛在竹竿上、燈火光暈一明一暗、每隔一陣子晃一下、周圍小星星閃爍；
  // 還沒進過商店時右上角掛一個跳動的「NEW!」（進商店後就不再顯示，Save.data.shopSeen）
  shopButton(x, y, w, h) {
    const t = Game.time, i = this.n, on = this.sel === i, pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = on ? 0.75 + pulse * 0.25 : 0.3 + pulse * 0.4;
    ctx.drawImage(Scene.glowSprite('#ffb04a'), x - 40, y - 34, w + 80, h + 72); ctx.restore();
    UI.pole(x - 16, y - 20, w + 32);
    if (UI.button(this, '商店', x, y, w, h, { tag: true, sub: 'sub.shop', size: lay(26, 30), ropeH: 20, wiggle: true })) App.goto('shop');
    // 小星星：三顆輪流閃
    [[x - 8, y + h * 0.35, 0], [x + w + 8, y + h * 0.2, 1.1], [x + w * 0.62, y + h + 14, 2.2]].forEach(([sx, sy, ph]) => {
      const k = Math.max(0, Math.sin(t * 2.4 + ph)), r = 4 + k * 9;
      if (k <= 0.05) return;
      ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#fff6c8'; ctx.translate(sx, sy); ctx.rotate(t * 0.8 + ph);
      ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4, rr = j % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); ctx.restore();
    });
    if (!Save.data.shopSeen) {   // NEW! 標籤（上下跳動）
      const bx = x + w - 6, by = y + 4 - Math.abs(Math.sin(t * 4)) * 6;
      UI.panel(bx - 34, by - 15, 68, 30, 15, '#e8302a', '#fff');
      UI.text('NEW!', bx, by + 1, 17, { fill: '#fff', stroke: null, raw: true });
    }
  },
  // 兩排的方向鍵移動：0 = 開始遊戲；1~5 = 下排木札；6 = 左上角的商店
  nav() {
    const s = this.sel, SHOP = this.TAGS.length + 1, go = v => { if (v !== this.sel) { this.sel = v; Sound.play('select'); } };
    if (s === SHOP) { if (Input.was('down') || Input.was('right')) go(0); return; }
    if (Input.was('up') && s === 0) go(SHOP);
    if (Input.was('down') && s === 0) go(this.lastTag);
    if (Input.was('up') && s > 0) { this.lastTag = s; go(0); }
    if (Input.was('left') && s > 1) go(s - 1);
    if (Input.was('right') && s >= 1 && s < this.TAGS.length) go(s + 1);
    if (Input.was('right') && s === 0) go(this.lastTag);
  }
};

// ---------- 商店 ----------
// 版面（之後商品變多也放得下）：
//   上：分頁列（種類多了可以左右捲動，選中的那頁一定看得到）
//   中：商品卡片格子（縮圖＋名稱＋狀態；超過一頁就上下捲動，手指可拖曳、滑鼠滾輪可捲）
//   下：選中商品的名稱、說明、狀態，以及「套用／購買」「返回」
// 手機：畫面下半部的面板（上半部留給背景預覽與主角）；PC：畫面右側的面板（中間的攤位照常看得到）
// 新增種類：在 CATS 加一項（list 商品清單、key 存檔欄位、thumb 縮圖畫法、focus 選到時的預覽）；
//   需要不同流程的種類可以另外給 state / status / badge / label / act / extra（額外按鈕）/ overlay（上方大面板）/ blur / cols
// 遊戲幣先預留（js/shop.js 的 CoinShop、js/config.js 的 COIN_SHOP / price）：COIN_SHOP = false 時全部免費
// 「追加樂曲」是付真錢的（js/shop.js 的 Shop：App Store / Google Play / Steam），分頁與價格用朱漆色和遊戲幣商品區分
// 只列付費的 VOL（內建曲目不算 VOL 系列，不在商店賣）
const VOL_ITEMS = VOL_ORDER.map((ids, v) => v).filter(v => v > 0).map(v => ({ id: 'vol' + v, vol: v, name: volName(v), songs: SONGS.filter(s => s.vol === v),
  color: VOL_COLORS[v] || '#c8321e' }));
Screens.shop = {
  cat: 0, sel: [], scroll: 0, scrollTo: 0, tabScroll: 0, btn: { sel: -1, n: 0 }, vs: 0,
  CATS: [
    // 卡片放大：手機 4 張一排（填滿格子區）、PC 一張一列的橫幅
    { name: '追加樂曲', kind: 'vol', list: VOL_ITEMS, cols: lay(4, 1), ch: lay(180, 140), paid: true,
      // 縮圖：VOL 代表色＋大字＋這一集 10 首的顏色點；沒買的有鎖
      thumb(it, x, y, w, h) {
        const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, it.color); g.addColorStop(1, 'rgba(0,0,0,.6)');
        ctx.fillStyle = it.color; ctx.fillRect(x, y, w, h); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        UI.text(it.name, x + w / 2, y + h * 0.42, Math.min(h * 0.42, w * 0.2), { fill: '#fff', stroke: 'rgba(0,0,0,.45)', sw: 6, raw: true });
        const nd = it.songs.length, d = Math.min(9, w / (nd * 2.2 + 4));   // 點的大小跟著曲數（10 或 20 首）
        it.songs.forEach((s, k) => { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(x + w / 2 + (k - (nd - 1) / 2) * d * 2.2, y + h * 0.82, d * 0.8, 0, 7); ctx.fill(); });
        if (!Shop.owned(it.vol)) drawLock(x + w - 22, y + 24, 0.55);
      },
      state(it) { return Shop.owned(it.vol) ? 'owned' : 'locked'; },
      status(it, st) { return !Shop.paid(it.vol) ? tr('免費') : !Shop.enabled() ? tr('免費開放中') : st === 'owned' ? tr('✓ 已購買') : Shop.price(it.vol); },
      badge(it) { return Shop.price(it.vol); },
      desc(it) { return tr('追加樂曲 {0} 首', it.songs.length); },
      label(st) { return st === 'owned' ? '前往選曲' : '購買'; },
      act(it) {
        const S = Screens.shop;
        if (Shop.owned(it.vol)) { Save.data.lastSong = it.songs[S.vs].id; Save.store(); Sound.play('confirm'); App.goto('songs'); return; }
        if (Shop.busy) return;
        Sound.play('confirm');
        Shop.buy(it.vol).then(r => {
          if (r === 'ok') { Sound.play('purchase'); if (A.ctx) SND.fanfare(A.ctx.currentTime + 0.6); S.say(tr('已解鎖 {0}！', it.name)); }
          else S.say(tr(r === 'cancel' ? '已取消購買' : '購買失敗，請稍後再試'));
        });
      },
      // 額外按鈕：恢復購買（有商店時；iOS 規定要有）
      extra() {
        return Shop.enabled() ? { label: '恢復購買', run() {
          if (Shop.busy) return;
          Sound.play('confirm');
          Shop.restore().then(n => Screens.shop.say(tr(n < 0 ? '恢復購買失敗' : n > 0 ? '已恢復購買' : '沒有可恢復的購買')));
        } } : null;
      },
      focus(it) { Scene.preview = Save.data.bg; Screens.shop.vs = 0; Screens.shop.playSong(); },
      blur() { Sound.startBgm(); },
      overlay(it) { Screens.shop.drawVol(it); } },
    { name: '店面背景', kind: 'bg', key: 'bg', list: BACKGROUNDS,
      // 縮圖：背景圖中間偏上（招牌、燈籠、主角）
      thumb(it, x, y, w, h) {
        const img = IMG['bg_' + it.id];
        if (!img) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, y, w, h); UI.text('…', x + w / 2, y + h / 2, 24, { fill: '#cfd8ff', stroke: null, raw: true }); return; }
        const sh = img.height * 0.36, sw = Math.min(img.width, sh * w / h), s2 = sw * h / w;
        ctx.drawImage(img, (img.width - sw) / 2, img.height * 0.4 - s2 / 2, sw, s2, x, y, w, h);
      },
      desc(it) { return IMG['bg_' + it.id] ? it.desc : '載入中…'; },
      focus(it) { Scene.preview = it.id; } },
    { name: '陪伴寵物', kind: 'pet', key: 'pet', list: PETS,
      // 縮圖：寵物本身（不帶寵物 = 空的木檯）
      thumb(it, x, y, w, h, live) {
        const bg = ctx.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#5a4a8a'); bg.addColorStop(1, '#2a2050');
        ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#a8703a'; ctx.fillRect(x, y + h * 0.82, w, h * 0.18);   // 木檯
        if (it.id === 'none') { UI.text('—', x + w / 2, y + h * 0.45, h * 0.4, { fill: 'rgba(255,255,255,.5)', stroke: null, raw: true }); return; }
        const k = h / 135;
        ctx.save(); ctx.translate(x + w / 2, y + h * 0.88); ctx.scale(k, k);
        drawPet(ctx, it.id, live ? 'happy' : 'idle', live ? (Game.time % 0.6) : 0, 0); ctx.restore();
      },
      // 預覽：木檯上的寵物直接換成這一隻，並開心跳一下
      focus(it) { Scene.preview = Save.data.bg; Pet.preview = it.id; Pet.react('happy', 0.5); },
      // 手機：木檯在商店面板後面看不到 → 在主角左邊放大預覽（站在發光的圓台上）；PC 的木檯露在外面，不用另外畫
      overlay(it) {
        if (LAND || it.id === 'none') return;
        const x = 140, y = 790;
        const glow = ctx.createRadialGradient(x, y, 4, x, y, 120); glow.addColorStop(0, 'rgba(255,220,140,.55)'); glow.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = glow; ctx.fillRect(x - 130, y - 200, 260, 260);
        ctx.fillStyle = 'rgba(16,22,52,.75)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 78, 16, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.stroke();
        if (Game.time >= Pet.until) Pet.mood = 'idle';
        ctx.save(); ctx.translate(x, y); ctx.scale(1.7, 1.7); drawPet(ctx, it.id, Pet.mood, Game.time - Pet.hopT, Scene.idlePulse()); ctx.restore();
      } },
    { name: '打擊音效', kind: 'hit', key: 'hitSound', list: HIT_SOUNDS,
      // 縮圖：商品色底＋等化器長條（試聽時會跳動）
      thumb(it, x, y, w, h, live) {
        const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, it.color); g.addColorStop(1, 'rgba(0,0,0,.55)');
        ctx.fillStyle = it.color; ctx.fillRect(x, y, w, h); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        const n = 7, bw = Math.min(14, w / (n * 1.8)), gap = bw * 0.7, x0 = x + w / 2 - (n * bw + (n - 1) * gap) / 2, t = Game.time;
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (let k = 0; k < n; k++) {
          const base = [0.35, 0.6, 0.85, 0.5, 0.75, 0.45, 0.3][k], hh = h * 0.7 * (live ? 0.25 + 0.75 * Math.abs(Math.sin(t * 9 + k * 1.7)) : base);
          rrect(x0 + k * (bw + gap), y + h * 0.85 - hh, bw, hh, bw / 2); ctx.fill();
        }
      },
      extra() { return { label: '♪ 試聽', key: '試聽', run() { Screens.shop.demo(); } }; },
      focus(it) { Scene.preview = Save.data.bg; Screens.shop.demo(); } },
  ],
  // 版面：sheet 面板、tabs 分頁列、grid 格子（cols 欄、rows 看得到幾列；種類可用 cols 改欄數）、detail 說明區、vol 追加樂曲的曲目面板
  L: lay({ sheet: [12, 846, 696, 426], tabs: [28, 858, 664, 44], grid: { x: 28, y: 914, cols: 4, cw: 157, ch: 84, gap: 12, rows: 2 }, detail: [28, 1102, 664, 72], btnY: 1186,
    vol: [36, 100, 648, 734] },
  { sheet: [1342, 104, 552, 940], tabs: [1362, 120, 512, 48], grid: { x: 1362, y: 184, cols: 2, cw: 250, ch: 140, gap: 12, rows: 4 }, detail: [1362, 778, 512, 120], btnY: 966,
    vol: [300, 110, 1010, 900] }),
  C() { return this.CATS[this.cat]; },
  item() { return this.C().list[this.sel[this.cat] || 0]; },
  grid() {
    const B = this.L.grid, c = this.C(), cols = c.cols || B.cols, ch = c.ch || B.ch, gw = B.cols * (B.cw + B.gap) - B.gap, viewH = B.rows * (B.ch + B.gap) - B.gap;
    return Object.assign({}, B, { cols, ch, cw: (gw - B.gap * (cols - 1)) / cols, rows: Math.max(1, Math.floor((viewH + B.gap) / (ch + B.gap))) });
  },
  enter() {
    if (!Save.data.shopSeen) { Save.data.shopSeen = true; Save.store(); }   // 主選單商店木札的 NEW! 只到第一次進來為止
    this.toast = null; this.cat = 0; this.btn.sel = -1; this.demoT = -9;
    // 預設選中：套用中的那款；追加樂曲 = 第一個還沒買的 VOL
    this.sel = this.CATS.map(c => Math.max(0, c.key ? c.list.findIndex(x => x.id === Save.data[c.key]) : c.list.findIndex(x => !Shop.owned(x.vol))));
    BACKGROUNDS.forEach(b => Assets.bg(b.id));   // 其他背景這時才載入（縮圖、預覽用）
    Sound.startBgm();
    this.C().focus(this.item()); this.follow(true);
  },
  leave() { Scene.preview = null; Pet.preview = null; this.stopDemo(); this.ask = null; },
  back() { App.goto('menu'); },
  // 選中的卡片捲到看得到的位置（now = 直接跳過去）
  follow(now) {
    const G = this.grid(), row = Math.floor((this.sel[this.cat] || 0) / G.cols), top = row * (G.ch + G.gap), viewH = G.rows * (G.ch + G.gap) - G.gap;
    if (top < this.scrollTo) this.scrollTo = top;
    if (top + G.ch > this.scrollTo + viewH) this.scrollTo = top + G.ch - viewH;
    if (now) this.scroll = this.scrollTo;
  },
  maxScroll() { const G = this.grid(), rows = Math.ceil(this.C().list.length / G.cols); return Math.max(0, rows * (G.ch + G.gap) - G.gap - (G.rows * (G.ch + G.gap) - G.gap)); },
  pick(i) {
    const N = this.C().list.length;
    i = clamp(i, 0, N - 1);
    if (i === this.sel[this.cat]) return;
    this.sel[this.cat] = i; Sound.play('select'); this.follow(); this.C().focus(this.item());
  },
  setCat(c) {
    c = clamp(c, 0, this.CATS.length - 1);
    if (c === this.cat) return;
    this.stopDemo();
    if (this.C().blur) this.C().blur();
    Pet.preview = null;   // 寵物的預覽只在那一頁
    this.cat = c; this.sel[c] = this.sel[c] || 0; this.scroll = this.scrollTo = 0; this.follow(true); Sound.play('select');
    this.C().focus(this.item());
  },
  // 打擊音效試聽：切、炒、淋醬、GREAT 各一下（走音效音量）；換下一包時前一段立刻停
  demo() {
    if (!A.ctx) return;
    this.stopDemo();
    const bus = this.demoBus = A.ctx.createGain(), t = A.ctx.currentTime + 0.12, pack = this.item().id;
    bus.connect(A.hit); this.demoT = Game.time;
    const byPose = p => TYPES.find(k => ING[k].pose === p);
    [['knife', 'NICE'], ['spatula', 'NICE'], ['sauce', 'NICE'], ['knife', 'GREAT']].forEach(([p, g], i) => SND.hit(byPose(p), g, bus, t + i * 0.26, pack));
  },
  stopDemo() { this.demoT = -9; if (this.demoBus) { try { this.demoBus.disconnect(); } catch (e) { /* ignore */ } this.demoBus = null; } },
  // 追加樂曲：試聽曲目面板上選中的那首（和選曲畫面一樣播中段）
  playSong() { const s = this.item().songs[this.vs]; Sound.startBgm(s, Math.min(2, s.sections.length - 1)); },
  setVs(k) { const n = this.item().songs.length; k = clamp(k, 0, n - 1); if (k === this.vs) return; this.vs = k; Sound.play('select'); this.playSong(); },
  say(text) { this.toast = { text: tr(text), t: Game.time }; },
  // 套用（沒有的先買）；種類有自己的 act 就交給它（追加樂曲：購買 / 前往選曲）
  act(item) {
    const c = this.C();
    if (c.act) return c.act(item);
    if (Save.data[c.key] === item.id) return;
    if (!CoinShop.owned(c.kind, item)) {
      if (CoinShop.coins() < item.price) { Sound.play('back'); this.say('遊戲幣不足'); return; }
      this.ask = { item, sel: 0, t: Game.time }; Sound.play('select'); return;   // 先問一次（確認框在 drawAsk）
    }
    Save.data[c.key] = item.id; Save.store(); Sound.play('confirm'); this.say('已套用！');
    Achieve.unlock('shop_first'); Achieve.check();
  },
  // 購買確認框：「用 N 遊戲幣購買「名稱」？」購買／取消（← → 或 ↑↓ 切換、ENTER 決定、ESC 取消；點按鈕）
  drawAsk(inp) {
    const A2 = this.ask, it = A2.item, c = this.C(), pw = lay(600, 640), ph = 300, px = (W - pw) / 2, py = (H - ph) / 2;
    UI.dim(0.6);
    UI.panel(px, py, pw, ph, 28, 'rgba(16,22,52,.97)', '#ffd23f');
    UI.text(it.name, W / 2, py + 62, 36, { fill: '#ffd23f', sw: 7, maxW: pw - 60 });
    coinText(it.price, W / 2, py + 118, 32, { align: 'center' });   // 價格：硬幣圖示＋數字
    { // 購買後還剩：文字＋硬幣圖示＋數字（整組置中）
      const lbl = tr('購買後還剩'), left = CoinShop.coins() - it.price; ctx.font = `18px ${FONT}`;
      const lw = ctx.measureText(lbl).width, cw = 18 * 1.32 + ctx.measureText(String(left)).width, x0 = W / 2 - (lw + 8 + cw) / 2;
      UI.text(lbl, x0, py + 160, 18, { align: 'left', fill: '#9fb0e0', stroke: null, raw: true });
      coinText(left, x0 + lw + 8, py + 160, 18, { fill: '#9fb0e0' });
    }
    const bw = 220, bh = 64, by = py + ph - bh - 30, b0 = W / 2 - bw - 12, b1 = W / 2 + 12;
    if (['left', 'right', 'up', 'down'].some(k => inp.pressed.has(k))) { A2.sel ^= 1; Sound.play('select'); }
    const tapped = (bx) => inp.taps.some(t => UI.inside(t.x, t.y, bx, by, bw, bh));
    ['購買', '取消'].forEach((lb, k) => {
      const bx = k ? b1 : b0, on = A2.sel === k;
      UI.panel(bx, by, bw, bh, 32, k ? (on ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.1)') : (on ? '#e0462a' : '#8a2a1a'), on ? '#ffd23f' : 'rgba(255,255,255,.4)');
      UI.text(lb, bx + bw / 2, by + bh / 2 + 1, 28, { fill: '#fff', stroke: null });
    });
    if (Game.time - A2.t < 0.15) return;   // 剛打開時的同一下 ENTER 不算
    const yes = tapped(b0) || (A2.sel === 0 && inp.pressed.has('confirm'));
    const no = tapped(b1) || inp.pressed.has('back') || (A2.sel === 1 && inp.pressed.has('confirm'));
    if (no) { this.ask = null; Sound.play('back'); return; }
    if (!yes) return;
    this.ask = null;
    if (CoinShop.buy(c.kind, it) !== 'ok') { Sound.play('back'); this.say('遊戲幣不足'); return; }
    Save.data[c.key] = it.id; Save.store(); Sound.play('purchase'); this.say('購買成功！');
    Achieve.unlock('shop_first'); Achieve.check();   // 商店收藏類成就（COIN_SHOP 打開才會解鎖）
  },
  state(c, it) { return c.state ? c.state(it) : Save.data[c.key] === it.id ? 'on' : CoinShop.owned(c.kind, it) ? 'owned' : 'locked'; },

  // 分頁列：每頁寬度依文字；放不下時跟著選中的那頁左右捲動，兩端淡出提示還有
  // 付費（真錢）的分頁用朱漆色＋金框，和遊戲幣商品區分
  drawTabs() {
    const [x, y, w, h] = this.L.tabs, gap = 10;
    ctx.font = `22px ${FONT}`;
    const ws = this.CATS.map(c => Math.max(150, ctx.measureText(tr(c.name)).width + 56)), total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
    const left = ws.slice(0, this.cat).reduce((a, b) => a + b + gap, 0);
    const want = total <= w ? -(w - total) / 2 : clamp(left + ws[this.cat] / 2 - w / 2, 0, total - w);
    this.tabScroll += (want - this.tabScroll) * 0.25;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y - 4, w, h + 8); ctx.clip();
    let tx = x - this.tabScroll;
    this.CATS.forEach((c, k) => {
      const on = k === this.cat;
      const fill = on ? (c.paid ? '#b8261a' : '#e8502a') : (c.paid ? 'rgba(184,38,26,.35)' : 'rgba(255,255,255,.1)');
      UI.panel(tx, y, ws[k], h, h / 2, fill, c.paid ? '#ffd23f' : on ? '#fff' : 'rgba(255,255,255,.35)');
      UI.text(c.name, tx + ws[k] / 2, y + h / 2 + 1, 22, { fill: on ? '#fff' : c.paid ? '#ffe0a0' : '#cfd8ff', stroke: on ? '#5a0f05' : null, sw: 5, maxW: ws[k] - 20 });
      if (Input.taps.some(t => UI.inside(t.x, t.y, Math.max(x, tx), y, Math.min(tx + ws[k], x + w) - Math.max(x, tx), h))) this.setCat(k);
      tx += ws[k] + gap;
    });
    ctx.restore();
    if (total > w) {   // 兩端還有分頁：小箭頭
      if (this.tabScroll > 4) UI.text('‹', x - 8, y + h / 2, 30, { fill: '#ffd23f', raw: true });
      if (this.tabScroll < total - w - 4) UI.text('›', x + w + 8, y + h / 2, 30, { fill: '#ffd23f', raw: true });
    }
  },
  // 商品格子：縮圖、名稱、狀態徽章；選中的卡片金框
  drawGrid() {
    const G = this.grid(), c = this.C(), list = c.list, viewH = G.rows * (G.ch + G.gap) - G.gap, gw = G.cols * (G.cw + G.gap) - G.gap;
    // 手指上下拖曳捲動（放開後停在原位）
    const drag = Input.dragY();
    if (drag && UI.inside(drag.x, drag.y, G.x, G.y, gw, viewH)) {
      if (this.dragFrom === null || this.dragFrom === undefined) this.dragFrom = this.scrollTo;
      this.scrollTo = this.scroll = clamp(this.dragFrom - drag.dy, 0, this.maxScroll());
    } else this.dragFrom = null;
    this.scrollTo = clamp(this.scrollTo, 0, this.maxScroll());
    this.scroll += (this.scrollTo - this.scroll) * 0.3;
    ctx.save(); ctx.beginPath(); ctx.rect(G.x - 6, G.y - 6, gw + 12, viewH + 12); ctx.clip();
    list.forEach((it, i) => {
      const col = i % G.cols, row = Math.floor(i / G.cols), x = G.x + col * (G.cw + G.gap), y = G.y + row * (G.ch + G.gap) - this.scroll;
      if (y + G.ch < G.y - 6 || y > G.y + viewH + 6) return;
      const on = i === this.sel[this.cat], st = this.state(c, it), th = G.ch - (LAND ? 40 : 30);
      UI.panel(x, y, G.cw, G.ch, 12, on ? 'rgba(255,190,60,.28)' : 'rgba(255,255,255,.07)', on ? '#ffd23f' : 'rgba(255,255,255,.22)');
      ctx.save(); rrect(x + 5, y + 5, G.cw - 10, th, 8); ctx.clip();
      c.thumb(it, x + 5, y + 5, G.cw - 10, th, on && Game.time - this.demoT < 1.2);
      if (st === 'locked' && !c.paid) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x + 5, y + 5, G.cw - 10, th); }
      ctx.restore();
      if (it.tag) {   // 稀有／限定：左上角的金邊朱漆小牌（會微微發亮）
        const tt = tr(it.tag); ctx.font = `15px ${FONT}`; const tw2 = ctx.measureText(tt).width + 18;
        ctx.save(); ctx.shadowColor = 'rgba(255,210,63,' + (0.5 + 0.4 * Math.sin(Game.time * 3 + i)) + ')'; ctx.shadowBlur = 10;
        UI.panel(x + 9, y + 9, tw2, 24, 12, '#b8261a', '#ffd23f'); ctx.restore();
        UI.text(tt, x + 9 + tw2 / 2, y + 22, 15, { fill: '#fff6c8', stroke: null, raw: true });
      }
      UI.text(it.name, x + G.cw / 2, y + th + (G.ch - th) / 2 + 2, LAND ? 21 : 16, { fill: on ? '#ffd23f' : '#fff', stroke: null, maxW: G.cw - 14 });
      // 狀態徽章：套用中 ✓（綠）／未擁有：價格（遊戲幣 = 深藍底黃字；付費 = 朱漆底白字）
      if (st === 'on' || (st === 'owned' && c.paid && Shop.paid(it.vol) && Shop.enabled())) {
        ctx.fillStyle = '#2fc46a'; ctx.beginPath(); ctx.arc(x + G.cw - 14, y + 14, 13, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
        UI.text('✓', x + G.cw - 14, y + 15, 16, { stroke: null, raw: true });
      } else if (st === 'locked') {
        // 付費：左上角的朱漆價格牌；遊戲幣：縮圖正中央
        const txt = c.badge ? c.badge(it) : String(it.price);   // 遊戲幣：硬幣圖示＋價格
        ctx.font = `17px ${FONT}`; const bw = Math.max(c.paid ? 70 : 92, ctx.measureText(txt).width + (c.paid ? 24 : 46));
        const bx = c.paid ? x + 12 : x + G.cw / 2 - bw / 2, by = c.paid ? y + 12 : y + 5 + th / 2 - 14;
        UI.panel(bx, by, bw, 28, 14, c.paid ? '#b8261a' : 'rgba(16,22,52,.9)', c.paid ? '#ffd23f' : '#fff27a');
        if (c.paid) UI.text(txt, bx + bw / 2, by + 15, 17, { fill: '#fff', stroke: null, raw: true });
        else coinText(txt, bx + bw / 2, by + 14, 17, { align: 'center' });
      }
      if (Input.taps.some(t => UI.inside(t.x, t.y, x, Math.max(y, G.y), G.cw, Math.min(y + G.ch, G.y + viewH) - Math.max(y, G.y)))) this.pick(i);
    });
    ctx.restore();
    // 捲軸（有超過一頁時）
    const max = this.maxScroll();
    // 上下還有東西時：邊緣淡出；下面還有 → 跳動的 ▼「還有 N 件」
    if (max > 0) {
      const fh = Math.min(70, G.ch * 0.45), top = this.scroll > 4, more = this.scroll < max - 4;
      const fade = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(10,12,30,0)'); g.addColorStop(1, 'rgba(10,12,30,.85)'); ctx.fillStyle = g; ctx.fillRect(G.x - 6, Math.min(y0, y1), gw + 12, Math.abs(y1 - y0)); };
      if (top) fade(G.y + fh * 0.6, G.y - 6);
      if (more) {
        fade(G.y + viewH - fh, G.y + viewH + 6);
        const lastRow = Math.floor((this.scroll + viewH + G.gap + G.ch * 0.3) / (G.ch + G.gap)), left = Math.max(0, list.length - lastRow * G.cols);
        const bob = Math.sin(Game.time * 5) * 4, cy = G.y + viewH - 16 + bob;
        const txt = left > 0 ? '▼ ' + tr('還有 {0} 件', left) + ' ▼' : '▼', fs = LAND ? 20 : 17;
        ctx.font = `${fs}px ${FONT}`; const pw = ctx.measureText(txt).width + 28;
        UI.panel(G.x + gw / 2 - pw / 2, cy - 16, pw, 32, 16, 'rgba(16,22,52,.92)', '#ffd23f');
        UI.text(txt, G.x + gw / 2, cy + 1, fs, { fill: '#ffd23f', stroke: null, raw: true });
      }
    }
    if (max > 0) {
      const sx = G.x + gw + 4, bh = viewH * viewH / (viewH + max), by = G.y + (viewH - bh) * (this.scroll / max);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(sx, G.y, 5, viewH, 3); ctx.fill();
      ctx.fillStyle = '#ffd23f'; rrect(sx, by, 5, bh, 3); ctx.fill();
    }
  },
  // 說明區：名稱、說明、狀態（＋種類的額外按鈕：打擊音效「♪ 試聽」、追加樂曲「恢復購買」）
  drawDetail() {
    const [x, y, w, h] = this.L.detail, c = this.C(), it = this.item(), st = this.state(c, it), ex = c.extra && c.extra();
    ctx.font = `${LAND ? 22 : 20}px ${FONT}`;
    const bw = ex ? Math.max(LAND ? 150 : 130, ctx.measureText(tr(ex.label)).width + 40) : 0, tw = w - bw - (ex ? 16 : 0);
    UI.text(it.name, x, y + (LAND ? 22 : 18), LAND ? 32 : 28, { align: 'left', fill: '#ffd23f', maxW: LAND ? tw : tw - 140 });
    const desc = c.desc ? c.desc(it) : it.desc;
    if (LAND) UI.wrap(desc, x, y + 62, tw, 26, 19, { fill: '#cfd8ff' });
    else UI.text(desc, x, y + 50, 17, { align: 'left', fill: '#cfd8ff', stroke: null, maxW: tw });
    const status = c.status ? c.status(it, st) : st === 'on' ? '✓ 套用中' : st === 'owned' ? '已擁有' : tr('{0} 遊戲幣', it.price);
    const sOpt = { fill: st === 'on' ? '#8dff8a' : st === 'owned' ? (c.paid ? '#8dff8a' : '#fff') : '#fff27a', stroke: null, raw: !!c.status || st === 'locked' };
    if (!c.status && st === 'locked') {   // 遊戲幣價格：硬幣圖示＋數字
      if (LAND) coinText(it.price, x, y + h - 6, 20); else coinText(it.price, x + tw, y + 20, 18, { align: 'right' });
    }
    else if (LAND) UI.text(status, x, y + h - 6, 20, Object.assign({ align: 'left' }, sOpt));
    else UI.text(status, x + tw, y + 20, 18, Object.assign({ align: 'right' }, sOpt));   // 手機：名稱那一行的右邊
    if (ex) {
      const bx = x + w - bw, by = y + (LAND ? 4 : 6), bh = LAND ? 48 : 44;
      UI.panel(bx, by, bw, bh, bh / 2, c.paid ? 'rgba(255,255,255,.14)' : '#2a6fd6', '#fff');
      UI.text(ex.label, bx + bw / 2, by + bh / 2 + 1, LAND ? 22 : 20, { stroke: c.paid ? null : '#0c2c63', sw: 4, maxW: bw - 16 });
      if (UI.tapIn(bx - 6, by - 6, bw + 12, bh + 12)) ex.run();
    }
  },
  // 追加樂曲：上方的曲目面板（10 首：編號、曲名、曲風、星級）；點一首或 ↑↓ 試聽
  drawVol(it) {
    const [x, y, w, h] = this.L.vol, owned = Shop.owned(it.vol), n = it.songs.length;
    UI.panel(x, y, w, h, 26, 'rgba(16,22,52,.92)', '#ffd23f');
    if (!owned) drawLock(x + 58, y + 56, 1.2);
    UI.text(it.name, x + (owned ? 34 : 98), y + 56, LAND ? 52 : 44, { align: 'left', fill: '#ffd23f', raw: true, sw: 8 });
    UI.text(tr('追加樂曲 {0} 首', n), x + (owned ? 34 : 98) + (LAND ? 210 : 176), y + 60, LAND ? 24 : 20, { align: 'left', fill: '#ffe8b0', stroke: null, raw: true });
    if (Shop.isTest()) { UI.panel(x + w - 120, y + 34, 96, 38, 19, '#c8321e', '#fff'); UI.text('TEST', x + w - 72, y + 54, 20, { fill: '#fff', stroke: null, raw: true }); }
    ctx.fillStyle = 'rgba(232,182,74,.5)'; ctx.fillRect(x + 24, y + 100, w - 48, 2);
    // 曲數超過 10 首：分兩欄（每欄一半），字級縮小；星星改小
    const cols = n > 10 ? 2 : 1, per = Math.ceil(n / cols), cw = (w - 32) / cols, top = y + 112, rh = (h - 112 - 56) / per, two = cols > 1;
    it.songs.forEach((s, k) => {
      const cx0 = x + 16 + Math.floor(k / per) * cw, ry = top + (k % per) * rh, cy = ry + rh / 2, on = k === this.vs;
      if (on) { ctx.fillStyle = 'rgba(255,210,63,.16)'; rrect(cx0, ry + 2, cw - 4, rh - 4, 10); ctx.fill(); }
      const dr = LAND ? (two ? 15 : 18) : (two ? 12 : 15);
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(cx0 + 30, cy, dr, 0, 7); ctx.fill();
      UI.text(String(s.no), cx0 + 30, cy + 1, dr, { fill: '#fff', stroke: '#3e2210', sw: 3, raw: true });
      const nx = cx0 + 30 + dr + 10, starW = two ? (LAND ? 90 : 60) : (LAND ? 130 : 100), tw = cw - (nx - cx0) - starW - 14;
      const fs = two ? (LAND ? 21 : 16) : (LAND ? 26 : 21), ss = two ? (LAND ? 13 : 11) : (LAND ? 16 : 13), gap = two ? (LAND ? 11 : 8) : (LAND ? 13 : 11);
      UI.text((on ? '♪ ' : '') + songName(s), nx, cy - gap, fs, { align: 'left', fill: on ? '#ffd23f' : '#fff', stroke: null, raw: true, maxW: tw });
      UI.text(songSub(s), nx, cy + gap + 2, ss, { align: 'left', fill: '#9fb0e0', stroke: null, raw: true, maxW: tw });
      drawStars(cx0 + cw - 10 - starW / 2, cy, s.stars, two ? (LAND ? 15 : 11) : (LAND ? 22 : 17));
      if (UI.tapIn(cx0, ry, cw, rh)) this.setVs(k);
    });
    UI.text(owned ? tr('已擁有：按「前往選曲」就能玩') : tr('點曲目就可以試聽'), x + w / 2, y + h - 28, LAND ? 20 : 17, { fill: '#cfd8ff', stroke: null, raw: true, maxW: w - 60 });
  },
  frame() {
    // 付款 / 恢復購買進行中：這一幀的操作全部忽略（畫面照畫，最後蓋上「處理中…」）
    if (Shop.busy) { Input.taps.length = 0; Input.pressed.clear(); Input.swipe = null; }
    // 購買確認框開著：底下的商店不吃這一幀的操作，交給 drawAsk
    let inp = null;
    if (this.ask) { inp = { taps: Input.taps.slice(), pressed: new Set(Input.pressed) }; Input.taps.length = 0; Input.pressed.clear(); Input.swipe = null; Input.ptr.moved = false; }
    menuBackdrop(0);
    const c = this.C(), N = c.list.length, it = this.item(), G = this.grid(), st = this.state(c, it), ex = c.extra && c.extra();
    // 左上：商店名牌；右上：遊戲幣（COIN_SHOP 打開才顯示；追加樂曲的曲目面板蓋住時不顯示）
    const tx = lay(18, 36);
    if (c.kind !== 'vol' || LAND) {   // 手機的追加樂曲：曲目面板蓋住名牌的位置
      UI.panel(tx, 18, 200, 64, 32, 'rgba(16,22,52,.88)', '#e8b64a');
      UI.text('商店', tx + 100, 51, 32, { fill: '#ffd23f' });
    }
    if (COIN_SHOP && !c.paid) {
      coinPill(W - tx, 18, 64, 28);
    }
    if (c.overlay) c.overlay(it);
    const [sx, sy, sw, sh] = this.L.sheet;
    UI.panel(sx, sy, sw, sh, 26, 'rgba(16,22,52,.9)', '#e8b64a');
    this.drawTabs(); this.drawGrid(); this.drawDetail();
    // 鍵盤 / 手把：← → ↑ ↓ 在格子裡移動（追加樂曲：↑↓ 選曲目試聽）、Q E（LB RB）換分頁、ENTER 決定、X 額外按鈕、ESC 返回；手機：左右滑動換分頁
    const i = this.sel[this.cat] || 0;
    if (Input.was('left') || Input.was('right') || Input.was('up') || Input.was('down')) this.btn.sel = -1;
    if (Input.was('left')) this.pick(i - 1);
    if (Input.was('right')) this.pick(i + 1);
    if (c.kind === 'vol') {
      if (Input.was('up')) this.setVs(this.vs - 1);
      if (Input.was('down')) this.setVs(this.vs + 1);
    } else {
      if (Input.was('up')) this.pick(i - G.cols);
      if (Input.was('down')) this.pick(Math.min(N - 1, i + G.cols));
    }
    if (Input.was('diffPrev') || (Input.swipe === 'right' && UI.inside(Input.ptr.x, Input.ptr.y, sx, sy, sw, sh))) this.setCat(this.cat - 1);
    if (Input.was('diffNext') || (Input.swipe === 'left' && UI.inside(Input.ptr.x, Input.ptr.y, sx, sy, sw, sh))) this.setCat(this.cat + 1);
    if (ex && Input.was('listen')) ex.run();
    // 按鈕：手機 = 木牌（套用／購買、返回）；PC = 右下角按鍵提示鈕
    const label = c.label ? c.label(st) : st === 'on' ? '套用中' : st === 'owned' ? '套用' : '購買';
    if (LAND) {
      const pad = Input.padConnected, xr = sx + sw - 20;
      if (UI.prompt(xr, this.L.btnY, pad ? 'A' : 'ENTER', label, { hot: st !== 'on' })) this.act(it);
      if (ex && UI.prompt(UI.promptX - 14, this.L.btnY, 'X', ex.key || ex.label)) ex.run();
      if (UI.prompt(UI.promptX - 14, this.L.btnY, pad ? 'B' : 'ESC', '返回', { back: true }) || Input.was('back')) this.back();
      if (Input.was('confirm')) this.act(it);
    } else {
      UI.begin(this.btn);
      const by = this.L.btnY;
      if (UI.button(this.btn, label, W / 2 - 250, by, 240, 64, { lacquer: st !== 'on', size: 30 })) this.act(it);
      if (UI.button(this.btn, '返回', W / 2 + 10, by, 240, 64, { back: true }) || Input.was('back')) this.back();
      if (Input.was('confirm') && this.btn.sel === -1) this.act(it);   // 滑鼠停在按鈕上時交給按鈕
    }
    if (this.toast && Game.time - this.toast.t < 2) {
      const a = clamp(2 - (Game.time - this.toast.t), 0, 1), cx = sx + sw / 2, ty = G.y + (G.rows * (G.ch + G.gap)) / 2;
      ctx.save(); ctx.globalAlpha = a; UI.panel(cx - 200, ty - 28, 400, 56, 28, 'rgba(16,22,52,.96)', '#8dff8a');
      UI.text(this.toast.text, cx, ty + 1, 24, { fill: '#fff', stroke: null, raw: true, maxW: 370 }); ctx.restore();
    }
    UI.hint(c.kind === 'vol' ? (ex ? '← → 選擇　↑↓ 試聽曲目　Q E 分頁　X 恢復購買　ENTER 決定' : '← → 選擇　↑↓ 試聽曲目　Q E 分頁　ENTER 決定')
      : c.kind === 'hit' ? '方向鍵 選擇　Q E 分頁　X 試聽　ENTER 套用' : '方向鍵 選擇　Q E 分頁　ENTER 套用');
    if (inp) this.drawAsk(inp);
    if (Shop.busy) { UI.dim(0.55); UI.text('處理中…', W / 2, H / 2, 44, { fill: '#fff', sw: 8 }); }
  }
};

// ---------- 選擇樂曲 ----------
// 卡片：編號、歌名、副標・風格、BPM、星級、HISCORE；選中的卡片會試聽（停留 0.3 秒才開始，快速捲動不會一直重播）
Screens.songs = {
  sel: 0, previewIdx: -1, previewT: 0, bs: { sel: -1, n: 0 },
  CARD: lay({ x: 40, y0: 246, w: 640, h: 130, gap: 10 }, { x: 100, y0: 226, w: 840, h: 126, gap: 10 }),   // 上方留給難度切換列
  SLOTS: 5,   // 同時看得到 5 張卡；選中的那首固定在正中間（轉盤），清單上下捲動
  pos: 0, dragFrom: null,
  vol() { return SONGS[this.sel].vol; },
  row() { return SONGS[this.sel].no - 1; },                       // 這一組裡的第幾首（0 起算）
  idxOf(vol, row) { return SONGS.findIndex(s => s.vol === vol && s.no === row + 1); },
  setVol(v) {   // ← →：切換內建曲目 / VOL.1 / VOL.2…（停在同樣的編號）
    const N = VOL_ORDER.length, nv = ((v % N) + N) % N;
    if (nv === this.vol()) return;
    this.sel = this.idxOf(nv, Math.min(this.row(), volSize(nv) - 1)); this.previewT = 0.3; this.bs.sel = -1;   // 組的曲數不同：超過就停在最後一首
    this.volT = 0; this.volDir = v > this.vol() ? 1 : -1;
    Sound.play('select');
  },
  enter() {
    const i = SONGS.findIndex(s => s.id === Save.data.lastSong);
    this.sel = i >= 0 ? i : 0; this.previewIdx = -1; this.bs.sel = -1; this.pos = this.row(); this.dragFrom = null; this.volT = 1; this.picker = null;
    chef.idlePose = 'wave'; Sound.init(); Sound.duck(false);
    // 選曲語音；試聽等語音講完（約 1.1 秒）再開始，不會蓋過去
    Sound.stopBgm(); Sound.playVoice('selectSong', A.ui, A.ctx && A.ctx.currentTime + 0.25);
    this.previewT = 1.3;
  },
  select(i) { if (i !== this.sel) { this.sel = i; this.previewT = 0.3; Sound.play('select'); } },
  // 切換難度（不循環：在簡單再往左、在困難再往右不動）
  setDiff(d) { d = clamp(d, 0, DIFFS.length - 1); if (d === curDiff()) return; Save.data.diff = d; Save.store(); Sound.play('select'); },
  selectRow(r) { this.select(this.idxOf(this.vol(), clamp(r, 0, volSize(this.vol()) - 1))); },
  // 開始遊戲；這首所在的 VOL 還沒買 → 改成購買
  start() {
    const song = SONGS[this.sel];
    if (!Shop.songOwned(song)) return this.purchase(song.vol);
    Sound.play('confirm'); App.goto('game', { song });
  },
  purchase(vol) {
    if (Shop.busy) return;
    Sound.play('confirm');
    Shop.buy(vol).then(r => {
      if (r === 'ok') { if (A.ctx) SND.fanfare(A.ctx.currentTime + 0.05); this.say(tr('已解鎖 {0}！', volName(vol))); }
      else this.say(tr(r === 'cancel' ? '已取消購買' : '購買失敗，請稍後再試'));
    });
  },
  restore() {
    if (Shop.busy) return;
    Sound.play('confirm');
    Shop.restore().then(n => this.say(tr(n < 0 ? '恢復購買失敗' : n > 0 ? '已恢復購買' : '沒有可恢復的購買')));
  },
  say(text) { this.msg = { text, t: Game.time }; },
  // ---- 樂曲組選單（點 VOL 列 / X 鍵 / 手把 X 打開）：全部的組一次列出來，直接跳到任一組（組再多也不用一直左右切） ----
  openPicker() { this.picker = { sel: this.vol(), scroll: 0 }; Sound.play('confirm'); },
  closePicker() { this.picker = null; Sound.play('back'); },
  pickVol(v) { this.picker = null; if (v !== this.vol()) this.setVol(v); else Sound.play('select'); },
  drawPicker(dt) {
    const P = this.picker, N = VOL_ORDER.length, cols = lay(2, 4);
    // 面板高度跟著組數（最多到 maxH，再多就捲動）；畫面置中
    const [px, pw, maxH] = lay([36, 648, 900], [420, 1080, 820]), gap = 18, ch = lay(200, 250), rows = Math.ceil(N / cols);
    const ph = Math.min(maxH, 96 + rows * (ch + gap) - gap + 90), py = (H - ph) / 2;
    const cw = (pw - 60 - gap * (cols - 1)) / cols, gy = py + 96, viewH = ph - 96 - 90;
    UI.dim(0.6);
    UI.panel(px, py, pw, ph, 28, 'rgba(16,22,52,.96)', '#ffd23f');
    UI.text('選擇樂曲組', px + pw / 2, py + 50, 34, { fill: '#ffd23f', sw: 7 });
    // 右上角 ✕
    UI.text('✕', px + pw - 44, py + 46, 30, { fill: '#fff', stroke: null, raw: true });
    if (UI.tapIn(px + pw - 84, py + 10, 76, 72)) return this.closePicker();
    // 鍵盤 / 手把：方向鍵移動、ENTER / A 決定、ESC / B / X 關閉
    if (Input.was('left')) P.sel = Math.max(0, P.sel - 1);
    if (Input.was('right')) P.sel = Math.min(N - 1, P.sel + 1);
    if (Input.was('up')) P.sel = Math.max(0, P.sel - cols);
    if (Input.was('down')) P.sel = Math.min(N - 1, P.sel + cols);
    if (['left', 'right', 'up', 'down'].some(k => Input.was(k))) Sound.play('select');
    // 選中的那張捲進畫面（組多到一頁放不下時）
    const top = Math.floor(P.sel / cols) * (ch + gap);
    if (top < P.scroll) P.scroll = top; else if (top + ch > P.scroll + viewH) P.scroll = top + ch - viewH;
    let picked = -1;
    ctx.save(); ctx.beginPath(); ctx.rect(px + 10, gy - 8, pw - 20, viewH + 16); ctx.clip();
    for (let v = 0; v < N; v++) {
      const x = px + 30 + (v % cols) * (cw + gap), y = gy + Math.floor(v / cols) * (ch + gap) - P.scroll;
      if (y > gy + viewH || y + ch < gy) continue;
      const songs = SONGS.filter(s => s.vol === v), owned = Shop.owned(v), cur = v === this.vol(), on = v === P.sel, col = VOL_COLORS[v] || '#c8321e';
      const cleared = songs.filter(s => Save.data.medals[recId(s)]).length;
      UI.panel(x, y, cw, ch, 18, on ? 'rgba(255,190,60,.25)' : 'rgba(255,255,255,.07)', on ? '#ffd23f' : 'rgba(255,255,255,.25)');
      // 上半：代表色＋名稱＋10 首的顏色點
      const th = ch * 0.56;
      ctx.save(); rrect(x + 6, y + 6, cw - 12, th, 12); ctx.clip();
      const g = ctx.createLinearGradient(0, y, 0, y + th); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = col; ctx.fillRect(x + 6, y + 6, cw - 12, th); ctx.fillStyle = g; ctx.fillRect(x + 6, y + 6, cw - 12, th);
      ctx.restore();
      UI.text(volName(v), x + cw / 2, y + 6 + th * 0.42, lay(34, 36), { fill: '#fff', stroke: 'rgba(0,0,0,.45)', sw: 6, raw: true, maxW: cw - 30 });
      const dr = Math.min(7, (cw - 40) / (songs.length * 2.4 + 2));   // 點的大小跟著曲數
      songs.forEach((s, k) => { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(x + cw / 2 + (k - (songs.length - 1) / 2) * dr * 2.4, y + 6 + th * 0.8, dr, 0, 7); ctx.fill(); });
      if (cur) { UI.panel(x + 14, y + 14, 70, 28, 14, '#2fc46a', '#fff'); UI.text('目前', x + 49, y + 29, 16, { stroke: null }); }
      if (!owned) drawLock(x + cw - 30, y + 34, 0.6);
      // 下半：過關數（這個難度拿過獎章的歌）／沒買的顯示價格
      const ly = y + th + (ch - th) / 2 + 4;
      if (owned) UI.text(tr('已過關 {0}/{1}', cleared, songs.length), x + cw / 2, ly, lay(20, 22), { fill: on ? '#ffd23f' : '#fff', stroke: null, raw: true, maxW: cw - 20 });
      else UI.text(Shop.price(v) || tr('追加樂曲 {0} 首', songs.length), x + cw / 2, ly, lay(20, 22), { fill: '#fff27a', stroke: null, raw: true, maxW: cw - 20 });
      if (picked < 0 && Input.taps.some(t => UI.inside(t.x, t.y, x, Math.max(y, gy), cw, Math.min(y + ch, gy + viewH) - Math.max(y, gy)))) picked = v;
    }
    ctx.restore();   // 一定要先還原裁切（之前在迴圈裡直接 return，裁切沒還原 → 之後整個選曲畫面只畫在這個框裡）
    if (picked >= 0) return this.pickVol(picked);
    UI.text(Input.touchMode ? '點一組切換・點外面關閉' : Input.padConnected ? '十字鍵 選擇　A 決定　B 關閉' : '方向鍵 選擇　ENTER 決定　ESC 關閉', px + pw / 2, py + ph - 44, 18, { fill: '#cfd8ff', stroke: null });
    if (Input.was('confirm')) return this.pickVol(P.sel);
    if (Input.was('back') || Input.was('listen')) return this.closePicker();
    if (Input.taps.some(t => !UI.inside(t.x, t.y, px, py, pw, ph))) this.closePicker();   // 點面板外面關閉
  },
  frame(dt) {
    // 付款 / 恢復購買進行中：這一幀的操作全部忽略（畫面照畫，最後蓋上「處理中…」）
    if (Shop.busy) { Input.taps.length = 0; Input.pressed.clear(); Input.swipe = null; }
    // 樂曲組選單打開時：這一幀的操作只給選單（先收起來，畫完選曲畫面再還給選單）
    let held = null;
    if (this.picker) { held = { taps: Input.taps.splice(0), pressed: new Set(Input.pressed), swipe: Input.swipe }; Input.pressed.clear(); Input.swipe = null; }
    menuBackdrop(0.66);
    UI.header('選擇樂曲', 'SELECT SONG');
    if (this.previewIdx !== this.sel) {
      this.previewT -= dt;
      if (this.previewT <= 0) { this.previewIdx = this.sel; const s = SONGS[this.sel]; Sound.startBgm(s, Math.min(2, s.sections.length - 1)); }
    }
    const C = this.CARD, slot = C.h + C.gap, top = C.y0, bottom = C.y0 + this.SLOTS * slot - C.gap;
    // ---- 難度切換列（簡單｜普通｜困難）：點選、鍵盤 Q／E、手把 LB／RB；卡片的星級、HISCORE、獎章跟著換 ----
    { const TY = lay(186, 172), th = 46, tw = (C.w - 16) / DIFFS.length, cd = curDiff();
      DIFFS.forEach((D, d) => {
        const tx = C.x + d * (tw + 8), on = d === cd;
        UI.panel(tx, TY, tw, th, th / 2, on ? D.color : 'rgba(16,22,52,.82)', on ? '#fff' : 'rgba(255,255,255,.35)');
        UI.text(D.name, tx + tw / 2, TY + th / 2 + 1, 24, { fill: on ? '#fff' : '#cfd8ff', stroke: on ? 'rgba(0,0,0,.35)' : null, sw: 5 });
        if (UI.tapIn(tx, TY, tw, th)) this.setDiff(d);
      });
      if (Input.was('diffPrev')) this.setDiff(cd - 1);
      if (Input.was('diffNext')) this.setDiff(cd + 1); }
    const inList = (x, y) => UI.inside(x, y, C.x, top, C.w, bottom - top);
    // ---- 手指上下拖曳：清單跟著手指轉，放開時對齊最近的一首（甩得快會多轉幾首） ----
    const drag = this.picker ? null : Input.dragY();
    if (drag && inList(drag.x, drag.y)) {
      if (this.dragFrom === null) this.dragFrom = this.pos;
      this.pos = clamp(this.dragFrom - drag.dy / slot, -0.45, volSize(this.vol()) - 0.55);
      this.bs.sel = -1;
    }
    const de = Input.dragEnd;
    if (de && this.dragFrom !== null) {
      const v = de.dy / de.ms;   // px / ms（往上甩為負）
      this.selectRow(Math.round(this.dragFrom - de.dy / slot - clamp(v * 160 / slot, -4, 4)));   // 甩動最多多轉 4 首
      this.dragFrom = null;
    } else if (!drag) this.dragFrom = null;
    if (this.dragFrom === null) this.pos += (this.row() - this.pos) * Math.min(1, dt * 14);   // 平滑轉到選中的那首
    // ---- 卡片：選中的盡量在正中間；到頭尾時清單不留空白（選中的卡移到上下緣） ----
    const view = clamp(this.pos - 2, 0, volSize(this.vol()) - this.SLOTS);
    const vol = this.vol(), list = SONGS.filter(s => s.vol === vol);
    this.volT = Math.min(1, (this.volT === undefined ? 1 : this.volT) + dt / 0.25);
    // 切換 VOL 時整排從側邊滑進來；手指左右拖曳時清單跟著手指橫移
    const slide = (1 - ease(this.volT)) * (this.volDir || 1) * 120 + Input.dragX() * 0.5;
    ctx.save(); ctx.beginPath(); ctx.rect(C.x - 30, top - 14, C.w + 60, bottom - top + 28); ctx.clip();
    list.forEach((song, r) => {
      const d = r - this.pos, y = top + (r - view) * slot;
      if (y < top - C.h || y > bottom) return;
      const i = SONGS.indexOf(song), on = i === this.sel && this.bs.sel !== 2 && Math.abs(d) < 0.5;   // 焦點在「新手教學」時，曲目卡不亮
      for (const t of Input.taps) if (UI.inside(t.x, t.y, C.x, y, C.w, C.h) && inList(t.x, t.y)) {
        if (i === this.sel && this.bs.sel !== 2) this.start(); else { this.bs.sel = -1; this.select(i); }
      }
      ctx.save(); ctx.globalAlpha *= clamp(1.15 - Math.abs(d) * 0.14, 0.55, 1) * (0.4 + 0.6 * ease(this.volT)); ctx.translate(slide, 0);
      this.card(song, i, C.x, y, C.w, C.h, on);
      ctx.restore();
    });
    ctx.restore();
    // 上下還有歌的提示箭頭
    const bob = Math.sin(Game.time * 4) * 4;
    if (view > 0.05) UI.text('▲', C.x + C.w / 2, top - 4 + bob, 22, { fill: '#ffd23f' });
    if (view < volSize(this.vol()) - this.SLOTS - 0.05) UI.text('▼', C.x + C.w / 2, bottom + 6 - bob, 22, { fill: '#ffd23f' });
    // ---- 樂曲組切換列：◀ 內建曲目 ▼ ●○○○ ▶（左右鍵 / 點箭頭：上一組・下一組；點名稱 / X 鍵：打開樂曲組選單） ----
    const py = lay(978, 944), cx = C.x + C.w / 2, NV = VOL_ORDER.length;
    // 做成按鈕的樣子：底下有影子、滑鼠移上去變亮、金色外框慢慢呼吸、右邊紅色圓鈕「▼」；按下時往下沉一點
    { const bx = cx - 160, bw = 320, bh = 52, hover = !this.picker && UI.inside(Input.ptr.x, Input.ptr.y, bx, py - 26, bw, bh);
      const sink = Game.time - (this.barT || -9) < 0.12 ? 3 : 0, by = py - 26 + sink;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(bx + 2, py - 26 + 6, bw, bh, 26); ctx.fill();
      UI.wood(bx, by, bw, bh, { r: 26, seed: 'page-bar', light: hover });
      ctx.save(); ctx.globalAlpha *= 0.55 + 0.35 * Math.sin(Game.time * 2.6) ** 2; ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; rrect(bx, by, bw, bh, 26); ctx.stroke(); ctx.restore();
      const yy = py + sink;
      UI.text(volName(vol), cx - 46, yy + 1, 26, { fill: '#3a1d0a', stroke: null, raw: true, maxW: 150 });
      if (!Shop.owned(vol)) drawLock(cx - 132, yy, 0.62);
      const ds = Math.min(18, 76 / Math.max(1, NV - 1)), dr = Math.min(6, ds * 0.4);   // 組數多時圓點縮小、靠緊（不壓到右邊的 ▼ 鈕）
      for (let v = 0; v < NV; v++) { ctx.fillStyle = v === vol ? '#c43a1a' : 'rgba(58,29,10,.35)'; ctx.beginPath(); ctx.arc(cx + 34 + v * ds, yy, dr, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#c43a1a'; ctx.beginPath(); ctx.arc(cx + 130, yy, 17, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff3d8'; ctx.lineWidth = 2.5; ctx.stroke();
      UI.text('▼', cx + 130, yy + 2, 16, { fill: '#fff', stroke: null, raw: true }); }
    const locked = !Shop.owned(vol);
    UI.text('◀', cx - 200, py, 40, { fill: '#ffd23f' }); UI.text('▶', cx + 200, py, 40, { fill: '#ffd23f' });
    // 手機：左右滑動切換 VOL（手指往左 = 下一集）
    if (Input.swipe === 'left') this.setVol(vol + 1);
    if (Input.swipe === 'right') this.setVol(vol - 1);
    if (Input.was('left') || UI.tapIn(cx - 250, py - 40, 88, 80)) this.setVol(vol - 1);   // 箭頭的點擊範圍不和中間的按鈕重疊
    if (Input.was('right') || UI.tapIn(cx + 162, py - 40, 88, 80)) this.setVol(vol + 1);
    if (UI.tapIn(cx - 160, py - 26, 320, 52) || Input.was('listen')) { this.barT = Game.time; this.openPicker(); }
    // 鍵盤 / 手把 / 滑鼠滾輪：↑↓ 一首一首選（第 1 首再按 ↑ → 焦點移到右上角的「新手教學」，↓ 回到曲目）；T 鍵 / 手把 Y 直接開教學
    const TUT = 2;
    if (Input.was('up')) {
      if (this.bs.sel === TUT) { /* 已在最上面 */ }
      else if (this.row() === 0) { if (!Input.wheel) { this.bs.sel = TUT; Sound.play('select'); } }
      else { this.bs.sel = -1; this.selectRow(this.row() - 1); }
    }
    if (Input.was('down')) {
      if (this.bs.sel === TUT) { this.bs.sel = -1; Sound.play('select'); }
      else if (this.row() < volSize(this.vol()) - 1) { this.bs.sel = -1; this.selectRow(this.row() + 1); }
    }
    if (Input.was('tutorial')) { Sound.play('confirm'); App.goto('tutorial', { from: 'songs' }); }
    if (Input.was('confirm') && (this.bs.sel === -1 || this.bs.sel === 1)) this.start();   // 滑鼠停在「返回」「新手教學」上時不開始
    if (LAND) { if (locked) this.buyPanel(vol, list); else this.detail(SONGS[this.sel]); }
    UI.begin(this.bs);
    const B = lay({ bx: 50, by: 1040, bw: 210, bh: 76, sx: 280, sy: 1034, sw: 390, sh: 86 }, { bx: 1000, by: 924, bw: 230, bh: 84, sx: 1250, sy: 918, sw: 570, sh: 96 });
    if (LAND) {
      // PC 版：不放大木牌，改成右下角的按鍵提示鈕（ENTER / ESC，接手把時顯示 A / B；滑鼠也能點）
      const pad = Input.padConnected;
      if (UI.prompt(B.sx + B.sw, 944, pad ? 'A' : 'ENTER', locked ? '購買' : '開始遊戲', { hot: true })) this.start();
      if (UI.prompt(UI.promptX - 18, 944, pad ? 'B' : 'ESC', '返回', { back: true }) || Input.was('back')) App.goto('menu');
      this.bs.n = 2;   // 保留按鈕編號：新手教學一樣是第 2 個（↑ 移過去的焦點）
    } else {
      if (UI.button(this.bs, '返回', B.bx, B.by, B.bw, B.bh, { back: true }) || Input.was('back')) App.goto('menu');
      // 沒買的 VOL：「開始遊戲」變成「購買 VOL.n」（副標是價格），下面多一顆「恢復購買」
      if (UI.button(this.bs, locked ? tr('購買 {0}', volName(vol)) : '開始遊戲', B.sx, B.sy, B.sw, B.sh, { lacquer: true, sub: locked ? Shop.price(vol) : 'sub.start', size: lay(36, 42) })) this.start();
      if (locked) this.restoreBtn(W / 2 - 110, 1136, 220, 46);
    }
    // 右上角：掛在竹竿上的「新手教學」木札（和主選單同款）；燈火光暈＋每隔一陣子晃一下，提示可以按
    const T = lay({ x: 590, y: 40, w: 116, h: 82 }, { x: W - 170, y: 44, w: 130, h: 90 }), pulse = 0.5 + 0.5 * Math.sin(Game.time * 3.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = this.bs.sel === 2 ? 0.75 + pulse * 0.25 : 0.25 + pulse * 0.35;   // 被選到時光暈更亮
    ctx.drawImage(Scene.glowSprite('#ffb04a'), T.x - 34, T.y - 30, T.w + 68, T.h + 64); ctx.restore();
    UI.pole(T.x - 16, 20, T.w + 30);
    if (UI.button(this.bs, '新手教學', T.x, T.y, T.w, T.h, { tag: true, sub: 'sub.tutorial', size: 22, ropeH: 20, wiggle: true })) App.goto('tutorial', { from: 'songs' });
    UI.hint(Input.touchMode ? '上下滑動選曲・點中間的歌開始・點樂曲組名稱切換' : Input.padConnected ? '↑↓ 選曲　← → 切換　X 樂曲組　LB／RB 難度　A 開始　Y 教學　B 返回' : '↑↓ 選曲　← → 切換　X 樂曲組　Q／E 難度　ENTER 開始　T 教學');
    // 購買結果的訊息（3 秒後淡出）
    if (this.msg && Game.time - this.msg.t < 3) {
      const a = clamp(3 - (Game.time - this.msg.t), 0, 1), ty = lay(600, 540);
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = `30px ${FONT}`; const mw = Math.min(W - 80, ctx.measureText(this.msg.text).width + 80);
      UI.panel(W / 2 - mw / 2, ty - 38, mw, 76, 38, 'rgba(16,22,52,.94)', '#ffd23f');
      UI.text(this.msg.text, W / 2, ty + 1, 30, { fill: '#fff', stroke: null, raw: true, maxW: mw - 40 });
      ctx.restore();
    }
    if (held) { Input.taps.push(...held.taps); held.pressed.forEach(k => Input.pressed.add(k)); Input.swipe = held.swipe; this.drawPicker(dt); }
    if (Shop.busy) { UI.dim(0.55); UI.text('處理中…', W / 2, H / 2, 44, { fill: '#fff', sw: 8 }); }
  },
  // 「恢復購買」小按鈕（換手機、重裝後找回已買的 VOL；App Store 規定一定要有）
  restoreBtn(x, y, w, h) {
    const hover = UI.inside(Input.ptr.x, Input.ptr.y, x, y, w, h);
    UI.panel(x, y, w, h, h / 2, hover ? 'rgba(255,190,60,.35)' : 'rgba(16,22,52,.85)', 'rgba(255,255,255,.55)');
    UI.text('恢復購買', x + w / 2, y + h / 2 + 1, 20, { fill: '#fff', stroke: null, maxW: w - 20 });
    if (UI.tapIn(x, y, w, h)) this.restore();
  },
  // 橫式右側（還沒買的 VOL）：這一集的曲目、價格、購買／恢復購買
  buyPanel(vol, list) {
    const x = 1000, y = 176, w = 820, h = 720, cx = x + w / 2;
    UI.panel(x, y, w, h, 28, 'rgba(16,22,52,.9)');
    drawLock(x + 84, y + 88, 1.7);
    UI.text(volName(vol), x + 150, y + 72, 60, { align: 'left', fill: '#ffd23f', raw: true, sw: 9 });
    UI.text(tr('追加樂曲 {0} 首', list.length), x + 154, y + 132, 24, { align: 'left', fill: '#ffe8b0', stroke: null, raw: true });
    if (Shop.isTest()) { UI.panel(x + w - 150, y + 30, 110, 40, 20, '#c8321e', '#fff'); UI.text('TEST', x + w - 95, y + 51, 22, { fill: '#fff', stroke: null, raw: true }); }
    ctx.fillStyle = 'rgba(232,182,74,.5)'; ctx.fillRect(x + 40, y + 176, w - 80, 2);
    // 曲目（兩欄，每欄一半）：正在試聽的那首亮起；曲數多時列距縮小
    const per = Math.ceil(list.length / 2), rh = Math.min(52, 270 / per), fs = rh >= 40 ? 24 : 18, rr = rh >= 40 ? 14 : 10;
    list.forEach((s, k) => {
      const tx = x + 60 + Math.floor(k / per) * 370, ty = y + 200 + rh / 2 + (k % per) * rh, on = SONGS.indexOf(s) === this.sel;
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(tx + 14, ty, rr, 0, 7); ctx.fill();
      UI.text(String(s.no), tx + 14, ty + 1, rr + 2, { fill: '#fff', stroke: '#3e2210', sw: 3, raw: true });
      UI.text(songName(s), tx + 36, ty, fs, { align: 'left', fill: on ? '#ffd23f' : '#fff', stroke: null, raw: true, maxW: 310 });
    });
    ctx.fillStyle = 'rgba(232,182,74,.5)'; ctx.fillRect(x + 40, y + 476, w - 80, 2);
    UI.text(this.previewIdx === this.sel ? '♪ ' + tr('試聽中') + '：' + songName(SONGS[this.sel]) : tr('選歌就可以先試聽'), cx, y + 512, 22, { fill: '#cfd8ff', stroke: null, raw: true, maxW: w - 80 });
    UI.text(Shop.price(vol), cx, y + 566, 44, { fill: '#fff', raw: true, sw: 7 });
    // 購買鈕（朱漆）＋恢復購買
    const bx = cx - 230, by = y + 600, bw = 460, bh = 72, hover = UI.inside(Input.ptr.x, Input.ptr.y, bx, by, bw, bh);
    UI.wood(bx, by, bw, bh, { r: 14, seed: 'buy', lacquer: true, light: hover });
    UI.text(tr('購買 {0}', volName(vol)), cx, by + bh / 2 + 1, 34, { fill: '#fff6e0', stroke: '#5a0f05', sw: 6, raw: true });
    if (UI.tapIn(bx, by, bw, bh)) this.purchase(vol);
    this.restoreBtn(cx - 100, y + 684 - 8, 200, 40);
  },
  card(song, i, x, y, w, h, on) {
    ctx.save();
    if (on) {
      const s = 1.02 + Math.sin(Game.time * 6) * 0.004;
      ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s); ctx.translate(-(x + w / 2), -(y + h / 2));
      UI.glow(x, y, w, h, 16, 'rgba(255,170,60,.95)', blur(26), { fill: 'rgba(255,170,60,.6)' });   // 光暈貼圖（不每幀模糊）
    }
    rrect(x + 4, y + 7, w, h, 16); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
    UI.wood(x, y, w, h, { r: 16, seed: 'song' + i, light: on });
    // 木板依難度換木頭色（簡單 = 原木、普通 = 胡桃木、困難 = 紅木）
    const D = DIFFS[curDiff()];
    if (D.card) { ctx.save(); rrect(x, y, w, h, 16); ctx.clip(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = D.card; ctx.fillRect(x, y, w, h); ctx.restore(); }
    // 編號圓牌（樂曲代表色）
    const bx = x + 54, by = y + h / 2;
    ctx.fillStyle = song.color; ctx.beginPath(); ctx.arc(bx, by, 34, 0, 7); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#3e2210'; ctx.stroke();
    UI.text(String(song.no), bx, by + 2, 34, { fill: '#fff', stroke: '#3e2210', sw: 6, raw: true });   // 這一集裡的編號 1～10
    const ink = on ? '#9a1a08' : '#3a1d0a', soft = on ? '#8a3a10' : '#6a3c18';
    UI.text(songName(song), x + 104, y + 40, 32, { align: 'left', fill: ink, stroke: null, raw: true, maxW: w - 320 });
    UI.text(songSub(song), x + 104, y + 80, 18, { align: 'left', fill: soft, stroke: null, raw: true, maxW: w - 340 });
    const S = song.sections;
    UI.text(`BPM ${S[0].bpm}–${S[S.length - 1].bpm}`, x + 104, y + 116, 17, { align: 'left', fill: soft, stroke: null, raw: true });
    if (on && this.previewIdx === i) {
      const b = Math.abs(Math.sin(Game.time * 5)) * 4;
      const hot = D.key === 'hard' ? '#5a0a00' : '#c43a1a';   // 困難的紅木板上改用深色，才看得清楚
      UI.text('♪', x + 262, y + 114 - b, 20, { fill: hot, stroke: null, raw: true });
      UI.text(tr('試聽中'), x + 280, y + 116, 16, { align: 'left', fill: hot, stroke: null, raw: true });
    }
    drawStars(x + w - 118, y + 40, diffStars(song), 24);   // 目前難度的星級
    drawSongMedal(recId(song), x + w - 196, y + 84, 22);   // 曲目獎章（目前難度：最佳評價＋全連擊／全 GREAT）
    UI.text('HISCORE', x + w - 24, y + 84, 14, { align: 'right', fill: soft, stroke: null, raw: true });
    UI.text(pad(Save.best(recId(song)), 7), x + w - 24, y + 114, 24, { align: 'right', fill: ink, stroke: null, raw: true });
    if (!Shop.songOwned(song)) {   // 還沒買的 VOL：卡片壓暗，編號圓牌上蓋鎖頭（仍可選來試聽）
      rrect(x, y, w, h, 16); ctx.fillStyle = 'rgba(20,12,30,.42)'; ctx.fill();
      drawLock(x + 54, y + h / 2, 1);
    }
    ctx.restore();
  },
  // 橫式右側：選中樂曲的詳細資料（大字歌名、星級、各段速度圖、HISCORE）
  detail(song) {
    const x = 1000, y = 176, w = 820, h = 720, cx = x + w / 2;
    UI.panel(x, y, w, h, 28, 'rgba(16,22,52,.86)');
    ctx.fillStyle = song.color; ctx.beginPath(); ctx.arc(x + 84, y + 92, 52, 0, 7); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#fff3d8'; ctx.stroke();
    UI.text(String(song.no), x + 84, y + 95, 52, { fill: '#fff', stroke: '#3e2210', sw: 8, raw: true });
    UI.text(songName(song), x + 160, y + 72, 52, { align: 'left', fill: '#fff', raw: true, maxW: w - 190, sw: 8 });
    UI.text(songSub(song), x + 162, y + 132, 24, { align: 'left', fill: '#ffe8b0', stroke: null, raw: true, maxW: w - 190 });
    ctx.fillStyle = 'rgba(232,182,74,.5)'; ctx.fillRect(x + 40, y + 180, w - 80, 2);
    drawStars(cx, y + 236, diffStars(song), 48);
    { const D = DIFFS[curDiff()]; UI.panel(x + 40, y + 216, 120, 40, 20, D.color, '#fff'); UI.text(D.name, x + 100, y + 237, 22, { fill: '#fff', stroke: 'rgba(0,0,0,.35)', sw: 4 }); }   // 目前難度
    // 各段速度：一段一根柱子（越後面越快），正在試聽的那段亮起
    const S = song.sections, lo = S[0].bpm, hi = S[S.length - 1].bpm, gw = w - 160, bw = gw / S.length;
    UI.text('TEMPO', x + 80, y + 300, 20, { align: 'left', fill: '#7fe4ff', stroke: null, raw: true });
    UI.text(`BPM ${lo} → ${hi}`, x + w - 80, y + 300, 24, { align: 'right', fill: '#fff', stroke: null, raw: true });
    const preview = this.previewIdx === this.sel, pv = Math.min(2, S.length - 1);
    S.forEach((s, i) => {
      const bh = 30 + 90 * (s.bpm - lo) / Math.max(1, hi - lo), bx = x + 80 + i * bw + 6, by = y + 450 - bh;
      ctx.fillStyle = preview && i === pv ? '#ffd23f' : hexA(song.color, 0.85); rrect(bx, by, bw - 12, bh, 8); ctx.fill();
      UI.text(String(s.bpm), bx + (bw - 12) / 2, y + 474, 16, { fill: '#cfd8ff', stroke: null, raw: true });
    });
    if (preview) {
      const b = Math.abs(Math.sin(Game.time * 5)) * 5;
      UI.text('♪ ' + tr('試聽中'), cx, y + 520 - b, 22, { fill: '#ffd23f', stroke: null, raw: true });
    }
    ctx.fillStyle = 'rgba(232,182,74,.5)'; ctx.fillRect(x + 40, y + 556, w - 80, 2);
    UI.text('HISCORE', x + 80, y + 604, 26, { align: 'left', fill: '#ffb0a0', stroke: null, raw: true });
    UI.text(pad(Save.best(recId(song)), 7), x + w - 80, y + 606, 64, { align: 'right', fill: '#fff', raw: true, sw: 9 });
    // 曲目獎章：最佳評價＋全連擊／全 GREAT
    const md = Save.data.medals[recId(song)];
    if (md && md.r <= 9) {
      drawMedalStamp(md.r, x + 108, y + 674, 30);
      UI.text(tr(RATINGS[md.r].title), x + 154, y + 676, 26, { align: 'left', fill: RATINGS[md.r].color, stroke: '#fff3d8', sw: 4, raw: true, maxW: w - 420 });
      if (md.ag || md.fc) drawMedalBadge(md.ag ? 'ag' : 'fc', x + w - 170, y + 676, 200, 34);
    } else UI.text(tr('還沒有通關紀錄'), x + 80, y + 676, 20, { align: 'left', fill: '#8a90b8', stroke: null, raw: true });
  },
};

// ---------- 遊戲（含暫停選單） ----------
Screens.game = {
  sel: 0, n: 0, pauseReq: false,
  enter(arg) {
    if (!(arg && arg.resume)) Game.newRun(arg && arg.song);
    this.sel = 0; this.pauseReq = false;
    Sound.stopBgm();
    Input.onHit = (x, y, t) => this.onHit(x, y, t);
  },
  leave() { Input.onHit = null; },
  onHit(x, y, t) {
    // 點到右上角暫停鈕：暫停（不算打擊）
    if (x !== undefined && Math.hypot(x - PAUSE_BTN.x, y - PAUSE_BTN.y) < PAUSE_BTN.r + 16) { this.pauseReq = true; return; }
    Game.hit(t);
  },
  pause() { Game.pause(); this.sel = 0; Sound.play('pause'); },
  frame(dt) {
    const s = Game.s;
    const toggle = Input.was('pause') || this.pauseReq;
    this.pauseReq = false;
    if (!s.paused) { if (toggle) this.pause(); }
    else if (s.resumeT > 0) { if (toggle || Input.was('back')) Game.pause(); }   // 倒數中：取消倒數
    else if (toggle || Input.was('back')) Game.resume();
    Game.update(dt);
    Game.draw();
    if (!s.paused) return;
    if (s.resumeT > 0) {
      UI.dim(0.3);
      const k = Game.countdown();
      if (k) UI.text(String(k), W / 2, lay(560, 470), 140, { fill: '#fff', stroke: '#c43a1a', sw: 20 });
      UI.text('跟著拍子準備！', W / 2, lay(680, 590), 30, { fill: '#ffe066', sw: 8 });
      return;
    }
    UI.dim(0.62);
    UI.text('PAUSE', W / 2, lay(400, 230), 96, { fill: '#fff27a', stroke: '#c43a1a', sw: 16 });
    UI.begin(this);
    if (UI.button(this, '繼續遊戲', PX, PY(492), 400, 70, { c1: '#8dff8a', c2: '#2fc46a' })) Game.resume();
    if (UI.button(this, '重新開始', PX, PY(578), 400, 70, { c1: '#ffe680', c2: '#ffb02e' })) { Game.newRun(); this.sel = 0; }
    if (UI.button(this, '返回選擇樂曲', PX, PY(664), 400, 70)) { s.ended = true; App.goto('songs'); }   // 選曲畫面會停在這首歌上
    if (UI.button(this, '設定', PX, PY(750), 400, 70, { c1: '#d6b3ff', c2: '#9a6bff' })) App.goto('settings', { from: 'game' });
    if (UI.button(this, '回主選單', PX, PY(836), 400, 70, { c1: '#ffb3d1', c2: '#ff6b9a', back: true })) { s.ended = true; App.goto('menu'); }
    UI.nav(this);
    UI.text('繼續後會先倒數 3 拍，再接回原本的節拍', W / 2, PY(950), 20, { fill: '#e6ecff', stroke: null });
    UI.navHint();
  }
};

// ---------- 新手教學（可以玩的練習） ----------
// intro（說明＋開始 / 略過）→ play（3 個步驟，達成目標自動進下一步）→ done（完成卡片）
// 用慢速的「月見ちょうちん」伴奏；譜面依步驟邊玩邊產生（Game.tutExtend）
Screens.tutorial = {
  sel: 0, n: 0, phase: 'intro', step: 0, base: 0, clearT: -1, doneT: 0, pauseReq: false, from: 'menu',
  STEPS: [
    { pat: [0], goal: 4, guide: true, title: '看準時機，按下去！', text: '食材丟出時會「啵」一聲，2 拍後落進金色框。落下的瞬間按下按鈕（手機點畫面任何地方）！' },
    { pat: [0, 2], goal: 6, guide: true, title: '跟著拍子連續打', text: '節奏變密囉！跟著音樂「咚、咚」的拍子按，比盯著食材更準。' },
    { pat: [0, 1, 2], goal: 1, oko: true, title: '做出廣島燒！', text: '炒麵、高麗菜、煎餅、培根各處理 1 個，就會合成一份廣島燒，+1000 分！右上角可以看收集進度。' },
  ],
  enter(arg) {
    this.from = arg && arg.from === 'songs' ? 'songs' : 'menu';
    this.phase = 'intro'; this.sel = 1; this.pauseReq = false;
    chef.idlePose = 'wave'; chef.queue = [];
    Sound.init(); Sound.duck(false); Sound.startBgm(songById('tsukimi'), 0);
  },
  leave() { Input.onHit = null; if (Game.s && Game.s.tut) Game.s.ended = true; },
  // 教學用樂曲：月見ちょうちん的編曲，固定 84 BPM
  song() { return Object.assign({}, songById('tsukimi'), { id: 'tutorial', title: tr('新手教學'), sections: [{ bpm: TUT_BPM, lv: [0] }] }); },
  begin() {
    Sound.play('confirm'); Sound.stopBgm();
    Game.newRun(this.song(), true);
    this.phase = 'play'; this.step = 0; this.clearT = -1; this.sel = 0;
    this.setStep(0);
    Input.onHit = (x, y, t) => {
      if (x !== undefined && Math.hypot(x - PAUSE_BTN.x, y - PAUSE_BTN.y) < PAUSE_BTN.r + 16) { this.pauseReq = true; return; }
      Game.hit(t);
    };
  },
  setStep(i) {
    const s = Game.s, st = this.STEPS[i];
    this.step = i; this.clearT = -1;
    this.base = st.oko ? s.oko : this.goodHits();
    s.tut.pat = st.pat; s.tut.sec = Math.min(i + 1, 2);   // 伴奏隨步驟加樂器
  },
  goodHits() { const g = Game.s.grades; return g.GREAT + g.NICE + g.GOOD; },
  progress() { const st = this.STEPS[this.step]; return Math.min(st.goal, (st.oko ? Game.s.oko : this.goodHits()) - this.base); },
  // 完成教學：之後按「開始遊戲」就直接進選曲
  complete() { if (!Save.data.tutorialDone) { Save.data.tutorialDone = true; Save.store(); } Achieve.check(); },
  exit(dest) { this.complete(); App.goto(dest); },
  pause() { Game.pause(); this.sel = 0; Sound.play('pause'); },

  frame(dt) {
    if (this.phase === 'intro') return this.intro();
    const s = Game.s;
    if (this.phase === 'play') {
      const toggle = Input.was('pause') || this.pauseReq;
      this.pauseReq = false;
      if (!s.paused) { if (toggle) this.pause(); }
      else if (s.resumeT > 0) { if (toggle || Input.was('back')) Game.pause(); }
      else if (toggle || Input.was('back')) Game.resume();
    }
    Game.update(dt);
    Game.draw();
    if (this.phase === 'play') {
      if (!s.paused) this.advance();
      this.drawGuide();
      if (!s.paused) this.drawCard();
      if (s.paused) this.pauseMenu();
    } else this.doneCard(dt);
  },
  // 達成目標 → 卡片顯示「完成！」1.8 秒（這段只有伴奏）→ 下一步；最後一步完成且食材都處理完 → 完成卡片
  advance() {
    const s = Game.s, last = this.step === this.STEPS.length - 1;
    if (this.clearT < 0) {
      if (this.progress() >= this.STEPS[this.step].goal) {
        this.clearT = Game.time; s.tut.pat = null;
        SND.kane(A.ctx.currentTime + 0.05, 1.6, A.sfx);
      }
      return;
    }
    if (Game.time - this.clearT < 1.8) return;
    if (!last) this.setStep(this.step + 1);
    else if (!s.chart.notes.some(n => n.state === 'fly') && !s.okoAnims.length) {
      this.phase = 'done'; this.doneT = 0; this.sel = 0;
      Input.onHit = null; chef.queue = []; chef.idlePose = 'cheer';
      this.complete();
      SND.fanfare(A.ctx.currentTime + 0.1);
    }
  },
  // 前兩步的時機提示：金框外的圈圈隨食材飛近縮小，落下瞬間剛好貼合，並顯示「就是現在！」
  drawGuide() {
    const s = Game.s;
    if (!this.STEPS[this.step].guide || s.paused) return;
    const st = Game.songTime();
    worldBegin();
    for (const n of s.chart.notes) {
      if (n.state !== 'fly' || st < n.throwT) continue;
      const p = clamp((st - n.throwT) / (n.t - n.throwT), 0, 1), k = 1 - p;
      ctx.save();
      ctx.strokeStyle = `rgba(255,240,150,${0.25 + p * 0.75})`; ctx.lineWidth = 3 + p * 3;
      ctx.beginPath(); ctx.ellipse(ZONE.x, ZONE.y, ZONE.w / 2 + 10 + k * 170, ZONE.h / 2 + 8 + k * 80, 0, 0, 7); ctx.stroke();
      ctx.restore();
      if (Math.abs(st - n.t) < 0.12) {
        const sc = 1 + (0.12 - Math.abs(st - n.t)) * 2;
        ctx.save(); ctx.translate(ZONE.x, 836); ctx.scale(sc, sc);
        txt(tr('就是現在！'), 0, 0, 40, '#fff27a', { stroke: '#c43a1a', lw: 10 });
        ctx.restore();
      }
      break;   // 只提示最近的一個
    }
    ctx.restore();
  },
  // 上方的步驟卡片：STEP n/3、標題、說明、進度點
  drawCard() {
    const s = Game.s, st = this.STEPS[this.step], cleared = this.clearT >= 0;
    const [x, y, w] = lay([24, 232, 612], [1340, 540, 540]), txtW = w - 48;   // 直式：招牌下方（不擋 LOGO）；橫式：右側食材欄下方
    const lines = UI.lines(tr(st.text), txtW, 19);
    const h = 104 + lines.length * 27;
    // 「廣島燒完成！」的字會出現在卡片位置：那時卡片變淡
    const fade = s.okoAnims.some(a => a.t < 0.6) ? 0.15 : 1;
    ctx.save(); ctx.globalAlpha *= fade;
    UI.panel(x, y, w, h, 20, 'rgba(16,22,52,.88)', cleared ? '#8dff8a' : '#e8b64a');
    const chip = 'STEP ' + (this.step + 1) + ' / ' + this.STEPS.length;
    ctx.fillStyle = cleared ? '#2fc46a' : '#c8321e'; rrect(x + 20, y + 18, 118, 30, 15); ctx.fill();
    UI.text(chip, x + 79, y + 34, 15, { fill: '#fff', stroke: null, raw: true });
    UI.text(st.title, x + 154, y + 34, 26, { align: 'left', fill: '#fff27a', stroke: null, maxW: w - 300 });
    lines.forEach((ln, i) => UI.text(ln, x + 24, y + 78 + i * 27, 19, { align: 'left', fill: '#fff', stroke: null, raw: true }));
    // 進度：右上角的圓點（廣島燒那一步是小廣島燒圖示）
    const done = cleared ? st.goal : this.progress(), py = y + 34;
    if (cleared) UI.text('✔ ' + tr('完成！'), x + w - 22, py, 22, { align: 'right', fill: '#8dff8a', stroke: null, raw: true });
    else if (st.oko) {
      drawImgW(IMG.okonomiyaki, x + w - 92, py, 46, 0, done ? 1 : 0.35);
      UI.text(done + ' / ' + st.goal, x + w - 22, py + 1, 20, { align: 'right', fill: '#fff', stroke: null, raw: true });
    } else {
      for (let i = 0; i < st.goal; i++) {
        const cx = x + w - 30 - (st.goal - 1 - i) * 22;
        ctx.fillStyle = i < done ? '#ffd23f' : 'rgba(255,255,255,.22)';
        ctx.beginPath(); ctx.arc(cx, py, 8, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  },
  pauseMenu() {
    const s = Game.s;
    if (s.resumeT > 0) {
      UI.dim(0.3);
      const k = Game.countdown();
      if (k) UI.text(String(k), W / 2, lay(560, 470), 140, { fill: '#fff', stroke: '#c43a1a', sw: 20 });
      UI.text('跟著拍子準備！', W / 2, lay(680, 590), 30, { fill: '#ffe066', sw: 8 });
      return;
    }
    UI.dim(0.62);
    UI.text('PAUSE', W / 2, lay(400, 230), 96, { fill: '#fff27a', stroke: '#c43a1a', sw: 16 });
    UI.begin(this);
    if (UI.button(this, '繼續練習', PX, PY(492), 400, 70, { c1: '#8dff8a', c2: '#2fc46a' })) Game.resume();
    if (UI.button(this, '從頭開始', PX, PY(578), 400, 70)) this.begin();
    if (UI.button(this, '略過教學', PX, PY(664), 400, 70)) { s.ended = true; this.exit('songs'); }
    if (UI.button(this, '回主選單', PX, PY(750), 400, 70, { back: true })) { s.ended = true; App.goto('menu'); }
    UI.nav(this);
    UI.navHint();
  },
  intro() {
    menuBackdrop(0.25);
    const w = lay(620, 800), x = (W - w) / 2, y = lay(800, 730);
    const lines = UI.lines(tr('只要一顆按鈕！先用一首慢歌，練習跟著節拍處理食材吧。'), w - 60, 21);
    UI.panel(x, y, w, 130 + lines.length * 32, 24);
    UI.ribbon(W / 2, y, tr('新手教學'), 34, 320);
    UI.text('歡迎光臨！', W / 2, y + 66, 32, { fill: '#fff27a', stroke: null });
    lines.forEach((ln, i) => UI.text(ln, W / 2, y + 112 + i * 32, 21, { fill: '#fff', stroke: null, raw: true }));
    UI.begin(this);
    if (UI.button(this, '略過', W / 2 - 310, lay(1104, 916), 200, 76, { back: true })) this.exit('songs');
    if (UI.button(this, '開始練習', W / 2 - 90, lay(1098, 910), 400, 88, { lacquer: true, size: 36 })) this.begin();
    if (Input.was('left')) this.sel = 0;
    if (Input.was('right')) this.sel = 1;
    if (Input.was('back')) App.goto(this.from);
    UI.navHint();
  },
  doneCard(dt) {
    this.doneT += dt;
    const k = ease(clamp(this.doneT / 0.35, 0, 1));
    UI.dim(0.55 * k);
    ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * 40);
    const x = W / 2 - 300, y = lay(330, 160), w = 600;
    UI.panel(x, y, w, 330, 26);
    UI.ribbon(W / 2, y, tr('教學完成！'), 40, 380);
    const tips = ['跟著音樂的拍子按，比盯著食材更準', '每 8 小節會 SPEED UP，節奏越來越快', '連擊越多加分越多，BAD 會中斷連擊', '四種食材湊齊就是一份廣島燒！'];
    tips.forEach((t, i) => {
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x + 46, y + 92 + i * 64, 7, 0, 7); ctx.fill();
      UI.wrap(t, x + 66, y + 92 + i * 64, w - 100, 26, 21, { fill: '#fff' });
    });
    ctx.restore();
    if (this.doneT < 0.5) return;
    UI.begin(this);
    if (UI.button(this, '前往選擇樂曲', PX, y + 370, 400, 86, { lacquer: true, size: 34 })) App.goto('songs');
    if (UI.button(this, '再練習一次', PX, y + 476, 400, 66)) this.begin();
    UI.nav(this);
    UI.navHint();
  },
};

// ---------- 操作說明 ----------
Screens.howto = {
  page: 0, sel: 0, n: 0,
  PAGES: ['遊戲規則', '操作方式', '判定與計分', '食材圖鑑'],
  slideDir: 0, slideT: 1,
  // 面板、◀ ▶ 點擊範圍、返回鈕：直式在下方；橫式 ◀ ▶ 在面板兩側
  L: lay({ panel: [30, 190, 660, 860], prev: [80, 1112], next: [640, 1112], tapPrev: [30, 1072, 120, 80], tapNext: [570, 1072, 120, 80], back: [250, 1076] },
    { panel: [160, 190, 1600, 720], prev: [96, 550], next: [W - 96, 550], tapPrev: [20, 450, 140, 200], tapNext: [W - 160, 450, 140, 200], back: [W / 2 - 110, 946] }),
  enter() { this.page = 0; this.sel = 0; this.slideT = 1; chef.idlePose = 'wave'; },
  frame(dt) {
    const L = this.L;
    menuBackdrop(0.7);
    UI.header('操作說明', `${tr(this.PAGES[this.page])}  (${this.page + 1}/${this.PAGES.length})`);
    UI.panel(...L.panel, 26);

    const N = this.PAGES.length;
    const go = d => { this.page = (this.page + d + N) % N; this.slideDir = d; this.slideT = 0; Sound.play('select'); };
    // 換頁：← → / 點 ◀ ▶ / 手機上左右滑動（手指往左 = 下一頁）
    if (Input.was('left') || UI.tapIn(...L.tapPrev) || Input.swipe === 'right') go(-1);
    if (Input.was('right') || UI.tapIn(...L.tapNext) || Input.swipe === 'left') go(1);
    // 內容跟著手指移動；換頁時新的一頁從滑動的方向滑進來
    this.slideT = Math.min(1, this.slideT + dt / 0.28);
    const e = ease(this.slideT), off = this.slideDir * (1 - e) * 300 + Input.dragX() * 0.6;
    ctx.save();
    rrect(...L.panel, 26); ctx.clip();
    ctx.translate(off, 0); ctx.globalAlpha *= clamp(0.25 + 0.75 * e - Math.abs(Input.dragX()) / 900, 0, 1);
    (LAND ? [this.p1L, this.p2L, this.p3L, this.p4L] : [this.p1, this.p2, this.p3, this.p4])[this.page].call(this);
    ctx.restore();
    UI.text('◀', ...L.prev, 48, { fill: '#ffd23f' }); UI.text('▶', ...L.next, 48, { fill: '#ffd23f' });
    UI.begin(this);
    if (UI.button(this, '返回', ...L.back, 220, 70, { back: true }) || Input.was('back')) App.goto('menu');
    UI.nav(this);
    UI.hint(Input.touchMode ? '左右滑動可以換頁' : '← → 換頁');
  },
  // ox = 這一列的左緣（圖示在 ox+70，文字從 ox+140 開始）
  row(y, icon, title, desc, ox = 30, ww = 490) {
    if (typeof icon === 'string') UI.text(icon, ox + 70, y + 40, 46, { stroke: null });
    else icon(ox + 70, y + 40);
    UI.text(title, ox + 140, y + 14, 28, { align: 'left', fill: '#fff27a', stroke: null });
    UI.wrap(desc, ox + 140, y + 54, ww, 32, 21, { fill: '#fff' });
  },
  RULES: [
    [(x, y) => drawButtonImg(x - 14, y + 20, 92), '跟著節拍按按鈕', '食材會從左右兩邊丟到鐵板中央的金色框裡，落下的瞬間按下按鈕！'],
    [(x, y) => drawImgW(IMG.cabbage_raw, x, y, 96), '先聽，再按', '食材丟出時會發出「咻～啵」提示音，2 拍之後落下。跟著音樂的節拍就對了。'],
    [(x, y) => drawImgW(IMG.okonomiyaki, x, y, 110), '湊齊四種食材', '炒麵、高麗菜、煎餅、培根各處理好 1 個，就會自動合成一份廣島燒，加 1000 分！'],
    ['⏩', '越來越快', '每 8 小節節奏加快一次。共 75 首樂曲（內建 15 首＋VOL.1～VOL.6 各 10 首），星越多越快、越難。'],
    ['🏆', 'HISCORE', '每首歌的每種難度，都會記下你自己的最高分。'],
  ],
  p1() { this.RULES.forEach(([ic, t, d], i) => this.row(222 + i * 164, ic, t, d)); },
  p1L() { this.RULES.forEach(([ic, t, d], i) => this.row(236 + (i % 3) * 210, ic, t, d, i < 3 ? 190 : 980, 600)); },   // 左欄 3 列、右欄 2 列
  // 操作對照表：手機版面（觸控裝置，包含 iPad）只列手機操作；PC 版面只列鍵盤與遊戲手把
  CONTROLS() {
    if (!LAND) return {
      cols: ['操作', '手機・平板'],
      rows: [
        ['處理食材', '點擊畫面任何地方'],
        ['暫停', '右上 ⏸ 按鈕'],
        ['選曲', '上下滑動清單'],
        ['切換樂曲組', '點下方的樂曲組按鈕\n或左右滑動'],
        ['決定', '點擊按鈕'],
        ['返回', '返回按鈕'],
      ],
    };
    return {
      cols: ['操作', '鍵盤', '遊戲手把'],
      rows: [
        ['處理食材', 'SPACE・ENTER\nF・J・D・K', 'A・B・X・Y\nLB・RB・LT・RT'],
        ['暫停', 'ESC・P', 'START'],
        ['選單移動', '↑↓←→\nW・A・S・D', '十字鍵\n左搖桿'],
        ['決定', 'ENTER\nSPACE', 'A'],
        ['返回', 'ESC\nBACKSPACE', 'B・BACK'],
      ],
    };
  },
  // xs = 各欄中心；rect = [列底色左緣, 列高, 寬]；f0 / f1 = 第一欄 / 其他欄字級
  table(xs, y0, dy, rect, f0, f1, mw0, mw1) {
    const { cols, rows } = this.CONTROLS();
    cols.forEach((t, k) => UI.text(t, xs[k], y0 - 68, f0 - 1, { fill: '#7fe4ff', stroke: null }));
    rows.forEach((r, i) => {
      const y = y0 + i * dy;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.13)'; ctx.fillRect(rect[0], y - rect[1] / 2, rect[2], rect[1]);
      r.forEach((t, k) => {
        const ls = tr(t).split('\n');
        ls.forEach((ln, j) => UI.text(ln, xs[k], y + (j - (ls.length - 1) / 2) * 30, k === 0 ? f0 : f1,
          { fill: k === 0 ? '#fff27a' : '#fff', stroke: null, maxW: k === 0 ? mw0 : mw1, raw: true }));
      });
    });
  },
  padLine(x, y, mw) {
    const pad = Input.padConnected;
    UI.text(pad ? '🎮 遊戲手把已連接' : '🎮 遊戲手把：未連接（接上後按任一鍵即可使用）', x, y, 20, { fill: pad ? '#8dff8a' : '#cfd8ff', stroke: null, maxW: mw });
  },
  p2() {   // 手機・平板
    this.table([180, 470], 290, 92, [42, 84, 636], 24, 22, 210, 380);
    UI.wrap('點擊畫面任何地方都算打擊（右上暫停鈕除外）。暫停後選「繼續遊戲」會先倒數 3 拍，再接回原本的節拍。', 60, 862, 600, 34, 21, { fill: '#fff' });
  },
  p2L() {   // PC：鍵盤・遊戲手把
    this.table([470, 960, 1450], 312, 96, [190, 88, 1540], 26, 22, 360, 420);
    this.padLine(W / 2, 806, 1400);
    UI.wrap('打擊鍵按任何一顆都可以。暫停後選「繼續遊戲」會先倒數 3 拍，再接回原本的節拍。', 220, 852, 1480, 32, 21, { fill: '#fff' });
  },
  GRADES: [['GREAT', '±50ms 以內', '300'], ['NICE', '±90ms 以內', '200'], ['GOOD', '±130ms 以內', '100'], ['BAD', '太早／太晚／沒按', '0']],
  NOTES: [
    ['連擊加分', '每次命中再加「連擊數 × 4」分（最多 +200）。BAD 會中斷連擊。'],
    ['廣島燒', '四種食材各 1 個合成一份，+1000 分。'],
    ['揮空不扣分', '沒有食材時按下按鈕只會揮空，可以放心跟著拍子按。'],
    ['判定校正', '如果總覺得判定偏早或偏晚，可以到「設定」調整。'],
  ],
  grades(xs, y0, dy, rect) {
    UI.text('判定', xs[0], y0 - 64, 22, { fill: '#7fe4ff', stroke: null });
    UI.text('時間差', xs[1], y0 - 64, 22, { fill: '#7fe4ff', stroke: null });
    UI.text('得分', xs[2], y0 - 64, 22, { fill: '#7fe4ff', stroke: null });
    this.GRADES.forEach(([g, w, p], i) => {
      const y = y0 + i * dy;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.13)'; ctx.fillRect(rect[0], y - rect[1] / 2, rect[2], rect[1]);
      drawGradeText(g, xs[0], y, 1, 1, 40);
      UI.text(w, xs[1], y, 22, { fill: '#fff', stroke: null });
      UI.text(p, xs[2], y, 30, { fill: '#ffe680', stroke: null });
    });
  },
  p3() {
    this.grades([130, 400, 590], 300, 92, [42, 84, 636]);
    let y = 700;
    this.NOTES.forEach(([t, d]) => {
      UI.text(t, 60, y, 22, { align: 'left', fill: '#7fe4ff', stroke: null });
      y += UI.wrap(d, 210, y, 450, 30, 20, { fill: '#fff' }) + 22;
    });
  },
  p3L() {   // 左：判定表；右：計分說明
    this.grades([320, 600, 830], 330, 110, [190, 96, 760]);
    let y = 270;
    this.NOTES.forEach(([t, d]) => {
      UI.text(t, 1010, y, 26, { align: 'left', fill: '#7fe4ff', stroke: null });
      y += UI.wrap(d, 1010, y + 44, 680, 32, 22, { fill: '#fff' }) + 76;
    });
  },
  // 食材圖鑑一格：生食材 ➜ 處理後，右邊是名稱、主角動作、提示音
  ingredient(k, x, y, mw) {
    const ing = ING[k];
    drawImgW(IMG[ing.raw], x + 88, y, 140);
    UI.text('➜', x + 198, y, 40, { fill: '#ffd23f', stroke: null });
    drawImgW(IMG[ing.done], x + 308, y, 160);
    UI.text(ing.name, x + 418, y - 34, 30, { align: 'left', fill: '#fff27a', stroke: null });
    UI.text(tr('主角動作：{0}', tr(ing.act)), x + 418, y + 10, 20, { align: 'left', fill: '#fff', stroke: null, maxW: mw, raw: true });
    const pitch = ['低', '中', '高', '中高'][[440, 523, 784, 659].indexOf(ing.cue)];
    UI.text(tr('提示音：{0}音「啵」', tr(pitch)), x + 418, y + 44, 18, { align: 'left', fill: '#cfd8ff', stroke: null, maxW: mw, raw: true });
  },
  p4() {
    TYPES.forEach((k, i) => {
      const y = 300 + i * 190;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.13)'; ctx.fillRect(42, y - 84, 636, 172);
      this.ingredient(k, 42, y, 220);
    });
  },
  p4L() {   // 2×2
    TYPES.forEach((k, i) => {
      const x = 190 + (i % 2) * 780, y = 380 + Math.floor(i / 2) * 330;
      ctx.fillStyle = (i % 2) ^ Math.floor(i / 2) ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.13)'; rrect(x, y - 140, 760, 280, 18); ctx.fill();
      this.ingredient(k, x + 20, y, 300);
    });
  },
};

// ---------- 設定 ----------
Screens.settings = {
  sel: 0, n: 0, from: 'menu',
  // 各列（上下鍵的順序）：直式 = 手機；橫式 = PC（全螢幕、解析度）；桌面版、App 版沒有「安裝到主畫面」
  KEYS: LAND ? ['music', 'sfx', 'offset', 'voice', 'backup', 'full', 'res', 'eco', 'lang', ...(DESKTOP_APP || NATIVE_APP ? [] : ['install'])]
    : ['music', 'sfx', 'offset', 'voice', 'vibrate', 'eco', 'lang', ...(NATIVE_APP ? [] : ['install']), 'backup'],
  // 各列的位置 [x, y]：直式一欄（App 版沒有安裝，備份往上補位）；橫式兩欄（左：音量、判定校正、語音反應、備份；右：全螢幕、解析度、省電、語言、安裝）
  POS: lay({ music: [50, 176], sfx: [50, 298], offset: [50, 420], voice: [50, 572], vibrate: [50, 668], eco: [50, 764], lang: [50, 860], install: [50, 980], backup: [50, NATIVE_APP ? 980 : 1076] },
    { music: [300, 200], sfx: [300, 326], offset: [300, 452], voice: [300, 610], backup: [300, 706], full: [1000, 200], res: [1000, 300], eco: [1000, 424], lang: [1000, 524], install: [1000, 648] }),
  BACK: lay([230, 1176], [W / 2 - 130, 830]),
  get ROWS() { return this.KEYS.length + 1; },   // 最後一列 = 返回
  idx(k) { return this.KEYS.indexOf(k); },
  enter(arg) {
    this.from = arg && arg.from === 'game' ? 'game' : 'menu';
    this.sel = arg && arg.row ? Math.max(0, this.idx(arg.row)) : 0;
    if (this.from === 'menu') Sound.startBgm();
  },
  back() { if (this.from === 'game') App.goto('game', { resume: true }); else App.goto('menu'); },
  say(text) { this.toast = { text: tr(text), t: Game.time }; },
  // 匯出：存檔碼複製到剪貼簿；不行的話下載成文字檔
  exportSave() {
    Sound.play('confirm');
    const code = Save.exportCode();
    const download = () => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); a.download = 'daioyaki-save.txt';
      document.body.appendChild(a); a.click(); a.remove(); this.say('已下載存檔檔案（daioyaki-save.txt）');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(() => this.say('已複製存檔碼！貼到記事本或傳給自己保存')).catch(download);
    else download();
  },
  // 匯入：先讀剪貼簿；讀不到或不是存檔碼，再請玩家貼上
  importSave() {
    Sound.play('confirm');
    const apply = code => {
      const d = Save.parseCode(code);
      if (!d) { if (code) this.say('這不是有效的存檔碼'); return; }
      if (!window.confirm(tr('會用存檔碼覆蓋目前的成績、紀錄與設定，確定嗎？'))) return;
      Save.importData(d); this.say('匯入完成！即將重新載入…');
      setTimeout(() => location.reload(), 900);
    };
    const ask = () => { const c = window.prompt(tr('請貼上存檔碼')); if (c) apply(c); };
    if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => (Save.parseCode(t) ? apply(t) : ask())).catch(ask);
    else ask();
  },
  setVol(key, v) {
    v = clamp(v, 0, 5);
    if (v === Save.data[key]) return;
    Sound.setVol(key, v);
    Sound.play(key === 'sfx' ? 'sfxPreview' : 'musicPreview');
    if (key === 'music') Sound.play('select');
  },
  setOffset(v) {
    v = clamp(v, -200, 400);   // 藍牙耳機常有 150～300ms 延遲
    if (v === Save.data.offset) return;
    Save.data.offset = v; Save.store(); Sound.play('select');
  },
  // 一列的底框；回傳 [x, y, 這一列的索引]
  panel(k, h) {
    const i = this.idx(k), [X, y] = this.POS[k], on = this.sel === i;
    UI.panel(X, y, 620, h, 24, on ? 'rgba(255,190,60,.3)' : 'rgba(16,22,52,.82)', on ? '#ffd23f' : '#e8b64a');
    if (Input.ptr.moved && UI.inside(Input.ptr.x, Input.ptr.y, X, y, 620, h)) this.sel = i;
    return [X, y, i];
  },
  setLang(l) {
    if (Save.data.lang === l) return;
    Save.data.lang = l; Save.store(); Sound.play('confirm'); Achieve.onLang(l);
    document.getElementById('rotate').textContent = tr('請將手機直立握持');
  },
  setRes(r) {
    if (Save.data.res === r) return;
    Display.setResolution(r); Sound.play('confirm');
  },
  // ON / OFF 開關列
  toggle(k, h, label, sub, on, flip) {
    const [X, y, i] = this.panel(k, h);
    UI.text(label, X + 34, y + 30, 30, { align: 'left', maxW: 380 });
    UI.text(sub, X + 34, y + 66, 16, { align: 'left', fill: '#cfd8ff', stroke: null, maxW: 400 });
    UI.panel(X + 450, y + (h - 56) / 2, 140, 56, 28, on ? '#2fc46a' : 'rgba(255,255,255,.18)', '#fff');
    UI.text(on ? 'ON' : 'OFF', X + 520, y + h / 2 + 1, 28);
    if (UI.tapIn(X, y, 620, h)) { this.sel = i; flip(); }
    if (this.sel === i && (Input.was('left') || Input.was('right') || Input.was('confirm'))) flip();
  },
  // 三選一的列（語言、解析度）：opts = [[值, 標籤]]；← → 循環切換
  choice(k, label, opts, cur, set) {
    const [X, y, i] = this.panel(k, 114);
    UI.text(label, X + 34, y + 28, 30, { align: 'left' });
    opts.forEach(([v, text], j) => {
      const x = X + 24 + j * 196, on = cur === v;
      UI.panel(x, y + 52, 180, 50, 25, on ? '#e8502a' : 'rgba(255,255,255,.16)', on ? '#fff' : 'rgba(255,255,255,.4)');
      UI.text(text, x + 90, y + 77, 24, { fill: '#fff', stroke: on ? '#5a0f05' : null, raw: true, maxW: 164 });
      if (UI.tapIn(x, y + 52, 180, 50)) { this.sel = i; set(v); }
    });
    if (this.sel === i) {
      const j = Math.max(0, opts.findIndex(o => o[0] === cur)), n = opts.length;
      if (Input.was('left')) set(opts[(j + n - 1) % n][0]);
      if (Input.was('right')) set(opts[(j + 1) % n][0]);
    }
  },
  frame() {
    if (this.from === 'game') { Game.draw(); UI.dim(0.75); } else menuBackdrop(0.7);
    UI.header('設定', 'SETTINGS');

    // 音樂、音效
    [['音樂', 'music'], ['音效', 'sfx']].forEach(([label, key]) => {
      const [X, y, i] = this.panel(key, 116);
      const v = Save.data[key];
      UI.text(label, X + 34, y + 30, 30, { align: 'left' });
      UI.text(v === 0 ? 'MUTE' : String(v), X + 586, y + 30, 30, { align: 'right', fill: '#ffd23f' });
      for (let k = 0; k < 5; k++) {
        const bx = X + 90 + k * 92, bh = 22 + k * 7;
        ctx.fillStyle = k < v ? (key === 'music' ? '#7fe4ff' : '#ffb347') : 'rgba(255,255,255,.2)';
        rrect(bx, y + 104 - bh, 70, bh, 8); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1a1f3a'; ctx.stroke();
        if (UI.tapIn(bx - 8, y + 46, 86, 70)) { this.sel = i; this.setVol(key, k + 1 === v ? k : k + 1); }
      }
      UI.text('−', X + 42, y + 84, 44); UI.text('+', X + 578, y + 84, 44);
      if (UI.tapIn(X + 6, y + 46, 70, 70)) { this.sel = i; this.setVol(key, v - 1); }
      if (UI.tapIn(X + 544, y + 46, 70, 70)) { this.sel = i; this.setVol(key, v + 1); }
      if (this.sel === i) { if (Input.was('left')) this.setVol(key, v - 1); if (Input.was('right')) this.setVol(key, v + 1); }
    });

    // 判定校正
    { const [X, y2, i] = this.panel('offset', 146), off = Save.data.offset;
      UI.text('判定校正', X + 34, y2 + 30, 30, { align: 'left' });
      // 右上：自動校正（跟著聲音點一點，量出耳機 / 喇叭的延遲）
      const openCal = () => { Sound.play('confirm'); App.goto('calibrate', { from: this.from }); };
      UI.panel(X + 402, y2 + 12, 196, 40, 20, '#e8502a', '#fff');
      UI.text(tr('自動校正') + ' ▶', X + 500, y2 + 33, 20, { stroke: '#5a0f05', sw: 5, raw: true, maxW: 180 });
      if (UI.tapIn(X + 396, y2 + 6, 208, 52)) { this.sel = i; openCal(); }
      if (this.sel === i && Input.was('confirm')) openCal();
      UI.text((off > 0 ? '+' : '') + off + ' ms', X + 310, y2 + 80, 36, { fill: '#ffd23f' });
      UI.text('◀', X + 100, y2 + 80, 42, { fill: '#fff' }); UI.text('▶', X + 520, y2 + 80, 42, { fill: '#fff' });
      if (UI.tapIn(X + 40, y2 + 56, 120, 54)) { this.sel = i; this.setOffset(off - 10); }
      if (UI.tapIn(X + 460, y2 + 56, 120, 54)) { this.sel = i; this.setOffset(off + 10); }
      if (this.sel === i) { if (Input.was('left')) this.setOffset(off - 10); if (Input.was('right')) this.setOffset(off + 10); }
      const r = Game.result;
      if (r && r.hits >= 5) UI.text(tr('上一局平均：{0} {1}ms', tr(r.avgErr >= 0 ? '晚' : '早'), Math.abs(r.avgErr)), X + 310, y2 + 124, 17, { fill: '#8dff8a', stroke: null, maxW: 580, raw: true });
      else UI.text('用藍牙耳機會有延遲：按「自動校正」量一次就好', X + 310, y2 + 124, 17, { fill: '#cfd8ff', stroke: null, maxW: 580 }); }

    // 語音反應：主角在遊戲中的吆喝（打開時播一句試聽）
    this.toggle('voice', 90, '語音反應', '遊戲中主角的吆喝（いいね！、おっと！…）', Save.data.voice !== false, () => {
      Save.data.voice = Save.data.voice === false; Save.store(); Sound.play('confirm');
      if (Save.data.voice && A.ctx) { Sound.sayState.end = 0; Sound.sayState.last = {}; Sound.sayState.any = -99; Sound.say('combo', A.ui, A.ctx.currentTime + 0.15); }
    });

    // 震動（手機）／全螢幕＋解析度（PC）、省電模式
    if (LAND) {
      this.toggle('full', 90, '全螢幕', 'F11 也可以切換', Display.fullscreen(), () => { Display.setFullscreen(!Display.fullscreen()); Sound.play('confirm'); });
      this.choice('res', '解析度', RESOLUTIONS.map(r => [r, r.replace('x', '×')]), Save.data.res, r => this.setRes(r));
    } else this.toggle('vibrate', 90, '震動', navigator.vibrate ? '手機打擊時輕微震動' : '此裝置不支援震動', Save.data.vibrate,
      () => { Save.data.vibrate = !Save.data.vibrate; Save.store(); Sound.play('confirm'); Sound.vibrate(30); });
    this.toggle('eco', 90, '省電模式', '每秒 30 幀・較低解析度・減少特效（判定不受影響）', Save.data.eco,
      () => { Save.data.eco = !Save.data.eco; Save.store(); Sound.play('confirm'); if (window.applyPowerMode) window.applyPowerMode(); });

    // 語言
    this.choice('lang', '語言', LANGS, Save.data.lang, l => this.setLang(l));

    // 安裝到主畫面（APP；桌面版沒有）
    if (this.idx('install') >= 0) {
      const [X, y5, i] = this.panel('install', 90), inst = PWA.installed();
      UI.text('安裝到主畫面', X + 34, y5 + 30, 30, { align: 'left', maxW: 400 });
      UI.text(inst ? '已經是 APP 模式' : '變成 APP，全螢幕、離線也能玩', X + 34, y5 + 66, 16, { align: 'left', fill: '#cfd8ff', stroke: null, maxW: 400 });
      UI.panel(X + 450, y5 + 17, 140, 56, 28, inst ? '#2fc46a' : '#e8502a', '#fff');
      UI.text(inst ? '✓' : '教學 ▶', X + 520, y5 + 46, 24, { stroke: '#5a0f05', sw: 5 });
      const openInstall = () => { Sound.play('confirm'); App.goto('install', { from: this.from }); };
      if (UI.tapIn(X, y5, 620, 90)) { this.sel = i; openInstall(); }
      if (this.sel === i && Input.was('confirm')) openInstall();
    }

    // 存檔備份：匯出（複製存檔碼）／匯入（貼上存檔碼）；← → 選按鈕、ENTER 執行
    { const [X, y, i] = this.panel('backup', 84);
      UI.text('存檔備份', X + 34, y + 28, 28, { align: 'left', maxW: 280 });
      UI.text('換手機或資料被清掉時，用存檔碼還原', X + 34, y + 62, 15, { align: 'left', fill: '#cfd8ff', stroke: null, maxW: 280 });
      [['匯出', () => this.exportSave()], ['匯入', () => this.importSave()]].forEach(([label, act], j) => {
        const bx = X + 330 + j * 140, on = this.sel === i && (this.bk || 0) === j;
        UI.panel(bx, y + 16, 128, 52, 26, on ? '#ffd23f' : j ? 'rgba(255,255,255,.18)' : '#e8502a', '#fff');
        UI.text(label, bx + 64, y + 43, 24, { fill: on ? '#5a2a00' : '#fff', stroke: on ? null : '#5a0f05', sw: 5 });
        if (UI.tapIn(bx, y + 16, 128, 52)) { this.sel = i; this.bk = j; act(); }
      });
      if (this.sel === i) {
        if (Input.was('left')) this.bk = 0;
        if (Input.was('right')) this.bk = 1;
        if (Input.was('confirm')) (this.bk ? this.importSave() : this.exportSave());
      } }
    // 匯出／匯入的結果訊息
    if (this.toast && Game.time - this.toast.t < 3) {
      const a = clamp(3 - (Game.time - this.toast.t), 0, 1), ty = lay(1020, 1000);
      ctx.save(); ctx.globalAlpha = a; UI.panel(W / 2 - 330, ty - 30, 660, 60, 30, 'rgba(16,22,52,.94)', '#8dff8a');
      UI.text(this.toast.text, W / 2, ty + 1, 20, { fill: '#fff', stroke: null, raw: true, maxW: 620 }); ctx.restore();
    }

    // 最後一列：返回
    UI.begin(this); this.n = this.ROWS - 1;
    if (UI.button(this, this.from === 'game' ? '返回遊戲' : '返回', ...this.BACK, 260, 66, { back: true }) || Input.was('back')) this.back();
    this.n = this.ROWS;
    if (Input.was('up')) { this.sel = (this.sel + this.ROWS - 1) % this.ROWS; Sound.play('select'); }
    if (Input.was('down')) { this.sel = (this.sel + 1) % this.ROWS; Sound.play('select'); }
    UI.hint('↑↓ 選擇　← → 調整');
  }
};
// ---------- 自動校正：跟著「叩」聲點畫面，量出耳機 / 喇叭的延遲（藍牙常有 150～300ms） ----------
// 畫面上不跟著拍子閃（避免玩家看畫面點），只在點下去時給回饋；前 WARM 下當預備不記錄，取中位數
Screens.calibrate = {
  sel: 0, n: 0, from: 'menu', BPM: 80, BEATS: 16, WARM: 4,
  enter(arg) {
    this.from = arg && arg.from === 'game' ? 'game' : 'menu';
    Sound.init(); Sound.stopBgm(); Sound.duck(false);
    this.reset();
    Input.onHit = (x, y, t) => this.tap(t);
  },
  leave() { Input.onHit = null; },
  reset() { this.t0 = A.ctx ? A.ctx.currentTime + 1.2 : 0; this.next = 0; this.errs = []; this.taps = 0; this.flash = -9; this.result = null; this.sel = 0; },
  back() { App.goto('settings', { from: this.from, row: 'offset' }); },
  bd() { return 60 / this.BPM; },
  tap(tMs) {
    if (this.result || !A.ctx) return;
    const delay = Math.max(0, (performance.now() - tMs) / 1000), at = A.ctx.currentTime - delay - Sound.latency();
    const bd = this.bd(), k = Math.round((at - this.t0) / bd);
    this.flash = Game.time;
    if (k < this.WARM || k >= this.BEATS) return;
    const e = at - (this.t0 + k * bd);
    if (Math.abs(e) < bd * 0.5) { this.errs.push(e); this.taps++; }
  },
  frame() {
    menuBackdrop(0.78);
    UI.header('自動校正', 'TIMING CHECK');
    const now = A.ctx ? A.ctx.currentTime : 0, bd = this.bd();
    // 排「叩」聲（第 1 拍與預備拍用較高的聲音）
    while (A.ctx && !this.result && this.next < this.BEATS && this.t0 + this.next * bd < now + 0.2) {
      const k = this.next++; SND.wood(this.t0 + k * bd, k % 4 === 0, A.ui);
    }
    if (A.ctx && !this.result && now > this.t0 + this.BEATS * bd + 0.4) {
      if (this.errs.length >= 6) {
        const s = this.errs.slice().sort((a, b) => a - b), med = s[s.length >> 1];
        this.result = { ms: clamp(Math.round(med * 100) * 10, -200, 400) }; Achieve.unlock('calibrate');   // 以 10ms 為單位
      } else this.result = { fail: true };
      this.sel = 0;
    }
    const pw = lay(640, 900), CY = y => lay(y, y - 160);   // 橫式：說明框加寬、其他往上移
    UI.panel((W - pw) / 2, lay(196, 180), pw, lay(150, 120), 24);
    UI.wrap('戴上平常玩的耳機（藍牙也可以），聽到「叩」聲就跟著點畫面（或按任意鍵）。前 4 下是預備。', (W - pw) / 2 + 30, lay(238, 222), pw - 60, 32, 21, { fill: '#fff' });
    // 中央的大鼓：只在點下去時跳一下（不跟著拍子閃）
    const k = clamp(1 - (Game.time - this.flash) / 0.18, 0, 1), cx = W / 2, cy = CY(620), r = 130 * (1 + k * 0.08);
    ctx.save();
    ctx.fillStyle = '#8a2a14'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.fillStyle = k ? '#ffe6b0' : '#f2d7a0'; ctx.beginPath(); ctx.arc(cx, cy, r - 18, 0, 7); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#3a1608'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    ctx.restore();
    const need = this.BEATS - this.WARM;
    if (!this.result) {
      const started = now >= this.t0 - 0.05, beat = Math.floor((now - this.t0) / bd);
      UI.text(started ? (beat < this.WARM ? tr('預備…') : tr('跟著聲音點！')) : tr('準備…'), cx, cy - 10, 32, { fill: '#7a2a10', stroke: null, raw: true });
      UI.text(this.taps + ' / ' + need, cx, cy + 40, 26, { fill: '#7a2a10', stroke: null, raw: true });
      // 進度點
      for (let i = 0; i < need; i++) {
        ctx.fillStyle = i < this.taps ? '#ffd23f' : 'rgba(255,255,255,.25)';
        ctx.beginPath(); ctx.arc(cx - (need - 1) * 14 + i * 28, CY(820), 9, 0, 7); ctx.fill();
      }
      // 測量中按鍵（SPACE / ENTER）是拿來打拍子的：返回鈕不取得焦點，只能點或按 ESC
      const q = { sel: -1, n: 0 };
      if (UI.button(q, '返回', W / 2 - 110, CY(1040), 220, 70, { back: true }) || Input.was('back')) this.back();
      return;
    }
    if (this.result.fail) {
      UI.text('點擊次數不夠，再測一次吧', cx, cy, 26, { fill: '#7a2a10', stroke: null, maxW: 220 });
    } else {
      const ms = this.result.ms;
      UI.text('測量完成！', cx, cy - 46, 28, { fill: '#7a2a10', stroke: null });
      UI.text((ms > 0 ? '+' : '') + ms + ' ms', cx, cy + 6, 48, { fill: '#c8321e', stroke: null, raw: true });
      UI.text(ms >= 100 ? '延遲偏大（藍牙常見）' : '延遲很小', cx, cy + 56, 18, { fill: '#7a2a10', stroke: null, maxW: 220 });
    }
    UI.begin(this);
    if (!this.result.fail && UI.button(this, '套用', PX, CY(860), 400, 80, { lacquer: true, size: 34 })) { Save.data.offset = this.result.ms; Save.store(); this.back(); }
    if (UI.button(this, '再測一次', PX, CY(956), 400, 64)) this.reset();
    if (UI.button(this, '返回', W / 2 - 110, CY(1040), 220, 70, { back: true }) || Input.was('back')) this.back();
    UI.nav(this);
    UI.navHint();
  },
};
// ---------- 安裝到主畫面（APP 簡易教學） ----------
Screens.install = {
  sel: 0, n: 0, from: 'menu', busy: false,
  GUIDES: {
    ios: ['iPhone／iPad（Safari）', ['點畫面下方的「分享」按鈕 ⬆', '往下滑，選「加入主畫面」', '按右上角「新增」就完成了'], '※ 請用 Safari 開啟本頁'],
    android: ['Android（Chrome）', ['點右上角的「︙」選單', '選「安裝應用程式」或「加到主畫面」', '按「安裝」就完成了'], ''],
    desktop: ['電腦（Chrome／Edge）', ['點網址列右邊的「安裝」圖示 ⊕', '按「安裝」，桌面就會出現圖示'], ''],
  },
  enter(arg) { this.from = arg && arg.from || 'menu'; this.sel = 0; this.busy = false; },
  back() { App.goto('settings', { from: this.from, row: 'install' }); },
  frame() {
    if (this.from === 'game') { Game.draw(); UI.dim(0.78); } else menuBackdrop(0.72);
    UI.header('安裝到主畫面', 'INSTALL APP');
    const P = lay([30, 190, 660, 850], [160, 190, 1600, 720]);
    UI.panel(...P, 26);
    UI.wrap('安裝後可以從主畫面直接開啟：全螢幕、開啟更快，沒有網路也能玩。', P[0] + 30, 232, P[2] - 60, 32, 21, { fill: '#fff' });

    UI.begin(this);
    let y = 316;
    if (PWA.installed()) {
      UI.text('✓ 目前已經是 APP 模式', W / 2, y + 20, 26, { fill: '#8dff8a', stroke: null });
      y += 64;
    } else if (PWA.canPrompt()) {
      if (UI.button(this, '立即安裝', W / 2 - 170, y - 4, 340, 76, { lacquer: true, sub: 'INSTALL', size: 34 }) && !this.busy) {
        this.busy = true; PWA.install().finally(() => { this.busy = false; });
      }
      y += 96;
    }
    // 目前的裝置排第一個並標亮
    const mine = PWA.platform();
    // 直式：上下排；橫式：三欄並排
    const y0 = y;
    ['ios', 'android', 'desktop'].sort((a, b) => (b === mine) - (a === mine)).forEach((key, c) => {
      const [title, steps, note] = this.GUIDES[key], on = key === mine;
      const h = LAND ? 250 : 62 + steps.length * 38 + (note ? 30 : 0), gx = lay(50, 190 + c * 520), gw = lay(620, 500);
      if (LAND) y = y0;
      UI.panel(gx, y, gw, h, 18, on ? 'rgba(255,190,60,.18)' : 'rgba(255,255,255,.06)', on ? '#ffd23f' : 'rgba(255,255,255,.25)');
      UI.text(title, gx + 26, y + 32, 25, { align: 'left', fill: on ? '#fff27a' : '#cfe0ff', stroke: null, maxW: gw - 200 });
      if (on) { UI.panel(gx + gw - 150, y + 14, 132, 36, 18, '#e8502a', '#fff'); UI.text('你的裝置', gx + gw - 84, y + 32, 17, { stroke: null, maxW: 116 }); }
      steps.forEach((st, i) => {
        const sy = y + 74 + i * 38;
        ctx.fillStyle = on ? '#e8502a' : 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.arc(gx + 40, sy, 14, 0, 7); ctx.fill();
        UI.text(String(i + 1), gx + 40, sy + 1, 17, { stroke: null, raw: true });
        UI.text(st, gx + 66, sy, 20, { align: 'left', fill: '#fff', stroke: null, maxW: gw - 90 });
      });
      if (note) UI.text(note, gx + 26, y + h - 22, 17, { align: 'left', fill: '#ffb0a0', stroke: null, maxW: gw - 60 });
      y += h + 16;
    });

    if (UI.button(this, '返回', W / 2 - 110, lay(1062, 946), 220, 68, { back: true }) || Input.was('back')) this.back();
    UI.nav(this);
    UI.navHint();
  }
};

// ---------- 成就：上方總覽（已解鎖數、各等級）＋依分類列出全部成就（拖曳／滾輪／↑↓ 捲動） ----------
// 規格：docs/成就表.md；成就資料與判定：js/achieve.js
Screens.achievements = {
  sel: 0, n: 0, scroll: 0, target: 0, dragFrom: null, fresh: [],
  ROW: lay(104, 96), HEAD: 50,
  enter() {
    this.sel = 0; this.scroll = this.target = 0; this.dragFrom = null;
    this.fresh = Save.data.achNew.slice();   // 這次進來才標「新」，之後就算看過了
    if (Save.data.achNew.length) { Save.data.achNew = []; Save.store(); }
  },
  frame(dt) {
    menuBackdrop(0.72);
    UI.header('成就', 'ACHIEVEMENTS');
    const list = Achieve.list(), N = list.length, got = Achieve.unlockedCount();
    // ---- 總覽：已解鎖 x / N、進度條、各等級數量 ----
    const [sx, sy, sw] = lay([30, 186, 660], [360, 186, 1200]), sh = 74;
    UI.panel(sx, sy, sw, sh, 22, 'rgba(16,22,52,.9)', '#e8b64a');
    UI.text(tr('已解鎖 {0} / {1}', got, N), sx + 24, sy + 26, 24, { align: 'left', fill: '#ffd23f', stroke: null, raw: true });
    const bw = lay(250, 520);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(sx + 24, sy + 46, bw, 12, 6); ctx.fill();
    ctx.fillStyle = '#ffd23f'; rrect(sx + 24, sy + 46, Math.max(12, bw * got / N), 12, 6); ctx.fill();
    Object.keys(ACH_TIERS).forEach((k, i) => {
      const all = list.filter(a => a.tier === k), n = all.filter(a => Achieve.done(a.id)).length, tx = sx + sw - lay(370, 520) + i * lay(92, 130);
      achMedal(tx + 16, sy + sh / 2, 16, k, n > 0);
      UI.text(n + '/' + all.length, tx + 38, sy + sh / 2 + 1, 18, { align: 'left', fill: '#fff', stroke: null, raw: true });
    });
    if (COIN_SHOP) {   // 成就獎勵合計：橫式 =「成就獎勵」＋硬幣圖示＋數字（進度條右邊）；直式 = 只有硬幣圖示＋數字（「已解鎖」後面，右邊是等級數量）
      const total = list.filter(a => Achieve.done(a.id)).reduce((s, a) => s + ACH_TIERS[a.tier].coins, 0);
      if (LAND) {
        const lx0 = sx + 24 + bw + 20, lbl = tr('成就獎勵'); ctx.font = `18px ${FONT}`;
        UI.text(lbl, lx0, sy + 26, 18, { align: 'left', fill: '#fff27a', stroke: null, raw: true });
        coinText(total, lx0 + ctx.measureText(lbl).width + 8, sy + 26, 18);
      } else {
        ctx.font = `24px ${FONT}`;
        coinText(total, sx + 24 + ctx.measureText(tr('已解鎖 {0} / {1}', got, N)).width + 16, sy + 26, 18);
      }
    }
    // ---- 清單（分類標題＋成就列） ----
    const [lx, ly, lw, lh] = lay([30, 274, 660, 880], [360, 274, 1200, 690]);
    const rows = [];
    ACH_CATS.forEach((c, ci) => { const as = list.filter(a => a.cat === ci); if (as.length) { rows.push({ head: c, n: as.filter(a => Achieve.done(a.id)).length, of: as.length }); as.forEach(a => rows.push({ a })); } });
    const total = rows.reduce((s, r) => s + (r.head ? this.HEAD : this.ROW), 0), maxS = Math.max(0, total - lh);
    // 捲動：拖曳跟著手指；滾輪、↑↓ 一次一列；平滑移動
    const drag = Input.dragY();
    if (drag && UI.inside(drag.x, drag.y, lx, ly, lw, lh)) { if (this.dragFrom === null) this.dragFrom = this.target; this.target = this.dragFrom - drag.dy; }
    else this.dragFrom = null;
    if (Input.was('down')) this.target += this.ROW * 2;
    if (Input.was('up')) this.target -= this.ROW * 2;
    this.target = clamp(this.target, 0, maxS);
    this.scroll += (this.target - this.scroll) * Math.min(1, dt * 14);
    ctx.save(); ctx.beginPath(); ctx.rect(lx - 6, ly, lw + 12, lh); ctx.clip();
    let y = ly - this.scroll;
    for (const r of rows) {
      const h = r.head ? this.HEAD : this.ROW;
      if (y + h > ly - 4 && y < ly + lh + 4) {
        if (r.head) {
          UI.text(tr(r.head), lx + 8, y + 30, 22, { align: 'left', fill: '#ffe8b0', sw: 5 });
          UI.text(r.n + ' / ' + r.of, lx + lw - 8, y + 30, 18, { align: 'right', fill: '#cfd8ff', stroke: null, raw: true });
        } else this.row(r.a, lx, y + 4, lw, h - 10);
      }
      y += h;
    }
    ctx.restore();
    if (maxS > 0) {   // 右側捲軸
      const th = Math.max(40, lh * lh / total), ty = ly + (lh - th) * (this.scroll / maxS);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(lx + lw + 10, ly, 6, lh, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,210,63,.7)'; rrect(lx + lw + 10, ty, 6, th, 3); ctx.fill();
    }
    UI.begin(this); this.sel = 0;
    if (UI.button(this, '返回主選單', W / 2 - 140, lay(1176, 992), 280, 66, { back: true }) || Input.was('back')) App.goto('menu');
    UI.hint(Input.touchMode ? '上下滑動捲動' : '↑↓ 捲動　ESC 返回');
  },
  // 一列成就：等級獎牌、名稱、條件；右邊是進度條或達成日期
  row(a, x, y, w, h) {
    const done = Achieve.done(a.id), secret = a.hidden && !done, T = ACH_TIERS[a.tier];
    UI.panel(x, y, w, h, 18, done ? 'rgba(40,34,20,.92)' : 'rgba(16,22,52,.88)', done ? T.color : 'rgba(255,255,255,.22)');
    achMedal(x + 46, y + h / 2, lay(28, 26), a.tier, done);
    const tx = x + 92, right = lay(170, 300);
    UI.text(secret ? '？？？' : Achieve.name(a), tx, y + h * 0.36, lay(25, 26), { align: 'left', fill: done ? '#fff' : '#dfe6ff', stroke: null, raw: true, maxW: w - 92 - right - 16 });
    UI.text(secret ? tr('隱藏成就：達成後揭曉') : Achieve.desc(a), tx, y + h * 0.72, lay(17, 18), { align: 'left', fill: done ? '#ffe8b0' : '#9aa6d0', stroke: null, raw: true, maxW: w - 92 - right - 16 });
    const rx = x + w - right, cy = y + h / 2;
    if (done) {
      const d = new Date(Save.data.achievements[a.id]);
      UI.text('✓ ' + tr('已達成'), x + w - 20, cy - 10, 20, { align: 'right', fill: '#8dff8a', stroke: null, raw: true });
      UI.text(d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate(), x + w - 20, cy + 16, 15, { align: 'right', fill: '#cfd8ff', stroke: null, raw: true });
      if (this.fresh.includes(a.id)) { UI.panel(x + w - 66, y - 8, 52, 26, 13, '#e8302a', '#fff'); UI.text(tr('新'), x + w - 40, y + 5, 15, { fill: '#fff', stroke: null, raw: true }); }
    } else if (a.prog && !secret) {
      const [c, g] = a.prog();
      if (g > 1) {
        const bw = right - 30;
        ctx.fillStyle = 'rgba(255,255,255,.14)'; rrect(rx, cy + 4, bw, 10, 5); ctx.fill();
        ctx.fillStyle = T.color; if (c > 0) { rrect(rx, cy + 4, Math.max(10, bw * c / g), 10, 5); ctx.fill(); }
        UI.text(c + ' / ' + g, rx + bw, cy - 12, 17, { align: 'right', fill: '#dfe6ff', stroke: null, raw: true });
      } else UI.text(tr('未達成'), x + w - 20, cy + 1, 18, { align: 'right', fill: '#7a86b0', stroke: null, raw: true });
    } else UI.text(tr('未達成'), x + w - 20, cy + 1, 18, { align: 'right', fill: '#7a86b0', stroke: null, raw: true });
  }
};

// 鎖頭圖示（還沒購買的 VOL）：金色鎖身＋鎖環，中心在 (cx, cy)，s = 縮放
function drawLock(cx, cy, s = 1) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3e2210'; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(0, -8, 13, Math.PI, 0); ctx.lineTo(13, 2); ctx.moveTo(-13, -8); ctx.lineTo(-13, 2); ctx.stroke();
  ctx.strokeStyle = '#d8dce8'; ctx.lineWidth = 6; ctx.stroke();   // 鎖環（銀色）
  rrect(-22, -2, 44, 34, 7); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#3e2210'; ctx.stroke();
  ctx.fillStyle = '#3e2210'; ctx.beginPath(); ctx.arc(0, 11, 5, 0, 7); ctx.fill(); ctx.fillRect(-2.5, 12, 5, 11);   // 鑰匙孔
  ctx.restore();
}
// 星級（最多 5 顆）
// 曲目獎章：最佳評價的圓形印章（特上～修行）
function drawMedalStamp(rIdx, cx, cy, r, rot = -0.14) {
  const R = RATINGS[rIdx]; if (!R) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(255,250,238,.92)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.strokeStyle = R.color; ctx.lineWidth = Math.max(2, r * 0.12); ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, 7); ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.04); ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, 7); ctx.stroke();
  const st = tr(R.stamp);
  UI.text(st, 0, 1, st.length > 1 ? r * 0.62 : r * 0.95, { fill: R.color, stroke: null, raw: true, maxW: r * 1.3 });
  ctx.restore();
}
// 全連擊／全 GREAT 的彩帶（ALL GREAT 是彩虹色）
function drawMedalBadge(kind, cx, cy, w, h) {
  ctx.save();
  if (kind === 'ag') {
    const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    ['#ff5a7a', '#ffb84a', '#ffe14a', '#7affb0', '#7ad8ff', '#c890ff'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = g;
  } else ctx.fillStyle = '#e8b64a';
  rrect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  UI.text(kind === 'ag' ? 'ALL GREAT' : 'FULL COMBO', cx, cy + 1, h * 0.62, { fill: '#5a2a00', stroke: null, raw: true, maxW: w - 8 });
  ctx.restore();
}
// 選曲卡片／詳細資料用：印章＋（全 GREAT 優先，否則全連擊）彩帶
function drawSongMedal(id, cx, cy, r) {
  const m = Save.data.medals[id]; if (!m || m.r === undefined || m.r > 9) return;
  drawMedalStamp(m.r, cx, cy, r);
  if (m.ag || m.fc) drawMedalBadge(m.ag ? 'ag' : 'fc', cx, cy + r + 6, r * 3.1, r * 0.62);
}
function drawStars(cx, cy, n, size, max = 5) {
  max = Math.max(max, n);   // 5 星歌選困難 = 第 6 顆（紅色）
  ctx.save(); ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const gap = size * 1.15, x0 = cx - (max - 1) * gap / 2;
  for (let i = 0; i < max; i++) {
    const on = i < n, x = x0 + i * gap, red = i >= 5;
    ctx.lineWidth = size * 0.28; ctx.strokeStyle = on ? (red ? '#5a0008' : '#5a2a00') : 'rgba(40,20,0,.35)'; ctx.strokeText('★', x, cy);
    ctx.fillStyle = on ? (red ? '#ff3a3a' : '#ffc21a') : 'rgba(255,255,255,.28)'; ctx.fillText('★', x, cy);
  }
  ctx.restore();
}
// ---------- 節奏分析 ----------
// ① 音感等級（蓋章＋評語）② 進步曲線（最近 30 場準確度）③ 時間差分布（早／剛好／晚）＋建議 ④ 各星級命中率＋統計小卡
// 直式由上往下排；橫式左右兩欄
const RFS = s => s * lay(1, 1.3);   // 節奏分析的字級（橫式放大）
Screens.rhythm = {
  sel: 0, n: 0, t: 0, a: null,
  R: lay({ lvl: [30, 184, 660, 160], curve: [30, 356, 660, 232], hist: [30, 600, 660, 250], stat: [30, 862, 660, 196] },
         { lvl: [110, 170, 840, 210], curve: [110, 400, 840, 470], hist: [970, 170, 840, 440], stat: [970, 630, 840, 240] }),
  enter() { this.t = 0; this.sel = 0; this.a = Rhythm.analyze(); chef.idlePose = 'wave'; },
  frame(dt) {
    this.t += dt;
    menuBackdrop(0.74);
    UI.header('節奏分析', 'RHYTHM REPORT');
    const a = this.a, R = this.R;
    if (!a) {
      UI.panel(60, lay(420, 380), W - 120, 200, 26);
      UI.text('♪', W / 2, lay(480, 440), 54, { fill: '#ffd23f', raw: true });
      UI.text('先玩幾首歌，就會出現你的節奏分析喔！', W / 2, lay(560, 520), RFS(26), { fill: '#fff', stroke: null, maxW: W - 180 });
    } else {
      const k = i => ease(clamp((this.t - i * 0.12) * 3, 0, 1));   // 各區依序淡入
      ctx.save(); ctx.globalAlpha = k(0); this.level(a, ...R.lvl); ctx.restore();
      ctx.save(); ctx.globalAlpha = k(1); this.curve(a, ...R.curve, k(1)); ctx.restore();
      ctx.save(); ctx.globalAlpha = k(2); this.hist(a, ...R.hist, k(2)); ctx.restore();
      ctx.save(); ctx.globalAlpha = k(3); this.stats(a, ...R.stat); ctx.restore();
    }
    UI.begin(this);
    if (UI.button(this, '返回', W / 2 - 110, lay(1090, 940), 220, 66, { back: true }) || Input.was('back')) App.goto('menu');
    UI.nav(this);
    UI.navHint();
  },
  // ① 音感等級
  level(a, x, y, w, h) {
    const L = a.level;
    UI.panel(x, y, w, h, 24, 'rgba(255,248,232,.95)', L.color);
    // 圓形印章
    const cx = x + 86, cy = y + h / 2, r = Math.min(66, h / 2 - 14), s = 1 + (1 - ease(clamp(this.t * 3, 0, 1))) * 0.6;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12); ctx.scale(s, s);
    ctx.strokeStyle = L.color; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r - 8, 0, 7); ctx.stroke();
    UI.text(tr('音感'), 0, -r * 0.36, r * 0.32, { fill: L.color, stroke: null, raw: true });
    const nm = tr(L.name); UI.text(nm, 0, r * 0.18, r * 0.42, { fill: L.color, stroke: null, raw: true, maxW: r * 1.6 });
    ctx.restore();
    const tx = x + 176, tw = w - 200;
    UI.text(tr('音感等級'), tx, y + 28, RFS(16), { align: 'left', fill: '#8a6a4a', stroke: null, raw: true });
    UI.text(tr('最近 {0} 場', a.recentN), x + w - 22, y + 28, RFS(15), { align: 'right', fill: '#8a6a4a', stroke: null, raw: true });
    UI.text(tr(L.name), tx, y + 66, lay(36, 42), { align: 'left', fill: L.color, stroke: null, raw: true, maxW: tw });
    UI.wrap(L.text, tx, y + lay(108, 118), tw, lay(26, 30), lay(18, 21), { fill: '#5a3a1a' });
    if (a.count < 5) UI.text(tr('資料還不多，結果僅供參考'), x + w - 22, y + h - 18, RFS(14), { align: 'right', fill: '#b06a3a', stroke: null, raw: true });
  },
  // ② 進步曲線：最近 30 場的準確度
  curve(a, x, y, w, h, k) {
    UI.panel(x, y, w, h, 22);
    UI.text(tr('進步曲線（準確度）'), x + 24, y + 28, RFS(20), { align: 'left', fill: '#7fe4ff', stroke: null, raw: true });
    UI.text(tr('準確度') + ' ' + Math.round(a.acc) + '%', x + w - 24, y + 28, RFS(20), { align: 'right', fill: '#ffd23f', stroke: null, raw: true });
    const gx = x + 64, gy = y + 56, gw = w - 92, gh = h - 92, pts = a.curve, N = pts.length;
    const Y = v => gy + gh - clamp(v, 0, 100) / 100 * gh, X = i => (N === 1 ? gx + gw / 2 : gx + i / (N - 1) * gw);
    // 格線＋刻度
    ctx.lineWidth = 1;
    [0, 50, 100].forEach(v => { ctx.strokeStyle = v === 100 ? 'rgba(255,214,90,.35)' : 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.moveTo(gx, Y(v)); ctx.lineTo(gx + gw, Y(v)); ctx.stroke();
      UI.text(v + '%', gx - 10, Y(v), RFS(13), { align: 'right', fill: '#cfd8ff', stroke: null, raw: true }); });
    // 線條逐漸畫出（k = 0 → 1）
    const shown = Math.max(1, Math.ceil(N * k));
    ctx.save(); ctx.beginPath(); ctx.moveTo(X(0), Y(pts[0]));
    for (let i = 1; i < shown; i++) ctx.lineTo(X(i), Y(pts[i]));
    const line = new Path2D(); line.moveTo(X(0), Y(pts[0])); for (let i = 1; i < shown; i++) line.lineTo(X(i), Y(pts[i]));
    ctx.lineTo(X(shown - 1), gy + gh); ctx.lineTo(X(0), gy + gh); ctx.closePath();
    const gr = ctx.createLinearGradient(0, gy, 0, gy + gh); gr.addColorStop(0, 'rgba(255,184,74,.45)'); gr.addColorStop(1, 'rgba(255,184,74,0)');
    ctx.fillStyle = gr; ctx.fill();
    ctx.strokeStyle = '#ffb84a'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke(line);
    for (let i = 0; i < shown; i++) { const last = i === N - 1; ctx.fillStyle = last ? '#fff27a' : '#ffb84a'; ctx.beginPath(); ctx.arc(X(i), Y(pts[i]), last ? 7 : 4, 0, 7); ctx.fill(); }
    ctx.restore();
    UI.text(tr('舊'), gx, gy + gh + 20, RFS(13), { fill: '#cfd8ff', stroke: null, raw: true });
    UI.text(tr('最新'), gx + gw, gy + gh + 20, RFS(13), { fill: '#fff27a', stroke: null, raw: true });
    if (a.trend !== null) UI.text(tr(a.trend >= 0 ? '最近 5 場 ▲{0}%' : '最近 5 場 ▼{0}%', Math.abs(Math.round(a.trend))), x + w / 2, gy + gh + 20, RFS(14), { fill: a.trend >= 0 ? '#8dff8a' : '#ff9a8a', stroke: null, raw: true });
  },
  // ③ 時間差分布（山形長條）＋平均位置＋建議
  hist(a, x, y, w, h, k) {
    UI.panel(x, y, w, h, 22);
    UI.text(tr('時間差分布'), x + 24, y + 28, RFS(20), { align: 'left', fill: '#7fe4ff', stroke: null, raw: true });
    const bias = Math.round(a.bias);
    UI.text(tr('平均 {0}', (bias > 0 ? tr('晚') + ' ' : bias < 0 ? tr('早') + ' ' : '') + Math.abs(bias) + 'ms') + '　±' + Math.round(a.sd) + 'ms', x + w - 24, y + 28, RFS(18), { align: 'right', fill: '#ffd23f', stroke: null, raw: true });
    const advH = a.advice.length * lay(26, 30) + 14, gx = x + 30, gw = w - 60, gy = y + 56, gh = h - 56 - 40 - advH, B = a.hist.length, bw = gw / B;
    const mx = Math.max(1, ...a.hist);
    a.hist.forEach((v, i) => {
      const bh = v / mx * gh * k, d = Math.abs(i + 0.5 - B / 2);   // 離中間越遠越偏紅
      ctx.fillStyle = d < 1 ? '#8dff8a' : d < 2 ? '#ffe066' : d < 4 ? '#ffb84a' : '#ff7a6a';
      rrect(gx + i * bw + 3, gy + gh - bh, bw - 6, Math.max(2, bh), 4); ctx.fill();
    });
    // 中線（剛好）與平均位置的三角形
    const zx = gx + gw / 2, mxp = gx + clamp((a.bias + Rhythm.BIN * B / 2) / (Rhythm.BIN * B), 0, 1) * gw;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(zx, gy - 4); ctx.lineTo(zx, gy + gh); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mxp, gy + gh + 4); ctx.lineTo(mxp - 8, gy + gh + 16); ctx.lineTo(mxp + 8, gy + gh + 16); ctx.fill();
    UI.text('◀ ' + tr('早'), gx, gy + gh + 28, RFS(15), { align: 'left', fill: '#7fb8ff', stroke: null, raw: true });
    UI.text(tr('剛好'), zx, gy + gh + 28, RFS(15), { fill: '#8dff8a', stroke: null, raw: true });
    UI.text(tr('晚') + ' ▶', gx + gw, gy + gh + 28, RFS(15), { align: 'right', fill: '#ff9a8a', stroke: null, raw: true });
    a.advice.forEach((s, i) => UI.text('💡 ' + s, x + 24, gy + gh + 40 + lay(26, 30) * (i + 0.5) + 8, lay(17, 20), { align: 'left', fill: '#fff', stroke: null, raw: true, maxW: w - 48 }));
  },
  // ④ 各星級命中率＋統計小卡
  stats(a, x, y, w, h) {
    UI.panel(x, y, w, h, 22);
    const half = w * 0.5, rowH = (h - 40) / 5;
    UI.text(tr('各星級命中率'), x + 24, y + 24, RFS(17), { align: 'left', fill: '#7fe4ff', stroke: null, raw: true });
    a.stars.forEach((s, i) => {
      const yy = y + 44 + i * rowH + rowH / 2, bx = x + 86, bw = half - 120;
      UI.text('★' + s.st, x + 30, yy, RFS(16), { align: 'left', fill: '#ffd23f', stroke: null, raw: true });
      ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(bx, yy - 7, bw, 14, 7); ctx.fill();
      if (s.acc !== null) { ctx.fillStyle = s.acc >= 85 ? '#8dff8a' : s.acc >= 65 ? '#ffe066' : '#ff9a6a'; rrect(bx, yy - 7, Math.max(10, bw * s.acc / 100), 14, 7); ctx.fill(); }
      UI.text(s.acc === null ? '—' : Math.round(s.acc) + '%', bx + bw + 8, yy, RFS(14), { align: 'left', fill: '#fff', stroke: null, raw: true });
    });
    // 統計小卡（2×2＋最常玩）
    const T = a.totals, tiles = [['總場數', String(T.plays)], ['廣島燒', String(T.oko)], ['最高連擊', String(T.maxCombo)], ['GREAT', Math.round(a.great) + '%']];
    const tx = x + half + 10, tw = (half - 34) / 2, th = (h - 64) / 2;
    tiles.forEach(([l, v], i) => {
      const cx = tx + (i % 2) * (tw + 8), cy = y + 14 + Math.floor(i / 2) * (th + 6);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; rrect(cx, cy, tw, th, 12); ctx.fill();
      UI.text(tr(l), cx + tw / 2, cy + th * 0.3, RFS(14), { fill: '#cfd8ff', stroke: null, raw: true, maxW: tw - 10 });
      UI.text(v, cx + tw / 2, cy + th * 0.68, lay(26, 32), { fill: '#fff', stroke: null, raw: true, maxW: tw - 10 });
    });
    if (T.fav) UI.text(tr('最常玩') + '：' + songName(T.fav), tx + half / 2 - 12, y + h - 22, RFS(15), { fill: '#ffe8b0', stroke: null, raw: true, maxW: half - 30 });
  },
};

// ---------- CREDIT ----------
Screens.credits = {
  sel: 0, n: 0, t: 0, wisps: [], spawn: 0,
  enter() { this.t = 0; this.wisps = []; this.spawn = 0; chef.idlePose = 'wave'; Sound.startBgm(); },
  // 熱騰騰的蒸氣：從廣島燒表面冒出、左右搖曳著往上飄、慢慢變大變淡
  // 結算畫面也用（Screens.credits.steam.call(畫面, …)：各畫面用自己的 wisps / spawn）
  // 每一縷 = 沿著同一條 S 形軌跡的幾顆柔光（尾巴較細較淡），看起來像一絲絲捲起的熱氣
  steam(dt, cx, cy, col = '#ffffff', amul = 1) {   // col / amul：蒸氣顏色與濃度（淺色底上要用深一點的顏色）
    this.spawn -= dt;
    if (this.spawn <= 0) {
      this.spawn = ECO() ? 0.22 : 0.11;
      this.wisps.push({ x: cx + rand(-80, 80), y: cy + rand(-14, 8), age: 0, life: rand(1.5, 2.2), ph: rand(0, 6.3), amp: rand(10, 18), r: rand(14, 22), vy: rand(40, 56) });
    }
    const glow = Scene.glowSprite(col), TAIL = ECO() ? 2 : 4;
    ctx.save();
    for (const p of this.wisps) {
      p.age += dt;
      for (let j = 0; j < TAIL; j++) {
        const age = p.age - j * 0.09; if (age < 0) continue;
        const k = age / p.life; if (k >= 1) continue;
        const x = p.x + Math.sin(p.ph + age * 2.6) * p.amp * Math.min(1, k * 2) + (p.x - cx) * k * 0.3;
        const y = p.y - p.vy * age;
        const r = p.r * (1 + k * 1.6) * (1 - j * 0.15);
        ctx.globalAlpha = Math.min(1, k * 5) * (1 - k) * (1 - k) * 0.5 * amul * (1 - j * 0.2);   // 淡入 → 淡出
        ctx.drawImage(glow, x - r, y - r * 1.3, r * 2, r * 2.6);
      }
    }
    ctx.restore();
    this.wisps = this.wisps.filter(p => p.age < p.life);
  },
  frame(dt) {
    this.t += dt;
    menuBackdrop(0.6);
    UI.header('CREDIT', '製作名單');
    // 直式：名單在上、廣島燒在下；橫式：名單在左、廣島燒在右
    const L = lay({ panel: [60, 200, 600, 820], nx: W / 2, y0: 286, ox: W / 2, oy: 800, ty: 900 }, { panel: [360, 190, 1200, 700], nx: 700, y0: 300, ox: 1220, oy: 470, ty: 680 });
    UI.panel(...L.panel, 26);
    const line = (i, y, fn) => { const k = clamp((this.t - i * 0.15) * 4, 0, 1); ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 20); fn(y); ctx.restore(); };
    let y = L.y0, idx = 0;
    for (const [role, names] of CREDITS) {
      line(idx++, y, yy => UI.text(role, L.nx, yy, 30, { fill: '#7fe4ff', stroke: null }));
      y += 64;
      for (const n of names) { line(idx++, y, yy => UI.text(n, L.nx, yy, 42, { fill: '#fff', raw: true })); y += 60; }
      y += 30;
    }
    const okoK = clamp((this.t - idx * 0.15) * 4, 0, 1);
    line(idx++, L.oy, yy => drawImgW(IMG.okonomiyaki, L.ox, yy, lay(240, 300)));
    if (okoK >= 1) this.steam(dt, L.ox, L.oy - 10);
    line(idx++, L.ty, yy => UI.text('大王焼き  リズム屋台', L.ox, yy, 26, { fill: '#ffe8b0', stroke: null, raw: true }));
    line(idx++, L.ty + 44, yy => UI.text("©Arc's Concept Games", L.ox, yy, 20, { fill: '#cfd8ff', stroke: null, raw: true }));
    line(idx++, L.ty + 76, yy => UI.text(tr('樂曲') + '：' + tr('全曲原創（AI 協助製作）'), L.ox, yy, 18, { fill: '#cfd8ff', stroke: null, raw: true, maxW: lay(560, 520) }));
    line(idx++, L.ty + 104, yy => UI.text(tr('語音') + '：' + VOICE_CREDIT, L.ox, yy, 18, { fill: '#cfd8ff', stroke: null, raw: true, maxW: lay(560, 520) }));
    UI.begin(this);
    if (UI.button(this, '返回', W / 2 - 110, lay(1076, 940), 220, 70, { back: true }) || Input.was('back')) App.goto('menu');
    UI.nav(this);
  }
};

// ---------- 結算 ----------
Screens.result = {
  // 節奏評價：紅色印章（分數數完後「咚」地蓋下）＋稱號＋評語
  drawRating(r, x, y, w, t) {
    const R = RATINGS[r.rating], k = clamp((t - 1.45) / 0.22, 0, 1);
    if (k <= 0) return;
    if (!this.stamped) {
      this.stamped = true;
      if (A.ctx) {
        SND.don(A.ctx.currentTime, 0.9, A.ui); nz(A.ctx.currentTime, 0.06, 0.3, A.ui, { type: 'lowpass', f: 600 });
        Sound.say('thanks', A.ui, A.ctx.currentTime + 0.35);   // 蓋章後主角道謝「おおきに！」
      }
    }
    // 底框（和紙色帶）
    ctx.fillStyle = 'rgba(200,50,30,.07)'; rrect(x + 20, y, w - 40, 90, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(200,50,30,.35)'; ctx.lineWidth = 2; rrect(x + 20, y, w - 40, 90, 14); ctx.stroke();
    // 印章：從 2 倍大蓋下來，略微傾斜
    const cx = x + 74, cy = y + 45, s = 1 + (1 - ease(k)) * 1.2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, k * 1.5);
    ctx.strokeStyle = R.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 33, 0, 7); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 27, 0, 7); ctx.stroke();
    const st = tr(R.stamp);
    UI.text(st, 0, 1, st.length > 1 ? 20 : 30, { fill: R.color, stroke: null, raw: true, maxW: 48 });
    ctx.restore();
    // 稱號＋評語
    const a = clamp((t - 1.6) / 0.3, 0, 1);
    UI.text(tr('節奏評價'), x + 126, y + 18, 13, { align: 'left', fill: '#8a6a4a', stroke: null, raw: true, alpha: a });
    UI.text(tr(R.title), x + 126, y + 40, 24, { align: 'left', fill: R.color, stroke: null, raw: true, maxW: w - 160, alpha: a });
    UI.text(Math.round(r.ratio * 100) + '%', x + w - 36, y + 18, 13, { align: 'right', fill: '#8a6a4a', stroke: null, raw: true, alpha: a });
    ctx.save(); ctx.globalAlpha *= a;
    // 評語一行放不下（英文較長）時縮小字級排兩行，不超出底框
    const two = UI.lines(tr(R.desc), w - 166, 15).length > 1;
    UI.wrap(R.desc, x + 126, two ? y + 62 : y + 68, w - 166, 17, two ? 13 : 15, { fill: '#5a3a1a' });
    ctx.restore();
  },
  // 結算的廣島燒圖（中心 ox, oy、寬 w）：依節奏評價加效果，蓋章後（約 1.6 秒）才揭曉
  //   傳說的鐵板之神（特上）：背後金色光暈、表面一道光掃過、四周金白星星閃爍、金粉往上飄（＋白色熱氣）
  //   鐵板上的災難（修行）：疊上焦黑（遊戲中烤焦的同款）、冒灰黑色焦煙、偶爾跳出火星
  //   其他：有做出廣島燒才冒白色熱氣
  drawOko(r, ox, oy, w, t, dt) {
    const img = IMG.okonomiyaki; if (!img) return;
    const h = w * img.height / img.width, reveal = ease(clamp((t - 1.6) / 0.6, 0, 1));
    const god = r.rating === 0 && reveal > 0, burnt = r.rating === RATINGS.length - 1 && reveal > 0;
    if (god) {   // 金色光暈（一明一暗）
      // 米白卡片上用加亮混色看不出來，改用一般疊色的金黃色半透明圈
      const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, w * 0.75);
      gr.addColorStop(0, `rgba(255,200,60,${0.45 * reveal * (0.8 + 0.2 * Math.sin(t * 3))})`); gr.addColorStop(1, 'rgba(255,200,60,0)');
      ctx.save(); ctx.translate(ox, oy); ctx.scale(1, 0.72); ctx.translate(-ox, -oy); ctx.fillStyle = gr; ctx.fillRect(ox - w, oy - w, w * 2, w * 2); ctx.restore();
    }
    if (god) {   // 表面一道光掃過（每 2.4 秒一次；只亮在廣島燒上）
      if (!this.okoFx) { this.okoFx = document.createElement('canvas'); this.okoFx.width = img.width; this.okoFx.height = img.height; }
      const g = this.okoFx.getContext('2d'), sp = ((t - 1.6) % 2.4) / 0.9;
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, img.width, img.height); g.drawImage(img, 0, 0);
      if (sp > 0 && sp < 1) {
        const bx = -120 + sp * (img.width + 240), gr = g.createLinearGradient(bx - 70, 0, bx + 70, 0);
        gr.addColorStop(0, 'rgba(255,250,220,0)'); gr.addColorStop(0.5, 'rgba(255,250,220,.75)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
        g.globalCompositeOperation = 'source-atop'; g.save(); g.transform(1, 0, -0.4, 1, 0, 0); g.fillStyle = gr; g.fillRect(bx - 70, 0, 140 + img.height, img.height); g.restore();
      }
      ctx.drawImage(this.okoFx, ox - w / 2, oy - h / 2, w, h);
    } else drawImgW(img, ox, oy, w);
    if (burnt) drawImgW(burntImg('okonomiyaki'), ox, oy, w, 0, 0.72 * reveal);   // 燒焦（保留一點原色，看得出是廣島燒）
    // 熱氣：燒焦 = 灰黑色焦煙（沒做出來也會冒）；其他有做出來 = 白色熱氣
    if (burnt) Screens.credits.steam.call(this, dt, ox, oy - 22, '#4a423c', 1.9 * reveal);
    else if (r.oko >= 1) Screens.credits.steam.call(this, dt, ox, oy - 22, '#ffffff', 1.8);
    if (burnt) {   // 火星：從焦掉的表面跳起、往上飄、熄滅
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const ph = (t * 0.55 + i / 7) % 1, x = ox + Math.sin(i * 12.9898) * w * 0.32 + Math.sin(t * 3 + i) * 6, y = oy - 10 - ph * 70;
        ctx.globalAlpha = reveal * (1 - ph) * (0.5 + 0.5 * Math.sin(t * 20 + i * 3));
        ctx.fillStyle = i % 2 ? '#ff7a2a' : '#ffb347'; ctx.beginPath(); ctx.arc(x, y, 2.6 - ph * 1.4, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
    if (god) {   // 星星（輪流閃爍、慢慢旋轉）＋金粉
      const star = (x, y, rr, col, rot, edge) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath();
        for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4, q = j % 2 ? rr * 0.26 : rr; ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
        ctx.closePath(); if (edge) { ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = edge; ctx.stroke(); } ctx.fill(); ctx.restore();
      };
      ctx.save();
      [[-0.55, -0.55, 0], [0.5, -0.75, 1.3], [0.62, 0.15, 2.6], [-0.62, 0.25, 3.9], [0.1, -0.95, 5.2], [-0.25, 0.62, 0.7], [0.35, 0.58, 2.0]].forEach(([u, v, ph], i) => {
        const q = Math.max(0, Math.sin(t * 2.6 + ph)); if (q < 0.05) return;
        const x = ox + u * w * 0.62, y = oy + v * h * 0.75, rr = (7 + q * 11) * (i % 3 === 0 ? 1.25 : 1);
        ctx.globalAlpha = reveal * q;
        star(x, y, rr, '#ffd23f', t * 0.6 + ph, '#d0801a'); star(x, y, rr * 0.5, '#fffbe6', t * 0.6 + ph);
      });
      for (let i = 0; i < 10; i++) {   // 金粉
        const ph = (t * 0.35 + i / 10) % 1;
        ctx.globalAlpha = reveal * Math.sin(ph * Math.PI) * 0.9;
        ctx.fillStyle = i % 3 ? '#ffe27a' : '#fff6c8';
        ctx.beginPath(); ctx.arc(ox + Math.sin(i * 7.31) * w * 0.45 + Math.sin(t * 2 + i) * 8, oy + h * 0.2 - ph * 110, 2.2, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  },
  sel: 0, n: 0, t: 0, r: null, newRecord: false,
  enter() {
    this.r = Game.result; this.t = 0; this.sel = 0; this.stamped = false; this.wisps = []; this.spawn = 0;
    this.song = songById(this.r.song);
    this.rid = recId(this.song, Game.diff);   // 這一局難度的紀錄 id
    this.newRecord = !!this.r.newRecord;      // 結束時已經比過自己的最高分（Game.finish）
    Sound.duck(false);
    SND.fanfare(A.ctx.currentTime + 0.2);
    const o = this.r.oko;
    chef.queue = []; chef.idlePose = o >= 8 ? 'cheer' : o >= 3 ? 'nice' : 'bad';
  },
  leave() { chef.idlePose = 'wave'; },
  frame(dt) {
    this.t += dt;
    const r = this.r, t = this.t;
    menuBackdrop(0.55);
    const k = ease(clamp(t / 0.5, 0, 1));
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 40);
    const x = lay(50, 340), y = lay(120, 170), w = 620, h = 700, cx = x + w / 2;   // 橫式：成績卡在左、按鈕在右
    ctx.fillStyle = 'rgba(255,250,238,.97)'; rrect(x, y, w, h, 28); ctx.fill(); ctx.strokeStyle = '#1f2a5a'; ctx.lineWidth = 6; ctx.stroke();
    UI.ribbon(cx, y + 4, '本日營業結束！', 34, 380);
    { const D = DIFFS[Game.diff === undefined ? 1 : Game.diff];   // 左上：這一局的難度
      UI.panel(x + 22, y + 36, 112, 44, 22, D.color, '#fff'); UI.text(D.name, x + 78, y + 59, 22, { fill: '#fff', stroke: 'rgba(0,0,0,.35)', sw: 4 }); }
    this.drawOko(r, cx - 70, y + 140, 240, t, dt);   // 廣島燒（依評價：鐵板之神閃閃發亮、災難燒焦冒煙）
    UI.text('×' + r.oko, cx + 150, y + 150, 72, { fill: '#c8321e', stroke: '#fff', sw: 10 });
    UI.text('完成的廣島燒', cx, y + 242, 20, { fill: '#6b4a2a', stroke: null });
    UI.text('SCORE', cx, y + 290, 22, { fill: '#6b4a2a', stroke: null });
    const cnt = clamp((t - 0.4) / 1.0, 0, 1);
    UI.text(String(Math.floor(r.score * cnt)), cx, y + 344, 64, { fill: '#1f2a5a', stroke: null });
    if (this.newRecord && t > 1.4) UI.text('★ NEW RECORD ★', cx, y + 400, 26, { fill: '#d6462a', stroke: null, alpha: 0.6 + 0.4 * Math.sin(Game.time * 6) });
    else UI.text('HISCORE  ' + pad(Save.best(this.rid), 7), cx, y + 400, 22, { fill: '#6b4a2a', stroke: null });
    ['GREAT', 'NICE', 'GOOD', 'BAD'].forEach((g, i) => {
      const gx = x + 80 + i * 153;
      drawGradeText(g, gx, y + 466, 1, 1, 26);
      UI.text(String(r.grades[g]), gx, y + 514, 34, { fill: '#1f2a5a', stroke: null });
    });
    UI.text('MAX COMBO  ' + r.maxCombo, cx, y + 556, 24, { fill: '#1f2a5a', stroke: null });
    if ((r.ag || r.fc) && t > 1.4) {   // 這一場達成全連擊／全 GREAT（第一次達成加 NEW!）
      drawMedalBadge(r.ag ? 'ag' : 'fc', cx + 200, y + 556, 150, 28);
      if (r.ag ? r.newAg : r.newFc) UI.text('NEW!', cx + 200, y + 579, 17, { fill: '#d6462a', stroke: '#fff', sw: 4, raw: true, alpha: 0.6 + 0.4 * Math.sin(Game.time * 6) });
    }
    if (r.hits >= 5) UI.text(tr('平均時間差：{0} {1}ms', tr(r.avgErr >= 0 ? '晚' : '早'), Math.abs(r.avgErr)), cx, y + 586, 16, { fill: '#8a6a4a', stroke: null, raw: true });
    this.drawRating(r, x, y + 604, w, t);
    // 遊玩獎勵：難度牌和分享鈕中間（評價蓋章後跳出來）；首次過關／首次全連擊的加成另列一行
    if (r.coins && t > 1.75) {
      const k2 = ease(clamp((t - 1.75) / 0.25, 0, 1)), s2 = 1 + (1 - k2) * 0.4, px = x + 302;
      ctx.save(); ctx.globalAlpha *= k2; ctx.translate(px, y + 58); ctx.scale(s2, s2);
      UI.panel(-130, -22, 260, 44, 22, '#1f2a5a', '#ffd23f');
      coinText('+' + r.coins.total, 0, 0, 26, { align: 'center' });
      ctx.restore();
      // 加成明細：「×廣島燒數」下面（右側空位），一項一行
      [r.coins.first && tr('首次過關 +{0}', r.coins.first), r.coins.fc && tr('首次全連擊 +{0}', r.coins.fc)].filter(Boolean)
        .forEach((s, i) => UI.text('● ' + s, cx + 150, y + 200 + i * 22, 16, { fill: '#c8321e', stroke: null, raw: true, alpha: k2, maxW: 150 }));
    }
    ctx.restore();

    if (t < 1.6) { if (t > 0.4 && (Input.taps.length || Input.was('confirm'))) { this.t = 1.6; Input.taps.length = 0; Input.pressed.delete('confirm'); } return; }
    UI.begin(this);
    const BX = lay(160, 1180), BY = i => lay(890 + i * 84, 360 + i * 110);   // 三顆按鈕
    if (UI.button(this, '再玩一次', BX, BY(0), 400, 64, { lacquer: true })) App.goto('game', { song: this.song });
    if (UI.button(this, '返回選擇樂曲', BX, BY(1), 400, 64)) App.goto('songs');
    if (UI.button(this, '回主選單', BX, BY(2), 400, 64, { back: true })) App.goto('menu');
    // 成績卡右上角：分享成績圖（手機叫出分享選單，PC 下載圖片）
    if (UI.button(this, '分享', x + w - 150, y + 34, 132, 52, { size: 24 })) Share.result(r, this.song);
    UI.nav(this);
  }
};
