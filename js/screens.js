'use strict';

// ===== 畫面管理（淡入淡出轉場）與各畫面 =====
const App = {
  cur: null, name: '', pending: null, fade: 1,

  goto(name, arg) { if (this.pending) return; this.pending = { name, arg }; },
  start(name, arg) { this.name = name; this.cur = Screens[name]; if (this.cur.enter) this.cur.enter(arg); this.fade = 1; },

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
  },
};

const Screens = {};

// 選單共用背景：攤位場景（主角揮手）＋暗化
function menuBackdrop(dimA) {
  Scene.draw(Scene.idlePulse());
  if (dimA) UI.dim(dimA);
}

// ---------- 載入中 ----------
Screens.boot = {
  frame() {
    ctx.fillStyle = '#0d1024'; ctx.fillRect(0, 0, W, H);
    UI.text('Loading… ' + Math.round(Assets.loaded / Assets.names.length * 100) + '%', W / 2, H / 2, 32, { stroke: null });
  }
};

// ---------- 開始畫面（點擊 / 按任意鍵，以解除瀏覽器音效限制） ----------
Screens.title = {
  enter() { chef.idlePose = 'wave'; chef.queue = []; },
  frame() {
    const pulse = Scene.idlePulse();
    Scene.draw(pulse);
    UI.noren(W / 2, 252, 460, 118, 'リズム屋台');
    UI.tanzaku(W / 2, 404, '節奏熱炒遊戲');
    const label = Input.touchMode ? 'TAP TO START' : Input.padConnected ? 'PRESS START' : 'PRESS ANY KEY';
    UI.text(label, W / 2, 1080, 44, { fill: '#fff', stroke: '#c43a1a', sw: 10, alpha: 0.6 + 0.4 * Math.sin(Game.time * 4) });
    drawButtonImg(W / 2, 1220, 130 + pulse * 6);
    UI.copyright();
    if (Input.was('anykey')) { Sound.init(); Sound.play('confirm'); App.goto('menu'); }
  }
};

// ---------- 主選單 ----------
// 按鈕放在畫面最下方（攤位前的吧台與板凳上），不擋主角：
// 第 1 排 = 朱漆「開始遊戲」大木牌；第 2 排 = 掛在竹竿上的四塊木札
Screens.menu = {
  sel: 0, n: 0, lastTag: 1,
  TAGS: [['操作說明', 'sub.howto', 'howto'], ['排行榜', 'sub.ranking', 'ranking'], ['設定', 'sub.settings', 'settings'], ['CREDIT', 'sub.credits', 'credits']],
  enter() { this.sel = 0; chef.idlePose = 'wave'; chef.queue = []; Sound.init(); Sound.duck(false); Sound.startBgm(); },
  frame() {
    menuBackdrop(0);
    const gr = ctx.createLinearGradient(0, 930, 0, H);   // 下方壓暗，讓木牌清楚
    gr.addColorStop(0, 'rgba(8,10,30,0)'); gr.addColorStop(1, 'rgba(8,10,30,.82)');
    ctx.fillStyle = gr; ctx.fillRect(0, 930, W, H - 930);
    UI.noren(W / 2, 252, 460, 118, 'リズム屋台');
    UI.tanzaku(W / 2, 404, 'HISCORE  ' + pad(Save.best(), 7));

    UI.begin(this);
    if (UI.button(this, '開始遊戲', 170, 980, 380, 92, { lacquer: true, sub: 'sub.start', size: 40 })) App.goto('game');
    UI.pole(16, 1098, W - 32);
    this.TAGS.forEach(([label, sub, dest], k) => {
      if (UI.button(this, label, 33 + k * 166, 1122, 154, 94, { tag: true, sub, size: 27, ropeH: 24 })) App.goto(dest);
    });
    this.nav();
    UI.navHint();
    UI.copyright();
  },
  // 兩排的方向鍵移動：0 = 開始遊戲；1~4 = 下排木札
  nav() {
    const s = this.sel, go = v => { if (v !== this.sel) { this.sel = v; Sound.play('select'); } };
    if (Input.was('down') && s === 0) go(this.lastTag);
    if (Input.was('up') && s > 0) { this.lastTag = s; go(0); }
    if (Input.was('left') && s > 1) go(s - 1);
    if (Input.was('right') && s >= 1 && s < 4) go(s + 1);
    if (Input.was('right') && s === 0) go(this.lastTag);
  }
};

