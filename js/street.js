'use strict';

// ===== 橫式（16:9）背景：攤位原圖兩側延伸的夜市街景 =====
// 攤位原圖是直的；橫式時置中，左右兩側用程式畫出夜空、遠方屋頂、燈籠串、隔壁的屋台與石板路。
// 只在建立背景快取時畫一次（Scene.background），每幀不重畫。座標為畫面座標（1920x1080）。
// 夜空（sky）和街景（paint）分兩層：開場野台升起時，只有街景跟著升起，夜空留在原地。
const Street = {
  HZ: 655,   // 地平線（和原圖中央看出去的街道同高）
  // 街景（天空透明）。rect = 攤位原圖在畫面上的位置 [x, y, w, h]；st = 店面背景的街景主題（js/config.js 的 STREET_BASE）
  paint(g, rect, st = STREET_BASE) {
    const [sx, , sw] = rect, HZ = this.HZ;
    // 先畫在另一張畫布上，整體微微模糊＋壓暗（景深：焦點留在中間的攤位），燈火光暈最後再疊上去（保持清楚）
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const b = c.getContext('2d');
    const glows = [];
    this.town(b, HZ, 0, sx + 40, 11, glows, st.win);
    this.town(b, HZ, sx + sw - 40, W, 23, glows, st.win);
    this.ground(b, HZ, st.win);
    this.strings(b, sx, sw, glows, st);
    st.booths.forEach(([sign, stripe, noren], k) => this.booth(b, k ? W - 300 : 300, sign, stripe, noren, k ? 7 : 3, glows, st.slime));
    g.save();
    if (st.pixel) {   // 像素風：縮小再用最近鄰放大，變成一格一格的點陣
      const P = 5, p = document.createElement('canvas'); p.width = W / P; p.height = H / P;
      p.getContext('2d').drawImage(c, 0, 0, p.width, p.height);
      g.imageSmoothingEnabled = false; g.drawImage(p, 0, 0, W, H);
    } else { g.filter = 'blur(1.6px)'; g.drawImage(c, 0, 0); }
    g.restore();
    // 壓暗、邊緣暗角只套在畫出來的街景上（source-atop：透明的天空不受影響）
    g.save(); g.globalCompositeOperation = 'source-atop';
    g.fillStyle = `rgba(8,10,34,${st.dark})`; g.fillRect(0, 0, W, H);
    for (const [x0, x1] of [[0, 260], [W, W - 260]]) {   // 兩側邊緣壓暗（視線集中到中間）
      const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(4,5,18,.55)'); gr.addColorStop(1, 'rgba(4,5,18,0)');
      g.fillStyle = gr; g.fillRect(Math.min(x0, x1), 0, 260, H);
    }
    const bot = g.createLinearGradient(0, H - 200, 0, H); bot.addColorStop(0, 'rgba(4,5,18,0)'); bot.addColorStop(1, 'rgba(4,5,18,.5)');
    g.fillStyle = bot; g.fillRect(0, H - 200, W, 200);
    g.restore();
    // 燈火光暈（清楚、帶一點泛光）
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, col, a] of glows) { g.globalAlpha = a; g.drawImage(Scene.glowSprite(col), x - r, y - r, r * 2, r * 2); }
    g.restore();
  },
  // 夜空層（漸層、星星、月亮）：和開場的夜空同一個月亮位置
  skyCanvas() {
    const c = document.createElement('canvas'); c.width = Math.round(W * RES); c.height = Math.round(H * RES);
    const g = c.getContext('2d'); g.scale(RES, RES);
    this.sky(g, this.HZ + 40);
    g.fillStyle = 'rgba(8,10,34,.28)'; g.fillRect(0, 0, W, H);
    return c;
  },

  // 攤位原圖左右邊緣做成漸層透明，疊上去時和街景自然銜接
  feather(img, w, h) {
    const c = document.createElement('canvas'); c.width = Math.round(w * RES); c.height = Math.round(h * RES);
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-in';
    const F = 64 / w, gr = g.createLinearGradient(0, 0, c.width, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(F, 'rgba(0,0,0,1)'); gr.addColorStop(1 - F, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    return c;
  },

  sky(g, HZ) {
    const gr = g.createLinearGradient(0, 0, 0, HZ);
    gr.addColorStop(0, '#060a24'); gr.addColorStop(0.55, '#16184a'); gr.addColorStop(1, '#33265a');
    g.fillStyle = gr; g.fillRect(0, 0, W, HZ);
    const R = mulberry(91);
    for (let i = 0; i < 140; i++) {
      const x = R() * W, y = R() * HZ * 0.75, s = 0.6 + R() * 1.6;
      g.fillStyle = `rgba(255,252,235,${0.25 + R() * 0.6})`; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
    }
    // 月亮（右上；和開場夜空的月亮同位置，野台升起時接得上）
    g.save(); g.globalAlpha = 0.6; g.drawImage(Scene.glowSprite('#fff0be'), 1730 - 112, 120 - 112, 224, 224); g.restore();
    g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(1730, 120, 52, 0, 7); g.fill();
    g.fillStyle = 'rgba(230,210,160,.45)'; g.beginPath(); g.arc(1714, 110, 9, 0, 7); g.arc(1744, 140, 6, 0, 7); g.fill();
  },

  // 遠方的町家屋頂剪影（亮著的窗）＋樹
  town(g, HZ, x0, x1, seed, glows, win = '#ffaa5a') {
    const R = mulberry(seed);
    g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0, H); g.clip();
    // 樹的剪影
    g.fillStyle = '#121a30';
    for (let x = x0 - 40; x < x1; x += 70 + R() * 60) { const r = 50 + R() * 40; g.beginPath(); g.arc(x, HZ - 120 - R() * 40, r, 0, 7); g.arc(x + r * 0.7, HZ - 90, r * 0.8, 0, 7); g.fill(); }
    // 屋頂（兩層：後排較暗）
    [[HZ - 150, '#1a1a38', 0.55], [HZ - 92, '#24213f', 1]].forEach(([top, col, lit]) => {
      for (let x = x0 - 60; x < x1 + 60;) {
        const w = 150 + R() * 110, h = HZ - top + 30;
        g.fillStyle = col; g.fillRect(x, top, w, h + 40);
        // 瓦屋頂（斜面）
        g.fillStyle = '#0f0f22'; g.beginPath(); g.moveTo(x - 16, top + 6); g.lineTo(x + 18, top - 26); g.lineTo(x + w - 18, top - 26); g.lineTo(x + w + 16, top + 6); g.closePath(); g.fill();
        // 窗（暖色燈光）
        for (let k = 0; k < 3; k++) {
          if (R() < 0.45) continue;
          const wx = x + 20 + k * (w - 40) / 3, wy = top + 22 + R() * 20, ww = (w - 60) / 3.5, wh = 22 + R() * 10;
          g.fillStyle = hexA(win, (0.4 + R() * 0.25) * lit); g.fillRect(wx, wy, ww, wh);
          g.strokeStyle = 'rgba(30,18,10,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
          if (lit > 0.9) glows.push([wx + ww / 2, wy + wh / 2, 40, win, 0.18]);
        }
        x += w + 6 + R() * 20;
      }
    });
    g.restore();
  },

  // 石板路（透視：往地平線變密）
  ground(g, HZ, spot = '#ffb060') {
    const gr = g.createLinearGradient(0, HZ, 0, H);
    gr.addColorStop(0, '#2a2438'); gr.addColorStop(0.4, '#3a3040'); gr.addColorStop(1, '#241c28');
    g.fillStyle = gr; g.fillRect(0, HZ, W, H - HZ);
    g.strokeStyle = 'rgba(10,8,20,.45)'; g.lineWidth = 2;
    for (let i = 1; i < 14; i++) {   // 橫向石縫
      const t = i / 14, y = HZ + (H - HZ) * t * t;
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    const vx = W / 2;
    for (let i = -24; i <= 24; i++) {   // 縱向石縫（往消失點集中）
      g.beginPath(); g.moveTo(vx + i * 22, HZ); g.lineTo(vx + i * 200, H); g.stroke();
    }
    // 屋台燈光照在地上的暖色光斑
    for (const x of [300, W - 300]) {
      g.save(); g.globalAlpha = 0.35; g.drawImage(Scene.glowSprite(spot), x - 320, 860 - 90, 640, 180); g.restore();
    }
  },

  // 燈籠串（從攤位往兩側拉出去的垂墜曲線）
  strings(g, sx, sw, glows, st = STREET_BASE) {
    const cols = st.cols;
    const lines = [
      [sx + 30, 300, -60, 210, 150], [sx + 30, 470, -60, 400, 110], [sx + 20, 600, -40, 560, 60],
      [sx + sw - 30, 300, W + 60, 210, 150], [sx + sw - 30, 470, W + 60, 400, 110], [sx + sw - 20, 600, W + 40, 560, 60],
    ];
    lines.forEach(([ax, ay, bx, by, sag], li) => {
      const mx = (ax + bx) / 2, my = (ay + by) / 2 + sag;
      g.strokeStyle = 'rgba(20,10,20,.85)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(mx, my, bx, by); g.stroke();
      const n = 9, sc = li % 3 === 2 ? 0.6 : li % 3 === 1 ? 0.8 : 1;
      for (let i = 1; i < n; i++) {
        const u = i / n, x = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * mx + u * u * bx, y = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by;
        const col = cols[(i + li) % cols.length];
        (st.cage ? this.cageLamp : this.lantern).call(this, g, x, y + 20 * sc, sc, col);
        glows.push([x, y + 20 * sc, 46 * sc, col, 0.45]);
      }
    });
  },
  // 鐵籠燈（搖滾、金屬主題）：發光的燈罩外面一圈鐵條
  cageLamp(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#1a1a1e'; g.fillRect(-1.5, -26, 3, 10); g.fillRect(-9, -18, 18, 5); g.fillRect(-9, 15, 18, 5);
    g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 11, 15, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,250,220,.55)'; g.beginPath(); g.ellipse(0, -2, 4, 8, 0, 0, 7); g.fill();
    g.strokeStyle = '#2a2a30'; g.lineWidth = 2.2;
    for (const xx of [-8, 0, 8]) { g.beginPath(); g.moveTo(xx * 0.7, -15); g.quadraticCurveTo(xx * 1.6, 0, xx * 0.7, 15); g.stroke(); }
    g.beginPath(); g.moveTo(-13, 0); g.lineTo(13, 0); g.stroke();
    g.restore();
  },
  lantern(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#1a0e08'; g.fillRect(-1.5, -24, 3, 10);
    g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 15, 19, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,240,200,.35)'; g.beginPath(); g.ellipse(-4, -4, 6, 11, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(80,20,0,.55)'; g.lineWidth = 1.4;
    for (const yy of [-9, 0, 9]) { g.beginPath(); g.ellipse(0, yy, 15 * Math.sqrt(1 - (yy / 19) ** 2), 2.5, 0, 0, 7); g.stroke(); }
    g.fillStyle = '#2a1608'; g.fillRect(-8, -21, 16, 5); g.fillRect(-8, 16, 16, 5);
    g.restore();
  },

  // 隔壁的屋台：條紋遮陽棚、招牌、暖簾、亮著的櫃台
  booth(g, cx, sign, stripe, norenCol, seed, glows, slime) {
    const R = mulberry(seed), w = 420, x = cx - w / 2, top = 330, floor = 905;
    const ink = '#1c0f08';
    g.save(); g.lineJoin = 'round';
    // 地上的影子
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, floor + 6, w * 0.58, 22, 0, 0, 7); g.fill();
    // 店內（暖光）
    const inner = g.createLinearGradient(0, top + 90, 0, 700);
    inner.addColorStop(0, '#ffcf86'); inner.addColorStop(1, '#c4743a');
    g.fillStyle = inner; g.fillRect(x + 22, top + 80, w - 44, 620 - top);
    // 店內的架子與鍋具剪影
    g.fillStyle = 'rgba(90,40,15,.55)';
    g.fillRect(x + 50, top + 190, w - 100, 8);
    for (let i = 0; i < 6; i++) { const bx = x + 70 + i * 50 + R() * 10, bh = 24 + R() * 22; rr(g, bx, top + 190 - bh, 26, bh, 5); g.fill(); }
    glows.push([cx, top + 260, 230, '#ffb060', 0.35]);
    // 柱子
    g.fillStyle = '#6b4325'; g.strokeStyle = ink; g.lineWidth = 3;
    for (const px of [x + 4, x + w - 26]) { g.fillRect(px, top + 40, 22, floor - top - 40); g.strokeRect(px, top + 40, 22, floor - top - 40); }
    // 櫃台
    const cy = 690;
    g.fillStyle = '#a8703c'; g.fillRect(x - 10, cy, w + 20, 22); g.strokeRect(x - 10, cy, w + 20, 22);
    const front = g.createLinearGradient(0, cy + 22, 0, floor);
    front.addColorStop(0, '#7a4a24'); front.addColorStop(1, '#4a2a14');
    g.fillStyle = front; g.fillRect(x + 6, cy + 22, w - 12, floor - cy - 22); g.strokeRect(x + 6, cy + 22, w - 12, floor - cy - 22);
    g.strokeStyle = 'rgba(30,14,5,.6)'; g.lineWidth = 2;
    for (let k = 1; k < 7; k++) { const lx = x + 6 + k * (w - 12) / 7; g.beginPath(); g.moveTo(lx, cy + 24); g.lineTo(lx, floor - 2); g.stroke(); }
    // 櫃台前的布條（店名）
    g.fillStyle = '#f4ead2'; rr(g, cx - 120, cy + 56, 240, 70, 8); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.stroke();
    g.fillStyle = stripe[0]; g.font = `40px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(sign, cx, cy + 93);
    // 櫃台上的東西（碗、瓶子）
    g.fillStyle = '#e8e0d0'; g.strokeStyle = ink; g.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const bx = x + 60 + i * 95 + R() * 20; g.beginPath(); g.ellipse(bx, cy - 4, 22, 10, 0, 0, Math.PI); g.fill(); g.stroke(); }
    // 暖簾（遮陽棚下方，一格一個字的布）
    const nN = 5, nw = (w - 40) / nN;
    for (let i = 0; i < nN; i++) {
      const nx = x + 20 + i * nw;
      g.fillStyle = norenCol; g.fillRect(nx + 2, top + 76, nw - 4, 84);
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.strokeRect(nx + 2, top + 76, nw - 4, 84);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(nx + 2, top + 148, nw - 4, 4);
    }
    // 條紋遮陽棚
    const aw = top - 10, ah = 96, aL = x - 34, aR = x + w + 34, n = 9;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const tx0 = x + 10 + (w - 20) * u0, tx1 = x + 10 + (w - 20) * u1, bx0 = aL + (aR - aL) * u0, bx1 = aL + (aR - aL) * u1;
      g.fillStyle = stripe[i % 2]; g.beginPath(); g.moveTo(tx0, aw); g.lineTo(tx1, aw); g.lineTo(bx1, aw + ah); g.lineTo(bx0, aw + ah); g.closePath(); g.fill();
    }
    // 遮陽棚下緣的波浪
    for (let i = 0; i < n; i++) {
      const bx0 = aL + (aR - aL) * i / n, bw = (aR - aL) / n;
      g.fillStyle = stripe[i % 2]; g.beginPath(); g.moveTo(bx0, aw + ah); g.quadraticCurveTo(bx0 + bw / 2, aw + ah + 26, bx0 + bw, aw + ah); g.fill();
    }
    g.strokeStyle = ink; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x + 10, aw); g.lineTo(x + w - 10, aw); g.lineTo(aR, aw + ah); g.lineTo(aL, aw + ah); g.closePath(); g.stroke();
    // 招牌（遮陽棚上方的木板）
    g.fillStyle = '#3a2412'; rr(g, cx - 130, top - 120, 260, 92, 10); g.fill(); g.stroke();
    g.fillStyle = '#f6ecd4'; rr(g, cx - 118, top - 110, 236, 72, 6); g.fill();
    g.fillStyle = '#1c1008'; g.font = `50px ${FONT}`; g.fillText(sign, cx, top - 72);
    // 棚子兩角的紅燈籠
    for (const lx of [aL + 16, aR - 16]) { this.lantern(g, lx, aw + ah + 50, 1.3, '#ff5a2a'); glows.push([lx, aw + ah + 50, 70, '#ff7a30', 0.55]); }
    // 喪屍主題：招牌和遮陽棚往下滴的綠色黏液
    if (slime) {
      g.fillStyle = slime;
      const drip = (x0, y0, len, wd) => { g.beginPath(); g.moveTo(x0 - wd, y0); g.lineTo(x0 + wd, y0); g.lineTo(x0 + wd * 0.5, y0 + len); g.arc(x0, y0 + len, wd * 0.6, 0, Math.PI); g.closePath(); g.fill(); };
      for (let i = 0; i < 9; i++) drip(aL + 30 + R() * (aR - aL - 60), aw + ah + 8, 18 + R() * 60, 5 + R() * 6);
      for (let i = 0; i < 4; i++) drip(cx - 110 + R() * 220, top - 38, 10 + R() * 34, 4 + R() * 4);
      for (let i = 0; i < 4; i++) glows.push([aL + 40 + R() * (aR - aL - 80), aw + ah + 30, 50, slime, 0.25]);
    }
    g.restore();
  },
};

function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
