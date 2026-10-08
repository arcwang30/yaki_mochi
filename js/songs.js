'use strict';

// ===== 樂曲 =====
// 每首歌 = 資料（歌名、星級、各段 BPM 與節奏難度、搖擺比例）＋ arrange()：產生一個小節的音樂。
// arrange(ms, add)：ms 為小節資訊（kind: 'play' | 'rest'，sec 第幾段，idx 第幾小節，bd 一拍秒數，at(s) 第 s 個八分音符的時間）；
// add(t, (x, dest) => 播放) 把音符排進去。dest 一定要傳給樂器（遊戲 / 選曲試聽共用）。
// 每段最後一小節是休息小節（kind = 'rest'），請編個過門（fill）。

function measureInfo(song, m) {
  const bd = 60 / m.bpm, sw = song.swing || 0.5;
  return Object.assign(m, { bd, sd: bd / 2, at: s => m.start + Math.floor(s / 2) * bd + (s % 2 ? sw * bd : 0) });
}
// 旋律：每個音延續到下一個音符（或小節結束）
function stepEnd(ms, s) { return s >= 8 ? ms.start + 4 * ms.bd : ms.at(s); }
function melody(row, ms, add, fn) {
  row.forEach((n, s) => {
    if (n === null) return;
    let e = s + 1; while (e < 8 && row[e] === null) e++;
    const dur = (stepEnd(ms, e) - ms.at(s)) * 0.88;
    add(ms.at(s), (x, d) => fn(x, n, dur, d));
  });
}

// ---------- 1. 月見ちょうちん（Lo-fi 和琴） ----------
const TSUKIMI = {
  CH: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 60, 64], [55, 59, 62, 64]],   // Am7 Fmaj7 Cmaj7 G6
  BASS: [45, 41, 48, 43],
  MEL: [
    [76, null, 74, null, 72, null, 69, null], [72, null, null, 74, 76, null, null, null],
    [79, null, 76, null, 74, 72, null, null], [74, null, 72, null, 69, null, null, null],
    [76, null, 79, null, 81, null, 79, 76], [74, null, 72, null, 74, null, 76, null],
    [72, 74, 76, null, 74, null, 72, null], [69, null, null, null, null, null, null, null],
  ],
};
// ---------- 2. 屋台ばやし（祭典太鼓） ----------
const YATAI = {
  MEL: [
    [12, null, 9, null, 7, 9, 12, null], [14, null, 12, 9, 7, null, null, null],
    [9, null, 7, 4, 2, 4, 7, null], [4, null, 2, 0, 2, null, null, null],
    [12, null, 14, null, 16, 14, 12, null], [9, null, 12, 9, 7, null, 4, null],
    [7, 9, 12, 9, 7, 4, 2, 4], [0, null, null, null, null, null, null, null],
  ],
  BASS: [0, 0, 5, 7, 0, 5, 7, 0],
  TAIKO: {
    normal: { 0: 'don', 2: 'ka', 4: 'don', 5: 'don', 6: 'ka' },
    vary:   { 0: 'don', 2: 'ka', 3: 'ka', 4: 'don', 6: 'don', 7: 'ka' },
    fill:   { 0: 'don', 1: 'don', 2: 'don', 3: 'ka', 4: 'don', 5: 'don', 6: 'don', 7: 'don' },
  },
};
// ---------- 3. 鉄板スウィング（搖擺爵士，F 藍調） ----------
const SWING = {
  CHORD: [[57, 63, 65], [56, 62, 65], [58, 64, 67]],   // F7 Bb7 C7（三音）
  IDX: [0, 1, 0, 2, 0, 1, 2, 0],
  WALK: [[41, 45, 48, 50], [46, 50, 53, 51], [41, 43, 45, 47], [48, 52, 55, 40],
         [41, 45, 48, 45], [46, 50, 49, 47], [48, 46, 45, 43], [41, 45, 48, 53]],
  MEL: [
    [65, null, 68, 69, 72, null, 69, null], [70, null, 69, null, 65, null, null, null],
    [72, 72, 75, null, 74, 72, 69, null], [67, null, 64, null, 65, null, null, null],
    [77, null, 75, null, 72, null, 69, 68], [70, 69, 65, null, null, null, 62, 63],
    [65, 68, 69, 72, 75, 72, 69, 67], [65, null, null, null, null, null, null, null],
  ],
};
// ---------- 4. ソース・ファンク（迪斯可放克，E 多利安） ----------
const FUNK = {
  CHORD: [[52, 55, 59, 62], [55, 57, 61, 64], [52, 55, 59, 62], [55, 57, 61, 64], [55, 59, 60, 64], [54, 57, 59, 63], [52, 55, 59, 62], [54, 57, 59, 63]],
  ROOT: [40, 45, 40, 45, 48, 47, 40, 47],
  SLAP: { 0: 0, 2: 12, 3: 0, 5: 12, 6: 10, 7: 12 },
  MEL: [
    [64, null, 67, null, 69, 71, null, 74], [76, null, 74, null, 71, null, 69, null],
    [64, null, 67, null, 69, 71, 74, null], [76, 79, 76, 74, 71, null, null, null],
    [72, null, 71, null, 67, null, 64, null], [66, null, 69, null, 71, null, 75, null],
    [76, null, 74, 71, 69, 67, 64, 62], [64, null, null, null, null, null, null, null],
  ],
};
// ---------- 5. 大王ハイパービート（Eurobeat，A 小調） ----------
const HYPER = {
  CHORD: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59], [57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
  ROOT: [45, 41, 43, 40, 45, 41, 43, 40],
  MEL: [
    [81, null, 79, 81, 84, null, 81, 79], [77, null, 76, 77, 81, null, 77, 76],
    [79, null, 77, 79, 83, null, 79, 77], [76, null, 74, 76, 79, null, 83, null],
    [81, 84, 86, 84, 81, 79, 81, null], [77, 81, 84, 81, 77, 76, 77, null],
    [79, 83, 86, 88, 86, 83, 79, 83], [81, null, null, null, null, null, null, null],
  ],
};