// ---------- 遊戲（含暫停選單） ----------
Screens.game = {
  sel: 0, n: 0, pauseReq: false,
  enter(arg) {
    if (!(arg && arg.resume)) Game.newRun();
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
      if (k) UI.text(String(k), W / 2, 560, 140, { fill: '#fff', stroke: '#c43a1a', sw: 20 });
      UI.text('跟著拍子準備！', W / 2, 680, 30, { fill: '#ffe066', sw: 8 });
      return;
    }
    UI.dim(0.62);
    UI.text('PAUSE', W / 2, 400, 96, { fill: '#fff27a', stroke: '#c43a1a', sw: 16 });
    UI.begin(this);
    if (UI.button(this, '繼續遊戲', 160, 500, 400, 72, { c1: '#8dff8a', c2: '#2fc46a' })) Game.resume();
    if (UI.button(this, '重新開始', 160, 592, 400, 72, { c1: '#ffe680', c2: '#ffb02e' })) { Game.newRun(); this.sel = 0; }
    if (UI.button(this, '設定', 160, 684, 400, 72, { c1: '#d6b3ff', c2: '#9a6bff' })) App.goto('settings', { from: 'game' });
    if (UI.button(this, '回主選單', 160, 776, 400, 72, { c1: '#ffb3d1', c2: '#ff6b9a', back: true })) { s.ended = true; App.goto('menu'); }
    UI.nav(this);
    UI.text('繼續後會先倒數 3 拍，再接回原本的節拍', W / 2, 900, 20, { fill: '#e6ecff', stroke: null });
    UI.navHint();
  }
};

