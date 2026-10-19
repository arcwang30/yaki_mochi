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
  price() { return 'NT$60'; },   // 測試用顯示價格（跟正式定價一樣）
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
  // 可以買了嗎：已擁有（或商店免費）／沒有開放條件／條件達成（屋台等級、特殊條件）
  avail(kind, item) { return this.owned(kind, item) || Stall.open(item); },
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

// ===== 屋台等級：每場結算得經驗值（js/config.js 的 STALL），升級逐一開放商店的商品 =====
// 商品的 lv：屋台幾級開放；req：特殊條件（下面的 REQ）。開放只是「可以買」，還是要花遊戲幣；已經買過的不受影響
// Save.data.xp：經驗值；unlockSeen：已經通知過開放的商品（「種類:id」）；shopNew：商店卡片上還沒看過的 NEW
const Stall = {
  // 特殊條件（稀有寵物、限定音效）：盡量只用內建曲目，沒買 VOL 也拿得到
  REQ: {
    bit2: { test: () => ['chip', 'bitboss'].every(id => AchStat.medal(songById(id), achTop(2))), desc: () => tr('過關「{0}」和「{1}」', songName(songById('chip')), songName(songById('bitboss'))) },
    bitboss: { test: () => AchStat.medal(songById('bitboss'), achTop(2)), desc: () => tr('過關「{0}」', songName(songById('bitboss'))) },
    streak7: { test: () => AchStat.streak() >= 7, desc: () => tr('連續 {0} 天開攤', 7) },
    toku10: { test: () => AchStat.songsWith(achTop(0)) >= 10, desc: () => tr('{0} 首拿到「特上」', 10) },
    hardfc: { test: () => AchStat.songsWith(m => m.fc, [2]) > 0, desc: () => tr('任一首困難全連擊') },
  },
  // 第 L 級升到 L+1 要多少經驗；升到第 L 級的累計經驗
  need: L => STALL.step[0] + (L - 1) * STALL.step[1],
  total(L) { let s = 0; for (let k = 1; k < L; k++) s += this.need(k); return s; },
  level(xp = Save.data.xp) { let L = 1; while (L < STALL.maxLv && xp >= this.total(L + 1)) L++; return L; },
  // 經驗條：{ lv, cur（這一級已累積）, need（這一級總共要）}；滿級 need = 0
  bar(xp = Save.data.xp) { const lv = this.level(xp); return { lv, cur: xp - this.total(lv), need: lv >= STALL.maxLv ? 0 : this.need(lv) }; },
  open(item) { return item.req ? !!(this.REQ[item.req] && this.REQ[item.req].test()) : !item.lv || this.level() >= item.lv; },
  // 還沒開放的說明（商店卡片、說明區、按下去的提示）
  why(item) { return item.req ? this.REQ[item.req].desc() : tr('屋台 Lv.{0} 開放', item.lv); },
  short(item) { return item.req ? tr('特別條件') : 'Lv.' + item.lv; },
  gated() { return [['bg', BACKGROUNDS], ['pet', PETS], ['hit', HIT_SOUNDS]].flatMap(([kind, list]) => list.filter(it => it.lv || it.req).map(it => ({ kind, it, key: kind + ':' + it.id }))); },
  // 第一次（舊存檔）：目前已經開放的都算通知過，不會一次跳一大串
  init() { if (Save.data.unlockSeen === null) { Save.data.unlockSeen = this.gated().filter(g => this.open(g.it)).map(g => g.key); Save.store(); } },
  // 新開放（還沒通知過）的商品：記下來、商店卡片掛 NEW；回傳這次新開放的 [{ kind, it }]
  announce() {
    if (!COIN_SHOP) return [];
    this.init();
    const d = Save.data, fresh = this.gated().filter(g => !d.unlockSeen.includes(g.key) && this.open(g.it) && !CoinShop.owned(g.kind, g.it));
    fresh.forEach(g => { d.unlockSeen.push(g.key); if (!d.shopNew.includes(g.key)) d.shopNew.push(g.key); });
    if (fresh.length) Save.store();
    return fresh;
  },
  // 結算（Game.finish）：加經驗、判定升級與新開放；回傳 { gain, xp0, xp1, lv0, lv1, fresh }（COIN_SHOP 關掉時不算）
  add(R, diff) {
    if (!COIN_SHOP) return null;
    this.init();
    const xp0 = Save.data.xp, gain = STALL.xp.rating[R.rating] + STALL.xp.diff[diff];
    Save.data.xp = xp0 + gain; Save.store();
    return { gain, xp0, xp1: Save.data.xp, lv0: this.level(xp0), lv1: this.level(), fresh: this.announce() };
  },
  // 下一級開放的商品（結算畫面「下一級開放：…」）
  nextItems(lv = this.level()) { return this.gated().filter(g => g.it.lv === lv + 1); },
  seen(kind, item) { const k = kind + ':' + item.id, a = Save.data.shopNew, i = a.indexOf(k); if (i >= 0) { a.splice(i, 1); Save.store(); } },
  isNew: (kind, item) => Save.data.shopNew.includes(kind + ':' + item.id),
};
