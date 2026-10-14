// 把遊戲整理成 iOS App（Capacitor）要包進去的網頁檔：輸出到 www/（不進 git）
// 用法（Mac）：npm run build　→ 之後 npx cap sync ios 會把 www/ 複製進 Xcode 專案
// 和網頁版的差別：
//   - 字型 Mochiy Pop One 改用 App 內附的檔案（@fontsource/mochiy-pop-one，OFL 授權），不連 Google Fonts，離線也正常
//   - 不放 Service Worker、manifest、網頁圖示（App 圖示在 Xcode 的 Assets 裡設定）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'www');
const from = (...p) => path.join(root, ...p);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of ['css', 'js', 'assets/images', 'assets/audio']) {
  fs.cpSync(from(item), path.join(out, item), { recursive: true });
}

// ---- 字型：只複製 woff2（WKWebView 都支援），CSS 裡的 woff 備援不會被讀到 ----
const fontPkg = from('node_modules', '@fontsource', 'mochiy-pop-one');
if (!fs.existsSync(fontPkg)) {
  throw new Error('找不到 @fontsource/mochiy-pop-one，請先執行 npm install（見 docs/iOS上架.md）');
}
const fontOut = path.join(out, 'fonts', 'mochiy-pop-one');
fs.mkdirSync(path.join(fontOut, 'files'), { recursive: true });
const fontCss = ['400.css', 'index.css'].map(f => path.join(fontPkg, f)).find(f => fs.existsSync(f));
fs.copyFileSync(fontCss, path.join(fontOut, 'font.css'));
for (const f of fs.readdirSync(path.join(fontPkg, 'files'))) {
  if (f.endsWith('.woff2')) fs.copyFileSync(path.join(fontPkg, 'files', f), path.join(fontOut, 'files', f));
}

// ---- Capacitor 執行環境＋原生外掛（遊戲是一般 <script>、沒有打包工具，所以用各套件的瀏覽器版 dist 檔） ----
//   capacitor.js：@capacitor/core（提供 registerPlugin）；native-purchases.js：App Store 內購（js/shop.js 的 AppleStore）
const SCRIPTS = [
  ['@capacitor/core/dist/capacitor.js', 'capacitor.js'],
  ['@capgo/native-purchases/dist/plugin.js', 'plugins/native-purchases.js'],
];
for (const [src, dst] of SCRIPTS) {
  const file = from('node_modules', src);
  if (!fs.existsSync(file)) throw new Error(`找不到 ${src}，請先執行 npm install（見 docs/iOS上架.md）`);
  fs.mkdirSync(path.dirname(path.join(out, dst)), { recursive: true });
  fs.copyFileSync(file, path.join(out, dst));
}

// ---- index.html：拿掉網頁版才需要的連結，換成內附字型；每一項都必須找得到，找不到就停下來（代表 index.html 改過，這裡要跟著改） ----
let html = fs.readFileSync(from('index.html'), 'utf8');
const edit = (re, to, what) => {
  if (!re.test(html)) throw new Error(`index.html 找不到：${what}`);
  html = html.replace(re, to);
};
edit(/[ \t]*<link rel="manifest"[^>]*>\r?\n/, '', 'manifest');
edit(/[ \t]*<link rel="icon"[^>]*>\r?\n/, '', 'favicon');
edit(/[ \t]*<link rel="apple-touch-icon"[^>]*>\r?\n/, '', 'apple-touch-icon');
edit(/[ \t]*<link rel="preconnect"[^>]*>\r?\n/g, '', 'preconnect');
edit(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/mochiy-pop-one/font.css">', 'Google Fonts');
edit(/([ \t]*)<script src="js\/config\.js"><\/script>/,
  SCRIPTS.map(([, dst]) => `$1<script src="${dst}"></script>\n`).join('') + '$1<script src="js/config.js"></script>', 'js/config.js');
fs.writeFileSync(path.join(out, 'index.html'), html);

console.log('Built: www/');
