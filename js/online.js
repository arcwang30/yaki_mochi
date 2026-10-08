'use strict';

// ===== 線上排行榜（Firebase Firestore，集合 leaderboard） =====
// firebase-config.js 有填 apiKey 時才會載入 Firebase SDK；否則全部使用本機排行榜。
const Online = {
  enabled: false,
  db: null,
  cache: null,
  SDK: 'https://www.gstatic.com/firebasejs/10.12.2/',

  init() {
    if (typeof FIREBASE_CONFIG === 'undefined' || !FIREBASE_CONFIG.apiKey) return;
    const load = src => new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    load(this.SDK + 'firebase-app-compat.js')
      .then(() => load(this.SDK + 'firebase-firestore-compat.js'))
      .then(() => {
        firebase.initializeApp(FIREBASE_CONFIG);
        this.db = firebase.firestore();
        this.enabled = true;
        this.top().catch(() => {});
      })
      .catch(e => console.warn('Firebase init failed', e));
  },

  col() { return this.db.collection('leaderboard'); },

  async top() {
    const snap = await this.col().orderBy('score', 'desc').limit(20).get();
    const list = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    this.cache = list;
    return list;
  },

  qualifies(score) {
    const l = this.cache;
    return score > 0 && (!l || l.length < 20 || score > l[l.length - 1].score);
  },

  async submit(entry) {
    const ref = await this.col().add({
      name: String(entry.name).slice(0, 8), score: Math.floor(entry.score), oko: Math.floor(entry.oko),
      combo: Math.floor(entry.combo || 0), ts: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
  }
};
