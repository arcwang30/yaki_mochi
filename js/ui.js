'use strict';

// ===== 即時模式（immediate-mode）UI 小工具：文字、面板、按鈕、標題 =====
const UI = {
  text(str, x, y, size, o = {}) {
    str = String(str);
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.font = `${size}px ${FONT}`;
    if (o.maxW) {
      const w = ctx.measureText(str).width;
      if (w > o.maxW) { size = size * o.maxW / w; ctx.font = `${size}px ${FONT}`; }
    }
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const stroke = o.stroke === undefined ? '#1a1f3a' : o.stroke;
    if (stroke) { ctx.lineWidth = o.sw || Math.max(3, size * 0.18); ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
    ctx.fillStyle = o.fill || '#fff'; ctx.fillText(str, x, y);
    ctx.restore();
  },

  lines(str, maxW, size) {
    ctx.font = `${size}px ${FONT}`;
    const out = []; let cur = '';
    for (const ch of str) {
      if (ch === '\n') { out.push(cur); cur = ''; continue; }
      if (ctx.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  },

  wrap(str, x, y, maxW, lineH, size, o = {}) {
    const ls = this.lines(str, maxW, size);
    ls.forEach((ln, i) => this.text(ln, x, y + i * lineH, size, Object.assign({ align: 'left', stroke: null }, o)));
    return ls.length * lineH;
  },

  panel(x, y, w, h, r, fill, stroke) {
    ctx.save(); rrect(x, y, w, h, r);
    ctx.fillStyle = fill || 'rgba(16,22,52,.82)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = stroke || '#e8b64a'; ctx.stroke();
    ctx.restore();
  },

  dim(a) { ctx.fillStyle = `rgba(8,10,30,${a})`; ctx.fillRect(0, 0, W, H); },

  // 紅色標題帶（主畫面的「リズム屋台」與各頁標題）
  ribbon(cx, cy, label, size, w) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.03);
    w = w || 520; const h = size * 1.6;
    ctx.fillStyle = '#c8321e'; rrect(-w / 2, -h / 2, w, h, 16); ctx.fill(); ctx.strokeStyle = '#ffe2a0'; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
    this.text(label, cx, cy + 2, size, { fill: '#fff', stroke: '#6e1408', sw: size * 0.2 });
  },

  header(title, sub) {
    this.ribbon(W / 2, 92, title, 44, 420);
    if (sub) this.text(sub, W / 2, 158, 22, { fill: '#ffe8b0', sw: 6 });
  },

  begin(scr) { scr.n = 0; },

  button(scr, label, x, y, w, h, o = {}) {
    const i = scr.n++;
    const inside = (px, py) => px >= x && px <= x + w && py >= y && py <= y + h;
    if (Input.ptr.moved && inside(Input.ptr.x, Input.ptr.y) && scr.sel !== i) { scr.sel = i; Sound.play('select'); }
    let hit = false;
    for (const t of Input.taps) if (inside(t.x, t.y)) { scr.sel = i; hit = true; }
    const focus = scr.sel === i;
    if (focus && Input.was('confirm')) hit = true;

    const s = focus ? 1.04 + Math.sin(Game.time * 8) * 0.012 : 1;
    const c1 = o.c1 || '#ffb347', c2 = o.c2 || '#e8502a';
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s);
    rrect(-w / 2, -h / 2 + 6, w, h, h / 2); ctx.fillStyle = 'rgba(10,10,30,.5)'; ctx.fill();
    const gr = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    gr.addColorStop(0, focus ? '#fff27a' : c1); gr.addColorStop(1, focus ? '#ffa41f' : c2);
    rrect(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = gr; ctx.fill();
    ctx.lineWidth = focus ? 5 : 3.5; ctx.strokeStyle = focus ? '#ffffff' : '#1a1f3a'; ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff'; rrect(-w / 2 + 12, -h / 2 + 5, w - 24, h * 0.3, h * 0.15); ctx.fill();
    ctx.restore();
    this.text(label, x + w / 2, y + h / 2 + 2, o.size || Math.min(32, h * 0.48), { fill: focus ? '#7a2a10' : '#fff', stroke: focus ? '#ffffff' : '#1a1f3a', sw: 6, maxW: w - 60 });
    if (focus) this.text('▶', x + 30, y + h / 2 + 2, 22, { fill: '#e8502a', stroke: '#fff', sw: 4 });
    if (hit) Sound.play(o.back ? 'back' : 'confirm');
    return hit;
  },

  nav(scr) {
    if (scr.n <= 0) return;
    if (Input.was('up')) { scr.sel = (scr.sel - 1 + scr.n) % scr.n; Sound.play('select'); }
    if (Input.was('down')) { scr.sel = (scr.sel + 1) % scr.n; Sound.play('select'); }
    scr.sel = clamp(scr.sel, 0, scr.n - 1);
  },

  inside(px, py, x, y, w, h) { return px >= x && px <= x + w && py >= y && py <= y + h; },
  tapIn(x, y, w, h) { return Input.taps.some(t => this.inside(t.x, t.y, x, y, w, h)); },

  copyright() { this.text("©Arc's Concept Game", W - 16, H - 22, 16, { align: 'right', fill: 'rgba(255,255,255,.9)', stroke: 'rgba(0,0,0,.6)', sw: 4 }); },
  hint(str) { this.text(str, 16, H - 22, 15, { align: 'left', fill: 'rgba(255,255,255,.85)', stroke: 'rgba(0,0,0,.6)', sw: 4 }); },
  // 依目前輸入裝置顯示提示
  navHint() {
    this.hint(Input.padConnected ? '十字鍵 選擇　A 決定　B 返回' : Input.touchMode ? '點選按鈕' : '↑↓ 選擇　ENTER 決定　ESC 返回');
  },
};
