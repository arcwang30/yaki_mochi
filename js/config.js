'use strict';

// ===== 全域參數（調整難度、計分、版面改這裡） =====
const W = 720, H = 1280;          // 9:16 直式邏輯解析度
const FONT = "'Mochiy Pop One','Microsoft JhengHei','PingFang TC',sans-serif";
const QS = new URLSearchParams(location.search);
const FAST = QS.has('fast');      // 網址加 ?fast：每段只有 3 小節，方便測試結算與排行榜

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');

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

// ---- 食材 ----
const TYPES = ['noodles', 'cabbage', 'crepe', 'bacon'];
const ING = {
  noodles: { name: '炒麵',   raw: 'noodles_raw', done: 'yakisoba',      rawW: 200, doneW: 215, pose: 'spatula', act: '鍋鏟翻炒', cue: 440, color: '#e8b45a' },
  cabbage: { name: '高麗菜', raw: 'cabbage_raw', done: 'cabbage_shred', rawW: 165, doneW: 205, pose: 'knife',   act: '切絲',     cue: 523, color: '#a8d878' },
  crepe:   { name: '煎餅',   raw: 'crepe_raw',   done: 'crepe_sauce',   rawW: 200, doneW: 205, pose: 'sauce',   act: '淋醬',     cue: 784, color: '#ead2a0' },
  bacon:   { name: '培根',   raw: 'bacon_raw',   done: 'bacon_bits',    rawW: 210, doneW: 195, pose: 'knife',   act: '切塊',     cue: 659, color: '#d0644a' },
};

// ---- 節奏 ----
// 每段 MEASURES 小節，最後一小節休息（顯示 SPEED UP）；節奏隨時間變快
const MEASURES = FAST ? 3 : 8;
const SECTIONS = [
  { bpm: 96,  lv: [0] }, { bpm: 104, lv: [0, 1] }, { bpm: 112, lv: [1] },
  { bpm: 122, lv: [1, 2] }, { bpm: 134, lv: [2, 3] }, { bpm: 146, lv: [3] },
];
// 節奏型（小節內的拍點，0.5 = 八分音符反拍）；兩小節一組重複，像「節奏天國」一樣先聽再打
const PATTERNS = [
  [[0, 2], [0], [0, 1], [2], [0, 2, 3], [0, 1, 2]],
  [[0, 1, 2], [0, 2, 3], [1, 2], [0, 1, 3], [0, 2, 2.5], [0, 1, 2, 3]],
  [[0, 1, 2, 3], [0, 0.5, 2], [0, 2, 2.5], [1, 2, 3], [0, 1.5, 2], [0, 0.5, 1, 2]],
  [[0, 0.5, 1, 2], [0, 1, 1.5, 2, 3], [0, 0.5, 2, 2.5], [0, 1.5, 3], [1, 1.5, 2, 3], [0, 0.5, 1, 1.5, 3]],
];

// ---- 樂曲（D 大調五聲音階，8 小節循環） ----
const MELODY = [
  [12, null, 9, null, 7, 9, 12, null], [14, null, 12, 9, 7, null, null, null],
  [9, null, 7, 4, 2, 4, 7, null], [4, null, 2, 0, 2, null, null, null],
  [12, null, 14, null, 16, 14, 12, null], [9, null, 12, 9, 7, null, 4, null],
  [7, 9, 12, 9, 7, 4, 2, 4], [0, null, null, null, null, null, null, null],
];
const BASS_ROOT = [0, 0, 5, 7, 0, 5, 7, 0];
const TAIKO = {
  normal: { 0: 'don', 2: 'ka', 4: 'don', 5: 'don', 6: 'ka' },
  vary:   { 0: 'don', 2: 'ka', 3: 'ka', 4: 'don', 6: 'don', 7: 'ka' },
  fill:   { 0: 'don', 1: 'don', 2: 'don', 3: 'ka', 4: 'don', 5: 'don', 6: 'don', 7: 'don' },
};
const MENU_BPM = 92;

// ---- 主角姿勢 ----
// 跳躍姿勢的原圖人物畫得較小（頭寬約站姿的 0.68 倍），在此放大並以臉（口罩中心）對齊站姿。
// a = 該圖口罩中心、t = 站姿口罩中心（皆為 560x526 圖內座標），lift = 往上跳的高度
const POSE_ADJ = {
  great: { s: 1.45, a: [316, 185], t: [291, 170], lift: 34 },
  cheer: { s: 1.45, a: [316, 182], t: [291, 170], lift: 34 },
};

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
const CREDITS = {
  roles: [['企劃', 'Arc Wang'], ['程式', 'AI'], ['美術', 'AI'], ['音樂', 'AI']],
  thanks: ['Kelvin Lo', 'Bubu Lin', '大王KUNI', 'KT Lee', 'Gmoto', '國見比呂', 'Greed'],
};

// ---- 小工具 ----
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const ease = t => 1 - Math.pow(1 - t, 3);
const pad = (n, len) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
const mel = n => 293.66 * Math.pow(2, n / 12);
const bassF = n => 73.42 * Math.pow(2, n / 12);
