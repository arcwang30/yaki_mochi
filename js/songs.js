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

// ================= 第二集（VOL.2） =================
// ---------- 6. 縁側ボサノバ（巴薩諾瓦，C 大調） ----------
const BOSSA = {
  CHORD: [[55, 59, 60, 64], [55, 57, 60, 64], [53, 57, 60, 62], [53, 55, 59, 62], [55, 59, 60, 64], [55, 57, 61, 64], [53, 57, 60, 62], [53, 55, 59, 62]],
  ROOT: [48, 45, 50, 43, 48, 45, 50, 43],
  MEL: [
    [76, null, null, 74, 72, null, 69, null], [72, null, null, null, 67, null, 69, null],
    [69, null, null, 72, 74, null, 72, null], [71, null, null, null, 67, null, null, null],
    [76, null, null, 79, 77, null, 76, null], [73, null, null, null, 69, null, 73, null],
    [74, null, 72, null, 69, null, 65, null], [67, null, null, null, null, null, null, null],
  ],
};
// ---------- 7. ちんどん行進曲（街頭宣傳樂隊，F 大調二拍子） ----------
const CHINDON = {
  CHORD: [[53, 57, 60], [53, 57, 60], [55, 58, 64], [53, 57, 60], [53, 58, 62], [53, 57, 60], [55, 58, 64], [53, 57, 60]],
  ROOT: [41, 41, 48, 41, 46, 41, 48, 41],
  MEL: [
    [72, null, 72, 74, 76, null, 72, null], [77, null, 76, 74, 72, null, null, null],
    [70, null, 72, 74, 76, null, 74, 72], [72, null, 69, null, 65, null, null, null],
    [70, null, 74, null, 77, null, 74, null], [72, null, 69, null, 65, null, 69, null],
    [72, 74, 76, 77, 79, 77, 76, 74], [77, null, null, null, null, null, null, null],
  ],
};
// ---------- 8. 鉄板スカ（斯卡，G 大調） ----------
const SKA = {
  CHORD: [[55, 59, 62], [52, 55, 59], [52, 55, 60], [54, 57, 62], [55, 59, 62], [52, 55, 59], [52, 55, 60], [54, 57, 62]],
  WALK: [[43, 47, 50, 47], [40, 43, 47, 43], [48, 52, 55, 52], [50, 54, 57, 54], [43, 47, 50, 47], [40, 43, 47, 45], [48, 52, 55, 52], [50, 54, 57, 50]],
  MEL: [
    [79, null, 79, 78, 79, null, 74, null], [76, null, 74, 71, 67, null, null, null],
    [72, null, 72, 71, 72, null, 76, null], [74, null, null, null, 78, null, null, null],
    [79, null, 81, null, 83, null, 81, 79], [76, null, 79, null, 74, null, 71, null],
    [72, 74, 76, 72, 74, 76, 78, 74], [79, null, null, null, null, null, null, null],
  ],
};
// ---------- 9. 8ビット・ヤタイ（8 位元，D 小調） ----------
const CHIP = {
  CHORD: [[62, 65, 69], [58, 62, 65], [60, 64, 67], [61, 64, 69], [62, 65, 69], [58, 62, 65], [60, 64, 67], [61, 64, 69]],
  ROOT: [50, 46, 48, 45, 50, 46, 48, 45],
  MEL: [
    [74, null, 77, 74, 81, null, 79, 77], [74, null, 72, 74, 70, null, null, null],
    [72, null, 76, 72, 79, null, 77, 76], [73, null, 76, null, 81, null, 79, 76],
    [86, 84, 81, null, 77, null, 81, null], [82, 81, 77, null, 74, null, 77, null],
    [76, 77, 79, 81, 79, 77, 76, 73], [74, null, null, null, null, null, null, null],
  ],
};
// ---------- 10. 炎のドラムンベース（鼓打貝斯，F 小調） ----------
const DNB = {
  CHORD: [[53, 56, 60], [53, 56, 61], [55, 58, 63], [55, 60, 63], [53, 56, 60], [53, 56, 61], [53, 58, 61], [55, 60, 64]],
  ROOT: [41, 37, 39, 36, 41, 37, 46, 36],
  MEL: [
    [77, null, 80, 77, 84, null, 82, 80], [77, null, null, 75, 73, null, 72, null],
    [75, null, 79, 75, 82, null, 80, 79], [72, null, 75, null, 79, null, 84, null],
    [84, 82, 80, null, 77, null, 80, 82], [85, 84, 80, null, 77, null, 73, null],
    [82, 80, 77, 75, 77, 80, 82, 84], [89, null, null, null, null, null, null, null],
  ],
};

