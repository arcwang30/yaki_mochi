'use strict';

// ===== 成就（規格見 docs/成就表.md）：58 個、11 類、銅／銀／金／白金 =====
// 兩種判定：
//   prog() → [目前, 目標]：從存檔算得出來的（場數、廣島燒、獎章、遊玩過的歌…），Achieve.check() 時一起檢查，舊玩家也能回溯解鎖
//   event：當下發生的事（分享、自動校正、深夜遊玩、暫停後全連擊…），由各處呼叫 Achieve.unlock(id) 或在結算時判定
// shop: true 的（商店收藏）在 COIN_SHOP 打開前不顯示也不解鎖（商店免費時太容易）
// 遊戲幣：COIN_SHOP 打開時解鎖就發；之前解鎖的在打開後自動補發（Save.data.coinsPaid 記錄發過的）
const ACH_TIERS = {
  bronze: { name: '銅', color: '#d08a4a', coins: 20 },
  silver: { name: '銀', color: '#c4d0dc', coins: 60 },
  gold: { name: '金', color: '#ffd23f', coins: 150 },
  plat: { name: '白金', color: '#9ae8ff', coins: 300 },
};
const ACH_CATS = ['開店入門', '累計場數', '累計廣島燒', '連擊', '評價', '全連擊・全 GREAT', '曲包制霸', '收集・探索', '音感', '商店收藏', '趣味・隱藏'];

// ---- 從存檔算進度用的小工具 ----
const AchStat = {
  T: () => Save.data.totals,
  // 這首歌在任一難度（ds 指定難度）的獎章符合 fn
  medal(song, fn, ds = [0, 1, 2]) { return ds.some(d => { const m = Save.data.medals[song.id + DIFFS[d].suffix]; return m && fn(m); }); },
  songsWith(fn, ds) { return SONGS.filter(s => this.medal(s, fn, ds)).length; },
  pack: v => SONGS.filter(s => s.vol === v),
  played: s => (Save.data.totals.songs[s.id] || 0) > 0,
  // 最長連續遊玩天數（Save.data.playDays：'YYYY-MM-DD'）
  streak() {
    const days = [...new Set(Save.data.playDays)].sort(), DAY = 86400000;
    let best = 0, run = 0, prev = null;
    for (const d of days) { const t = Date.parse(d + 'T00:00:00'); run = prev !== null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; }
    return best;
  },
  level() { const a = Rhythm.analyze(); return a && a.level ? Rhythm.LEVELS.indexOf(a.level) : 99; },
  shopAll: (kind, list) => list.every(it => CoinShop.owned(kind, it)),
};
const achCnt = (cur, goal) => () => [Math.min(cur(), goal), goal];
const achHas = f => () => [f() ? 1 : 0, 1];
const achTop = r => m => m.r !== undefined && m.r <= r;   // 評價 r 以上（0 特上、1 上）