// ---------- 操作說明 ----------
Screens.howto = {
  page: 0, sel: 0, n: 0,
  PAGES: ['遊戲規則', '操作方式', '判定與計分', '食材圖鑑'],
  enter() { this.page = 0; this.sel = 0; chef.idlePose = 'wave'; },
  frame() {
    menuBackdrop(0.7);
    UI.header('操作說明', `${tr(this.PAGES[this.page])}  (${this.page + 1}/${this.PAGES.length})`);
    UI.panel(30, 190, 660, 860, 26);
    [this.p1, this.p2, this.p3, this.p4][this.page].call(this);

    const N = this.PAGES.length;
    const go = d => { this.page = (this.page + d + N) % N; Sound.play('select'); };
    if (Input.was('left') || UI.tapIn(30, 1072, 120, 80)) go(-1);
    if (Input.was('right') || UI.tapIn(570, 1072, 120, 80)) go(1);
    UI.text('◀', 80, 1112, 48, { fill: '#ffd23f' }); UI.text('▶', 640, 1112, 48, { fill: '#ffd23f' });
    UI.begin(this);
    if (UI.button(this, '返回', 250, 1076, 220, 70, { back: true }) || Input.was('back')) App.goto('menu');
    UI.nav(this);
    UI.hint('← → 換頁');
  },
  row(y, icon, title, desc) {
    if (typeof icon === 'string') UI.text(icon, 100, y + 40, 46, { stroke: null });
    else icon(100, y + 40);
    UI.text(title, 170, y + 14, 28, { align: 'left', fill: '#fff27a', stroke: null });
    UI.wrap(desc, 170, y + 54, 490, 32, 21, { fill: '#fff' });
  },
  p1() {
    const rows = [
      [(x, y) => drawButtonImg(x - 14, y + 20, 92), '跟著節拍按按鈕', '食材會從左右兩邊丟到鐵板中央的金色框裡，落下的瞬間按下按鈕！'],
      [(x, y) => drawImgW(IMG.cabbage_raw, x, y, 96), '先聽，再按', '食材丟出時會發出「咻～啵」提示音，2 拍之後落下。跟著音樂的節拍就對了。'],
      [(x, y) => drawImgW(IMG.okonomiyaki, x, y, 110), '湊齊四種食材', '炒麵、高麗菜、煎餅、培根各處理好 1 個，就會自動合成一份廣島燒，加 1000 分！'],
      ['⏩', '越來越快', '每 8 小節節奏加快一次，共 6 段，從 96 一路加速到 146 BPM。'],
      ['🏆', '排行榜', '遊戲結束時，分數進入前 20 名就能登錄姓名。'],
    ];
    rows.forEach(([ic, t, d], i) => this.row(222 + i * 164, ic, t, d));
  },
  p2() {
    const cols = [['操作', 110], ['鍵盤', 270], ['遊戲手把', 440], ['手機', 600]];
    cols.forEach(([t, x]) => UI.text(t, x, 232, 22, { fill: '#7fe4ff', stroke: null }));
    const rows = [
      ['處理食材', 'SPACE・ENTER\nF・J・D・K', 'A・B・X・Y\nLB・RB・LT・RT', '點擊畫面\n任何地方'],
      ['暫停', 'ESC・P', 'START', '右上\n⏸ 按鈕'],
      ['選單移動', '↑↓←→\nW・A・S・D', '十字鍵\n左搖桿', '點選'],
      ['決定', 'ENTER\nSPACE', 'A', '點擊按鈕'],
      ['返回', 'ESC\nBACKSPACE', 'B・BACK', '返回按鈕'],
    ];
    rows.forEach((r, i) => {
      const y = 300 + i * 100;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.13)'; ctx.fillRect(42, y - 44, 636, 92);
      r.forEach((t, k) => {
        const ls = tr(t).split('\n');
        ls.forEach((ln, j) => UI.text(ln, cols[k][1], y + (j - (ls.length - 1) / 2) * 30, k === 0 ? 23 : 18,
          { fill: k === 0 ? '#fff27a' : '#fff', stroke: null, maxW: k === 0 ? 130 : 160, raw: true }));
      });
    });
    const pad = Input.padConnected;
    UI.text(pad ? '🎮 遊戲手把已連接' : '🎮 遊戲手把：未連接（接上後按任一鍵即可使用）', W / 2, 838, 20, { fill: pad ? '#8dff8a' : '#cfd8ff', stroke: null, maxW: 620 });
    UI.wrap('打擊鍵按任何一顆都可以；在手機上點擊畫面任何地方都算（右上暫停鈕除外）。暫停後選「繼續遊戲」會先倒數 3 拍，再接回原本的節拍。', 60, 892, 600, 32, 20, { fill: '#fff' });
  },
  p3() {
    UI.text('判定', 130, 236, 22, { fill: '#7fe4ff', stroke: null });
    UI.text('時間差', 400, 236, 22, { fill: '#7fe4ff', stroke: null });
    UI.text('得分', 590, 236, 22, { fill: '#7fe4ff', stroke: null });
    const rows = [['GREAT', '±50ms 以內', '300'], ['NICE', '±90ms 以內', '200'], ['GOOD', '±130ms 以內', '100'], ['BAD', '太早／太晚／沒按', '0']];
    rows.forEach(([g, w, p], i) => {
      const y = 300 + i * 92;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.13)'; ctx.fillRect(42, y - 42, 636, 84);
      drawGradeText(g, 130, y, 1, 1, 40);
      UI.text(w, 400, y, 22, { fill: '#fff', stroke: null });
      UI.text(p, 590, y, 30, { fill: '#ffe680', stroke: null });
    });
    const notes = [
      ['連擊加分', '每次命中再加「連擊數 × 4」分（最多 +200）。BAD 會中斷連擊。'],
      ['廣島燒', '四種食材各 1 個合成一份，+1000 分。'],
      ['揮空不扣分', '沒有食材時按下按鈕只會揮空，可以放心跟著拍子按。'],
      ['判定校正', '如果總覺得判定偏早或偏晚，可以到「設定」調整。'],
    ];
    let y = 700;
    notes.forEach(([t, d]) => {
      UI.text(t, 60, y, 22, { align: 'left', fill: '#7fe4ff', stroke: null });
      y += UI.wrap(d, 210, y, 450, 30, 20, { fill: '#fff' }) + 22;
    });
  },
  p4() {
    TYPES.forEach((k, i) => {
      const ing = ING[k], y = 300 + i * 190;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.13)'; ctx.fillRect(42, y - 84, 636, 172);
      drawImgW(IMG[ing.raw], 130, y, 140);
      UI.text('➜', 240, y, 40, { fill: '#ffd23f', stroke: null });
      drawImgW(IMG[ing.done], 350, y, 160);
      UI.text(ing.name, 460, y - 34, 30, { align: 'left', fill: '#fff27a', stroke: null });
      UI.text(tr('主角動作：{0}', tr(ing.act)), 460, y + 10, 20, { align: 'left', fill: '#fff', stroke: null, maxW: 220, raw: true });
      const pitch = ['低', '中', '高', '中高'][[440, 523, 784, 659].indexOf(ing.cue)];
      UI.text(tr('提示音：{0}音「啵」', tr(pitch)), 460, y + 44, 18, { align: 'left', fill: '#cfd8ff', stroke: null, maxW: 220, raw: true });
    });
  },
};