SONGS.push(
  {
    id: 'bossa', title: '縁側ボサノバ', stars: 1, color: '#ffd1a1',
    sub: { zh: '簷廊巴薩諾瓦', ja: 'Veranda Bossa Nova', en: 'Veranda Bossa Nova' },
    genre: { zh: '巴薩諾瓦・吉他', ja: 'ボサノバ', en: 'Bossa Nova' },
    sections: [{ bpm: 84, lv: [0] }, { bpm: 90, lv: [0] }, { bpm: 96, lv: [0, 1] }, { bpm: 102, lv: [1] }, { bpm: 108, lv: [1, 2] }],
    arrange(ms, add) {
      const B = BOSSA, mi = ms.idx % 8, ch = B.CHORD[mi], r = B.ROOT[mi], rest = ms.kind === 'rest';
      [0, 2, 3, 5, 6].forEach(s => add(ms.at(s), (x, d) => SND.nylon(x, ch, s === 0 ? 1 : 0.75, d)));      // 巴薩諾瓦的切分刷法
      [[0, r], [3, r + 7], [4, r + 7], [6, r]].forEach(([s, n]) => add(ms.at(s), (x, d) => SND.walk(x, n, ms.sd * 1.4, 0.75, d)));
      (mi % 2 ? [2, 4] : [0, 3, 6]).forEach(s => add(ms.at(s), (x, d) => SND.rim(x, 0.7, d)));            // 2-3 clave
      for (let s = 0; s < 8; s++) if (ms.sec >= 1) add(ms.at(s), (x, d) => SND.shaker(x, s % 2 ? 0.5 : 0.3, d));
      if (ms.sec >= 2) [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.35, d)));
      if (rest) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.rim(x, 0.5, d)));
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.flute(x, n, dur, 1, d);
        if (ms.sec >= 4) SND.flute(x, n - 12, dur, 0.5, d);
      });
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.5, d));
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.nylon(x, [48, 55, 59, 62, 64], 1.2, d); SND.walk(x, 48, 1.8, 0.8, d); SND.flute(x, 76, 1.4, 1, d); SND.rim(x, 0.7, d); });
    },
  },
  {
    id: 'chindon', title: 'ちんどん行進曲', stars: 2, color: '#ff9a8a',
    sub: { zh: '街頭樂隊進行曲', ja: 'Chindon March', en: 'Chindon March' },
    genre: { zh: '單簧管・鉦與太鼓', ja: 'ちんどん屋', en: 'Street Band March' },
    sections: [{ bpm: 104, lv: [0] }, { bpm: 110, lv: [0, 1] }, { bpm: 116, lv: [1] }, { bpm: 124, lv: [1, 2] }, { bpm: 130, lv: [2] }, { bpm: 136, lv: [2, 3] }],
    arrange(ms, add) {
      const C = CHINDON, mi = ms.idx % 8, ch = C.CHORD[mi], r = C.ROOT[mi], rest = ms.kind === 'rest';
      // 蹦（低音）恰（和弦）二拍子
      [[0, r], [4, r + 7]].forEach(([s, n]) => add(ms.at(s), (x, d) => SND.tuba(x, n, ms.bd * 0.8, 1, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.organ(x, ch, ms.sd * 0.6, 0.8, d)));
      // ちん（鉦）どん（太鼓）
      [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.don(x, 0.7, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.kane(x, 1, d)));
      if (ms.sec >= 1) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.kane(x, 0.4, d)));
      if (ms.sec >= 2) add(ms.at(7), (x, d) => SND.snare(x, 0.4, d));
      if (rest) for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.snare(x, 0.25 + s * 0.05, d));
      melody(C.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.clarinet(x, n, dur, 1, d);
        if (ms.sec >= 4) SND.clarinet(x, n - 12, dur, 0.6, d);
      });
    },
    outro(ms, add) {
      [0, 2, 4].forEach(s => add(ms.at(s), (x, d) => { SND.don(x, 1, d); SND.kane(x, 1, d); }));
      add(ms.at(4), (x, d) => { SND.organ(x, [53, 57, 60, 65], 1, 1, d); SND.tuba(x, 41, 1, 1, d); SND.clarinet(x, 77, 1, 1, d); });
    },
  },
  {
    id: 'ska', title: '鉄板スカ', stars: 3, color: '#a8f07a',
    sub: { zh: '鐵板斯卡', ja: 'Teppan Ska', en: 'Teppan Ska' },
    genre: { zh: '斯卡・銅管', ja: 'スカ', en: 'Ska' },
    sections: [{ bpm: 116, lv: [1] }, { bpm: 122, lv: [1] }, { bpm: 128, lv: [1, 2] }, { bpm: 136, lv: [2] }, { bpm: 144, lv: [2, 3] }, { bpm: 150, lv: [3] }],
    arrange(ms, add) {
      const K = SKA, mi = ms.idx % 8, ch = K.CHORD[mi], rest = ms.kind === 'rest';
      [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.8, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.55, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.35 : 0.55, d));
      [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.organ(x, ch.map(n => n + 12), ms.sd * 0.45, 1, d)));   // 反拍刷奏
      K.WALK[mi].forEach((n, b) => add(ms.at(b * 2), (x, d) => SND.walk(x, n, ms.bd * 0.8, 1, d)));
      if (ms.sec >= 3) [3, 7].forEach(s => add(ms.at(s), (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.5, 0.8, d)));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); [5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.6, d))); }
      melody(K.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.trumpet(x, n, dur, 1.3, d);
        if (ms.sec >= 2) SND.lead(x, n - 12, dur, 0.55, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1, d); SND.kick(x, 0.9, d); SND.brass(x, [67, 71, 74, 79], 1, 1.3, d); SND.walk(x, 43, 1.4, 1, d); });
    },
  },
  {
    id: 'chip', title: '8ビット・ヤタイ', stars: 4, color: '#7ad8ff',
    sub: { zh: '8 位元屋台', ja: '8-bit Yatai', en: '8-bit Yatai' },
    genre: { zh: '8 位元電玩', ja: 'チップチューン', en: 'Chiptune' },
    sections: [{ bpm: 124, lv: [1, 2] }, { bpm: 132, lv: [2] }, { bpm: 140, lv: [2, 3] }, { bpm: 148, lv: [3] }, { bpm: 156, lv: [3] }, { bpm: 164, lv: [3] }],
    arrange(ms, add) {
      const P = CHIP, mi = ms.idx % 8, ch = P.CHORD[mi], r = P.ROOT[mi], rest = ms.kind === 'rest';
      [0, 3, 4].forEach(s => add(ms.at(s), (x, d) => SND.chipKick(x, 1, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.chipSnare(x, 1, d)));
      for (let s = 0; s < 8; s++) {
        add(ms.at(s), (x, d) => SND.chipHat(x, s % 2 ? 1 : 0.6, d));
        add(ms.at(s), (x, d) => SND.chipTri(x, s % 2 ? r + 12 : r, ms.sd * 0.85, 1, d));   // 三角波八度低音
      }
      if (ms.sec >= 1) for (let i = 0; i < 16; i++) {   // 16 分音符琶音
        const n = ch[i % 3] + 12;
        add(ms.start + i * ms.bd / 4, (x, d) => SND.chip(x, n, ms.bd / 4 * 0.7, 0.35, d));
      }
      if (rest) for (let i = 0; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.chipSnare(x, 0.3 + i * 0.04, d));
      melody(P.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.chip(x, n, dur, 1, d);
        if (ms.sec >= 4) SND.chip(x + 0.02, n + 12, dur, 0.35, d);   // 回音
      });
    },
    outro(ms, add) {
      [0, 1, 2].forEach(b => add(ms.at(b * 2), (x, d) => SND.chipKick(x, 1, d)));
      add(ms.at(4), (x, d) => { [74, 77, 81, 86].forEach((n, i) => SND.chip(x + i * 0.05, n, 0.8, 0.8, d)); SND.chipTri(x, 50, 1, 1, d); });
    },
  },
  {
    id: 'dnb', title: '炎のドラムンベース', stars: 5, color: '#ff6a5a',
    sub: { zh: '烈焰鼓打貝斯', ja: 'Flame Drum & Bass', en: 'Flame Drum & Bass' },
    genre: { zh: '鼓打貝斯', ja: 'ドラムンベース', en: 'Drum & Bass' },
    sections: [{ bpm: 156, lv: [2, 3] }, { bpm: 164, lv: [3] }, { bpm: 170, lv: [3] }, { bpm: 176, lv: [3] }, { bpm: 184, lv: [3] }, { bpm: 190, lv: [3] }],
    arrange(ms, add) {
      const D = DNB, mi = ms.idx % 8, ch = D.CHORD[mi], r = D.ROOT[mi], rest = ms.kind === 'rest';
      if (ms.idx === 0) add(ms.at(0), (x, d) => SND.crash(x, 0.9, d));
      // 碎拍：大鼓 1、3&，小鼓 2、4，加上 16 分音符的鬼音
      [0, 5].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 1, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.8, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.6 : 0.4, d));
      if (ms.sec >= 2) [3, 7].forEach(s => add(ms.at(s) + ms.bd / 4, (x, d) => SND.snare(x, 0.18, d)));
      // Reese 低音：長音＋換音
      add(ms.at(0), (x, d) => SND.reese(x, r, ms.bd * 1.4, 1, d));
      add(ms.at(3), (x, d) => SND.reese(x, r + 12, ms.bd * 0.4, 0.8, d));
      add(ms.at(4), (x, d) => SND.reese(x, r, ms.bd * 1.8, 1, d));
      add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.6, d));
      if (ms.sec >= 3) add(ms.at(7), (x, d) => SND.supersaw(x, ch[2] + 12, ms.sd * 0.6, 0.7, d));
      if (rest) {
        for (let i = 0; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.snare(x, 0.15 + i * 0.045, d));
        add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d));
      }
      melody(D.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.pluck(x, n, 1.3, d);
        if (ms.sec >= 1) SND.supersaw(x, n, dur, 0.6, d);
        if (ms.sec >= 4) SND.pluck(x + ms.bd / 4, n + 12, 0.4, d);   // 回音
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.2, d); SND.kick(x, 1, d); SND.reese(x, 41, 1.6, 1, d); SND.pad(x, [53, 56, 60, 65], 2, 1, d); SND.supersaw(x, 77, 1.2, 1, d); });
    },
  },
);

// 選單背景音樂用哪一首（index）
const MENU_SONG = 1;
const songById = id => SONGS.find(s => s.id === id) || SONGS[MENU_SONG];
