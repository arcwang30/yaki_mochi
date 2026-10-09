'use strict';

// ===== 即時模式（immediate-mode）UI 小工具：文字、面板、按鈕、標題 =====
const UI = {
  // 文字（自動翻譯；玩家姓名等不翻譯時傳 o.raw）
  text(str, x, y, size, o = {}) {
    str = o.raw ? String(str) : tr(str);
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

  // 換行：中日文逐字、英文逐字詞
  lines(str, maxW, size) {
    ctx.font = `${size}px ${FONT}`;
    const out = []; let cur = '';
    const units = Save.data.lang === 'en' ? str.split(/(?<= )|(?=\n)|(?<=\n)/) : str;
    for (const ch of units) {
      if (ch === '\n') { out.push(cur); cur = ''; continue; }
      if (ctx.measureText(cur + ch).width > maxW && cur) { out.push(cur.trimEnd()); cur = ch.trimStart(); } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  },

  wrap(str, x, y, maxW, lineH, size, o = {}) {
    const ls = this.lines(tr(str), maxW, size);
    ls.forEach((ln, i) => this.text(ln, x, y + i * lineH, size, Object.assign({ align: 'left', stroke: null, raw: true }, o)));
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

  // ---- 野台風素材 ----
  // 木板（木紋、節眼、上亮下暗）；lacquer = 朱漆木牌
  // 畫一次就快取成圖（依尺寸 / 樣式 / 解析度），之後每幀只要貼圖，省下大量漸層與曲線運算
  woodCache: new Map(),
  wood(x, y, w, h, o = {}) {
    const r = o.r === undefined ? 10 : o.r, P = 3;
    const key = [Math.round(w), Math.round(h), r, o.seed || 'wood', o.light ? 1 : 0, o.lacquer ? 1 : 0, RES].join('|');
    let c = this.woodCache.get(key);
    if (!c) {
      if (this.woodCache.size > 120) this.woodCache.clear();
      c = document.createElement('canvas');
      c.width = Math.ceil((w + P * 2) * RES); c.height = Math.ceil((h + P * 2) * RES);
      const g = c.getContext('2d'); g.scale(RES, RES);
      this.woodPaint(g, P, P, w, h, r, o);
      this.woodCache.set(key, c);
    }
    ctx.drawImage(c, x - P, y - P, w + P * 2, h + P * 2);
  },
  woodPaint(g, x, y, w, h, r, o) {
    const R = mulberry(hashStr(o.seed || 'wood'));
    const path = () => { const q = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + q, y); g.arcTo(x + w, y, x + w, y + h, q); g.arcTo(x + w, y + h, x, y + h, q); g.arcTo(x, y + h, x, y, q); g.arcTo(x, y, x + w, y, q); g.closePath(); };
    g.save();
    path();
    const gr = g.createLinearGradient(0, y, 0, y + h);
    const cols = o.lacquer ? (o.light ? ['#ff6b4a', '#c42a14'] : ['#e04a30', '#9e1f0e'])
      : (o.light ? ['#f3cf98', '#c88d50'] : ['#d6a268', '#9a6332']);
    gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
    g.fillStyle = gr; g.fill();
    g.clip();
    if (!o.lacquer) {
      g.strokeStyle = 'rgba(90,45,15,.24)'; g.lineWidth = 1.6;
      for (let k = 0; k < 7; k++) {
        const yy = y + 4 + R() * (h - 8);
        g.beginPath(); g.moveTo(x, yy);
        g.bezierCurveTo(x + w * 0.3, yy + (R() - 0.5) * 9, x + w * 0.65, yy + (R() - 0.5) * 9, x + w, yy + (R() - 0.5) * 6);
        g.stroke();
      }
      g.fillStyle = 'rgba(90,45,15,.22)';
      g.beginPath(); g.ellipse(x + w * (0.2 + R() * 0.6), y + h * (0.3 + R() * 0.4), 7, 3, 0, 0, 7); g.fill();
    } else {
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x, y + 4, w, h * 0.22);   // 漆的光澤
    }
    g.fillStyle = 'rgba(255,240,210,.35)'; g.fillRect(x, y + 2, w, 3);
    g.fillStyle = 'rgba(50,20,5,.28)'; g.fillRect(x, y + h - 7, w, 7);
    g.restore();
    path();
    g.lineWidth = 4; g.strokeStyle = o.lacquer ? '#f2c25a' : (o.light ? '#fff0c8' : '#3e2210'); g.stroke();
  },  nail(x, y) {
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x - 1.3, y - 1.3, 1.6, 0, 7); ctx.fill();
  },
  // 發光框：取代每幀的 shadowBlur（模糊在手機 GPU 上最耗電、最燙）。依尺寸畫一次快取成圖，之後每幀只貼圖
  // o.fill：框內填色＋外圍光暈；o.ring：只要外框線的光暈（框線本身另外畫，例如判定框的虛線）
  glowCache: new Map(),
  glow(x, y, w, h, r, color, bl, o = {}) {
    const lw = o.ring || 0, P = bl * 1.5 + lw + 2;
    const key = [Math.round(w), Math.round(h), r, color, bl, o.fill || '', lw, RES].join('|');
    let c = this.glowCache.get(key);
    if (!c) {
      if (this.glowCache.size > 60) this.glowCache.clear();
      c = document.createElement('canvas'); c.width = Math.ceil((w + P * 2) * RES); c.height = Math.ceil((h + P * 2) * RES);
      const g = c.getContext('2d'); g.scale(RES, RES);
      const path = ox => { const q = Math.min(r, w / 2, h / 2), X = P + ox, Y = P; g.beginPath(); g.moveTo(X + q, Y); g.arcTo(X + w, Y, X + w, Y + h, q); g.arcTo(X + w, Y + h, X, Y + h, q); g.arcTo(X, Y + h, X, Y, q); g.arcTo(X, Y, X + w, Y, q); g.closePath(); };
      g.shadowColor = color; g.shadowBlur = bl;   // shadowBlur 以裝置像素計（不受 scale 影響），和直接畫在主畫布上一樣
      if (lw) {   // 只留光暈：把框線畫在畫布外，用陰影位移把光暈移回來
        const off = w + P * 3; g.shadowOffsetX = off * RES; g.lineWidth = lw; g.strokeStyle = color; path(-off); g.stroke();
      } else { g.fillStyle = o.fill || color; path(0); g.fill(); }
      this.glowCache.set(key, c);
    }
    ctx.drawImage(c, x - P, y - P, w + P * 2, h + P * 2);
  },
  // 小紅燈籠（焦點標記）
  lantern(x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (!ECO()) { ctx.save(); ctx.globalAlpha *= 0.9; ctx.drawImage(Scene.glowSprite('#ff7828'), -24, -27, 48, 54); ctx.restore(); }   // 燈火光暈（貼圖）
    ctx.fillStyle = '#e8402a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 14, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(80,10,0,.55)'; ctx.lineWidth = 1.2;
    for (const yy of [-7, 0, 7]) { ctx.beginPath(); ctx.ellipse(0, yy, 11 * Math.sqrt(1 - (yy / 14) ** 2), 2, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#2a1608'; ctx.fillRect(-6, -17, 12, 4); ctx.fillRect(-6, 13, 12, 4);
    ctx.restore();
  },
  // 暖簾：木竿＋藍染布，一格一個字，隨風擺動
  noren(cx, top, w, h, chars) {
    const n = chars.length, gap = 6, pw = (w - gap * (n - 1)) / n, x0 = cx - w / 2, t = Game.time;
    [...chars].forEach((ch, i) => {
      const px = x0 + i * (pw + gap), sway = Math.sin(t * 1.7 + i * 0.9) * 4;
      ctx.save();
      const cloth = dy => {
        ctx.beginPath(); ctx.moveTo(px, top + dy); ctx.lineTo(px + pw, top + dy);
        ctx.lineTo(px + pw + sway, top + h + dy); ctx.quadraticCurveTo(px + pw / 2 + sway, top + h + 6 + dy, px + sway, top + h + dy);
        ctx.closePath();
      };
      cloth(5); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fill();   // 布的影子（位移的半透明色塊，不用模糊）
      cloth(0);
      const g = ctx.createLinearGradient(0, top, 0, top + h); g.addColorStop(0, '#2a4a86'); g.addColorStop(1, '#16295a');
      ctx.fillStyle = g; ctx.fill();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 2;   // 布的皺褶
      for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(px + pw * k / 3, top); ctx.lineTo(px + pw * k / 3 + sway, top + h); ctx.stroke(); }
      ctx.fillStyle = 'rgba(240,235,220,.85)'; ctx.fillRect(px - 10, top + h - 13, pw + 20, 4);   // 下緣白線（染め抜き）
      ctx.restore();
      this.text(ch, px + pw / 2 + sway * 0.55, top + h * 0.47, pw * 0.64, { fill: '#f6f1e4', stroke: 'rgba(10,20,50,.6)', sw: 4 });
    });
    // 木竿
    const rx = x0 - 26, rw = w + 52, ry = top - 9;
    const g = ctx.createLinearGradient(0, ry, 0, ry + 14); g.addColorStop(0, '#a87442'); g.addColorStop(1, '#5e3a1a');
    ctx.fillStyle = g; rrect(rx, ry, rw, 14, 7); ctx.fill();
    ctx.fillStyle = '#3a220e'; ctx.beginPath(); ctx.arc(rx + 7, ry + 7, 9, 0, 7); ctx.arc(rx + rw - 7, ry + 7, 9, 0, 7); ctx.fill();
  },
  // 和紙短冊（紅框、紅字）
  tanzaku(cx, cy, str, size = 22) {
    str = tr(str);
    ctx.font = `${size}px ${FONT}`;
    const w = ctx.measureText(str).width + 56, h = size * 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.02);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-w / 2 + 1, -h / 2 + 4, w, h);   // 影子（位移色塊，不用模糊）
    ctx.fillStyle = '#f7eed8'; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#c8321e'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10);
    ctx.restore();
    this.text(str, cx, cy + 1, size, { fill: '#a3200f', stroke: null, raw: true });
  },
  // 竹竿（掛木札用）
  pole(x, y, w) {
    const g = ctx.createLinearGradient(0, y - 7, 0, y + 7); g.addColorStop(0, '#e2cf86'); g.addColorStop(1, '#8c7a36');
    ctx.fillStyle = g; rrect(x, y - 7, w, 14, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(70,55,15,.7)'; ctx.lineWidth = 2;
    for (let k = x + 70; k < x + w - 20; k += 110) { ctx.beginPath(); ctx.moveTo(k, y - 7); ctx.lineTo(k, y + 7); ctx.stroke(); }
  },

  // 木牌按鈕。o.lacquer 朱漆；o.tag 掛在竿上的木札（會擺動）；o.sub 小字副標
  button(scr, label, x, y, w, h, o = {}) {
    const i = scr.n++;
    const inside = (px, py) => px >= x && px <= x + w && py >= y && py <= y + h;
    if (Input.ptr.moved && inside(Input.ptr.x, Input.ptr.y) && scr.sel !== i) { scr.sel = i; Sound.play('select'); }
    let hit = false;
    for (const t of Input.taps) if (inside(t.x, t.y)) { scr.sel = i; hit = true; }
    const focus = scr.sel === i;
    if (focus && Input.was('confirm')) hit = true;

    const t = Game.time, cx = x + w / 2, r = o.tag ? 8 : Math.min(14, h * 0.2);
    ctx.save();
    if (o.tag) {   // 繩子＋擺動（以掛點為軸）
      let sw = Math.sin(t * 2.2 + i * 1.3) * (focus ? 0.06 : 0.02);
      // o.wiggle：每 3 秒「晃～」一下（像被風吹動），提示玩家可以按
      if (o.wiggle && !focus) { const p = (t % 3) / 0.9; if (p < 1) sw += Math.sin(p * Math.PI * 4) * 0.13 * (1 - p); }
      const top = y - (o.ropeH || 24);
      ctx.translate(cx, top); ctx.rotate(sw); ctx.translate(-cx, -top);
      ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + w * 0.26, y + 10); ctx.lineTo(cx, top); ctx.lineTo(x + w * 0.74, y + 10); ctx.stroke();
    }
    const s = focus ? 1.05 + Math.sin(t * 8) * 0.01 : 1;
    ctx.translate(cx, y + h / 2); ctx.scale(s, s); ctx.translate(-cx, -(y + h / 2));
    if (focus) {   // 燈火般的光暈
      ctx.save(); ctx.globalAlpha *= 0.82 + Math.sin(t * 6) * 0.18;   // 光暈貼圖一明一暗（原本是每幀改模糊半徑）
      this.glow(x, y, w, h, r, 'rgba(255,170,60,.95)', blur(26), { fill: 'rgba(255,170,60,.6)' }); ctx.restore();
    }
    rrect(x + 4, y + 7, w, h, r); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
    this.wood(x, y, w, h, { r, seed: label, light: focus, lacquer: o.lacquer });
    if (o.tag) { this.nail(x + w * 0.26, y + 10); this.nail(x + w * 0.74, y + 10); }
    else if (w > 160) { this.nail(x + 14, y + h / 2); this.nail(x + w - 14, y + h / 2); }
    // 烙印字（淺色下緣 = 刻痕感）
    const size = o.size || Math.min(32, h * 0.46), my = o.sub ? y + h * 0.43 : y + h / 2 + 2;
    const ink = o.lacquer ? '#fff6e0' : focus ? '#9a1a08' : '#3a1d0a';
    const maxW = w - (o.tag ? 20 : 70);
    if (!o.lacquer) this.text(label, cx, my + 1.5, size, { fill: 'rgba(255,236,200,.5)', stroke: null, maxW });
    this.text(label, cx, my, size, { fill: ink, stroke: o.lacquer ? '#5a0f05' : null, sw: 6, maxW });
    if (o.sub) this.text(o.sub, cx, y + h * 0.8, Math.max(12, size * 0.42), { fill: o.lacquer ? '#ffd9a0' : (focus ? '#9a1a08' : '#6a3c18'), stroke: null, maxW });
    if (focus && !o.tag && w > 200) { this.lantern(x + 36, y + h / 2, 0.9); this.lantern(x + w - 36, y + h / 2, 0.9); }
    ctx.restore();
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
