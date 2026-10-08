'use strict';

// ===== Service Worker：讓遊戲可安裝成 APP、離線也能玩 =====
// 發佈新版本時把 VERSION 加 1，舊快取會在下次開啟時清掉。
const VERSION = 'v4';
const CACHE = 'daioyaki-' + VERSION;
const IMAGES = ['bg_stall.jpg', 'griddle.png', 'button.png', 'great_text.png', 'okonomiyaki.png',
  'chef_idle.png', 'chef_wave.png', 'chef_knife.png', 'chef_spatula.png', 'chef_sauce.png', 'chef_great.png', 'chef_nice.png', 'chef_bad.png', 'chef_cheer.png',
  'noodles_raw.png', 'yakisoba.png', 'cabbage_raw.png', 'cabbage_shred.png', 'crepe_raw.png', 'crepe_sauce.png', 'bacon_raw.png', 'bacon_bits.png'];
const CORE = ['./', 'index.html', 'manifest.json', 'css/style.css',
  ...['config', 'assets', 'save', 'i18n', 'firebase-config', 'online', 'audio', 'songs', 'input', 'pwa', 'ui', 'game', 'screens', 'main'].map(n => `js/${n}.js`),
  ...IMAGES.map(n => 'assets/images/' + n),
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/apple-touch-icon.png', 'assets/icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('daioyaki-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // 圖片：先用快取（不常變動）
    if (url.pathname.includes('/assets/')) {
      e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
      return;
    }
    // 網頁、程式、樣式：先上網拿最新版，離線時用快取
    e.respondWith(fetch(req).then(res => put(req, res)).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined))));
    return;
  }

  // Google 字型：先用快取，背景更新
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => put(req, res)).catch(() => hit);
      return hit || net;
    }));
  }
  // 其他（例如 Firebase 線上排行榜）：一律走網路
});
