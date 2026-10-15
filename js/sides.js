'use strict';

// ===== 直式版面的空白處理 =====
// 比 9:16 寬的螢幕（例如 iPad）：左右空白各掛一幅廣島燒的布簾（on）
// 比 9:16 長的螢幕（一般 iPhone）：上下空白維持原本的深色底，不畫東西；只有下方空白的上半部算打擊（vOn）
// 掛簾只在視窗大小改變、圖片與字型載入完成時重畫，平常不花效能。遊玩中點兩側也算打擊（iPad 手常放在兩邊）。
const Sides = {
  el: null, ctx: null, on: false,
  // 各邊的字：上方小色帶＋直書大字；下方一串燈籠，每盞一個字（字數 = 燈籠數）
  BANNERS: [{ band: '名物', text: '広島焼', lanterns: '商賣繁盛' }, { band: '屋台', text: '大王焼', lanterns: '千客萬來' }],

  init() {
    this.el = document.getElementById('sides');
    this.ctx = this.el.getContext('2d');
    this.el.addEventListener('pointerdown', e => {
      // 手機上下空白：只有下方空白的上半部算打擊（上方有動態島；最底下留給 Home 指示條的往上滑）
      if (this.vOn) { const gb = (this.vh + this.gameH) / 2; if (e.clientY < gb || e.clientY > gb + this.vert * 0.6) return; }
      Input.hit(undefined, undefined, e.timeStamp); e.preventDefault();
    });
  },

  // gameW、gameH = 遊戲畫面實際顯示的寬高（CSS px）
  // 比 9:16 寬（iPad）→ 左右掛簾（on）；比 9:16 長（一般 iPhone）→ 透明的打擊區（vOn，不畫）
  resize(gameW, gameH = window.innerHeight) {
    const vw = window.innerWidth, vh = window.innerHeight, side = (vw - gameW) / 2, vert = (vh - gameH) / 2;
    this.on = !LAND && side > 12;
    this.vOn = !LAND && !this.on && vert > 12;
    this.el.style.display = this.on || this.vOn ? 'block' : 'none';
    if (!this.on && !this.vOn) return;
    const dpr = window.devicePixelRatio || 1;
    this.el.width = Math.round(vw * dpr);
    this.el.height = Math.round(vh * dpr);
    this.vw = vw; this.vh = vh; this.side = side; this.dpr = dpr;
    this.gameW = gameW; this.gameH = gameH; this.vert = vert;
    this.draw();
  },

  draw() {
    if (!this.on) return;
    const c = this.ctx, { vw, vh, side } = this;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, vw, vh);
    if (side < 40) return;   // 太窄就不掛（只留點擊區）
    this.BANNERS.forEach((b, i) => {
      const x0 = i === 0 ? 0 : vw - side, end = this.banner(c, x0, side, vh, b);
      this.lanterns(c, x0 + side / 2, end, vh, Math.min(side * 0.7, 180), b.lanterns);
    });
  },

  // 掛簾下方一串紅燈籠（和屋台的燈籠一樣）：緊密疊在畫面下方，和掛簾之間只有一段吊繩；top = 掛簾下緣，maxW = 燈籠最大寬度
  lanterns(c, cx, top, vh, maxW, chars) {
    const list = [...chars], n = list.length;
    const w = Math.min(maxW, (vh - top) * 0.75 / (n * 1.6 + 0.4));   // 燈籠串最多佔下方空間的 3/4，上面留一段吊繩
    if (w < 20) return;   // 空間不夠就不掛
    const pitch = w * 1.6, last = vh - w * 1.1;   // 每盞間距（本體＋上下蓋＋一小段繩）；最後一盞的流蘇剛好到底
    const ys = list.map((_, k) => last - (n - 1 - k) * pitch);
    // 光暈先畫，才不會蓋住吊繩和別的燈籠
    ys.forEach(cy => {
      const glow = c.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 1.3);
      glow.addColorStop(0, 'rgba(255,150,60,.3)'); glow.addColorStop(1, 'rgba(255,150,60,0)');
      c.fillStyle = glow; c.fillRect(cx - w * 1.3, cy - w * 1.3, w * 2.6, w * 2.6);
    });
    // 一條吊繩串起所有燈籠
    c.strokeStyle = '#d9b77a'; c.lineWidth = Math.max(1.5, w * 0.02);
    c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, ys[ys.length - 1]); c.stroke();
    ys.forEach((cy, k) => this.lantern(c, cx, cy, w, list[k], k === n - 1));
  },

  // 一盞燈籠：中心 (cx, cy)、寬 w、正中間一個字；tassel = 下方流蘇（只有最下面一盞有，疊在一起才不會打架）
  lantern(c, cx, cy, w, ch, tassel) {
    const h = w * 1.3, capH = w * 0.14;
    // 燈籠本體（橢圓、中間亮、邊緣暗）
    const body = c.createRadialGradient(cx - w * 0.1, cy - h * 0.1, w * 0.05, cx, cy, w * 0.62);
    body.addColorStop(0, '#ffd27a'); body.addColorStop(0.45, '#f05a2a'); body.addColorStop(1, '#9e1f10');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill();
    // 竹骨（橫向弧線）
    c.save(); c.beginPath(); c.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); c.clip();
    c.strokeStyle = 'rgba(90,15,5,.35)'; c.lineWidth = Math.max(1, w * 0.015);
    for (let k = -3; k <= 3; k++) {
      const y = cy + k * h / 8;
      c.beginPath(); c.ellipse(cx, y, w / 2, w * 0.06, 0, 0, Math.PI); c.stroke();
    }
    c.restore();
    // 上下黑蓋
    c.fillStyle = '#2a1a12';
    c.beginPath(); c.roundRect(cx - w * 0.3, cy - h / 2 - capH * 0.6, w * 0.6, capH, capH * 0.3); c.fill();
    c.beginPath(); c.roundRect(cx - w * 0.3, cy + h / 2 - capH * 0.4, w * 0.6, capH, capH * 0.3); c.fill();
    // 字
    const fs = w * 0.42;
    c.font = `${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#2a0a04'; c.fillText(ch, cx, cy + fs * 0.05);
    // 下方流蘇
    if (!tassel) return;
    c.strokeStyle = '#2a1a12'; c.lineWidth = Math.max(1, w * 0.02);
    for (let k = -2; k <= 2; k++) {
      c.beginPath(); c.moveTo(cx + k * w * 0.04, cy + h / 2 + capH * 0.6); c.lineTo(cx + k * w * 0.05, cy + h / 2 + capH * 0.6 + w * 0.22); c.stroke();
    }
  },

  // 一幅掛簾：竹竿＋吊繩、橘色布面（布紋皺褶、白邊）、上方深藍色帶、直書大字、廣島燒、燕尾下襬＋金穗
  banner(c, x0, sw, vh, { band, text }) {
    const bw = Math.min(sw * 0.74, 190), cx = x0 + sw / 2, bx = cx - bw / 2;
    const rodY = vh * 0.07, rodH = bw * 0.09, top = rodY + rodH * 0.4;
    const bh = Math.min(vh * 0.56, bw * 6.4), bottom = top + bh, notch = bw * 0.16;

    // 吊繩：竹竿兩端拉到上方的釘子
    c.strokeStyle = '#d9b77a'; c.lineWidth = Math.max(1.5, bw * 0.018);
    c.beginPath(); c.moveTo(bx - bw * 0.06, rodY); c.lineTo(cx, vh * 0.025); c.lineTo(bx + bw * 1.06, rodY); c.stroke();
    c.fillStyle = '#8a6a3a'; c.beginPath(); c.arc(cx, vh * 0.025, bw * 0.035, 0, Math.PI * 2); c.fill();

    // 布面（下襬燕尾）＋陰影
    const cloth = () => {
      c.beginPath();
      c.moveTo(bx, top); c.lineTo(bx + bw, top); c.lineTo(bx + bw, bottom);
      c.lineTo(cx, bottom - notch); c.lineTo(bx, bottom); c.closePath();
    };
    c.save();
    c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = bw * 0.12; c.shadowOffsetX = bw * 0.03; c.shadowOffsetY = bw * 0.05;
    const g = c.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, '#c4560c'); g.addColorStop(0.5, '#f2861e'); g.addColorStop(1, '#c4560c');
    c.fillStyle = g; cloth(); c.fill();
    c.restore();
    // 布的直向皺褶
    c.save(); cloth(); c.clip();
    for (let k = 1; k < 5; k++) {
      const fx = bx + bw * k / 5, fg = c.createLinearGradient(fx - bw * 0.08, 0, fx + bw * 0.08, 0);
      fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.5, 'rgba(0,0,0,.12)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = fg; c.fillRect(fx - bw * 0.08, top, bw * 0.16, bh);
    }
    // 上方深藍色帶
    const bandH = bw * 0.42;
    c.fillStyle = '#1d2a5c'; c.fillRect(bx, top, bw, bandH);
    c.fillStyle = '#ffd23f'; c.fillRect(bx, top + bandH, bw, bw * 0.03);
    c.restore();
    // 白色內框
    const ins = bw * 0.07;
    c.strokeStyle = 'rgba(255,248,230,.9)'; c.lineWidth = Math.max(1, bw * 0.022);
    c.beginPath();
    c.moveTo(bx + ins, top + bandH + ins); c.lineTo(bx + bw - ins, top + bandH + ins); c.lineTo(bx + bw - ins, bottom - ins * 1.6);
    c.lineTo(cx, bottom - notch - ins * 1.2); c.lineTo(bx + ins, bottom - ins * 1.6); c.closePath(); c.stroke();

    // 竹竿（壓在布的上緣）
    const rg = c.createLinearGradient(0, rodY - rodH / 2, 0, rodY + rodH / 2);
    rg.addColorStop(0, '#e2c27f'); rg.addColorStop(0.5, '#b58a45'); rg.addColorStop(1, '#7a5a28');
    c.fillStyle = rg;
    c.beginPath(); c.roundRect(bx - bw * 0.12, rodY - rodH / 2, bw * 1.24, rodH, rodH / 2); c.fill();

    // 文字
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const bs = bw * 0.26;
    c.font = `${bs}px ${FONT}`; c.fillStyle = '#fff';
    c.fillText(band, cx, top + bandH / 2 + bs * 0.06, bw * 0.8);
    const imgH = bw * 0.62;   // 下方留給廣島燒
    const tTop = top + bandH + bw * 0.22, tBot = bottom - notch - imgH - bw * 0.3;
    const fs = Math.min(bw * 0.6, (tBot - tTop) / (text.length * 1.08));
    c.font = `${fs}px ${FONT}`;
    c.strokeStyle = '#6a2a04'; c.lineWidth = fs * 0.16; c.fillStyle = '#fff8e6';
    const gap = (tBot - tTop) / text.length;
    [...text].forEach((ch, k) => {
      const y = tTop + gap * (k + 0.5);
      c.strokeText(ch, cx, y); c.fillText(ch, cx, y);
    });

    // 廣島燒：奶油色圓盤上
    const py = bottom - notch - imgH / 2 - bw * 0.18, pr = bw * 0.38;
    c.fillStyle = '#fff3d6'; c.beginPath(); c.arc(cx, py, pr, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#ffd23f'; c.lineWidth = Math.max(1, bw * 0.02); c.stroke();
    const im = IMG.okonomiyaki;
    if (im) { const iw = pr * 1.7, ih = iw * im.height / im.width; c.drawImage(im, cx - iw / 2, py - ih / 2, iw, ih); }

    // 燕尾尖端的金穗
    const ty = bottom - notch;
    c.strokeStyle = '#ffd23f'; c.lineWidth = Math.max(1.5, bw * 0.025);
    c.beginPath(); c.moveTo(cx, ty); c.lineTo(cx, ty + bw * 0.22); c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(cx, ty + bw * 0.22, bw * 0.05, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8a020';
    c.beginPath(); c.moveTo(cx - bw * 0.05, ty + bw * 0.24); c.lineTo(cx + bw * 0.05, ty + bw * 0.24); c.lineTo(cx + bw * 0.035, ty + bw * 0.42); c.lineTo(cx - bw * 0.035, ty + bw * 0.42); c.closePath(); c.fill();
    return bottom + bw * 0.3;   // 掛簾（含金穗）的下緣
  },
};