// ---------- 設定 ----------
Screens.settings = {
  sel: 0, n: 0, from: 'menu',
  ROWS: 6,
  enter(arg) { this.sel = 0; this.from = arg && arg.from === 'game' ? 'game' : 'menu'; if (this.from === 'menu') Sound.startBgm(); },
  back() { if (this.from === 'game') App.goto('game', { resume: true }); else App.goto('menu'); },
  setVol(key, v) {
    v = clamp(v, 0, 5);
    if (v === Save.data[key]) return;
    Sound.setVol(key, v);
    Sound.play(key === 'sfx' ? 'sfxPreview' : 'musicPreview');
    if (key === 'music') Sound.play('select');
  },
  setOffset(v) {
    v = clamp(v, -150, 150);
    if (v === Save.data.offset) return;
    Save.data.offset = v; Save.store(); Sound.play('select');
  },
  panel(i, y, h) {
    const on = this.sel === i;
    UI.panel(50, y, 620, h, 24, on ? 'rgba(255,190,60,.3)' : 'rgba(16,22,52,.82)', on ? '#ffd23f' : '#e8b64a');
    if (Input.ptr.moved && UI.inside(Input.ptr.x, Input.ptr.y, 50, y, 620, h)) this.sel = i;
  },
  setLang(l) {
    if (Save.data.lang === l) return;
    Save.data.lang = l; Save.store(); Sound.play('confirm');
    document.getElementById('rotate').textContent = tr('請將手機直立握持');
  },
  frame() {
    if (this.from === 'game') { Game.draw(); UI.dim(0.75); } else menuBackdrop(0.7);
    UI.header('設定', 'SETTINGS');

    // 音量（0 音樂、1 音效）
    [['音樂', 'music', 186], ['音效', 'sfx', 334]].forEach(([label, key, y], i) => {
      this.panel(i, y, 136);
      const v = Save.data[key];
      UI.text(label, 84, y + 32, 30, { align: 'left' });
      UI.text(v === 0 ? 'MUTE' : String(v), 636, y + 32, 30, { align: 'right', fill: '#ffd23f' });
      for (let k = 0; k < 5; k++) {
        const bx = 140 + k * 92, bh = 26 + k * 8;
        ctx.fillStyle = k < v ? (key === 'music' ? '#7fe4ff' : '#ffb347') : 'rgba(255,255,255,.2)';
        rrect(bx, y + 120 - bh, 70, bh, 8); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1a1f3a'; ctx.stroke();
        if (UI.tapIn(bx - 8, y + 52, 86, 80)) { this.sel = i; this.setVol(key, k + 1 === v ? k : k + 1); }
      }
      UI.text('−', 92, y + 96, 44); UI.text('+', 628, y + 96, 44);
      if (UI.tapIn(56, y + 56, 70, 76)) { this.sel = i; this.setVol(key, v - 1); }
      if (UI.tapIn(594, y + 56, 70, 76)) { this.sel = i; this.setVol(key, v + 1); }
      if (this.sel === i) { if (Input.was('left')) this.setVol(key, v - 1); if (Input.was('right')) this.setVol(key, v + 1); }
    });

    // 2 判定校正
    const y2 = 482, off = Save.data.offset;
    this.panel(2, y2, 168);
    UI.text('判定校正', 84, y2 + 32, 30, { align: 'left' });
    UI.text((off > 0 ? '+' : '') + off + ' ms', W / 2, y2 + 86, 38, { fill: '#ffd23f' });
    UI.text('◀', 150, y2 + 86, 44, { fill: '#fff' }); UI.text('▶', 570, y2 + 86, 44, { fill: '#fff' });
    if (UI.tapIn(90, y2 + 50, 120, 72)) { this.sel = 2; this.setOffset(off - 10); }
    if (UI.tapIn(510, y2 + 50, 120, 72)) { this.sel = 2; this.setOffset(off + 10); }
    if (this.sel === 2) { if (Input.was('left')) this.setOffset(off - 10); if (Input.was('right')) this.setOffset(off + 10); }
    UI.text('總是判定偏晚 → 往＋調　偏早 → 往－調', W / 2, y2 + 140, 18, { fill: '#cfd8ff', stroke: null, maxW: 580 });
    const r = Game.result;
    if (r && r.hits >= 5) UI.text(tr('上一局平均：{0} {1}ms', tr(r.avgErr >= 0 ? '晚' : '早'), Math.abs(r.avgErr)), 636, y2 + 32, 17, { align: 'right', fill: '#8dff8a', stroke: null, maxW: 300, raw: true });

    // 3 震動
    const y3 = 664, vib = Save.data.vibrate, can = !!navigator.vibrate;
    this.panel(3, y3, 104);
    UI.text('震動', 84, y3 + 34, 30, { align: 'left' });
    UI.text(can ? '手機打擊時輕微震動' : '此裝置不支援震動', 84, y3 + 74, 17, { align: 'left', fill: '#cfd8ff', stroke: null, maxW: 380 });
    UI.panel(500, y3 + 24, 140, 56, 28, vib ? '#2fc46a' : 'rgba(255,255,255,.18)', '#fff');
    UI.text(vib ? 'ON' : 'OFF', 570, y3 + 53, 28);
    const flip = () => { Save.data.vibrate = !Save.data.vibrate; Save.store(); Sound.play('confirm'); Sound.vibrate(30); };
    if (UI.tapIn(50, y3, 620, 104)) { this.sel = 3; flip(); }
    if (this.sel === 3 && (Input.was('left') || Input.was('right') || Input.was('confirm'))) flip();

    // 4 語言
    const y4 = 782;
    this.panel(4, y4, 132);
    UI.text('語言', 84, y4 + 32, 30, { align: 'left' });
    LANGS.forEach(([code, label], k) => {
      const x = 74 + k * 196, on = Save.data.lang === code;
      UI.panel(x, y4 + 62, 180, 54, 27, on ? '#e8502a' : 'rgba(255,255,255,.16)', on ? '#fff' : 'rgba(255,255,255,.4)');
      UI.text(label, x + 90, y4 + 89, 24, { fill: '#fff', stroke: on ? '#5a0f05' : null, raw: true });
      if (UI.tapIn(x, y4 + 62, 180, 54)) { this.sel = 4; this.setLang(code); }
    });
    if (this.sel === 4) {
      const idx = LANGS.findIndex(l => l[0] === Save.data.lang);
      if (Input.was('left')) this.setLang(LANGS[(idx + LANGS.length - 1) % LANGS.length][0]);
      if (Input.was('right')) this.setLang(LANGS[(idx + 1) % LANGS.length][0]);
    }

    // 5 返回
    UI.begin(this); this.n = 5;
    if (UI.button(this, this.from === 'game' ? '返回遊戲' : '返回', 230, 1060, 260, 72, { back: true }) || Input.was('back')) this.back();
    this.n = this.ROWS;
    if (Input.was('up')) { this.sel = (this.sel + this.ROWS - 1) % this.ROWS; Sound.play('select'); }
    if (Input.was('down')) { this.sel = (this.sel + 1) % this.ROWS; Sound.play('select'); }
    UI.hint('↑↓ 選擇　← → 調整');
  }
};

