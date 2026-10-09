'use strict';

// ===== 統一輸入：鍵盤 / 遊戲控制器（Xbox 等標準配置）/ 滑鼠與手機觸控 =====
// 選單用「動作」（up/down/left/right/confirm/back/pause）；遊戲中的打擊用 onHit 回呼，
// 並附上事件發生的時間戳記（performance.now 時間軸），判定才不會受畫面更新率影響。
const Input = {
  pressed: new Set(),
  taps: [],
  starts: new Map(),
  ptr: { x: -1, y: -1, moved: false },
  touchMode: false,
  padConnected: false,
  swipe: null,          // 這一幀的滑動方向：'left' / 'right'
  onHit: null,          // (x, y, timeMs) => void；x/y 只有觸控 / 滑鼠才有
  lockUntil: 0,
  _pad: {},
  _axis: {},

  KEYMAP: {
    ArrowUp: ['up'], KeyW: ['up'], ArrowDown: ['down'], KeyS: ['down'],
    ArrowLeft: ['left'], KeyA: ['left'], ArrowRight: ['right'], KeyD: ['right'],
    Enter: ['confirm'], NumpadEnter: ['confirm'], Space: ['confirm'],
    Escape: ['back', 'pause'], Backspace: ['back'], KeyP: ['pause'],
    KeyT: ['tutorial']   // 選曲畫面：直接開新手教學
  },
  // 遊戲中的打擊鍵（任一個都可以）
  HIT_KEYS: new Set(['Space', 'Enter', 'NumpadEnter', 'KeyF', 'KeyJ', 'KeyD', 'KeyK', 'KeyZ', 'KeyX']),

  locked() { return performance.now() < this.lockUntil; },
  was(a) { return this.pressed.has(a); },
  hit(x, y, t) { if (this.onHit && !this.locked()) this.onHit(x, y, t); },

  init(canvas) {
    window.addEventListener('keydown', e => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      if (this.HIT_KEYS.has(e.code)) this.hit(undefined, undefined, e.timeStamp);
      (this.KEYMAP[e.code] || []).forEach(a => this.pressed.add(a));
      this.pressed.add('anykey');
    });

    const pos = e => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    };
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') this.touchMode = true;
      const p = pos(e);
      this.starts.set(e.pointerId, Object.assign(p, { t: e.timeStamp }));
      this.ptr.x = p.x; this.ptr.y = p.y; this.ptr.moved = e.pointerType !== 'touch';
      this.pressed.add('anykey');
      this.hit(p.x, p.y, e.timeStamp);   // 打擊在「按下」瞬間成立
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', e => {
      const p = pos(e), st = this.starts.get(e.pointerId);
      if (st) { st.cx = p.x; st.cy = p.y; }   // 拖曳中的位置（滑動換頁用）
      if (e.pointerType === 'touch') return;
      this.ptr.x = p.x; this.ptr.y = p.y; this.ptr.moved = true;
    });
    // 選單按鈕在「放開」時才算點擊（移動很少才算）；橫向快速滑動算「滑動」（swipe = 手指往 'left' / 'right'）
    const up = (e, cancel) => {
      const st = this.starts.get(e.pointerId), p = pos(e);
      this.starts.delete(e.pointerId);
      if (!st || cancel) return;
      const dx = p.x - st.x, dy = p.y - st.y;
      if (Math.hypot(dx, dy) < 24) this.taps.push({ x: st.x, y: st.y });
      else {
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) this.swipe = dx < 0 ? 'left' : 'right';
        if (Math.abs(dy) > Math.abs(dx)) this.dragEnd = { x: st.x, y: st.y, dy, ms: Math.max(16, e.timeStamp - st.t) };   // 直向拖曳放開（選曲轉盤用）
      }
    };
    canvas.addEventListener('pointerup', e => up(e, false));
    canvas.addEventListener('pointercancel', e => up(e, true));
    // 鎖住整頁的拖曳 / 縮放 / 下拉重新整理
    const stop = e => { if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); };
    document.addEventListener('touchmove', stop, { passive: false });
    document.addEventListener('gesturestart', stop);
    document.addEventListener('dblclick', stop);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    // 滑鼠滾輪：當成上下鍵（選曲用；每格一次，連續滾動有間隔）
    let wheelT = 0;
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      if (e.timeStamp - wheelT < 70 || Math.abs(e.deltaY) < 4) return;
      wheelT = e.timeStamp; this.pressed.add(e.deltaY > 0 ? 'down' : 'up'); this.wheel = true;
    }, { passive: false });
  },

  // 每幀呼叫：讀取遊戲控制器
  update() {
    if (this.locked()) { this.pressed.clear(); this.taps.length = 0; this.swipe = null; this.dragEnd = null; }
    const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    this.padConnected = !!gp;
    if (!gp) return;
    const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    const down = [];
    for (let i = 0; i < 16; i++) { const now = b(i); down[i] = now && !this._pad[i]; this._pad[i] = now; }
    const t = Math.min(performance.now(), gp.timestamp || performance.now());
    // A / B / X / Y / LB / RB / LT / RT：遊戲中全部都是打擊鍵
    if (down.slice(0, 8).some(Boolean)) { this.pressed.add('anykey'); this.hit(undefined, undefined, t); }
    if (down[0]) this.pressed.add('confirm');                                   // A
    if (down[3]) this.pressed.add('tutorial');                                  // Y（選曲畫面：新手教學）
    if (down[1] || down[8]) this.pressed.add('back');                           // B / BACK(VIEW)
    if (down[9]) { this.pressed.add('pause'); this.pressed.add('anykey'); }     // START
    if (down[12]) this.pressed.add('up');
    if (down[13]) this.pressed.add('down');
    if (down[14]) this.pressed.add('left');
    if (down[15]) this.pressed.add('right');
    // 左類比搖桿（推過門檻的瞬間算一次）
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const axis = (name, on, act) => { if (on && !this._axis[name]) this.pressed.add(act); this._axis[name] = on; };
    axis('u', ay < -0.6, 'up'); axis('d', ay > 0.6, 'down'); axis('l', ax < -0.6, 'left'); axis('r', ax > 0.6, 'right');
  },

  // 目前手指橫向拖曳的距離（只有一根手指、而且偏橫向時；畫面跟著手指移動用）
  dragX() {
    if (this.starts.size !== 1) return 0;
    const st = this.starts.values().next().value;
    if (st.cx === undefined) return 0;
    const dx = st.cx - st.x, dy = st.cy - st.y;
    return Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) ? dx : 0;
  },

  // 目前手指直向拖曳的距離與起點（只有一根手指、而且偏直向時；選曲轉盤跟著手指轉）
  dragY() {
    if (this.starts.size !== 1) return null;
    const st = this.starts.values().next().value;
    if (st.cy === undefined) return null;
    const dx = st.cx - st.x, dy = st.cy - st.y;
    return Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) ? { x: st.x, y: st.y, dy } : null;
  },

  endFrame() {
    this.swipe = null; this.dragEnd = null; this.wheel = false;
    this.pressed.clear();
    this.taps.length = 0;
    this.ptr.moved = false;
  }
};
