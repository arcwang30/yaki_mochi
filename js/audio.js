'use strict';

// ===== 音訊：全部即時合成（太鼓、三味線、笛、鉦），不需音檔 =====
// 三條音軌：music（樂曲）、sfx（遊戲中音效）、ui（選單音效）；音量 0~5 存在 Save
const A = { ctx: null, noise: null, master: null, music: null, sfx: null, ui: null };

function env(g, t, att, peak, dec) {
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec);
}
function osc(type, f, t, dur, peak, dest, o = {}) {
  const C = A.ctx, os = C.createOscillator(), g = C.createGain(), att = o.att || 0.004;
  os.type = type; os.frequency.setValueAtTime(f, t);
  if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + (o.bend || dur));
  env(g, t, att, peak, dur); os.connect(g); g.connect(dest); os.start(t); os.stop(t + att + dur + 0.05);
}
function nz(t, dur, peak, dest, o = {}) {
  const C = A.ctx, s = C.createBufferSource(), fl = C.createBiquadFilter(), g = C.createGain();
  s.buffer = A.noise; fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 1000, t);
  if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + dur); fl.Q.value = o.q || 1;
  env(g, t, 0.002, peak, dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}

// 通用音色：波形＋（可選）低通濾波掃頻、顫音、延音
function voice(type, f, t, dur, peak, dest, o = {}) {
  const C = A.ctx, os = C.createOscillator(), g = C.createGain(), att = o.att || 0.005, hold = o.hold || 0;
  os.type = type; os.frequency.setValueAtTime(f, t);
  if (o.detune) os.detune.value = o.detune;
  let node = os;
  if (o.lp) {
    const fl = C.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = o.q || 1;
    fl.frequency.setValueAtTime(o.lp, t);
    if (o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo, t + (o.lpT || dur));
    os.connect(fl); node = fl;
  }
  let lfo = null;
  if (o.vib) {
    lfo = C.createOscillator(); const lg = C.createGain();
    lfo.frequency.value = o.vibRate || 5.5; lg.gain.value = f * o.vib;
    lfo.connect(lg); lg.connect(os.frequency); lfo.start(t + (o.vibDelay || 0)); lfo.stop(t + att + hold + dur + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att);
  if (hold) g.gain.setValueAtTime(peak, t + att + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + att + hold + dur);
  node.connect(g); g.connect(dest); os.start(t); os.stop(t + att + hold + dur + 0.05);
}
const m2f = n => 440 * Math.pow(2, (n - 69) / 12);   // MIDI 音高 → 頻率

// 樂器與音效（t = AudioContext 時間）
const SND = {
  // ---- 鼓組 ----
  kick(t, v = 1, dest = A.music) { osc('sine', 130, t, 0.26, 0.95 * v, dest, { to: 42, bend: 0.12 }); nz(t, 0.012, 0.35 * v, dest, { type: 'highpass', f: 2500 }); },
  snare(t, v = 1, dest = A.music) { nz(t, 0.16, 0.42 * v, dest, { f: 1900, q: 0.7 }); osc('triangle', 195, t, 0.08, 0.3 * v, dest, { to: 150 }); },
  hat(t, v = 1, dest = A.music, open = false) { nz(t, open ? 0.24 : 0.04, 0.22 * v, dest, { type: 'highpass', f: 7500 }); },
  ride(t, v = 1, dest = A.music) { nz(t, 0.34, 0.12 * v, dest, { type: 'highpass', f: 5200 }); osc('sine', 3150, t, 0.3, 0.03 * v, dest); osc('sine', 4720, t, 0.2, 0.015 * v, dest); },
  rim(t, v = 1, dest = A.music) { osc('square', 1750, t, 0.018, 0.08 * v, dest); nz(t, 0.03, 0.25 * v, dest, { f: 2600, q: 4 }); },
  shaker(t, v = 1, dest = A.music) { nz(t, 0.05, 0.1 * v, dest, { type: 'highpass', f: 6000 }); },
  crash(t, v = 1, dest = A.music) { nz(t, 1.3, 0.22 * v, dest, { type: 'highpass', f: 4200 }); },
  scratch(t, v = 1, dest = A.music) { nz(t, 0.035, 0.3 * v, dest, { f: 2300, q: 2.5 }); },   // 放克吉他刷弦
  riser(t, dur, dest = A.music) { nz(t, dur, 0.18, dest, { f: 400, to: 6000, q: 1.2 }); },
  // ---- 旋律 / 和聲 ----
  koto(t, n, v = 1, dest = A.music) {   // 和琴：明亮撥弦，微微上滑
    const f = m2f(n);
    voice('triangle', f * 0.985, t, 0.9, 0.2 * v, dest, { att: 0.004 });
    voice('sine', f * 2, t, 0.35, 0.06 * v, dest, { att: 0.002 });
  },
  pad(t, notes, dur, v = 1, dest = A.music, type = 'triangle') {
    notes.forEach(n => { voice(type, m2f(n), t, 0.6, 0.045 * v, dest, { att: 0.18, hold: Math.max(0, dur - 0.5), detune: -6 });
                         voice(type, m2f(n), t, 0.6, 0.035 * v, dest, { att: 0.22, hold: Math.max(0, dur - 0.5), detune: 7 }); });
  },
  piano(t, notes, v = 1, dest = A.music, dur = 0.5) {
    notes.forEach(n => { voice('triangle', m2f(n), t, dur, 0.09 * v, dest, { att: 0.003 }); voice('sine', m2f(n) * 2, t, dur * 0.5, 0.03 * v, dest, { att: 0.002 }); });
  },
  trumpet(t, n, dur, v = 1, dest = A.music) {   // 弱音小號
    voice('sawtooth', m2f(n), t, 0.12, 0.09 * v, dest, { att: 0.025, hold: Math.max(0, dur - 0.1), lp: 1500, q: 2, vib: 0.008, vibDelay: 0.12 });
  },
  walk(t, n, dur, v = 1, dest = A.music) { voice('triangle', m2f(n), t, dur, 0.55 * v, dest, { att: 0.004, lp: 900 }); },
  slap(t, n, v = 1, dest = A.music) { voice('square', m2f(n), t, 0.2, 0.22 * v, dest, { att: 0.002, lp: 2600, lpTo: 260, lpT: 0.16, q: 4 }); },
  brass(t, notes, dur, v = 1, dest = A.music) {
    notes.forEach(n => voice('sawtooth', m2f(n), t, 0.1, 0.05 * v, dest, { att: 0.012, hold: dur, lp: 2200, lpTo: 900, q: 1.5 }));
  },
  lead(t, n, dur, v = 1, dest = A.music) { voice('square', m2f(n), t, 0.08, 0.06 * v, dest, { att: 0.006, hold: Math.max(0, dur - 0.06), lp: 2400, q: 1 }); },
  supersaw(t, n, dur, v = 1, dest = A.music) {
    [-14, 0, 14].forEach(d => voice('sawtooth', m2f(n), t, 0.12, 0.04 * v, dest, { att: 0.006, hold: Math.max(0, dur - 0.08), detune: d, lp: 4200, q: 0.8 }));
  },
  pluck(t, n, v = 1, dest = A.music) { voice('square', m2f(n), t, 0.1, 0.045 * v, dest, { att: 0.002, lp: 3200, lpTo: 600, lpT: 0.09 }); },
  sub(t, n, dur, v = 1, dest = A.music) { voice('sawtooth', m2f(n), t, 0.06, 0.16 * v, dest, { att: 0.004, hold: Math.max(0, dur - 0.05), lp: 700, q: 2 }); },
  // ---- 第二集新增 ----
  nylon(t, notes, v = 1, dest = A.music) {   // 尼龍吉他（和弦由低到高輕刷）
    notes.forEach((n, i) => { const x = t + i * 0.014; voice('triangle', m2f(n), x, 0.7, 0.09 * v, dest, { att: 0.003, lp: 2400, lpTo: 900, lpT: 0.3 }); voice('sine', m2f(n) * 2, x, 0.25, 0.02 * v, dest, { att: 0.002 }); });
  },
  flute(t, n, dur, v = 1, dest = A.music) { voice('sine', m2f(n), t, 0.15, 0.13 * v, dest, { att: 0.05, hold: Math.max(0, dur - 0.12), vib: 0.006, vibDelay: 0.15 }); },
  clarinet(t, n, dur, v = 1, dest = A.music) { voice('square', m2f(n), t, 0.08, 0.06 * v, dest, { att: 0.03, hold: Math.max(0, dur - 0.08), lp: 1500, q: 1, vib: 0.007, vibDelay: 0.1 }); },
  organ(t, notes, dur, v = 1, dest = A.music) { notes.forEach(n => voice('square', m2f(n), t, 0.05, 0.035 * v, dest, { att: 0.003, hold: dur, lp: 2200 })); },
  tuba(t, n, dur, v = 1, dest = A.music) { voice('sawtooth', m2f(n), t, 0.08, 0.2 * v, dest, { att: 0.02, hold: Math.max(0, dur - 0.08), lp: 600, q: 1 }); },
  // 8 位元音源：方波 / 三角波 / 雜訊鼓
  chip(t, n, dur, v = 1, dest = A.music) { voice('square', m2f(n), t, 0.04, 0.055 * v, dest, { att: 0.002, hold: Math.max(0, dur - 0.04) }); },
  chipTri(t, n, dur, v = 1, dest = A.music) { voice('triangle', m2f(n), t, 0.03, 0.24 * v, dest, { att: 0.002, hold: Math.max(0, dur - 0.03) }); },
  chipKick(t, v = 1, dest = A.music) { osc('square', 110, t, 0.09, 0.3 * v, dest, { to: 40 }); nz(t, 0.05, 0.3 * v, dest, { type: 'lowpass', f: 400 }); },
  chipSnare(t, v = 1, dest = A.music) { nz(t, 0.11, 0.35 * v, dest, { f: 2200, q: 0.5 }); },
  chipHat(t, v = 1, dest = A.music) { nz(t, 0.025, 0.18 * v, dest, { type: 'highpass', f: 9000 }); },
  // 鼓打貝斯的 Reese 低音（兩把略為走音的鋸齒波）
  reese(t, n, dur, v = 1, dest = A.music) { [-18, 18].forEach(d => voice('sawtooth', m2f(n), t, 0.08, 0.13 * v, dest, { att: 0.01, hold: Math.max(0, dur - 0.08), detune: d, lp: 520, q: 3 })); },
  don(t, v = 1, dest = A.music) { osc('sine', 150, t, 0.34, 0.9 * v, dest, { to: 58, bend: 0.2 }); osc('sine', 88, t, 0.5, 0.3 * v, dest); nz(t, 0.05, 0.5 * v, dest, { type: 'lowpass', f: 500 }); },
  ka(t, v = 1, dest = A.music) { nz(t, 0.045, 0.45 * v, dest, { f: 3300, q: 4 }); osc('square', 1150, t, 0.02, 0.06 * v, dest); },
  kane(t, v = 1, dest = A.music) { [1, 2.41, 3.93].forEach((r, i) => osc('sine', 1750 * r, t, 0.13, 0.06 * v / (i + 1), dest)); },
  clap(t, dest = A.music) { nz(t, 0.08, 0.28, dest, { f: 1400, q: 0.8 }); nz(t + 0.012, 0.08, 0.22, dest, { f: 1600, q: 0.8 }); },
  bass(t, f, dur, dest = A.music) { osc('triangle', f, t, dur, 0.5, dest); },
  shamisen(t, f, dest = A.music, v = 1) {
    const C = A.ctx, os = C.createOscillator(), fl = C.createBiquadFilter(), g = C.createGain();
    os.type = 'sawtooth'; os.frequency.setValueAtTime(f * 1.025, t); os.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    fl.type = 'lowpass'; fl.Q.value = 3; fl.frequency.setValueAtTime(4200, t); fl.frequency.exponentialRampToValueAtTime(700, t + 0.28);
    env(g, t, 0.003, 0.2 * v, 0.42); os.connect(fl); fl.connect(g); g.connect(dest); os.start(t); os.stop(t + 0.5);
  },
  fue(t, f, dur, dest = A.music) {
    const C = A.ctx, os = C.createOscillator(), lfo = C.createOscillator(), lg = C.createGain(), g = C.createGain();
    os.type = 'sine'; os.frequency.value = f; lfo.frequency.value = 5.5; lg.gain.value = f * 0.012;
    lfo.connect(lg); lg.connect(os.frequency); env(g, t, 0.03, 0.07, dur);
    os.connect(g); g.connect(dest); os.start(t); lfo.start(t); os.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
  },
  wood(t, hi, dest = A.music) { osc('sine', hi ? 1600 : 1050, t, 0.05, 0.45, dest); nz(t, 0.02, 0.3, dest, { f: 2200, q: 3 }); },
  // 食材被丟出的提示音：咻～＋每種食材不同音高的「啵」
  cue(t, type) {
    nz(t, 0.16, 0.22, A.sfx, { f: 600, to: 3500, q: 1.5 });
    osc('sine', ING[type].cue, t, 0.07, 0.32, A.sfx, { to: ING[type].cue * 1.5 });
  },
  hit(type, grade, dest = A.sfx) {
    const t = A.ctx.currentTime;
    SND.don(t, 0.85, dest);
    const p = ING[type].pose;
    if (p === 'knife') { nz(t, 0.03, 0.5, dest, { type: 'highpass', f: 4000 }); osc('triangle', 2100, t, 0.03, 0.14, dest); nz(t + 0.07, 0.03, 0.35, dest, { type: 'highpass', f: 4000 }); }
    else if (p === 'spatula') { nz(t, 0.35, 0.3, dest, { f: 5200, q: 0.7 }); osc('square', 2600, t, 0.04, 0.05, dest); }
    else { nz(t, 0.15, 0.5, dest, { type: 'lowpass', f: 800, to: 250 }); osc('sine', 320, t, 0.1, 0.2, dest, { to: 150 }); }
    if (grade === 'GREAT') { osc('triangle', 1568, t + 0.02, 0.12, 0.12, dest); osc('triangle', 2093, t + 0.07, 0.15, 0.1, dest); }
  },
  bad() { const t = A.ctx.currentTime; osc('square', 190, t, 0.2, 0.1, A.sfx, { to: 110 }); nz(t, 0.12, 0.2, A.sfx, { f: 500, q: 2 }); },
  whiff() { const t = A.ctx.currentTime; nz(t, 0.09, 0.14, A.sfx, { f: 900, to: 2200, q: 1.2 }); },
  fanfare(t) { [587, 740, 880, 1175].forEach((f, i) => osc('triangle', f, t + i * 0.07, 0.25, 0.16, A.sfx)); },
  speedUp(t, bd) { [587, 659, 740, 880, 988, 1175].forEach((f, i) => osc('square', f, t + i * bd / 4, bd / 4, 0.05, A.sfx)); },
};

const Sound = {
  ducked: false,
  bgmOn: false,
  bgm: { next: 0, step: 0 },

  // 必須在使用者第一次點擊 / 按鍵後呼叫（瀏覽器自動播放限制）
  init() {
    if (A.ctx) { this.resume(); return; }
    try {
      const C = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      A.ctx = C;
      A.master = C.createGain(); A.master.gain.value = 0.9; A.master.connect(C.destination);
      const comp = C.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4; comp.connect(A.master);
      A.music = C.createGain(); A.music.connect(comp);
      A.sfx = C.createGain(); A.sfx.connect(comp);
      A.ui = C.createGain(); A.ui.connect(comp);
      const len = C.sampleRate, buf = C.createBuffer(1, len, C.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      A.noise = buf;
      this.applyVol();
      this.loadVoices();
    } catch (e) { A.ctx = null; }
  },

  // ---- 語音（錄音檔）：走音效音量（設定的「音效」可調、可靜音）；offset 跳過錄音開頭的靜音 ----
  VOICES: {
    irasshaimase: { url: 'assets/audio/voice_irasshaimase.mp3', gain: 0.5, offset: 0.2 },   // 錄音本身很大聲（峰值 0.94）：比當下音樂清楚、但不搶戲（比打擊音效略小）
    selectSong: { url: 'assets/audio/voice_select_song.mp3', gain: 0.42, offset: 0.12 },     // 選曲畫面的語音（比上面那段略大聲：調成聽起來一樣大）
  },
  voices: {},
  loadVoices() {
    for (const [k, v] of Object.entries(this.VOICES)) {
      if (this.voices[k]) continue;
      this.voices[k] = 'loading';
      // 優先用 js/voices.js 內嵌的資料（file:// 的桌面版也能播）；沒有才去讀音檔
      const data = typeof VOICE_DATA !== 'undefined' && VOICE_DATA[k];
      const bytes = data ? Promise.resolve(Uint8Array.from(atob(data), c => c.charCodeAt(0)).buffer) : fetch(v.url).then(r => r.arrayBuffer());
      bytes.then(b => A.ctx.decodeAudioData(b))
        .then(buf => { this.voices[k] = buf; }).catch(() => { this.voices[k] = null; });   // 讀不到就安靜略過
    }
  },
  playVoice(k, dest = A.ui, t) {
    const buf = this.voices[k];
    if (!A.ctx || !(buf instanceof AudioBuffer)) return;
    const v = this.VOICES[k], s = A.ctx.createBufferSource(), g = A.ctx.createGain();
    s.buffer = buf; g.gain.value = v.gain;
    s.connect(g); g.connect(dest); s.start(t || A.ctx.currentTime, v.offset);
  },

  // 輸出延遲（秒）：畫面與判定都扣掉，讓「聽到的拍子」和判定一致
  latency() { return A.ctx ? (A.ctx.outputLatency || A.ctx.baseLatency || 0) : 0; },

  applyVol() {
    if (!A.ctx) return;
    const m = Save.data.music / 4, s = Save.data.sfx / 4, now = A.ctx.currentTime;
    const set = (node, v) => { node.gain.cancelScheduledValues(now); node.gain.setValueAtTime(v, now); };
    set(A.music, this.ducked ? 0 : 0.5 * m);
    set(A.sfx, this.ducked ? 0 : 0.85 * s);
    set(A.ui, 0.6 * s);
  },
  setVol(key, v) { Save.data[key] = clamp(v, 0, 5); Save.store(); this.applyVol(); },
  // 暫停時把樂曲與遊戲音效立即靜音（已排入的音符不會漏出來）
  duck(on) { this.ducked = on; this.applyVol(); },

  play(name) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime, u = A.ui;
    switch (name) {
      case 'select': osc('triangle', 880, t, 0.05, 0.2, u); break;
      case 'confirm': osc('triangle', 660, t, 0.06, 0.22, u); osc('triangle', 990, t + 0.06, 0.1, 0.22, u); break;
      case 'back': osc('triangle', 660, t, 0.06, 0.2, u); osc('triangle', 440, t + 0.06, 0.1, 0.2, u); break;
      case 'pause': osc('sine', 520, t, 0.08, 0.25, u); osc('sine', 390, t + 0.08, 0.14, 0.25, u); break;
      case 'tick': SND.wood(t, false, u); break;
      case 'go': SND.wood(t, true, u); break;
      case 'sfxPreview': SND.hit('cabbage', 'GREAT', u); break;
      case 'musicPreview': if (!this.ducked) SND.shamisen(t, m2f(74)); break;
    }
  },

  vibrate(ms) { if (Save.data.vibrate && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignore */ } } },

  // ---- 選單音樂 / 選曲試聽：循環播放某首歌的某一段 ----
  // 每次換歌建立新的音量節點，舊的直接淡出斷開（已排入的音符不會殘留）
  bgm: null,
  startBgm(song = SONGS[MENU_SONG], sec = 0) {
    if (this.bgmOn && this.bgm && this.bgm.song === song && this.bgm.sec === sec) return;
    this.stopBgm();
    this.bgmOn = true;
    this.bgm = { song, sec, next: 0, m: 0, bus: null, anchor: 0 };
  },
  stopBgm() {
    this.bgmOn = false;
    const b = this.bgm && this.bgm.bus;
    if (b && A.ctx) { b.gain.setTargetAtTime(0, A.ctx.currentTime, 0.04); setTimeout(() => { try { b.disconnect(); } catch (e) { /* ignore */ } }, 400); }
    if (this.bgm) this.bgm.bus = null;
  },
  bgmBpm() { return this.bgmOn && this.bgm ? this.bgm.song.sections[this.bgm.sec].bpm : 0; },
  // 選單畫面的節拍脈動（對齊正在播放的試聽）
  bgmPulse() {
    if (!this.bgmOn || !this.bgm || !this.bgm.anchor || !A.ctx) return null;
    const ph = (A.ctx.currentTime - Sound.latency() - this.bgm.anchor) / (60 / this.bgmBpm());
    return ph < 0 ? 0 : Math.exp(-(ph % 1) * 5);
  },
  tick() {
    if (!this.bgmOn || !A.ctx || A.ctx.state !== 'running' || this.ducked) return;
    const p = this.bgm, now = A.ctx.currentTime, bd = 60 / this.bgmBpm();
    if (!p.bus) { p.bus = A.ctx.createGain(); p.bus.gain.value = 0.85; p.bus.connect(A.music); }
    if (!p.next || p.next < now - 0.3) { p.next = now + 0.08; p.anchor = p.next; p.m = 0; }
    while (p.next < now + 0.3) {
      const ms = measureInfo(p.song, { kind: 'play', bpm: this.bgmBpm(), start: p.next, sec: p.sec, idx: p.m % 8 });
      p.song.arrange(ms, (t, f) => f(Math.max(t, now), p.bus));
      p.m++; p.next += 4 * bd;
    }
  },

  // 使用者第一次點擊 / 按鍵時呼叫：開啟音訊（iPhone 需要在點擊當下播一段無聲音訊才算解鎖）
  unlock() {
    this.init();
    if (!A.ctx) return;
    if (A.ctx.state !== 'running') A.ctx.resume();
    if (!this.unlocked) {
      const s = A.ctx.createBufferSource(); s.buffer = A.ctx.createBuffer(1, 1, 22050);
      s.connect(A.ctx.destination); s.start(0);
      this.unlocked = true;
    }
  },
  suspend() { if (A.ctx && A.ctx.state === 'running') A.ctx.suspend(); },
  resume() { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); },
};
