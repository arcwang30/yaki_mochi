'use strict';

// ===== 線上排行榜（Firebase Firestore；每首歌一個集合 leaderboard_<歌曲id>） =====
// firebase-config.js 有填 apiKey 時才會載入 Firebase SDK；否則全部使用本機排行榜。
const Online = {
  enabled: false,
  db: null,
  cache: {},
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
        SONGS.forEach(s => this.top(s.id).catch(() => {}));
      })
      .catch(e => console.warn('Firebase init failed', e));
  },

  col(id) { return this.db.collection('leaderboard_' + id); },

  async top(id) {
    const snap = await this.col(id).orderBy('score', 'desc').limit(20).get();
    const list = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    this.cache[id] = list;
    return list;
  },

  qualifies(score, id) {
    const l = this.cache[id];
    return score > 0 && (!l || l.length < 20 || score > l[l.length - 1].score);
  },

  async submit(entry, id) {
    const ref = await this.col(id).add({
      name: String(entry.name).slice(0, 8), score: Math.floor(entry.score), oko: Math.floor(entry.oko),
      combo: Math.floor(entry.combo || 0), ts: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
  }
};