const SONGS = [
  {
    id: 'tsukimi', title: '月見ちょうちん', stars: 1, color: '#9cc8ff',
    sub: { zh: '月見燈籠', ja: 'Moon-Viewing Lanterns', en: 'Moon-Viewing Lanterns' },
    genre: { zh: 'Lo-fi・和琴', ja: 'ローファイ・お琴', en: 'Lo-fi Koto' },
    sections: [{ bpm: 80, lv: [0] }, { bpm: 86, lv: [0] }, { bpm: 92, lv: [0, 1] }, { bpm: 98, lv: [1] }, { bpm: 104, lv: [1, 2] }],
    arrange(ms, add) {
      const T = TSUKIMI, mi = ms.idx % 8, ci = mi % 4, rest = ms.kind === 'rest';
      add(ms.at(0), (x, d) => SND.pad(x, T.CH[ci], ms.bd * 4, 1, d));
      const r = T.BASS[ci];
      add(ms.at(0), (x, d) => SND.walk(x, r, ms.bd * 1.6, 0.8, d));
      add(ms.at(5), (x, d) => SND.walk(x, r + 7, ms.bd * 0.5, 0.6, d));
      add(ms.at(6), (x, d) => SND.walk(x, r, ms.bd * 0.9, 0.7, d));
      for (let s = 0; s < 8; s++) {
        const t = ms.at(s);
        if (rest ? s % 2 === 0 : (s === 0 || s === 5)) add(t, (x, d) => SND.kick(x, 0.55, d));
        if (s === 2 || s === 6) add(t, (x, d) => SND.rim(x, 0.9, d));
        if (rest && s % 2 === 1) add(t, (x, d) => SND.rim(x, 0.5, d));
        if (ms.sec >= 1) add(t, (x, d) => SND.shaker(x, s % 2 ? 0.6 : 0.35, d));
        if (ms.sec >= 2 && s % 2 === 1) add(t, (x, d) => SND.hat(x, 0.35, d));
      }
      melody(T.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.koto(x, n, 1, d);
        if (ms.sec >= 3) SND.koto(x + 0.012, n - 12, 0.45, d);
        if (ms.sec >= 4) SND.koto(x + 0.02, n + 12, 0.25, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.kick(x, 0.6, d); SND.pad(x, [57, 60, 64, 67, 71], 2.6, 1.2, d); SND.walk(x, 45, 2, 0.8, d); });
      [69, 72, 76, 81].forEach((n, i) => add(ms.at(i), (x, d) => SND.koto(x, n, 0.9, d)));
    },
  },
  {
    id: 'yatai', title: '屋台ばやし', stars: 2, color: '#ffb84a',
    sub: { zh: '屋台祭典囃子', ja: 'Yatai Festival', en: 'Yatai Festival' },
    genre: { zh: '祭典太鼓・三味線', ja: '祭り囃子', en: 'Festival Taiko' },
    sections: [{ bpm: 100, lv: [0] }, { bpm: 108, lv: [0, 1] }, { bpm: 114, lv: [1] }, { bpm: 120, lv: [1, 2] }, { bpm: 128, lv: [2] }, { bpm: 136, lv: [2, 3] }],
    arrange(ms, add) {
      const Y = YATAI, mi = ms.idx % 8, tk = ms.kind === 'rest' ? Y.TAIKO.fill : (mi === 3 ? Y.TAIKO.vary : Y.TAIKO.normal);
      for (let s = 0; s < 8; s++) {
        const t = ms.at(s);
        if (tk[s] === 'don') add(t, (x, d) => SND.don(x, 0.8, d));
        else if (tk[s] === 'ka') add(t, (x, d) => SND.ka(x, 1, d));
        const n = Y.MEL[mi][s];
        if (n !== null) {
          add(t, (x, d) => SND.shamisen(x, mel(n), d));
          if (ms.sec >= 4) add(t, (x, d) => SND.fue(x, mel(n) * 2, ms.sd * 1.6, d));
        }
        const r = Y.BASS[mi];
        if (s === 0 || s === 3 || s === 6) add(t, (x, d) => SND.bass(x, bassF(r), ms.sd * 1.2, d));
        if (s === 4) add(t, (x, d) => SND.bass(x, bassF(r + 7), ms.sd * 1.2, d));
        if (ms.sec >= 2 && s % 2 === 1) add(t, (x, d) => SND.kane(x, 0.8, d));
        if (ms.sec >= 1 && (s === 2 || s === 6)) add(t, (x, d) => SND.clap(x, d));
      }
    },
    outro(ms, add) {
      [0, 1, 2].forEach(b => add(ms.at(b * 2), (x, d) => SND.don(x, 1, d)));
      add(ms.at(4), (x, d) => { [0, 4, 7, 12].forEach((n, i) => SND.shamisen(x + i * 0.03, mel(n), d)); SND.kane(x, 1.5, d); SND.bass(x, bassF(0), 1.2, d); });
    },
  },
  {
    id: 'swing', title: '鉄板スウィング', stars: 3, color: '#ffd76a', swing: 0.64,
    sub: { zh: '鐵板搖擺', ja: 'Teppan Swing', en: 'Teppan Swing' },
    genre: { zh: '搖擺爵士', ja: 'スウィングジャズ', en: 'Swing Jazz' },
    sections: [{ bpm: 112, lv: [1] }, { bpm: 118, lv: [1] }, { bpm: 124, lv: [1, 2] }, { bpm: 132, lv: [2] }, { bpm: 140, lv: [2, 3] }, { bpm: 148, lv: [3] }],
    arrange(ms, add) {
      const S = SWING, mi = ms.idx % 8, ch = S.CHORD[S.IDX[mi]], rest = ms.kind === 'rest';
      [0, 2, 3, 4, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.ride(x, s % 2 ? 0.6 : 1, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.hat(x, 0.5, d)));
      S.WALK[mi].forEach((n, b) => add(ms.at(b * 2), (x, d) => SND.walk(x, n, ms.bd * 0.85, 1.15, d)));
      if (ms.sec >= 1) { [0, 2, 4, 6].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.22, d))); }
      if (ms.sec >= 1) [1, 4].forEach(s => add(ms.at(s), (x, d) => SND.piano(x, ch, 0.9, d, 0.3)));
      if (ms.sec >= 3) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.3, d)));
      if (rest) [1, 3, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.35 + s * 0.05, d)));
      melody(S.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.trumpet(x, n, dur, 1.4, d);
        if (ms.sec >= 4) SND.lead(x, n - 12, dur, 0.5, d);
      });
      if (ms.sec >= 5 && mi % 2 === 0) add(ms.at(7), (x, d) => SND.piano(x, ch.map(n => n + 12), 0.6, d, 0.2));
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1, d); SND.kick(x, 0.6, d); SND.piano(x, [53, 57, 63, 67, 69], 1.2, d, 1.6); SND.walk(x, 41, 1.5, 0.9, d); SND.trumpet(x, 77, 1.4, 1, d); });
    },
  },
  {
    id: 'funk', title: 'ソース・ファンク', stars: 4, color: '#ff8ad0',
    sub: { zh: '醬汁放克', ja: 'Sauce Funk', en: 'Sauce Funk' },
    genre: { zh: '迪斯可放克', ja: 'ディスコファンク', en: 'Disco Funk' },
    sections: [{ bpm: 118, lv: [1] }, { bpm: 124, lv: [1, 2] }, { bpm: 132, lv: [2] }, { bpm: 140, lv: [2, 3] }, { bpm: 150, lv: [3] }, { bpm: 158, lv: [3] }],
    arrange(ms, add) {
      const F = FUNK, mi = ms.idx % 8, r = F.ROOT[mi], ch = F.CHORD[mi], rest = ms.kind === 'rest';
      for (let s = 0; s < 8; s++) {
        const t = ms.at(s);
        if (s % 2 === 0) add(t, (x, d) => SND.kick(x, 0.85, d));
        if (s === 2 || s === 6) add(t, (x, d) => { SND.snare(x, 0.6, d); SND.clap(x, d); });
        if (s % 2 === 1) add(t, (x, d) => SND.hat(x, 0.55, d, true));
        if (F.SLAP[s] !== undefined) add(t, (x, d) => SND.slap(x, r + F.SLAP[s], 1, d));
        if (ms.sec >= 1 && s % 2 === 1) add(t, (x, d) => SND.scratch(x, 0.8, d));
        if (rest) add(t, (x, d) => SND.snare(x, 0.25 + s * 0.06, d));
      }
      if (ms.sec >= 2) [3, 6].forEach(s => add(ms.at(s), (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.6, 1, d)));
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.8, d, 'sawtooth'));
      if (rest) { add(ms.at(0), (x, d) => SND.brass(x, ch.map(n => n + 12), ms.bd, 1.2, d)); add(ms.at(0), (x, d) => SND.riser(x, ms.bd * 4, d)); }
      melody(F.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.lead(x, n, dur, 1, d);
        if (ms.sec >= 4) SND.pluck(x, n + 12, 0.8, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1, d); SND.kick(x, 1, d); SND.brass(x, [64, 67, 71, 74, 78], 0.9, 1.4, d); SND.slap(x, 40, 1, d); });
    },
  },
  {
    id: 'hyper', title: '大王ハイパービート', stars: 5, color: '#7dffb0',
    sub: { zh: '大王超速節拍', ja: 'Daio Hyper Beat', en: 'Daio Hyper Beat' },
    genre: { zh: '歐陸節拍', ja: 'ユーロビート', en: 'Eurobeat' },
    sections: [{ bpm: 148, lv: [2] }, { bpm: 156, lv: [2, 3] }, { bpm: 164, lv: [3] }, { bpm: 170, lv: [3] }, { bpm: 176, lv: [3] }, { bpm: 182, lv: [3] }],
    arrange(ms, add) {
      const E = HYPER, mi = ms.idx % 8, r = E.ROOT[mi], ch = E.CHORD[mi], rest = ms.kind === 'rest';
      if (ms.idx === 0) add(ms.at(0), (x, d) => SND.crash(x, 1, d));
      for (let s = 0; s < 8; s++) {
        const t = ms.at(s);
        if (s % 2 === 0) add(t, (x, d) => SND.kick(x, 1, d));
        if (s === 2 || s === 6) add(t, (x, d) => SND.snare(x, 0.7, d));
        if (s % 2 === 1) add(t, (x, d) => SND.hat(x, 0.7, d));
        add(t, (x, d) => SND.sub(x, s % 2 ? r + 12 : r, ms.sd * 0.8, s % 2 ? 0.8 : 1, d));   // 反拍八度貝斯
      }
      if (ms.sec >= 1) for (let i = 0; i < 16; i++) {   // 16 分音符琶音
        const n = ch[[0, 1, 2, 1][i % 4]] + 12;
        add(ms.start + i * ms.bd / 4, (x, d) => SND.pluck(x, n, 0.8, d));
      }
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.7, d));
      if (rest) {
        for (let i = 0; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.snare(x, 0.15 + i * 0.04, d));
        add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d));
      }
      melody(E.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.supersaw(x, n, dur, 1, d);
        if (ms.sec >= 4) SND.supersaw(x, n - 12, dur, 0.5, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.2, d); SND.kick(x, 1, d); SND.supersaw(x, 81, 1.4, 1.2, d); SND.supersaw(x, 76, 1.4, 0.8, d); SND.supersaw(x, 72, 1.4, 0.8, d); SND.sub(x, 45, 1.2, 1, d); });
    },
  },
];

// 選單背景音樂用哪一首（index）
const MENU_SONG = 1;
const songById = id => SONGS.find(s => s.id === id) || SONGS[MENU_SONG];
