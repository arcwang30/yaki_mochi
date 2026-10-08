'use strict';

// ===== 全域參數（調整難度、計分、版面改這裡） =====
const W = 720, H = 1280;          // 9:16 直式邏輯解析度
const FONT = "'Mochiy Pop One','Microsoft JhengHei','PingFang TC',sans-serif";
const QS = new URLSearchParams(location.search);
const FAST = QS.has('fast');      // 網址加 ?fast：每段只有 3 小節，方便測試結算與排行榜

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let RES = 1;   // 畫布實際解析度倍率（main.js 依螢幕設定；快取圖用）

// ---- 省電模式（設定可開關）：每秒 30 幀、1 倍解析度、關閉模糊陰影 / 火星 / 濾鏡、特效粒子減半 ----
const ECO = () => !!Save.data.eco;
const blur = v => (ECO() ? 0 : v);              // 模糊陰影在手機上很耗電：省電模式直接關掉
const FPS_MAX = () => (ECO() ? 30 : 60);         // 120Hz 螢幕也限制在 60（省電模式 30）
const RES_MAX = () => (ECO() ? 1 : 2);

// ---- 版面 ----
const ZONE = { x: 360, y: 920, w: 240, h: 92 };   // 判定框（鐵板中央）
const GRIDDLE_Y = 860;
const BTN_RED = [117, 262], BTN_Y = 1212;         // 按鈕圖中紅色按鈕的中心（原圖 425x334）；畫面上落在下方正中央
const PAUSE_BTN = { x: 676, y: 210, r: 28 };      // 遊戲中右上角的暫停鈕

// ---- 判定與計分 ----
const LEAD_BEATS = 2;                                            // 食材在落點前 2 拍被丟出
const WIN = { GREAT: 0.05, NICE: 0.09, GOOD: 0.13, BAD: 0.18 };  // 判定時間窗（秒）
const POINTS = { GREAT: 300, NICE: 200, GOOD: 100, BAD: 0 };
const COMBO_BONUS = 4, COMBO_CAP = 50;                           // 每次命中加 min(連擊, 50) × 4
const OKO_BONUS = 1000;                                          // 合成一份廣島燒的獎勵
const OKO_FX_Y = 430;                                            // 「廣島燒完成！」演出的中心高度（在主角頭頂上方，不擋臉）

// ---- 食材 ----
const TYPES = ['noodles', 'cabbage', 'crepe', 'bacon'];
const ING = {
  noodles: { name: '炒麵',   raw: 'noodles_raw', done: 'yakisoba',      rawW: 200, doneW: 215, pose: 'spatula', act: '鍋鏟翻炒', cue: 440, color: '#e8b45a' },
  cabbage: { name: '高麗菜', raw: 'cabbage_raw', done: 'cabbage_shred', rawW: 165, doneW: 205, pose: 'knife',   act: '切絲',     cue: 523, color: '#a8d878' },
  crepe:   { name: '煎餅',   raw: 'crepe_raw',   done: 'crepe_sauce',   rawW: 200, doneW: 205, pose: 'sauce',   act: '淋醬',     cue: 784, color: '#ead2a0' },
  bacon:   { name: '培根',   raw: 'bacon_raw',   done: 'bacon_bits',    rawW: 210, doneW: 195, pose: 'knife',   act: '切塊',     cue: 659, color: '#d0644a' },
};

// ---- 節奏 ----
// 每首歌分成數段，每段 MEASURES 小節，最後一小節休息（顯示 SPEED UP）；各段 BPM 與難度定義在 js/songs.js
const MEASURES = FAST ? 3 : 8;
// 節奏型（小節內的拍點，0.5 = 八分音符反拍）；兩小節一組重複，像「節奏天國」一樣先聽再打
// 難度 0～3；每首歌的每一段指定要用哪幾級
const PATTERNS = [
  [[0, 2], [0], [0, 1], [2], [0, 2, 3], [0, 1, 2]],
  [[0, 1, 2], [0, 2, 3], [1, 2], [0, 1, 3], [0, 2, 2.5], [0, 1, 2, 3]],
  [[0, 1, 2, 3], [0, 0.5, 2], [0, 2, 2.5], [1, 2, 3], [0, 1.5, 2], [0, 0.5, 1, 2]],
  [[0, 0.5, 1, 2], [0, 1, 1.5, 2, 3], [0, 0.5, 2, 2.5], [0, 1.5, 3], [1, 1.5, 2, 3], [0, 0.5, 1, 1.5, 3]],
];
// ---- 主角姿勢 ----
// 跳躍姿勢的原圖人物畫得較小（頭寬約站姿的 0.68 倍），在此放大並以臉（口罩中心）對齊站姿。
// a = 該圖口罩中心、t = 站姿口罩中心（皆為 560x526 圖內座標），lift = 往上跳的高度
const POSE_ADJ = {
  great: { s: 1.45, a: [316, 185], t: [291, 170], lift: 34 },
  cheer: { s: 1.45, a: [316, 182], t: [291, 170], lift: 34 },
};

// 處理動作時主角往上探身的高度（px）：讓刀、鍋鏟、醬汁瓶露出鐵板
// 三個處理動作的頭部高度拉齊（連打時輪替不會上下跳）；比讚抬一點讓雙手露出鐵板
const POSE_LIFT = { knife: 95, spatula: 105, sauce: 90, nice: 60 };
const ACTION_HOLD = 0.36;   // 處理動作維持秒數（下一次打擊會直接接上）
const COMBO_STEP = 10;      // 每幾連擊主角跳起歡呼一次

// ---- 背景燈籠位置（背景原圖座標 848x1264） ----
const LANTERNS = [
  [72, 395, '#ff7a30'], [145, 395, '#ff7a30'], [220, 395, '#ff7a30'], [300, 395, '#ff70d0'], [385, 395, '#60ff70'],
  [465, 395, '#c070ff'], [545, 395, '#ffd040'], [628, 395, '#ff7a30'], [702, 395, '#ff7a30'], [772, 395, '#ff7a30'],
  [92, 75, '#ff7a30'], [80, 150, '#ff7a30'], [48, 205, '#ffd040'], [14, 232, '#ff7a30'],
  [757, 80, '#ff7a30'], [772, 150, '#ff7a30'], [800, 192, '#ffd040'], [835, 225, '#ff7a30'],
  [10, 470, '#ff7a30'], [35, 510, '#ff7a30'], [60, 548, '#ff7a30'], [150, 615, '#ff7a30'], [200, 650, '#ff7a30'],
  [838, 470, '#ff7a30'], [812, 510, '#ff7a30'], [786, 548, '#ff7a30'], [700, 615, '#ff7a30'], [650, 650, '#ff7a30'],
];

// ---- 製作名單 ----
// 每個職稱可列多位
const CREDITS = [
  ['企劃', ['Arc Wang', '大王KUNI']],
  ['特別感謝', ['Kelvin Lo', 'Bubu Lin']],
];

// ---- 小工具 ----
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const ease = t => 1 - Math.pow(1 - t, 3);
const pad = (n, len) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
// 固定種子的亂數（木紋等每幀都要畫成一樣的花紋）
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hashStr = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return h; };
const mel = n => 293.66 * Math.pow(2, n / 12);
const bassF = n => 73.42 * Math.pow(2, n / 12);
