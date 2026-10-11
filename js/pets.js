'use strict';

// ===== 陪伴寵物（主選單 → 商店 → 陪伴寵物）：坐在鐵板右上角的木檯上，跟著節拍點頭，打擊時有反應 =====
// 心情（mood）：idle 待機（跟著節拍點頭）／happy 開心（GREAT）／cheer 歡呼（每 10 連擊、廣島燒完成、好成績）／sad 難過（BAD、斷連擊）
// 目前用程式畫（PET_DRAW）。之後有同風格的圖：在 PETS 該隻加 art: true，放 assets/images/pet_<id>_<mood>.png（4 張，透明背景、
// 角色大小與位置一致、腳底在圖的下緣中間），就會改用圖片（沒載入完時先用程式畫的）
// 寵物清單（PETS）與位置（PET_POS）在 js/config.js

const Pet = {
  mood: 'idle', until: 0, hopT: -9, preview: null,
  id() { return this.preview || Save.data.pet || 'none'; },
  // 反應：mood 維持 dur 秒；更重要的心情可以蓋掉（歡呼 > 難過 > 開心）
  react(mood, dur) {
    const rank = { idle: 0, happy: 1, sad: 2, cheer: 3 };
    if (Game.time < this.until && rank[mood] < rank[this.mood]) return;
    this.mood = mood; this.until = Game.time + dur; this.hopT = Game.time;
  },
  reset() { this.mood = 'idle'; this.until = 0; this.hopT = -9; },
  // 畫在世界座標（Scene.draw 裡、鐵板之後）；pulse = 節拍脈動 0～1
  draw(pulse) {
    const id = this.id();
    if (id === 'none' || (!LAND && App.name === 'shop')) return;   // 手機的商店：木檯被面板擋住，改在主角旁邊放大預覽
    if (Game.time >= this.until) this.mood = 'idle';
    ctx.save(); ctx.translate(PET_POS.x, PET_POS.y); ctx.scale(PET_POS.s, PET_POS.s);
    drawPet(ctx, id, this.mood, Game.time - this.hopT, pulse || 0);
    ctx.restore();
  },
};

// 圖片版（有 art 的寵物）：用到時才載入
const petArt = {};
function petImage(id, mood) {
  const p = PETS.find(x => x.id === id);
  if (!p || !p.art) return null;
  const k = id + '_' + mood;
  if (!petArt[k]) { const im = new Image(); im.src = 'assets/images/pet_' + k + '.png'; petArt[k] = im; }
  return petArt[k].complete && petArt[k].naturalWidth ? petArt[k] : null;
}

// 畫一隻寵物（g 的原點 = 腳底中間；高約 115）。dt = 這次反應開始後幾秒
function drawPet(g, id, mood, dt, pulse) {
  // 共同的動態：待機跟著節拍壓扁點頭；開心小跳、歡呼大跳；難過縮一點
  const hop = mood === 'happy' ? Math.max(0, Math.sin(Math.min(1, dt / 0.32) * Math.PI)) * 16
    : mood === 'cheer' ? Math.abs(Math.sin(dt * 9)) * 26 * Math.max(0, 1 - dt / 1.2) : 0;
  const squash = mood === 'idle' ? pulse * 0.07 : 0, sad = mood === 'sad' ? 0.94 : 1;
  // 影子
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 2, 34 * (1 - hop / 80), 7, 0, 0, 7); g.fill();
  g.save(); g.translate(0, -hop); g.scale(sad * (1 + squash * 0.5), sad * (1 - squash));
  const img = petImage(id, mood);
  if (img) { const h = 120, w = h * img.width / img.height; g.drawImage(img, -w / 2, -h, w, h); }
  else (PET_DRAW[id] || PET_DRAW.shiba)(g, mood, dt);
  g.restore();
  // 特效：開心／歡呼 = 星星；難過 = 汗滴
  if (mood === 'happy' || mood === 'cheer') {
    const n = mood === 'cheer' ? 5 : 3, a = Math.max(0, 1 - dt / (mood === 'cheer' ? 1.2 : 0.6));
    g.save(); g.globalAlpha *= a; g.fillStyle = '#ffd23f';
    for (let i = 0; i < n; i++) { const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 0.55, r = 70 + dt * 60; petStar(g, Math.cos(ang) * r, -60 + Math.sin(ang) * r, 7); }
    g.restore();
  } else if (mood === 'sad') {
    g.fillStyle = '#7ac8ff'; g.strokeStyle = '#2a4a6a'; g.lineWidth = 2;
    const y = -96 + Math.min(1, dt / 0.5) * 10;
    g.beginPath(); g.moveTo(30, y - 12); g.quadraticCurveTo(38, y, 30, y + 4); g.quadraticCurveTo(22, y, 30, y - 12); g.fill(); g.stroke();
  }
}
function petStar(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}

