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
};