const ACHIEVEMENTS = [
  // A. 開店入門
  { id: 'first_tutorial', cat: 0, tier: 'bronze', name: '開店準備', desc: '完成新手教學', prog: achHas(() => Save.data.tutorialDone) },
  { id: 'first_play', cat: 0, tier: 'bronze', name: '第一位客人', desc: '完成第一場遊戲', prog: achCnt(() => AchStat.T().plays, 1) },
  { id: 'first_oko', cat: 0, tier: 'bronze', name: '第一份廣島燒', desc: '做出第一份廣島燒', prog: achCnt(() => AchStat.T().oko, 1) },
  { id: 'calibrate', cat: 0, tier: 'bronze', name: '調音師傅', desc: '完成一次自動校正' },
  { id: 'first_share', cat: 0, tier: 'bronze', name: '口耳相傳', desc: '分享一次成績' },
  // B. 累計場數
  ...[[10, 'bronze', '常客'], [50, 'silver', '熟面孔'], [100, 'silver', '老主顧'], [300, 'gold', '夜市名人'], [1000, 'plat', '百年老店']].map(([n, tier, name]) =>
    ({ id: 'plays_' + n, cat: 1, tier, name, desc: '累計完成 {0} 場', arg: n, prog: achCnt(() => AchStat.T().plays, n) })),
  // C. 累計廣島燒
  ...[[10, 'bronze', '小有手藝'], [100, 'silver', '百份達成'], [500, 'silver', '排隊名攤'], [2000, 'gold', '鐵板職人'], [5000, 'plat', '廣島燒之王']].map(([n, tier, name]) =>
    ({ id: 'oko_' + n, cat: 2, tier, name, desc: '累計做出 {0} 份廣島燒', arg: n, prog: achCnt(() => AchStat.T().oko, n) })),
  // D. 連擊
  ...[[50, 'bronze', '手感上來了'], [100, 'silver', '停不下來'], [150, 'gold', '鍋鏟旋風'], [200, 'plat', '無限連擊']].map(([n, tier, name]) =>
    ({ id: 'combo_' + n, cat: 3, tier, name, desc: '單場 {0} 連擊', arg: n, prog: achCnt(() => AchStat.T().maxCombo, n) })),
  // E. 評價
  { id: 'rank_jou', cat: 4, tier: 'bronze', name: '人氣排隊名攤', desc: '第一次拿到「上」以上', prog: achHas(() => AchStat.songsWith(achTop(1)) > 0) },
  { id: 'rank_toku', cat: 4, tier: 'silver', name: '鐵板之神降臨', desc: '第一次拿到「特上」', prog: achHas(() => AchStat.songsWith(achTop(0)) > 0) },
  { id: 'rank_toku_hard', cat: 4, tier: 'gold', name: '神之手', desc: '困難拿到「特上」', prog: achHas(() => AchStat.songsWith(achTop(0), [2]) > 0) },
  { id: 'rank_toku_10', cat: 4, tier: 'gold', name: '特上十選', desc: '{0} 首拿到「特上」', arg: 10, prog: achCnt(() => AchStat.songsWith(achTop(0)), 10) },
  { id: 'rank_toku_30', cat: 4, tier: 'plat', name: '特上三十選', desc: '{0} 首拿到「特上」', arg: 30, prog: achCnt(() => AchStat.songsWith(achTop(0)), 30) },
  { id: 'rank_disaster', cat: 4, tier: 'bronze', name: '客人轉身去吃章魚燒', desc: '拿到一次「修行」評價', hidden: true },
  // F. 全連擊・全 GREAT
  { id: 'fc_first', cat: 5, tier: 'silver', name: '一個都沒漏', desc: '第一次全連擊', prog: achHas(() => AchStat.songsWith(m => m.fc) > 0) },
  { id: 'ag_first', cat: 5, tier: 'gold', name: '完美的一盤', desc: '第一次全 GREAT', prog: achHas(() => AchStat.songsWith(m => m.ag) > 0) },
  { id: 'fc_hard', cat: 5, tier: 'gold', name: '火力全開', desc: '困難全連擊', prog: achHas(() => AchStat.songsWith(m => m.fc, [2]) > 0) },
  { id: 'ag_hard', cat: 5, tier: 'gold', name: '分毫不差', desc: '困難全 GREAT', prog: achHas(() => AchStat.songsWith(m => m.ag, [2]) > 0) },
  { id: 'fc_10', cat: 5, tier: 'gold', name: '全連擊十首', desc: '{0} 首全連擊', arg: 10, prog: achCnt(() => AchStat.songsWith(m => m.fc), 10) },
  { id: 'fc_30', cat: 5, tier: 'plat', name: '全連擊三十首', desc: '{0} 首全連擊', arg: 30, prog: achCnt(() => AchStat.songsWith(m => m.fc), 30) },
  { id: 'ag_10', cat: 5, tier: 'gold', name: '全 GREAT 十首', desc: '{0} 首全 GREAT', arg: 10, prog: achCnt(() => AchStat.songsWith(m => m.ag), 10) },
  { id: 'ag_30', cat: 5, tier: 'plat', name: '全 GREAT 三十首', desc: '{0} 首全 GREAT', arg: 30, prog: achCnt(() => AchStat.songsWith(m => m.ag), 30) },
  // G. 曲包制霸（內建曲目＋VOL.1～）
  ...VOL_ORDER.map((_, v) => ({ id: 'pack_' + v, cat: 6, tier: 'silver', name: v ? '{0} 制霸' : '內建曲目制霸', nameArg: v ? 'VOL.' + v : undefined,
    desc: v ? '{0} 的 10 首都拿到「上」以上' : '內建曲目 10 首都拿到「上」以上', arg: v ? 'VOL.' + v : '',
    prog: achCnt(() => AchStat.pack(v).filter(s => AchStat.medal(s, achTop(1))).length, AchStat.pack(v).length) })),
  // H. 收集・探索
  { id: 'first_hard', cat: 7, tier: 'bronze', name: '挑戰者', desc: '第一次完成困難', prog: achHas(() => Object.keys(Save.data.medals).some(k => k.endsWith(DIFFS[2].suffix))) },
  { id: 'all_diffs', cat: 7, tier: 'bronze', name: '三種吃法', desc: '同一首歌三種難度都完成', prog: achHas(() => SONGS.some(s => DIFFS.every(D => Save.data.medals[s.id + D.suffix]))) },
  { id: 'explore_pack', cat: 7, tier: 'bronze', name: '菜單走透透', desc: '任一曲包的 10 首都玩過', prog: achHas(() => VOL_ORDER.some((_, v) => AchStat.pack(v).every(AchStat.played))) },
  { id: 'explore_all', cat: 7, tier: 'gold', name: '夜市全制覇', desc: '{0} 首全部玩過', arg: SONGS.length, prog: achCnt(() => SONGS.filter(AchStat.played).length, SONGS.length) },
  { id: 'signature', cat: 7, tier: 'silver', name: '招牌菜', desc: '同一首歌完成 {0} 次', arg: 20, prog: achCnt(() => Math.max(0, ...Object.values(AchStat.T().songs)), 20) },
  { id: 'streak_7', cat: 7, tier: 'silver', name: '每晚準時開攤', desc: '連續 {0} 天都至少完成一場', arg: 7, prog: achCnt(() => AchStat.streak(), 7) },
  // I. 音感（節奏分析的音感等級）
  { id: 'sense_up', cat: 8, tier: 'silver', name: '漸入佳境', desc: '節奏分析出現「漸入佳境」', prog: achHas(() => { const a = Rhythm.analyze(); return !!a && (a.level && a.level.name === '漸入佳境' || (a.trend !== null && a.trend >= 5)); }) },
  { id: 'sense_great', cat: 8, tier: 'gold', name: '音感絕佳', desc: '音感等級達到「音感絕佳」', prog: achHas(() => AchStat.level() <= 1) },
  { id: 'sense_metronome', cat: 8, tier: 'plat', name: '人體節拍器', desc: '音感等級達到「人體節拍器」', prog: achHas(() => AchStat.level() === 0) },
  // J. 商店收藏（COIN_SHOP 打開後才有）
  { id: 'shop_first', cat: 9, tier: 'bronze', name: '開張大吉', desc: '第一次在商店裝備商品', shop: true },
  { id: 'shop_bg_all', cat: 9, tier: 'gold', name: '夜市建築師', desc: '擁有全部店面背景', shop: true, prog: achHas(() => AchStat.shopAll('bg', BACKGROUNDS)) },
  { id: 'shop_hit_all', cat: 9, tier: 'gold', name: '音效收藏家', desc: '擁有全部打擊音效', shop: true, prog: achHas(() => AchStat.shopAll('hit', HIT_SOUNDS)) },
  { id: 'shop_pet_all', cat: 9, tier: 'gold', name: '動物園長', desc: '擁有全部寵物', shop: true, prog: achHas(() => AchStat.shopAll('pet', PETS)) },
  { id: 'shop_complete', cat: 9, tier: 'plat', name: '商店全收藏', desc: '擁有商店全部商品', shop: true,
    prog: achHas(() => AchStat.shopAll('bg', BACKGROUNDS) && AchStat.shopAll('hit', HIT_SOUNDS) && AchStat.shopAll('pet', PETS)) },
  // K. 趣味・隱藏
  { id: 'polyglot', cat: 10, tier: 'bronze', name: '國際化屋台', desc: '切換過中文、日本語、English 三種語言', hidden: true, prog: achCnt(() => Save.data.langsUsed.length, 3) },
  { id: 'night_owl', cat: 10, tier: 'bronze', name: '深夜食堂', desc: '在凌晨 0:00～4:00 完成一場', hidden: true },
  { id: 'pause_fc', cat: 10, tier: 'silver', name: '臨危不亂', desc: '中途暫停過、繼續後仍拿到全連擊', hidden: true },
  { id: 'cat_ag', cat: 10, tier: 'gold', name: '喵喵完美', desc: '使用「貓咪」打擊音效拿到全 GREAT', hidden: true },
];
const achById = id => ACHIEVEMENTS.find(a => a.id === id);

