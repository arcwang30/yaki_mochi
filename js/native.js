'use strict';

// ===== iOS App 版（Capacitor）的原生功能：震動、分享、存檔備份 =====
// 外掛由 tools/build-web.mjs 以 <script> 載入（capacitor.js＋各外掛的瀏覽器版）；網頁版這些都不會用到。
const Native = {
  // 取得原生外掛：外掛的瀏覽器版會放全域（global）或登記到 Capacitor.Plugins；都沒有就直接向原生登記（registerPlugin）
  // 官方外掛（Haptics、Share、Filesystem）不放瀏覽器版，直接登記：App 版只會呼叫原生，不需要它們的網頁實作
  _plugins: {},
  plugin(name, global) {
    if (this._plugins[name]) return this._plugins[name];
    const C = window.Capacitor || {}, g = global && window[global];
    const reg = C.registerPlugin || (window.capacitorExports && window.capacitorExports.registerPlugin);
    const p = (g && g[name]) || (C.Plugins && C.Plugins[name]) || (reg && reg(name)) || null;
    return (this._plugins[name] = p);
  },

  // ---- 震動（Haptics）：iPhone 才有觸覺回饋（iPad 沒有）----
  canHaptic: NATIVE_APP && /iPhone/.test(navigator.userAgent),
  haptic(ms) {
    const H = this.plugin('Haptics', 'capacitorHaptics');
    if (H) H.impact({ style: ms >= 30 ? 'MEDIUM' : 'LIGHT' }).catch(() => {});
  },

  // ---- 分享檔案（成績圖、存檔碼）：先寫到暫存資料夾，再叫出 iOS 分享選單 ----
  // data：base64（圖片）或文字（encoding = 'utf8'）；回傳 Promise（玩家取消分享也算成功）
  shareFile(name, data, text, encoding) {
    const FS = this.plugin('Filesystem', 'capacitorFilesystem'), SH = this.plugin('Share', 'capacitorShare');
    if (!FS || !SH) return Promise.reject(new Error('share plugins not found'));
    return FS.writeFile(Object.assign({ path: name, data, directory: 'CACHE' }, encoding ? { encoding } : {}))
      .then(({ uri }) => SH.share({ files: [uri], text }))
      .catch(e => { if (!/cancel/i.test(String((e && e.message) || e))) throw e; });
  },

  // ---- 存檔備份：localStorage 在 iOS 儲存空間不足時可能被系統清掉，所以另外寫一份到 App 的 Library 資料夾（會跟著 iCloud 備份）----
  SAVE_FILE: 'save.json',
  _saveT: 0,
  restoring: false,   // 開啟時正在檢查備份檔：這段期間不寫備份（以免空白存檔蓋掉備份）
  mirrorSave(json) {
    if (!NATIVE_APP) return;
    clearTimeout(this._saveT);
    if (this.restoring) { this._saveT = -1; return; }   // 檢查完再寫
    this._saveT = setTimeout(() => { this._saveT = 0; this.writeSave(json); }, 1000);   // 連續存檔只寫最後一次
  },
  writeSave(json) {
    const FS = this.plugin('Filesystem', 'capacitorFilesystem');
    if (FS) FS.writeFile({ path: this.SAVE_FILE, data: json, directory: 'LIBRARY', encoding: 'utf8' }).catch(e => console.warn('save mirror failed', e));
  },
  // 切到背景時立刻寫（不等 1 秒）
  flushSave() {
    if (!NATIVE_APP || !this._saveT || this.restoring) return;
    clearTimeout(this._saveT); this._saveT = 0;
    this.writeSave(JSON.stringify(Save.data));
  },
  // 開啟時（Save.load 之後馬上呼叫）：localStorage 沒有存檔（fresh）、但備份檔有 → 還原後重新載入
  // 每次開啟最多還原一次，避免重複載入
  restoreSave(fresh) {
    if (!NATIVE_APP || !fresh || sessionStorage.getItem('daioyaki.restored')) return;
    const FS = this.plugin('Filesystem', 'capacitorFilesystem');
    if (!FS) return;
    this.restoring = true;
    FS.readFile({ path: this.SAVE_FILE, directory: 'LIBRARY', encoding: 'utf8' }).then(({ data }) => {
      JSON.parse(data);   // 壞掉的檔案不還原
      localStorage.setItem(Save.key, data);
      sessionStorage.setItem('daioyaki.restored', '1');
      location.reload();
    }).catch(() => {   // 沒有備份檔（第一次開啟）：檢查期間有存檔的話現在補寫
      this.restoring = false;
      if (this._saveT === -1) { this._saveT = 0; this.writeSave(JSON.stringify(Save.data)); }
    });
  },
};
