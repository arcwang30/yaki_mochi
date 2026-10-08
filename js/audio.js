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

// 樂器與音效（t = AudioContext 時間）
const SND = {
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
    } catch (e) { A.ctx = null; }
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
      case 'musicPreview': if (!this.ducked) SND.shamisen(t, mel(12)); break;
    }
  },

  vibrate(ms) { if (Save.data.vibrate && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignore */ } } },

  // ---- 選單背景音樂（同一段旋律，較輕的編制） ----
  startBgm() { if (!this.bgmOn) { this.bgmOn = true; this.bgm = { next: 0, step: 0 }; } },
  stopBgm() { this.bgmOn = false; },
  tick() {
    if (!this.bgmOn || !A.ctx || A.ctx.state !== 'running' || this.ducked) return;
    const now = A.ctx.currentTime, sd = 60 / MENU_BPM / 2;
    if (!this.bgm.next || this.bgm.next < now - 0.3) this.bgm.next = now + 0.08;
    while (this.bgm.next < now + 0.2) {
      const st = this.bgm.step, t = this.bgm.next, mi = Math.floor(st / 8) % 8, s = st % 8;
      const tk = TAIKO.normal[s];
      if (tk === 'don') SND.don(t, 0.5); else if (tk === 'ka') SND.ka(t, 0.5);
      const n = MELODY[mi][s];
      if (n !== null) SND.shamisen(t, mel(n), A.music, 0.8);
      const r = BASS_ROOT[mi];
      if (s === 0 || s === 4) SND.bass(t, bassF(s === 4 ? r + 7 : r), sd * 1.5);
      if (s % 2 === 1) SND.kane(t, 0.35);
      this.bgm.step++; this.bgm.next += sd;
    }
  },

  suspend() { if (A.ctx && A.ctx.state === 'running') A.ctx.suspend(); },
  resume() { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); },
};
