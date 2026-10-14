'use strict';

// ===== 付費 VOL（追加樂曲）：內建曲目（song.vol = 0）免費；VOL.1～VOL.6（各 10 首）各自付費 =====
// 遊戲只問 Shop：這一集買了沒（owned）、買（buy）、恢復購買（restore）。實際付款交給「商店」（provider）：
//   test   ：測試用（網址加 ?shop=test），不會真的扣款；購買紀錄存在本機
//   之後加 ：steam（Steam DLC）、apple（App Store 內購）、google（Google Play 內購）
// 沒有商店時（一般網頁版）不鎖任何一集，和以前一樣全部可以玩。
const PAID_VOLS = {
  1: { sku: 'vol1', songs: 10 },   // sku = 各商店裡這個商品的 ID（Steam 是 DLC 的 App ID，之後在 provider 裡對應）
  2: { sku: 'vol2', songs: 10 },
  3: { sku: 'vol3', songs: 10 },
  4: { sku: 'vol4', songs: 10 },
  5: { sku: 'vol5', songs: 10 },
  6: { sku: 'vol6', songs: 10 },
};
// 合購包：一個商品同時解鎖好幾集（規劃中，還沒上架；規則見 docs/iOS上架.md 的「內購規劃」）
// 上架：released 改 true，並在 App Store Connect 建立同 sku 的非消耗型商品；包含的集數都要已開放（RELEASED_VOLS）才會賣
// 擁有判定不看 released：買過的合購包永遠有效
const BUNDLES = [
  { sku: 'vol1_3', vols: [1, 2, 3], released: false },
];

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

// ---- App Store（iOS App 版）：@capgo/native-purchases（StoreKit 2），由 tools/build-web.mjs 以 <script> 載入 ----
// 商品 ID = Bundle ID ＋ '.' ＋ sku（例如 com.arcconceptgames.daioyaki.vol1），在 App Store Connect 建立（見 docs/iOS上架.md）
// 擁有清單＝StoreKit 的 currentEntitlements（已退款 / 撤銷的不算；家人共享的算）；另存一份在存檔，開啟時先用，背景再跟 StoreKit 對一次
const APP_ID = 'com.arcconceptgames.daioyaki';   // 和 capacitor.config.json 的 appId 一樣
const AppleStore = {
  name: 'apple',
  plugin: null,
  prices: {},
  id: sku => APP_ID + '.' + sku,
  sku: id => id.slice(APP_ID.length + 1),
  list() { return Save.data.appleOwned || (Save.data.appleOwned = []); },

  init() {
    this.plugin = Native.plugin('NativePurchases', 'capacitorNativePurchases');
    if (!this.plugin) { console.warn('NativePurchases plugin not found'); return; }
    // 家長同意（Ask to Buy）通過、在別台裝置買的、退款：StoreKit 之後才通知，收到就重新整理擁有清單
    this.plugin.addListener('transactionUpdated', () => this.refresh());
    this.refresh();
    this.plugin.getProducts({ productIdentifiers: Shop.skus().map(this.id), productType: 'inapp' })
      .then(({ products }) => products.forEach(p => { this.prices[this.sku(p.identifier)] = p.priceString; }))
      .catch(e => console.warn('getProducts failed', e));
  },
  // 跟 StoreKit 重新對一次擁有清單；回傳 Promise<擁有幾個>
  refresh() {
    return this.plugin.getPurchases({ productType: 'inapp', onlyCurrentEntitlements: true }).then(({ purchases }) => {
      const owned = [...new Set(purchases.filter(t => !t.revocationDate && t.productIdentifier.startsWith(APP_ID + '.')).map(t => this.sku(t.productIdentifier)))];
      Save.data.appleOwned = owned; Save.store();
      return owned.length;
    });
  },
  owns(sku) { return this.list().includes(sku); },
  price(sku) { return this.prices[sku] || ''; },
  // 回傳 Promise<true = 成功 | false = 取消 | 'pending' = 等家長同意>；其他錯誤 reject
  buy(sku) {
    if (!this.plugin) return Promise.reject(new Error('no plugin'));
    return this.plugin.purchaseProduct({ productIdentifier: this.id(sku), productType: 'inapp', quantity: 1 }).then(
      () => this.refresh().then(() => true),
      e => {
        const msg = String((e && e.message) || e);
        if (/cancel/i.test(msg)) return false;
        if (/pending/i.test(msg)) return 'pending';
        throw e;
      });
  },
  // 恢復購買：AppStore.sync()（會請玩家登入 Apple 帳號，所以只在按下「恢復購買」時呼叫）
  restore() {
    if (!this.plugin) return Promise.reject(new Error('no plugin'));
    return this.plugin.restorePurchases().then(() => this.refresh());
  },
};

