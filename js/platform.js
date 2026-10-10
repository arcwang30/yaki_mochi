'use strict';

// ===== 平台：網頁版 / 桌面版（Electron＋Steam）的差異集中在這裡 =====
// 桌面版的 preload（desktop/preload.js）會提供 window.desktop；網頁版沒有，一律走瀏覽器的 API。

// 全螢幕：桌面版由主程序切換視窗；網頁版用 Fullscreen API
const Display = {
  fullscreen() {
    if (DESKTOP_APP) return window.desktop.isFullscreen();
    return !!document.fullscreenElement;
  },
  setFullscreen(on) {
    if (DESKTOP_APP) { window.desktop.setFullscreen(on); return; }
    const d = document;
    if (on && d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(() => {});
    else if (!on && d.fullscreenElement) d.exitFullscreen().catch(() => {});
  },
  // 解析度（PC 版）：'1920x1080' → [1920, 1080]
  resolution() { return Save.data.res.split('x').map(Number); },
  // 畫布的解析度倍率：把 16:9 畫面放進選的解析度（1024x768 → 1024x576，上下黑邊）
  renderScale() { const [rw, rh] = this.resolution(); return Math.min(rw / W, rh / H); },
  setResolution(r) {
    Save.data.res = r; Save.store();
    this.applyWindow();
    if (window.applyPowerMode) window.applyPowerMode();   // 重新計算畫布大小
  },
  // 桌面版視窗模式：視窗內容大小 = 解析度（全螢幕時不動視窗，只改繪製解析度）
  applyWindow() {
    if (DESKTOP_APP && !this.fullscreen() && window.desktop.setWindowSize) window.desktop.setWindowSize(...this.resolution());
  },
};