// ---------- 排行榜 ----------
Screens.ranking = {
  sel: 0, n: 0, hl: null, hlId: null, list: null, loading: false, err: false,
  enter(arg) {
    this.hl = arg && arg.entry; this.hlId = arg && arg.entryId; this.sel = 0;
    chef.idlePose = 'wave'; Sound.startBgm();
    this.list = null; this.err = false; this.loading = false;
    if (Online.enabled) {
      this.loading = true;
      Online.top().then(l => { this.list = l; this.loading = false; })
        .catch(() => { this.err = true; this.list = []; this.loading = false; });
    }
  },
  frame() {
    menuBackdrop(0.72);
    UI.header('排行榜', Online.enabled ? 'LEADERBOARD（線上）' : 'LEADERBOARD（本機）');
    UI.panel(30, 190, 660, 860, 26);
    const C = { rank: 82, name: 136, oko: 478, score: 660 };
    UI.text('名次', C.rank, 226, 18, { fill: '#7fe4ff', stroke: null });
    UI.text('姓名', C.name, 226, 18, { align: 'left', fill: '#7fe4ff', stroke: null });
    UI.text('廣島燒', C.oko, 226, 18, { fill: '#7fe4ff', stroke: null });
    UI.text('分數', C.score, 226, 18, { align: 'right', fill: '#7fe4ff', stroke: null });
    const glob = Online.enabled, b = glob ? (this.list || []) : Save.board();
    if (glob && this.loading) UI.text('讀取中…', W / 2, 600, 30);
    for (let i = 0; i < 20; i++) {
      const y = 268 + i * 38, e = b[i];
      const isHl = e && (glob ? (this.hlId && e.id === this.hlId) : e === this.hl);
      ctx.fillStyle = isHl ? `rgba(255,210,63,${0.35 + 0.25 * Math.sin(Game.time * 8)})` : (i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.12)');
      ctx.fillRect(42, y - 18, 636, 36);
      const col = i === 0 ? '#ffd23f' : i === 1 ? '#e0e6f0' : i === 2 ? '#f0a070' : '#ffffff';
      UI.text(String(i + 1), C.rank, y, 22, { fill: col, stroke: null });
      if (e) {
        UI.text(e.name, C.name, y, 22, { align: 'left', fill: isHl ? '#fff27a' : '#fff', stroke: null, maxW: 280, raw: true });
        UI.text('×' + (e.oko || 0), C.oko, y, 20, { fill: '#ffb0a0', stroke: null });
        UI.text(pad(e.score, 7), C.score, y, 22, { align: 'right', fill: col, stroke: null });
      } else UI.text('---', C.name, y, 22, { align: 'left', fill: 'rgba(255,255,255,.4)', stroke: null });
    }
    if (this.err) UI.text('無法連線，暫時無法顯示線上排行', W / 2, 1030, 17, { fill: '#ff9fb5', stroke: null });
    UI.begin(this);
    if (UI.button(this, '返回主選單', 220, 1076, 280, 70, { back: true }) || Input.was('back')) App.goto('menu');
    UI.nav(this);
    UI.copyright();
  }
};

