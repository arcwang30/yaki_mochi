'use strict';

// ===== 全域參數（調整難度、計分、版面改這裡） =====
const FONT = "'Mochiy Pop One','Microsoft JhengHei','PingFang TC',sans-serif";
const QS = new URLSearchParams(location.search);
const FAST = QS.has('fast');      // 網址加 ?fast：每段只有 3 小節，方便測試結算與排行榜

// ---- 版面：手機直式 9:16（720x1280）／PC 橫式 16:9（1920x1080） ----
// 桌面版（Electron，preload 會放 window.desktop）一律橫式；網頁版：觸控裝置直式、電腦視窗較寬時橫式。
// 網址加 ?layout=landscape 或 ?layout=portrait 可強制指定（測試用）。啟動時決定，之後不再切換。
const DESKTOP_APP = !!window.desktop;
const LAND = (() => {
  const q = QS.get('layout');
  if (q) return q === 'landscape';
  if (DESKTOP_APP) return true;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  return !coarse && window.innerWidth > window.innerHeight;
})();
const lay = (portrait, landscape) => (LAND ? landscape : portrait);   // 依版面取值
const W = lay(720, 1920), H = lay(1280, 1080);   // 畫面（UI）邏輯解析度
// 攤位場景（背景、主角、鐵板、食材）一律用直式的世界座標 720x1280；橫式時整個場景等比縮小、置中，兩側是延伸的街景
const SW = 720, SH = 1280;
const Cam = { k: H / SH, x: (W - SW * H / SH) / 2 };      // 世界 → 畫面：sx = Cam.x + wx × k、sy = wy × k
const VIEW = { x0: -Cam.x / Cam.k, x1: (W - Cam.x) / Cam.k };   // 畫面看得到的世界範圍（橫式時比 0～720 寬）
function worldBegin() { ctx.save(); ctx.translate(Cam.x, 0); ctx.scale(Cam.k, Cam.k); }
const toWorld = (sx, sy) => [(sx - Cam.x) / Cam.k, sy / Cam.k];

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let RES = 1;   // 畫布實際解析度倍率（main.js 依螢幕設定；快取圖用）

// ---- 省電模式（設定可開關）：每秒 30 幀、1 倍解析度、關閉模糊陰影 / 火星 / 濾鏡、特效粒子減半 ----
const ECO = () => !!Save.data.eco;
const blur = v => (ECO() ? 0 : v);              // 模糊陰影在手機上很耗電：省電模式直接關掉
// 120Hz 螢幕也限制在 60；選單畫面（動作慢）一律 30，省一半的繪製；省電模式全部 30
const SMOOTH_SCREENS = ['game', 'tutorial', 'intro'];
const FPS_MAX = () => (ECO() ? 30 : SMOOTH_SCREENS.includes(App.name) ? 60 : 30);
const RES_MAX = () => (ECO() ? 1 : 2);
// PC 版（橫式）可選的解析度：畫布實際繪製的大小（4:3 的 1024x768 會上下留黑邊）；桌面版視窗模式時也是視窗大小
const RESOLUTIONS = ['1920x1080', '1280x720', '1024x768'];

// ---- 版面 ----
const ZONE = { x: 360, y: 920, w: 240, h: 92 };   // 判定框（鐵板中央）
const GRIDDLE_Y = 860;
const BTN_RED = [117, 262], BTN_Y = 1212;         // 按鈕圖中紅色按鈕的中心（原圖 425x334）；畫面上落在下方正中央
const PAUSE_BTN = lay({ x: 676, y: 210, r: 28 }, { x: W - 66, y: 64, r: 34 });   // 遊戲中右上角的暫停鈕（畫面座標）

// ---- 判定與計分 ----
const LEAD_BEATS = 2;                                            // 食材在落點前 2 拍被丟出
const WIN = { GREAT: 0.05, NICE: 0.09, GOOD: 0.13, BAD: 0.18 };  // 判定時間窗（秒）
const POINTS = { GREAT: 300, NICE: 200, GOOD: 100, BAD: 0 };
const COMBO_BONUS = 4, COMBO_CAP = 50;                           // 每次命中加 min(連擊, 50) × 4
const OKO_BONUS = 1000;                                          // 合成一份廣島燒的獎勵
// 節奏評價：依「得分 ÷ 該曲滿分」分 5 級（各曲音符數不同，用比例才公平）
// 滿分 = 每個音符都 GREAT＋連擊不斷＋所有可合成的廣島燒
const maxScoreFor = n => { let s = 0; for (let i = 1; i <= n; i++) s += POINTS.GREAT + Math.min(i, COMBO_CAP) * COMBO_BONUS; return s + Math.floor(n / TYPES.length) * OKO_BONUS; };
const RATINGS = [
  { min: 0.90, stamp: '特上', color: '#c8321e', title: '傳說的鐵板之神', desc: '鍋鏟一揮，整條夜市都在排隊！大王KUNI 也要叫你一聲師父。' },
  { min: 0.75, stamp: '上',   color: '#e07a10', title: '人氣排隊名攤',   desc: '節奏又穩又帥，客人邊吃邊跟著打拍子，今晚又是完售！' },
  { min: 0.55, stamp: '並',   color: '#2e9a3e', title: '認真的見習生',   desc: '有模有樣！只是偶爾把高麗菜切成高麗「塊」……' },
  { min: 0.35, stamp: '見習', color: '#2a6fd6', title: '手忙腳亂的新人', desc: '鍋鏟揮得比拍子還快，培根飛到隔壁章魚燒攤了！' },
  { min: 0,    stamp: '修行', color: '#7a6aa8', title: '鐵板上的災難',   desc: '客人默默轉身去吃章魚燒了……明天再來練練吧！' },
];
const ratingFor = ratio => RATINGS.findIndex(r => ratio >= r.min);
const OKO_HUD = lay({ x: 612, y: 43, w: 84 }, { x: 1580, y: 959, w: 180 });   // HUD 上廣島燒成品圖（畫面座標；橫式在右下，不擋右邊飛進來的食材）
const OKO_FX_Y = 430;                                           // 「廣島燒完成！」演出的中心高度（在主角頭頂上方，不擋臉）

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
