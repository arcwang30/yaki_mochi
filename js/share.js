'use strict';

// ===== 分享成績圖：結算畫面右上角「分享」→ 產生一張 1080×1350（IG 直式 4:5）的成績圖 =====
// 手機：叫出系統分享選單（LINE、IG…）；不支援時（PC、桌面版）直接下載 PNG。
// 圖片同步產生、同步叫出分享選單（iPhone 的 Safari 要求在點擊當下呼叫，等太久會被擋）。

const Share = {
  W: 1080, H: 1350,

  result(r, song) {
    const c = this.card(r, song);
    const url = c.toDataURL('image/png'), name = `daioyaki-${song.id}-${r.score}.png`;
    const R = RATINGS[r.rating];
    const text = tr('我在《大王焼き リズム屋台》的「{0}」拿到 {1} 分！評價：{2}', song.title, r.score, tr(R.title))
      + (/^https?:/.test(location.href) ? ' ' + location.origin + location.pathname : '');
    let file = null;
    try {
      const bin = atob(url.split(',')[1]), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      file = new File([buf], name, { type: 'image/png' });
    } catch (e) { /* 舊瀏覽器沒有 File：改用下載 */ }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], text }).catch(() => {});   // 使用者取消分享也沒關係
      return;
    }
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  },

  // 畫成績圖（獨立的畫布，不影響遊戲畫面）
  card(r, song) {
    const W = this.W, H = this.H, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), R = RATINGS[r.rating];
    const rr = (x, y, w, h, q) => { g.beginPath(); g.moveTo(x + q, y); g.arcTo(x + w, y, x + w, y + h, q); g.arcTo(x + w, y + h, x, y + h, q); g.arcTo(x, y + h, x, y, q); g.arcTo(x, y, x + w, y, q); g.closePath(); };
    const text = (s, x, y, size, o = {}) => {
      g.save(); g.font = `${size}px ${FONT}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      if (o.maxW) { const w = g.measureText(s).width; if (w > o.maxW) { size *= o.maxW / w; g.font = `${size}px ${FONT}`; } }
      if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.sw || size * 0.22; g.strokeText(s, x, y); }
      g.fillStyle = o.fill || '#fff'; g.fillText(s, x, y); g.restore();
    };
    // 背景：攤位圖（填滿）＋上下壓暗
    const bg = Scene.theme().img;
    if (bg) { const s = Math.max(W / bg.width, H / bg.height); g.drawImage(bg, (W - bg.width * s) / 2, (H - bg.height * s) / 2, bg.width * s, bg.height * s); }
    const dk = g.createLinearGradient(0, 0, 0, H); dk.addColorStop(0, 'rgba(10,12,40,.82)'); dk.addColorStop(0.5, 'rgba(10,12,40,.45)'); dk.addColorStop(1, 'rgba(10,12,40,.9)');
    g.fillStyle = dk; g.fillRect(0, 0, W, H);
    // 標題
    text('大王焼き リズム屋台', W / 2, 92, 64, { fill: '#ffd23f', stroke: '#7a1608', sw: 14 });
    text(tr('節奏熱炒遊戲'), W / 2, 158, 30, { fill: '#ffe8b0', stroke: 'rgba(0,0,0,.6)', sw: 8 });
    // 成績卡
    const px = 90, py = 220, pw = W - 180, ph = 900, cx = W / 2;
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 30; g.shadowOffsetY = 12; rr(px, py, pw, ph, 36); g.fillStyle = 'rgba(255,250,238,.97)'; g.fill(); g.restore();
    rr(px, py, pw, ph, 36); g.strokeStyle = '#1f2a5a'; g.lineWidth = 8; g.stroke();
    // 樂曲名＋星級
    text(song.title, cx, py + 70, 52, { fill: '#1f2a5a', maxW: pw - 80 });
    const d = Game.diff === undefined ? 1 : Game.diff, ns = diffStars(song, d);
    const st = '★'.repeat(Math.min(ns, 5)) + '☆'.repeat(Math.max(0, 5 - ns)) + (ns > 5 ? '★' : '');
    text('VOL.' + song.vol + '　' + st + '　' + tr(DIFFS[d].name), cx, py + 128, 30, { fill: DIFFS[d].color, maxW: pw - 80 });
    // 評價印章＋稱號
    const sx = px + 150, sy = py + 280, sr = 100;
    g.save(); g.translate(sx, sy); g.rotate(-0.15);
    g.strokeStyle = R.color; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, sr, 0, 7); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.arc(0, 0, sr - 20, 0, 7); g.stroke(); g.restore();
    const stamp = tr(R.stamp);
    g.save(); g.translate(sx, sy); g.rotate(-0.15); text(stamp, 0, 4, stamp.length > 1 ? 64 : 96, { fill: R.color }); g.restore();
    text(tr('節奏評價'), px + 290, py + 220, 26, { align: 'left', fill: '#8a6a4a' });
    text(tr(R.title), px + 290, py + 275, 48, { align: 'left', fill: R.color, maxW: pw - 330 });
    text(Math.round(r.ratio * 100) + '%', px + 290, py + 335, 30, { align: 'left', fill: '#8a6a4a' });
    // 分數
    text('SCORE', cx, py + 455, 30, { fill: '#6b4a2a' });
    text(String(r.score), cx, py + 530, 110, { fill: '#1f2a5a' });
    // 判定次數
    const GC = { GREAT: '#2e9a3e', NICE: '#e07a10', GOOD: '#2a6fd6', BAD: '#7a6aa8' };
    ['GREAT', 'NICE', 'GOOD', 'BAD'].forEach((k, i) => {
      const x = px + 110 + i * (pw - 220) / 3;
      text(k === 'NICE' ? 'NICE!' : k, x, py + 640, 32, { fill: GC[k], stroke: '#fff', sw: 8 });
      text(String(r.grades[k]), x, py + 690, 46, { fill: '#1f2a5a' });
    });
    text('MAX COMBO  ' + r.maxCombo, cx, py + 770, 38, { fill: '#1f2a5a' });
    // 全連擊／全 GREAT 彩帶
    if (r.ag || r.fc) {
      const bw = 360, bh = 60, by = py + 838;
      if (r.ag) { const gr = g.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0); ['#ff5a7a', '#ffb84a', '#ffe14a', '#7affb0', '#7ad8ff', '#c890ff'].forEach((col, i, a) => gr.addColorStop(i / (a.length - 1), col)); g.fillStyle = gr; }
      else g.fillStyle = '#e8b64a';
      rr(cx - bw / 2, by - bh / 2, bw, bh, bh / 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke();
      text(r.ag ? 'ALL GREAT' : 'FULL COMBO', cx, by + 2, 36, { fill: '#5a2a00' });
    }
    // 右下：廣島燒數量＋主角
    if (IMG.okonomiyaki) g.drawImage(IMG.okonomiyaki, px + 40, py + ph - 20, 220, 220 * IMG.okonomiyaki.height / IMG.okonomiyaki.width);
    text('×' + r.oko, px + 290, py + ph + 70, 64, { align: 'left', fill: '#ffd23f', stroke: '#7a1608', sw: 12 });
    const ch = IMG.chef_cheer || IMG.chef_wave;
    if (ch) { const w = 330, h = w * ch.height / ch.width; g.drawImage(ch, W - w + 10, H - h - 6, w, h); }
    // 頁尾
    const now = new Date(), date = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    text(date, 60, H - 40, 26, { align: 'left', fill: 'rgba(255,255,255,.8)' });
    text("©Arc's Concept Game", W - 40, H - 40, 24, { align: 'right', fill: 'rgba(255,255,255,.8)', stroke: 'rgba(0,0,0,.6)', sw: 6 });
    return c;
  },
};
