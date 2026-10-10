'use strict';

// ===== 圖片素材載入與共用繪圖小工具 =====
const IMG = {};
const Assets = {
  names: ['bg_stall.jpg', 'griddle', 'button', 'great_text', 'okonomiyaki',
    'chef_idle', 'chef_wave', 'chef_knife', 'chef_spatula', 'chef_sauce', 'chef_great', 'chef_nice', 'chef_bad', 'chef_cheer',
    'noodles_raw', 'yakisoba', 'cabbage_raw', 'cabbage_shred', 'crepe_raw', 'crepe_sauce', 'bacon_raw', 'bacon_bits'],
  loaded: 0,
  ready: null,
  load() {
    // 店面背景：開機時只多載入目前選的那張，其他的在選背景畫面才載入（Assets.bg）
    if (Save.data.bg !== 'stall') this.names.push('bg_' + Save.data.bg + '.jpg');
    this.ready = Promise.all(this.names.map(n => new Promise(res => {
      const im = new Image(), key = n.replace(/\.\w+$/, '');
      im.onload = () => { IMG[key] = im; this.loaded++; res(); };
      im.onerror = () => { this.loaded++; res(); };
      im.src = 'assets/images/' + (n.includes('.') ? n : n + '.png');
    })));
    return this.ready;
  },
  // 店面背景圖：已載入就回傳，沒有的話開始載入並先回傳 null
  bgLoading: {},
  bg(id) {
    const key = 'bg_' + id;
    if (IMG[key] || this.bgLoading[key]) return IMG[key] || null;
    this.bgLoading[key] = true;
    const im = new Image();
    im.onload = () => { IMG[key] = im; };
    im.onerror = () => { delete this.bgLoading[key]; };
    im.src = 'assets/images/' + key + '.jpg';
    return null;
  },
};

function drawImgW(img, cx, cy, w, rot = 0, alpha = 1, sy = 1) {
  if (!img) return;
  const h = w * img.height / img.width;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(cx, cy); if (rot) ctx.rotate(rot); ctx.scale(1, sy);
  ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
}
// 讓按鈕圖中的紅色按鈕落在 (cx, cy)
function drawButtonImg(cx, cy, w, sy = 1) {
  const img = IMG.button; if (!img) return;
  const f = w / img.width;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, sy);
  ctx.drawImage(img, -BTN_RED[0] * f, -BTN_RED[1] * f, w, img.height * f); ctx.restore();
}
// 遊戲畫面用文字（基線在字底；自動翻譯）
function txt(s, x, y, size, fill, opt = {}) {
  s = tr(s);
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = opt.align || 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  if (opt.stroke) { ctx.strokeStyle = opt.stroke; ctx.lineWidth = opt.lw || size * 0.22; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
function rrect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function pill(x, y, w, h) {
  ctx.fillStyle = 'rgba(16,22,52,.78)'; rrect(x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = '#e8b64a'; ctx.lineWidth = 3; ctx.stroke();
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