const Shop = {
  store: null,
  busy: false,   // 付款 / 恢復購買進行中（期間不能再按）

  init() {
    if (NATIVE_APP) { this.store = AppleStore; AppleStore.init(); }
    else if (QS.get('shop') === 'test') this.store = TestStore;
  },
  // buy() 結果的提示文字（'ok' 由畫面自己顯示解鎖訊息）
  RESULT_TEXT: { cancel: '已取消購買', pending: '等待核准中（例如家長同意），核准後會自動解鎖', error: '購買失敗，請稍後再試' },
  enabled() { return !!this.store; },
  isTest() { return this.store === TestStore; },
  paid(vol) { return !!PAID_VOLS[vol]; },
  owned(vol) {
    return !this.enabled() || !this.paid(vol) || this.store.owns(PAID_VOLS[vol].sku)
      || BUNDLES.some(b => b.vols.includes(vol) && this.store.owns(b.sku));
  },
  // 目前在賣的商品 sku（商店向 App Store 查價格、登記商品用）：已開放的各集＋已上架的合購包
  skus() {
    const vols = Object.keys(PAID_VOLS).map(Number).filter(v => v <= RELEASED_VOLS);
    return [...vols.map(v => PAID_VOLS[v].sku), ...BUNDLES.filter(b => b.released && b.vols.every(v => v <= RELEASED_VOLS)).map(b => b.sku)];
  },
  songOwned(song) { return this.owned(song.vol); },
  price(vol) { return this.paid(vol) && this.enabled() ? this.store.price(PAID_VOLS[vol].sku) : ''; },

  // 回傳 Promise<'ok' | 'cancel' | 'pending' | 'error'>
  buy(vol) {
    if (this.busy || this.owned(vol)) return Promise.resolve(this.owned(vol) ? 'ok' : 'cancel');
    this.busy = true;
    return this.store.buy(PAID_VOLS[vol].sku)
      .then(r => (r === 'pending' ? 'pending' : r ? 'ok' : 'cancel'), e => { console.warn('purchase failed', e); return 'error'; })
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
// COIN_SHOP = false（目前）：還沒有賺遊戲幣的方式，全部視為已擁有、免費套用。
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
  add(n) { Save.data.coins = Math.max(0, this.coins() + n); Save.store(); },
  // 結算的遊玩獎勵（Game.finish 呼叫）：回傳 { base, first, fc, total }；COIN_SHOP = false 時不發（null）
  reward(song, diff, R) {
    if (!COIN_SHOP) return null;
    const C = COIN_REWARD, d = Save.data, rid = recId(song, diff);
    const out = { base: C.rating[R.rating] + diffStars(song, diff) * C.perStar, first: 0, fc: 0 };
    if (R.rating <= 2 && !d.coinFirst.includes(song.id)) { d.coinFirst.push(song.id); out.first = C.first; }
    if (R.fc && !d.coinFc.includes(rid)) { d.coinFc.push(rid); out.fc = C.fc; }
    out.total = out.base + out.first + out.fc;
    this.add(out.total);
    return out;
  },
};
