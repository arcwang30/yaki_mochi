'use strict';

// ===== 付費 VOL（追加樂曲）：VOL.1 免費；VOL.2、VOL.3 各自付費 =====
// 遊戲只問 Shop：這一集買了沒（owned）、買（buy）、恢復購買（restore）。實際付款交給「商店」（provider）：
//   test   ：測試用（網址加 ?shop=test），不會真的扣款；購買紀錄存在本機
//   之後加 ：steam（Steam DLC）、apple（App Store 內購）、google（Google Play 內購）
// 沒有商店時（一般網頁版）不鎖任何一集，和以前一樣全部可以玩。
const PAID_VOLS = {
  2: { sku: 'vol2', songs: 10 },   // sku = 各商店裡這個商品的 ID（Steam 是 DLC 的 App ID，之後在 provider 裡對應）
  3: { sku: 'vol3', songs: 10 },
};

// ---- 測試商店：購買約 1 秒後成功（模擬付款畫面）；網址加 &fail=1 一律「取消」，測試失敗流程 ----
// 主控台可用 Shop.resetTest() 清掉測試購買紀錄
const TestStore = {
  name: 'test',
  fail: QS.has('fail'),
  list() { return Save.data.testOwned || (Save.data.testOwned = []); },
  owns(sku) { return this.list().includes(sku); },
  price() { return 'NT$90'; },
  buy(sku) {
    return new Promise(res => setTimeout(() => {
      if (this.fail) return res(false);
      if (!this.owns(sku)) { this.list().push(sku); Save.store(); }
      res(true);
    }, 1000));
  },
  restore() { return new Promise(res => setTimeout(() => res(this.list().length), 800)); },
};

const Shop = {
  store: null,
  busy: false,   // 付款 / 恢復購買進行中（期間不能再按）

  init() {
    if (QS.get('shop') === 'test') this.store = TestStore;
  },
  enabled() { return !!this.store; },
  isTest() { return this.store === TestStore; },
  paid(vol) { return !!PAID_VOLS[vol]; },
  owned(vol) { return !this.enabled() || !this.paid(vol) || this.store.owns(PAID_VOLS[vol].sku); },
  songOwned(song) { return this.owned(song.vol); },
  price(vol) { return this.paid(vol) && this.enabled() ? this.store.price(PAID_VOLS[vol].sku) : ''; },

  // 回傳 Promise<'ok' | 'cancel' | 'error'>
  buy(vol) {
    if (this.busy || this.owned(vol)) return Promise.resolve(this.owned(vol) ? 'ok' : 'cancel');
    this.busy = true;
    return this.store.buy(PAID_VOLS[vol].sku)
      .then(ok => (ok ? 'ok' : 'cancel'), () => 'error')
      .finally(() => { this.busy = false; });
  },
  // 回傳 Promise<恢復了幾個商品 | -1 = 失敗>
  restore() {
    if (this.busy || !this.enabled()) return Promise.resolve(0);
    this.busy = true;
    return this.store.restore().catch(() => -1).finally(() => { this.busy = false; });
  },
  resetTest() { if (Save.data.testOwned) { Save.data.testOwned = []; Save.store(); } },
};

Shop.init();

// ===== 遊戲幣商店（主選單 → 商店）：店面背景等外觀 =====
// 商品以「種類:id」記在 Save.data.owned（例如 bg:rock），價格在各商品的 price（js/config.js 的 BACKGROUNDS）。
// COIN_SHOP = false（目前）：還沒有賺遊戲幣的方式，全部視為已擁有、免費裝備。
const CoinShop = {
  coins() { return Save.data.coins || 0; },
  owned(kind, item) { return !COIN_SHOP || !item.price || Save.data.owned.includes(kind + ':' + item.id); },
  // 回傳 'ok'（買到或本來就有）/ 'poor'（遊戲幣不夠）
  buy(kind, item) {
    if (this.owned(kind, item)) return 'ok';
    if (this.coins() < item.price) return 'poor';
    Save.data.coins -= item.price; Save.data.owned.push(kind + ':' + item.id); Save.store();
    return 'ok';
  },
  // 之後：結算畫面依成績發遊戲幣
  add(n) { Save.data.coins = Math.max(0, this.coins() + n); Save.store(); },
};