// ---- 程式畫的寵物（粗深色描邊＋兩階明暗，接近主角的賽璐璐風格）----
const PET_LINE = '#2a1608';
function petEllipse(g, x, y, rx, ry, fill, shade, lw) {
  const p = () => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); };
  p(); g.fillStyle = fill; g.fill();
  if (shade) {   // 陰影：橢圓右下方的月牙
    g.save(); p(); g.clip(); g.fillStyle = shade; g.beginPath(); g.ellipse(x + rx * 0.35, y + ry * 0.35, rx, ry, 0, 0, 7); g.rect(x - rx * 3, y - ry * 3, rx * 6, ry * 6); g.fill('evenodd'); g.restore();
  }
  p(); g.strokeStyle = PET_LINE; g.lineWidth = lw || 3.5; g.stroke();
}
// 眼睛：idle 圓點（有亮點）／happy、cheer ^ ^／sad > <
function petEyes(g, x, y, mood, size = 1) {
  g.strokeStyle = PET_LINE; g.fillStyle = PET_LINE; g.lineWidth = 3.2 * size; g.lineCap = 'round';
  [-1, 1].forEach(k => {
    const ex = x * k;
    if (mood === 'happy' || mood === 'cheer') { g.beginPath(); g.arc(ex, y + 3 * size, 6 * size, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else if (mood === 'sad') { g.beginPath(); g.moveTo(ex - 5 * k * size, y - 4 * size); g.lineTo(ex + 3 * k * size, y); g.lineTo(ex - 5 * k * size, y + 4 * size); g.stroke(); }
    else {
      g.beginPath(); g.ellipse(ex, y, 4.2 * size, 5.4 * size, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 1.4 * size, y - 2 * size, 1.5 * size, 0, 7); g.fill(); g.fillStyle = PET_LINE;
    }
  });
}
function petBlush(g, x, y, r = 6) { g.fillStyle = 'rgba(255,110,120,.45)'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(x * k, y, r, r * 0.6, 0, 0, 7); g.fill(); }); }
function petMouth(g, x, y, mood, open) {   // 「ω」嘴；開心時張嘴
  g.strokeStyle = PET_LINE; g.lineWidth = 2.6; g.lineCap = 'round';
  if (mood === 'happy' || mood === 'cheer' || open) {
    g.fillStyle = '#d8424a'; g.beginPath(); g.moveTo(x - 7, y); g.quadraticCurveTo(x, y + 12, x + 7, y); g.closePath(); g.fill(); g.stroke();
  } else if (mood === 'sad') { g.beginPath(); g.moveTo(x - 6, y + 4); g.quadraticCurveTo(x, y - 2, x + 6, y + 4); g.stroke(); }
  else { g.beginPath(); g.moveTo(x - 7, y); g.quadraticCurveTo(x - 3.5, y + 5, x, y); g.quadraticCurveTo(x + 3.5, y + 5, x + 7, y); g.stroke(); }
}