// ---------- CREDIT ----------
Screens.credits = {
  sel: 0, n: 0, t: 0,
  enter() { this.t = 0; chef.idlePose = 'wave'; Sound.startBgm(); },
  frame(dt) {
    this.t += dt;
    menuBackdrop(0.6);
    UI.header('CREDIT', '製作名單');
    UI.panel(60, 200, 600, 820, 26);
    const line = (i, y, fn) => { const k = clamp((this.t - i * 0.15) * 4, 0, 1); ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 20); fn(y); ctx.restore(); };
    let y = 300, idx = 0;
    for (const [role, names] of CREDITS) {
      line(idx++, y, yy => UI.text(role, W / 2, yy, 30, { fill: '#7fe4ff', stroke: null }));
      y += 74;
      for (const n of names) { line(idx++, y, yy => UI.text(n, W / 2, yy, 44, { fill: '#fff', raw: true })); y += 70; }
      y += 40;
    }
    line(idx++, 760, yy => drawImgW(IMG.okonomiyaki, W / 2, yy, 260));
    line(idx++, 900, yy => UI.text('大王焼き  リズム屋台', W / 2, yy, 26, { fill: '#ffe8b0', stroke: null, raw: true }));
    line(idx++, 950, yy => UI.text("©Arc's Concept Game", W / 2, yy, 20, { fill: '#cfd8ff', stroke: null, raw: true }));
    UI.begin(this);
    if (UI.button(this, '返回', 250, 1076, 220, 70, { back: true }) || Input.was('back')) App.goto('menu');
    UI.nav(this);
    UI.copyright();
  }
};