const Achieve = {
  toasts: [],
  // 目前看得到的成就（商店收藏在 COIN_SHOP 打開前不算）
  list() { return ACHIEVEMENTS.filter(a => !a.shop || COIN_SHOP); },
  done(id) { return !!Save.data.achievements[id]; },
  name(a) { return a.nameArg !== undefined ? tr(a.name, a.nameArg) : tr(a.name); },
  desc(a) { return a.arg !== undefined ? tr(a.desc, a.arg) : tr(a.desc); },

  // 解鎖（silent = 不跳通知：開機時回溯舊紀錄用）。回傳是否是這次新解鎖的
  unlock(id, silent = false) {
    const a = achById(id), d = Save.data;
    if (!a || d.achievements[id] || (a.shop && !COIN_SHOP)) return false;
    d.achievements[id] = Date.now();
    if (!d.achNew.includes(id)) d.achNew.push(id);
    this.pay();
    Save.store();
    if (!silent) { this.toasts.push({ a, t: 0 }); if (A.ctx) Sound.play('confirm'); }
    return true;
  },
  // 遊戲幣：COIN_SHOP 打開時，把已解鎖但還沒發的獎勵發掉
  pay() {
    if (!COIN_SHOP) return;
    const d = Save.data;
    for (const id of Object.keys(d.achievements)) {
      const a = achById(id);
      if (a && !d.coinsPaid.includes(id)) { d.coinsPaid.push(id); d.coins = (d.coins || 0) + ACH_TIERS[a.tier].coins; }
    }
  },
  // 檢查所有從存檔算得出來的成就
  check(silent = false) {
    for (const a of this.list()) if (a.prog && !this.done(a.id)) { const [c, g] = a.prog(); if (c >= g) this.unlock(a.id, silent); }
  },
  // 結算（Game.finish 在存好獎章、遊玩紀錄之後呼叫）
  onResult(R, paused) {
    const d = Save.data, now = new Date(), day = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    if (!d.playDays.includes(day)) { d.playDays.push(day); if (d.playDays.length > 60) d.playDays.splice(0, d.playDays.length - 60); }
    if (R.rating === RATINGS.length - 1) this.unlock('rank_disaster');
    if (now.getHours() < 4) this.unlock('night_owl');
    if (R.fc && paused) this.unlock('pause_fc');
    if (R.ag && d.hitSound === 'cat') this.unlock('cat_ag');
    this.check();
  },
  // 語言切換：記錄用過的語言（國際化屋台）
  onLang(l) { const u = Save.data.langsUsed; if (l && !u.includes(l)) { u.push(l); Save.store(); } this.check(); },
  // 開機：補齊存檔欄位、記錄目前語言、回溯舊紀錄（不跳通知，成就畫面標「新」）、補發遊戲幣
  init() {
    this.onLangSilent(Save.data.lang);
    this.check(true);
    if (COIN_SHOP) { this.pay(); Save.store(); }
  },
  onLangSilent(l) { const u = Save.data.langsUsed; if (l && !u.includes(l)) u.push(l); },
  unlockedCount() { return this.list().filter(a => this.done(a.id)).length; },
  newCount() { return Save.data.achNew.filter(id => achById(id) && (!achById(id).shop || COIN_SHOP)).length; },

  // ---- 解鎖通知：畫面上方滑下來的小卡片（每張 3 秒，依序顯示）----
  draw(dt) {
    const q = this.toasts; if (!q.length) return;
    if (q.length > 3 && !q[0].more) { const rest = q.splice(2); q.push({ more: rest.length, t: 0 }); }   // 一次解鎖很多個：只秀前兩個，其餘合成一張
    const it = q[0]; it.t += dt;
    const DUR = 3.2, a = it.a || { tier: 'gold' }, T = ACH_TIERS[a.tier];
    const k = it.t < 0.3 ? ease(it.t / 0.3) : it.t > DUR - 0.3 ? ease((DUR - it.t) / 0.3) : 1;
    const w = lay(560, 640), h = 96, x = W / 2 - w / 2, y = -h + k * (h + lay(20, 24));
    ctx.save();
    UI.panel(x, y, w, h, 24, 'rgba(16,22,52,.95)', T.color);
    achMedal(x + 54, y + h / 2, 32, a.tier, true);
    UI.text(tr('成就解鎖！'), x + 100, y + 30, 20, { align: 'left', fill: T.color, stroke: null, raw: true });
    UI.text(it.more ? tr('另外解鎖了 {0} 個成就', it.more) : this.name(a), x + 100, y + 64, 28, { align: 'left', fill: '#fff', stroke: null, raw: true, maxW: w - (COIN_SHOP ? 250 : 130) });
    if (COIN_SHOP && !it.more) coinText('+' + T.coins, x + w - 24, y + 64, 22, { align: 'right' });
    ctx.restore();
    if (it.t >= DUR) q.shift();
  },
};

// 等級獎牌（圓牌＋等級字）：成就畫面與解鎖通知共用；on = 已解鎖（沒解鎖是灰的）
function achMedal(cx, cy, r, tier, on) {
  const T = ACH_TIERS[tier];
  ctx.save();
  ctx.fillStyle = on ? T.color : 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = on ? 'rgba(60,30,0,.55)' : 'rgba(255,255,255,.25)'; ctx.stroke();
  if (on) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.25, r * 0.4, 0.5, 0, 7); ctx.fill(); }
  ctx.restore();
  UI.text(T.name, cx, cy + 1, r * (T.name.length > 1 ? 0.62 : 0.85), { fill: on ? '#4a2a00' : 'rgba(255,255,255,.4)', stroke: null });
}

Achieve.init();