const PET_DRAW = {
  shiba(g, mood, dt) {
    const up = mood === 'cheer', wag = Math.sin(Game.time * (mood === 'idle' ? 6 : 14)) * 0.35;
    // 捲尾巴（在身體後面，搖動）
    g.save(); g.translate(26, -42); g.rotate(wag);
    g.lineWidth = 11; g.strokeStyle = PET_LINE; g.lineCap = 'round'; g.beginPath(); g.arc(4, -8, 10, Math.PI * 0.9, Math.PI * 2.4); g.stroke();
    g.lineWidth = 6; g.strokeStyle = '#e8913a'; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#fff4e2'; g.beginPath(); g.arc(4, -8, 10, Math.PI * 1.9, Math.PI * 2.4); g.stroke();
    g.restore();
    // 身體＋白肚子
    petEllipse(g, 0, -30, 30, 27, '#e8913a', '#c8702a');
    petEllipse(g, 0, -24, 15, 18, '#fff4e2', null, 2.5);
    // 前腳（歡呼時舉起）
    [-1, 1].forEach(k => petEllipse(g, k * (up ? 34 : 11), up ? -52 : -6, up ? 9 : 7, up ? 7 : 7, '#fff4e2', null, 3));   // 歡呼時往兩側舉起
    // 耳朵
    [-1, 1].forEach(k => {
      const ear = mood === 'sad' ? 0.5 : 0;
      g.save(); g.translate(k * 20, -94); g.rotate(k * (0.15 + ear));
      g.beginPath(); g.moveTo(-10, 8); g.lineTo(0, -16); g.lineTo(10, 8); g.closePath(); g.fillStyle = '#e8913a'; g.fill(); g.strokeStyle = PET_LINE; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke();
      g.beginPath(); g.moveTo(-5, 5); g.lineTo(0, -8); g.lineTo(5, 5); g.closePath(); g.fillStyle = '#a8521e'; g.fill();
      g.restore();
    });
    // 頭＋白色口鼻
    petEllipse(g, 0, -72, 33, 28, '#e8913a', '#c8702a');
    g.save(); g.beginPath(); g.ellipse(0, -72, 33, 28, 0, 0, 7); g.clip();
    g.fillStyle = '#fff4e2'; g.beginPath(); g.ellipse(0, -55, 26, 17, 0, 0, 7); g.fill(); g.restore();
    g.beginPath(); g.ellipse(0, -72, 33, 28, 0, 0, 7); g.strokeStyle = PET_LINE; g.lineWidth = 3.5; g.stroke();
    // 麻呂眉
    g.fillStyle = '#fff4e2'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * 12, -86, 4, 2.6, 0, 0, 7); g.fill(); });
    petEyes(g, 12, -75, mood);
    g.fillStyle = PET_LINE; g.beginPath(); g.ellipse(0, -63, 4.5, 3.2, 0, 0, 7); g.fill();
    petMouth(g, 0, -58, mood);
    petBlush(g, 21, -64);
  },
  maneki(g, mood, dt) {
    const wave = Math.sin(Game.time * (mood === 'idle' ? 5 : 12)) * 0.4, up = mood === 'cheer';
    // 身體
    petEllipse(g, 0, -30, 29, 28, '#fbf8f0', '#e3d8c4');
    // 金幣（右手抱著）
    g.save(); g.translate(14, -26); g.rotate(0.25);
    petEllipse(g, 0, 0, 11, 15, '#f2c230', '#d89a10', 3);
    g.fillStyle = '#8a5a00'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('福', 0, 1);
    g.restore();
    // 招手（左手，跟著節拍上下招）
    g.save(); g.translate(-26, -42); g.rotate(-0.55 + (up ? -0.5 : wave * 0.6));   // 從左肩往外上方招
    petEllipse(g, 0, -16, 8, 15, '#fbf8f0', null, 3);
    g.fillStyle = '#ff9db0'; g.beginPath(); g.ellipse(0, -26, 3.5, 3, 0, 0, 7); g.fill();
    g.restore();
    // 紅色項圈＋金鈴
    g.fillStyle = '#d8382a'; g.strokeStyle = PET_LINE; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -50, 22, 6, 0, 0, Math.PI); g.lineTo(-22, -52); g.ellipse(0, -52, 22, 5, 0, Math.PI, 0, true); g.closePath(); g.fill(); g.stroke();
    petEllipse(g, 0, -44, 6, 6, '#f2c230', null, 2.5);
    // 耳朵（花色）
    [-1, 1].forEach(k => {
      g.save(); g.translate(k * 18, -94); g.rotate(k * (mood === 'sad' ? 0.6 : 0.2));
      g.beginPath(); g.moveTo(-11, 9); g.lineTo(0, -15); g.lineTo(11, 9); g.closePath(); g.fillStyle = k < 0 ? '#f0a040' : '#2a2a2a'; g.fill(); g.strokeStyle = PET_LINE; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke();
      g.beginPath(); g.moveTo(-5, 6); g.lineTo(0, -6); g.lineTo(5, 6); g.closePath(); g.fillStyle = '#ffb3c6'; g.fill();
      g.restore();
    });
    // 頭（左額頭橘色斑點、右邊黑色斑點）
    g.save(); g.beginPath(); g.ellipse(0, -73, 32, 27, 0, 0, 7); g.fillStyle = '#fbf8f0'; g.fill(); g.clip();
    g.fillStyle = '#f0a040'; g.beginPath(); g.ellipse(-20, -92, 16, 12, 0.3, 0, 7); g.fill();
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(24, -90, 12, 10, -0.3, 0, 7); g.fill();
    g.restore();
    g.beginPath(); g.ellipse(0, -73, 32, 27, 0, 0, 7); g.strokeStyle = PET_LINE; g.lineWidth = 3.5; g.stroke();
    petEyes(g, 12, -75, mood === 'idle' ? 'happy' : mood);   // 招財貓平常就是瞇眼笑
    g.fillStyle = '#ff7a90'; g.beginPath(); g.moveTo(-3.5, -65); g.lineTo(3.5, -65); g.lineTo(0, -61); g.closePath(); g.fill();
    petMouth(g, 0, -59, mood);
    g.strokeStyle = PET_LINE; g.lineWidth = 1.8; [-1, 1].forEach(k => { g.beginPath(); g.moveTo(k * 16, -64); g.lineTo(k * 34, -67); g.moveTo(k * 16, -60); g.lineTo(k * 34, -58); g.stroke(); });
    petBlush(g, 20, -64);
  },
  tanuki(g, mood, dt) {
    const up = mood === 'cheer';
    // 尾巴（條紋）
    g.save(); g.translate(28, -18); g.rotate(-0.5 + Math.sin(Game.time * 4) * 0.1);
    petEllipse(g, 0, -12, 10, 18, '#9a6a3e', null, 3);
    g.fillStyle = '#5a3a20'; g.beginPath(); g.ellipse(0, -24, 8, 4, 0, 0, 7); g.fill();
    g.restore();
    // 身體＋圓肚子
    petEllipse(g, 0, -30, 31, 28, '#9a6a3e', '#7a4e2a');
    petEllipse(g, 0, -24, 18, 19, '#ecd2a4', null, 2.5);
    // 拍肚子／舉手
    [-1, 1].forEach(k => petEllipse(g, k * (up ? 36 : 17), up ? -50 : -30, up ? 9 : 7, up ? 7 : 9, '#5a3a20', null, 3));   // 平常拍肚子、歡呼時往兩側舉
    // 圓耳朵
    [-1, 1].forEach(k => petEllipse(g, k * 22, -94, 8, 8, '#5a3a20', null, 3));
    // 頭
    petEllipse(g, 0, -72, 33, 27, '#9a6a3e', '#7a4e2a');
    // 眼罩（深色）＋白色口鼻
    g.fillStyle = '#4a2e18'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * 13, -74, 11, 9, k * -0.3, 0, 7); g.fill(); });
    g.fillStyle = '#ecd2a4'; g.beginPath(); g.ellipse(0, -60, 15, 11, 0, 0, 7); g.fill();
    // 眼睛（在深色眼罩上，用白色描）
    g.save(); g.translate(0, 0);
    if (mood === 'idle') { [-1, 1].forEach(k => { g.fillStyle = '#fff'; g.beginPath(); g.arc(k * 13, -74, 4.6, 0, 7); g.fill(); g.fillStyle = PET_LINE; g.beginPath(); g.arc(k * 13, -74, 2.8, 0, 7); g.fill(); }); }
    else { g.strokeStyle = '#fff'; petEyesWhite(g, mood); }
    g.restore();
    g.fillStyle = PET_LINE; g.beginPath(); g.ellipse(0, -64, 4.5, 3.2, 0, 0, 7); g.fill();
    petMouth(g, 0, -58, mood);
    // 頭上的葉子
    g.save(); g.translate(4, -101); g.rotate(-0.4 + (mood === 'sad' ? 0.7 : 0));
    g.beginPath(); g.moveTo(0, 6); g.quadraticCurveTo(-12, -6, 0, -18); g.quadraticCurveTo(12, -6, 0, 6); g.closePath();
    g.fillStyle = '#5aa040'; g.fill(); g.strokeStyle = PET_LINE; g.lineWidth = 3; g.stroke();
    g.strokeStyle = '#2e6a20'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 4); g.lineTo(0, -14); g.stroke();
    g.restore();
  },
  tako(g, mood, dt) {
    const up = mood === 'cheer';
    // 觸手（6 隻，波動）
    for (let i = 0; i < 6; i++) {
      const x = -25 + i * 10, w = Math.sin(Game.time * 6 + i) * 4, lift = up && (i === 0 || i === 5) ? -26 : 0;
      g.beginPath(); g.moveTo(x - 6, -30); g.quadraticCurveTo(x + w - 8, -12 + lift / 2, x + w, -2 + lift);
      g.quadraticCurveTo(x + w + 7, -10 + lift / 2, x + 6, -30); g.closePath();
      g.fillStyle = '#e8584a'; g.fill(); g.strokeStyle = PET_LINE; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
      g.fillStyle = '#ffd0c0'; g.beginPath(); g.arc(x + w * 0.6, -10 + lift * 0.6, 2, 0, 7); g.fill();
    }
    // 頭（大圓頂）
    petEllipse(g, 0, -60, 36, 36, '#e8584a', '#c8423a');
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-12, -80, 9, 6, -0.5, 0, 7); g.fill();   // 亮光
    g.fillStyle = '#f88a7a'; [[-22, -66], [20, -76], [10, -86]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); });   // 斑點
    // 頭巾（白底、紅色條紋＋右邊打結）
    g.save(); g.beginPath(); g.ellipse(0, -60, 36, 36, 0, 0, 7); g.clip();
    g.fillStyle = '#fbf8f0'; g.fillRect(-40, -78, 80, 12); g.fillStyle = '#d8382a'; g.fillRect(-40, -73, 80, 3);
    g.restore();
    g.strokeStyle = PET_LINE; g.lineWidth = 2.5; g.strokeRect(-35, -78, 70, 12);
    g.fillStyle = '#fbf8f0'; g.beginPath(); g.moveTo(32, -74); g.lineTo(46, -84); g.lineTo(44, -70); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(32, -72); g.lineTo(48, -66); g.lineTo(38, -62); g.closePath(); g.fill(); g.stroke();
    petEyes(g, 12, -54, mood);
    // 嘴：章魚的「嘟嘴」（開心時張開）
    if (mood === 'happy' || mood === 'cheer') petMouth(g, 0, -42, mood);
    else { petEllipse(g, 0, -40, 6, 5, '#c8423a', null, 2.5); g.fillStyle = PET_LINE; g.beginPath(); g.arc(0, -40, 2, 0, 7); g.fill(); }
    petBlush(g, 23, -45);
  },
  kingyo(g, mood, dt) {   // 撈金魚的水袋：袋子跟著節拍晃，金魚在裡面游；開心冒泡泡
    const t = Game.time, sway = Math.sin(t * 2.4) * 0.06;
    g.save(); g.rotate(sway);
    // 水袋（透明、下圓上收口）
    const bag = () => { g.beginPath(); g.moveTo(-12, -96); g.quadraticCurveTo(-46, -70, -40, -32); g.quadraticCurveTo(-34, 0, 0, 0); g.quadraticCurveTo(34, 0, 40, -32); g.quadraticCurveTo(46, -70, 12, -96); g.closePath(); };
    bag(); g.fillStyle = 'rgba(200,235,255,.35)'; g.fill();
    g.save(); bag(); g.clip(); g.fillStyle = 'rgba(110,190,255,.45)'; g.fillRect(-50, -58, 100, 60);   // 水
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-50, -59, 100, 2.5);
    // 金魚（左右游、往游的方向轉）
    const sx = Math.sin(t * 1.6) * 8, dir = Math.cos(t * 1.6) >= 0 ? 1 : -1, jump = mood === 'cheer' ? -Math.abs(Math.sin(dt * 9)) * 16 : mood === 'happy' ? -8 : 0;
    g.save(); g.translate(sx, -30 + jump + (mood === 'sad' ? 6 : 0)); g.scale(dir * 0.85, 0.85);
    const tail = Math.sin(t * 12) * 0.35;
    g.save(); g.translate(-14, 0); g.rotate(tail);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-14, -14, -16, -4); g.quadraticCurveTo(-10, 0, -16, 6); g.quadraticCurveTo(-14, 14, 0, 0); g.closePath();
    g.fillStyle = '#ff9a5a'; g.fill(); g.strokeStyle = PET_LINE; g.lineWidth = 2.5; g.lineJoin = 'round'; g.stroke(); g.restore();
    petEllipse(g, 0, 0, 17, 12, '#ff6a2a', '#e84a1a', 2.8);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-3, 4, 7, 4, 0, 0, 7); g.fill();
    g.save(); g.translate(8, -3); petEyes(g, 0, 0, mood, 0.7); g.restore();
    g.restore();
    g.restore();
    bag(); g.strokeStyle = 'rgba(40,80,120,.7)'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-24, -48, 4, 12, 0.2, 0, 7); g.fill();   // 反光
    // 袋口綁的紅繩
    g.strokeStyle = '#d8382a'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-13, -96); g.lineTo(13, -96); g.stroke();
    g.beginPath(); g.moveTo(0, -96); g.quadraticCurveTo(-8, -112, 0, -118); g.quadraticCurveTo(8, -112, 0, -96); g.stroke();
    // 泡泡
    if (mood !== 'sad') for (let i = 0; i < 3; i++) {
      const k = (t * 0.8 + i / 3) % 1;
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(sx * 0.5 + i * 5 - 5, -40 - k * 18, 2 + i, 0, 7); g.stroke();
    }
    g.restore();
  },
  usagi(g, mood, dt) {   // 月兔：長耳朵（難過時垂下）、粉紅內耳、圓尾巴
    const up = mood === 'cheer', droop = mood === 'sad' ? 0.6 : 0, flick = Math.sin(Game.time * 5) * 0.06;
    petEllipse(g, 26, -20, 9, 9, '#ffffff', null, 3);   // 尾巴
    petEllipse(g, 0, -30, 27, 27, '#f6f2ff', '#dcd4f0');
    [-1, 1].forEach(k => petEllipse(g, k * (up ? 32 : 12), up ? -50 : -8, up ? 8 : 8, up ? 7 : 6, '#f6f2ff', null, 3));
    // 長耳朵
    [-1, 1].forEach(k => {
      g.save(); g.translate(k * 13, -92); g.rotate(k * (0.12 + droop) + flick * k);
      petEllipse(g, 0, -26, 9, 28, '#f6f2ff', '#dcd4f0', 3.2);
      g.fillStyle = '#ffb3c6'; g.beginPath(); g.ellipse(0, -24, 4.5, 20, 0, 0, 7); g.fill();
      g.restore();
    });
    petEllipse(g, 0, -70, 30, 26, '#f6f2ff', '#dcd4f0');
    petEyes(g, 11, -72, mood);
    g.fillStyle = '#ff8aa0'; g.beginPath(); g.moveTo(-3.5, -62); g.lineTo(3.5, -62); g.lineTo(0, -58); g.closePath(); g.fill();
    petMouth(g, 0, -55, mood);
    petBlush(g, 19, -62);
  },
  panda(g, mood, dt) {   // 熊貓：黑耳朵、黑眼圈、黑手腳
    const up = mood === 'cheer';
    petEllipse(g, 0, -30, 31, 28, '#f4f4f0', '#dadad2');
    [-1, 1].forEach(k => petEllipse(g, k * 15, -6, 10, 8, '#2a2a2e', null, 3));   // 腳
    [-1, 1].forEach(k => petEllipse(g, k * (up ? 34 : 22), up ? -52 : -34, 9, up ? 8 : 12, '#2a2a2e', null, 3));   // 手
    [-1, 1].forEach(k => petEllipse(g, k * 23, -92, 10, 10, '#2a2a2e', null, 3));   // 耳朵
    petEllipse(g, 0, -71, 33, 27, '#f4f4f0', '#dadad2');
    g.fillStyle = '#2a2a2e'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * 13, -73, 10, 12, k * -0.5, 0, 7); g.fill(); });
    if (mood === 'idle') [-1, 1].forEach(k => { g.fillStyle = '#fff'; g.beginPath(); g.arc(k * 13, -74, 4, 0, 7); g.fill(); g.fillStyle = PET_LINE; g.beginPath(); g.arc(k * 13, -74, 2.4, 0, 7); g.fill(); });
    else { g.save(); g.translate(0, 1); petEyesWhite(g, mood); g.restore(); }
    g.fillStyle = PET_LINE; g.beginPath(); g.ellipse(0, -61, 4.5, 3.2, 0, 0, 7); g.fill();
    petMouth(g, 0, -56, mood);
    petBlush(g, 22, -60);
  },
  penguin(g, mood, dt) {   // 企鵝：深藍身體、白肚子、橘嘴橘腳；開心時拍翅膀
    const flap = mood === 'idle' ? Math.sin(Game.time * 4) * 0.08 : Math.sin(Game.time * 22) * 0.5;
    [-1, 1].forEach(k => petEllipse(g, k * 11, -2, 10, 5, '#ff9a2a', null, 2.8));   // 腳
    petEllipse(g, 0, -50, 32, 48, '#2a3a5a', '#1a2840');
    petEllipse(g, 0, -40, 22, 34, '#fbf8f0', null, 2.5);
    [-1, 1].forEach(k => {   // 翅膀（畫在身體前面，拍動才看得到）
      g.save(); g.translate(k * 27, -54); g.rotate(-k * (0.25 + (mood === 'cheer' ? 1.7 : 0) + Math.abs(flap)));   // 負的角度 = 往外張開
      petEllipse(g, 0, 16, 8, 20, '#2a3a5a', null, 3); g.restore();
    });
    // 臉的白色區域（心形額頭）
    g.fillStyle = '#fbf8f0'; g.beginPath(); g.ellipse(-10, -74, 12, 13, 0, 0, 7); g.ellipse(10, -74, 12, 13, 0, 0, 7); g.fill();
    petEyes(g, 10, -75, mood);
    g.fillStyle = '#ff9a2a'; g.strokeStyle = PET_LINE; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(-6, -66); g.lineTo(6, -66); g.lineTo(0, mood === 'happy' || mood === 'cheer' ? -56 : -59); g.closePath(); g.fill(); g.stroke();
    petBlush(g, 20, -66);
  },
  daruma(g, mood, dt) {   // 達摩：紅色不倒翁，跟著節拍左右搖；左眼畫好、右眼空白（歡呼時兩眼都畫上）
    const rock = mood === 'sad' ? 0.25 : Math.sin(Game.time * 5) * 0.12 + (mood === 'cheer' ? Math.sin(dt * 14) * 0.2 : 0);
    g.save(); g.rotate(rock);
    petEllipse(g, 0, -50, 38, 50, '#d8382a', '#b0261a');
    // 金色腹部花紋
    g.strokeStyle = '#f2c230'; g.lineWidth = 3.5; g.beginPath(); g.arc(0, -20, 16, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.arc(0, -12, 22, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    // 白臉
    petEllipse(g, 0, -66, 24, 21, '#fbf8f0', null, 3);
    // 粗眉毛、鬍子
    g.strokeStyle = PET_LINE; g.lineWidth = 4.5; g.lineCap = 'round';
    [-1, 1].forEach(k => { g.beginPath(); g.moveTo(k * 6, -78); g.quadraticCurveTo(k * 14, mood === 'sad' ? -80 : -84, k * 20, -78); g.stroke(); });
    g.lineWidth = 2.5; [-1, 1].forEach(k => { g.beginPath(); g.moveTo(k * 5, -55); g.quadraticCurveTo(k * 14, -54, k * 18, -60); g.stroke(); });
    // 眼睛：左邊黑眼珠；右邊空白（歡呼時畫上）
    [-1, 1].forEach(k => {
      g.fillStyle = '#fff'; g.strokeStyle = PET_LINE; g.lineWidth = 2.5; g.beginPath(); g.arc(k * 10, -68, 7, 0, 7); g.fill(); g.stroke();
      if (k < 0 || mood === 'cheer') { g.fillStyle = PET_LINE; g.beginPath(); g.arc(k * 10, -67, 5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(k * 10 + 1.6, -69, 1.6, 0, 7); g.fill(); }
    });
    if (mood === 'happy' || mood === 'cheer') { g.fillStyle = '#d8424a'; g.beginPath(); g.ellipse(0, -55, 4, 3, 0, 0, 7); g.fill(); }
    g.restore();
  },
  hiyoko(g, mood, dt) {   // 小雞：從蛋殼探出頭；翅膀拍動、頭頂一撮毛
    const flap = mood === 'idle' ? Math.sin(Game.time * 5) * 0.12 : Math.sin(Game.time * 24) * 0.6;
    [-1, 1].forEach(k => { g.save(); g.translate(k * 26, -40); g.rotate(k * (0.6 + (mood === 'cheer' ? 0.9 : 0) + flap)); petEllipse(g, 0, -10, 7, 14, '#ffd84a', null, 3); g.restore(); });
    petEllipse(g, 0, -50, 30, 34, '#ffd84a', '#f2b820');
    // 頭頂的毛
    g.strokeStyle = PET_LINE; g.lineWidth = 3; g.fillStyle = '#ffd84a';
    g.beginPath(); g.moveTo(-4, -82); g.quadraticCurveTo(-8, -96, 2, -98); g.quadraticCurveTo(0, -90, 6, -84); g.closePath(); g.fill(); g.stroke();
    petEyes(g, 11, -58, mood);
    g.fillStyle = '#ff9a2a'; g.strokeStyle = PET_LINE; g.lineWidth = 2.5;
    const open = mood === 'happy' || mood === 'cheer';
    g.beginPath(); g.moveTo(-6, -50); g.lineTo(6, -50); g.lineTo(0, open ? -40 : -44); g.closePath(); g.fill(); g.stroke();
    if (open) { g.beginPath(); g.moveTo(-5, -52); g.lineTo(5, -52); g.lineTo(0, -58); g.closePath(); g.fill(); g.stroke(); }
    petBlush(g, 19, -48);
    // 下半的蛋殼（鋸齒邊）
    g.beginPath(); g.moveTo(-34, -30);
    for (let i = 0; i <= 8; i++) g.lineTo(-34 + i * 8.5, i % 2 ? -38 : -28);
    g.quadraticCurveTo(36, 2, 0, 2); g.quadraticCurveTo(-36, 2, -34, -30); g.closePath();
    g.fillStyle = '#fbf8f0'; g.fill(); g.strokeStyle = PET_LINE; g.lineWidth = 3.2; g.lineJoin = 'round'; g.stroke();
    g.fillStyle = '#e8e0d0'; g.beginPath(); g.ellipse(14, -10, 10, 6, -0.4, 0, 7); g.fill();
  },
  pocket(g, mood, dt) {   // 遊戲機：橘色橫式膠囊掌機（通用造型）；淺藍螢幕上的像素臉跟著心情換、左邊類比搖桿、右邊菱形 4 顆圓鈕、頭頂小天線
    const up = mood === 'cheer', t = Game.time, cy = -52;
    // 小腳
    [-1, 1].forEach(k => petEllipse(g, k * 14, -3, 9, 5, '#4a4a58', null, 2.8));
    g.strokeStyle = PET_LINE; g.lineWidth = 3; g.lineCap = 'round';
    [-1, 1].forEach(k => { g.beginPath(); g.moveTo(k * 14, -8); g.lineTo(k * 12, -24); g.stroke(); });
    // 小手（從兩端伸出；歡呼時舉起）
    [-1, 1].forEach(k => {
      g.save(); g.translate(k * 44, cy); g.rotate(-k * (up ? 1.0 : -0.5 + Math.sin(t * 4) * 0.08));
      g.strokeStyle = PET_LINE; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(k * 14, 0); g.stroke();
      petEllipse(g, k * 17, 0, 5.5, 5.5, '#fbf8f0', null, 2.5); g.restore();
    });
    // 頭頂的小天線（開心時尖端亮）
    g.strokeStyle = PET_LINE; g.lineWidth = 3; g.beginPath(); g.moveTo(14, cy - 26); g.quadraticCurveTo(18, cy - 40, 24, cy - 46); g.stroke();
    petEllipse(g, 25, cy - 48, 5, 5, mood === 'sad' ? '#7a7a88' : (mood === 'happy' || up) && Math.floor(t * 8) % 2 ? '#fff27a' : '#ffd23f', null, 2.5);
    // 機身（橫式膠囊）
    const body = () => { g.beginPath(); g.moveTo(-26, cy - 27); g.lineTo(26, cy - 27); g.arc(26, cy, 27, -Math.PI / 2, Math.PI / 2); g.lineTo(-26, cy + 27); g.arc(-26, cy, 27, Math.PI / 2, Math.PI * 1.5); g.closePath(); };
    body(); g.fillStyle = '#ff8a3a'; g.fill();
    g.save(); body(); g.clip(); g.fillStyle = '#e06a20'; g.fillRect(-60, cy + 14, 120, 20); g.restore();   // 下緣陰影
    body(); g.strokeStyle = PET_LINE; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke();
    // 螢幕（深色邊框＋淺藍螢幕；歡呼彩色閃、難過變暗）
    g.fillStyle = '#34344a'; g.strokeStyle = PET_LINE; g.lineWidth = 2.5; g.beginPath(); g.roundRect ? g.roundRect(-22, cy - 20, 44, 36, 7) : g.rect(-22, cy - 20, 44, 36); g.fill(); g.stroke();
    g.fillStyle = mood === 'sad' ? '#4a5260' : up ? `hsl(${(t * 400) % 360},80%,78%)` : '#bfe8ff';
    g.fillRect(-17, cy - 15, 34, 26);
    // 像素臉（每格 3px）
    const px = (x, y) => g.fillRect(x * 3, y * 3, 3, 3);
    g.save(); g.translate(0, cy - 2); g.fillStyle = mood === 'sad' ? '#1a2030' : '#1e2a5a';
    if (mood === 'idle') {
      const blink = (t % 3) < 0.12;
      [-1, 1].forEach(k => { if (blink) { px(k * 3 - 1, -1); px(k * 3, -1); } else { px(k * 3 - 1, -2); px(k * 3, -2); px(k * 3 - 1, -1); px(k * 3, -1); } });
      px(-1, 2); px(0, 2);
    } else if (mood === 'happy' || up) {
      [-1, 1].forEach(k => { px(k * 3 - 1, -1); px(k * 3, -2); px(k * 3 + 1, -1); });
      px(-2, 1); px(-1, 2); px(0, 2); px(1, 1);
    } else {
      [-1, 1].forEach(k => { px(k * 3 - k, -3); px(k * 3, -2); px(k * 3 - k, -1); });
      px(-2, 2); px(-1, 1); px(0, 1); px(1, 2);
    }
    g.restore();
    // 左：類比搖桿（跟著節拍微微晃）
    const sx = -38 + Math.sin(t * 5) * 1.5;
    petEllipse(g, -38, cy, 9, 9, '#3a3a48', null, 2.5); petEllipse(g, sx, cy - 1, 6, 6, '#6a6a7a', null, 2);
    // 右：菱形 4 顆圓鈕（同色；開心時輪流亮）
    [[38, cy - 9], [46, cy], [38, cy + 9], [30, cy]].forEach(([x, y], i) => {
      g.fillStyle = (mood === 'happy' || up) && Math.floor(t * 10) % 4 === i ? '#fff27a' : '#ffd23f';
      g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); g.strokeStyle = PET_LINE; g.lineWidth = 1.8; g.stroke();
    });
    // 喇叭孔
    g.fillStyle = 'rgba(60,20,0,.45)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-6 + i * 6, cy + 22, 1.6, 0, 7); g.fill(); }
  },
};
// 狸貓的眼睛（深色眼罩上用白線畫 ^ ^ 或 > <）
function petEyesWhite(g, mood) {
  g.lineWidth = 3; g.lineCap = 'round'; g.strokeStyle = '#fff';
  [-1, 1].forEach(k => {
    const ex = k * 13, y = -74;
    g.beginPath();
    if (mood === 'sad') { g.moveTo(ex - 5 * k, y - 4); g.lineTo(ex + 3 * k, y); g.lineTo(ex - 5 * k, y + 4); }
    else g.arc(ex, y + 3, 6, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  });
}
