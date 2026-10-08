'use strict';

// ===== PWA：註冊 Service Worker、接住瀏覽器的安裝提示、判斷裝置 =====
const PWA = {
  prompt: null,   // Chrome / Edge / Android 的安裝提示（beforeinstallprompt）
  justInstalled: false,

  init() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW register failed', e)));
    }
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.prompt = e; });
    window.addEventListener('appinstalled', () => { this.prompt = null; this.justInstalled = true; });
  },

  // 已經是從主畫面開啟（APP 模式）
  installed() {
    const mm = q => window.matchMedia && window.matchMedia(q).matches;
    return this.justInstalled || mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') || navigator.standalone === true;
  },

  // 'ios' | 'android' | 'desktop'
  platform() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  },

  canPrompt() { return !!this.prompt; },

  async install() {
    if (!this.prompt) return false;
    const p = this.prompt; this.prompt = null;
    p.prompt();
    const r = await p.userChoice.catch(() => null);
    return !!(r && r.outcome === 'accepted');
  },
};

PWA.init();
