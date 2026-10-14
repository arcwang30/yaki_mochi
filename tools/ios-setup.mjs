// 設定 iOS 專案的 Info.plist（npx cap add ios 產生 ios/ 之後執行一次；重複執行也沒關係）
// 用法（Mac）：npm run ios:setup
//   - iPhone：只能直式（9:16 版面）
//   - iPad：直式＋倒立直式（同樣 9:16 版面，左右空白掛廣島燒掛簾，見 js/sides.js）
//   - 隱藏狀態列（全螢幕遊戲）
//   - 加密出口合規：只用系統內建的 HTTPS，不另外用加密 → 上傳時不用每次回答問卷
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const plistPath = path.join(root, 'ios', 'App', 'App', 'Info.plist');
if (!fs.existsSync(plistPath)) throw new Error('找不到 ios/App/App/Info.plist，請先執行 npx cap add ios');

const orient = list => `<array>\n${list.map(o => `\t\t<string>UIInterfaceOrientation${o}</string>`).join('\n')}\n\t</array>`;
const KEYS = {
  'UISupportedInterfaceOrientations': orient(['Portrait']),
  'UISupportedInterfaceOrientations~ipad': orient(['Portrait', 'PortraitUpsideDown']),
  'UIStatusBarHidden': '<true/>',
  'UIViewControllerBasedStatusBarAppearance': '<false/>',
  'ITSAppUsesNonExemptEncryption': '<false/>',
};

let xml = fs.readFileSync(plistPath, 'utf8');
const esc = s => s.replace(/[.*+?^${}()|[\]\\~]/g, '\\$&');
for (const [key, value] of Object.entries(KEYS)) {
  // 已有這個 key → 換掉它的值（array / true / false / string）；沒有 → 加在最外層 dict 的最後
  const re = new RegExp(`(<key>${esc(key)}</key>\\s*)(<array>[\\s\\S]*?</array>|<array/>|<true/>|<false/>|<string>[\\s\\S]*?</string>)`);
  if (re.test(xml)) xml = xml.replace(re, `$1${value}`);
  else xml = xml.replace(/\n<\/dict>\s*<\/plist>\s*$/, `\n\t<key>${key}</key>\n\t${value}\n</dict>\n</plist>\n`);
  if (!xml.includes(`<key>${key}</key>`)) throw new Error(`Info.plist 寫入失敗：${key}`);
}
fs.writeFileSync(plistPath, xml);
console.log('Updated: ios/App/App/Info.plist');