// ---------- 結算 ----------
Screens.result = {
  sel: 0, n: 0, t: 0, r: null, qualifies: false, checked: false, submitted: false, newRecord: false, input: null,
  enter() {
    this.r = Game.result; this.t = 0; this.sel = 0; this.checked = false; this.submitted = false; this.shownInput = false;
    this.newRecord = this.r.score > Save.best();
    Sound.duck(false);
    SND.fanfare(A.ctx.currentTime + 0.2);
    const o = this.r.oko;
    chef.queue = []; chef.idlePose = o >= 8 ? 'cheer' : o >= 3 ? 'nice' : 'bad';
    this.input = document.getElementById('nameInput');
    this.input.value = Save.data.name || '';
    this.input.onkeydown = e => { if (e.key === 'Enter') this.submit(); };
    if (Online.enabled) Online.top().catch(() => {});
  },
  leave() { this.input.style.display = 'none'; this.input.blur(); chef.idlePose = 'wave'; },
  submit() {
    if (this.submitted) return;
    this.submitted = true;
    const nm = (this.input.value || '').trim().slice(0, 8) || 'PLAYER';
    const r = this.r, entry = { name: nm, score: r.score, oko: r.oko, combo: r.maxCombo };
    Save.add(entry);
    Sound.play('confirm');
    if (Online.enabled) {
      Online.submit(entry).then(id => App.goto('ranking', { entry, entryId: id })).catch(() => App.goto('ranking', { entry }));
    } else App.goto('ranking', { entry });
  },
  frame(dt) {
    this.t += dt;
    const r = this.r, t = this.t;
    menuBackdrop(0.55);
    const k = ease(clamp(t / 0.5, 0, 1));
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 40);
    const x = 50, y = 120, w = 620, h = 700;
    ctx.fillStyle = 'rgba(255,250,238,.97)'; rrect(x, y, w, h, 28); ctx.fill(); ctx.strokeStyle = '#1f2a5a'; ctx.lineWidth = 6; ctx.stroke();
    UI.ribbon(W / 2, y + 4, '本日營業結束！', 34, 380);
    drawImgW(IMG.okonomiyaki, W / 2 - 70, y + 140, 240);
    UI.text('×' + r.oko, W / 2 + 150, y + 150, 72, { fill: '#c8321e', stroke: '#fff', sw: 10 });
    UI.text('完成的廣島燒', W / 2, y + 242, 20, { fill: '#6b4a2a', stroke: null });
    UI.text('SCORE', W / 2, y + 290, 22, { fill: '#6b4a2a', stroke: null });
    const cnt = clamp((t - 0.4) / 1.0, 0, 1);
    UI.text(String(Math.floor(r.score * cnt)), W / 2, y + 344, 64, { fill: '#1f2a5a', stroke: null });
    if (this.newRecord && t > 1.4) UI.text('★ NEW RECORD ★', W / 2, y + 400, 26, { fill: '#d6462a', stroke: null, alpha: 0.6 + 0.4 * Math.sin(Game.time * 6) });
    else UI.text('HISCORE  ' + pad(Save.best(), 7), W / 2, y + 400, 22, { fill: '#6b4a2a', stroke: null });
    ['GREAT', 'NICE', 'GOOD', 'BAD'].forEach((g, i) => {
      const gx = x + 80 + i * 153;
      drawGradeText(g, gx, y + 466, 1, 1, 26);
      UI.text(String(r.grades[g]), gx, y + 514, 34, { fill: '#1f2a5a', stroke: null });
    });
    UI.text('MAX COMBO  ' + r.maxCombo, W / 2, y + 580, 26, { fill: '#1f2a5a', stroke: null });
    if (r.hits >= 5) UI.text(tr('平均時間差：{0} {1}ms', tr(r.avgErr >= 0 ? '晚' : '早'), Math.abs(r.avgErr)), W / 2, y + 630, 18, { fill: '#8a6a4a', stroke: null, raw: true });
    ctx.restore();

    if (t < 1.6) { if (t > 0.4 && (Input.taps.length || Input.was('confirm'))) { this.t = 1.6; Input.taps.length = 0; Input.pressed.delete('confirm'); } return; }
    if (!this.checked) { this.checked = true; this.qualifies = Online.enabled ? Online.qualifies(r.score) : Save.qualifies(r.score); }
    UI.begin(this);
    if (this.qualifies && !this.submitted) {
      UI.text('進榜！請輸入你的姓名', W / 2, 880, 30, { fill: '#ffd23f', sw: 8 });
      this.input.style.display = 'block';
      if (!this.shownInput) { this.shownInput = true; if (!Input.touchMode) { this.input.focus(); this.input.select(); } }
      if (UI.button(this, '登錄', 130, 1060, 220, 70, { c1: '#8dff8a', c2: '#2fc46a' })) this.submit();
      if (UI.button(this, '略過', 370, 1060, 220, 70, { back: true })) App.goto('menu');
    } else {
      this.input.style.display = 'none';
      if (UI.button(this, '再玩一次', 160, 880, 400, 70, { c1: '#8dff8a', c2: '#2fc46a' })) App.goto('game');
      if (UI.button(this, '排行榜', 160, 968, 400, 70, { c1: '#ffe680', c2: '#ffb02e' })) App.goto('ranking');
      if (UI.button(this, '回主選單', 160, 1056, 400, 70, { c1: '#ffb3d1', c2: '#ff6b9a', back: true })) App.goto('menu');
    }
    UI.nav(this);
  }
};
