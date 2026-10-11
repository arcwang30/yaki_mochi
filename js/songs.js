'use strict';

// ===== 樂曲（內建曲目＋追加的 VOL.1～VOL.6，各 10 首；分組與排列順序在檔案最後的 VOL_ORDER） =====
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
    genre: { zh: '祭典太鼓・三味線', ja: '祭り囃子', en: 'Taiko & Shamisen' },
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
    genre: { zh: '搖擺爵士', ja: 'スウィングジャズ', en: 'Big Band Jazz' },
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
    genre: { zh: '迪斯可放克', ja: 'ディスコファンク', en: '70s Disco Groove' },
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
    genre: { zh: '歐陸節拍', ja: 'ユーロビート', en: 'High-Energy Eurodance' },
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

// ================= 內建曲目後加入的 5 首（排列順序見檔案最後的 VOL_ORDER） =================
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
    genre: { zh: '巴薩諾瓦・吉他', ja: 'ボサノバ', en: 'Brazilian Guitar' },
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
    genre: { zh: '單簧管・鉦與太鼓', ja: 'ちんどん屋', en: 'Japanese Street Band' },
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
    genre: { zh: '斯卡・銅管', ja: 'スカ', en: 'Jamaican Brass' },
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
    genre: { zh: '鼓打貝斯', ja: 'ドラムンベース', en: 'Jungle Breakbeat' },
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

// ================= VOL.1（原本的第二批）：10 首新曲（每種星級 2 首） =================
// ---------- オルゴール夜市（音樂盒搖籃曲，F 大調） ----------
const MUSICBOX = {
  CHORD: [[65, 69, 72], [62, 65, 69], [58, 62, 65], [60, 64, 67], [65, 69, 72], [57, 60, 64], [58, 62, 65], [60, 64, 67]],
  ROOT: [41, 38, 34, 36, 41, 33, 34, 36],
  MEL: [
    // 音樂盒的三音一組往下撥（3+3+2），像發條轉動
    [84, 81, 77, 84, 81, 77, 79, null], [74, null, 77, null, 81, null, null, null],
    [82, 77, 74, 82, 77, 74, 76, null], [79, 76, 72, null, 76, null, null, null],
    [84, 81, 77, 84, 81, 77, 76, 77], [81, null, 76, null, 72, null, 69, null],
    [74, 77, 82, 86, 82, 77, 76, 74], [72, null, 76, null, 77, null, null, null],
  ],
};
// ---------- 南国屋台レゲエ（雷鬼，G 大調） ----------
const REGGAE = {
  CHORD: [[55, 59, 62], [55, 60, 64], [57, 62, 66], [55, 60, 64], [52, 55, 59], [55, 60, 64], [57, 62, 66], [55, 59, 62]],
  ROOT: [43, 48, 50, 48, 40, 48, 50, 43],
  MEL: [
    // 反拍起句、同音連打（慵懶的雷鬼唱腔），句尾才往上揚
    [null, 74, null, 74, null, 72, 71, null], [72, null, null, null, null, 76, 79, null],
    [null, 78, null, 78, null, 76, 74, null], [76, null, 72, null, null, null, null, null],
    [null, 71, null, 71, null, 67, 64, null], [64, null, 67, null, 72, null, 76, null],
    [74, null, null, 78, 81, null, 78, null], [79, null, null, null, null, null, null, null],
  ],
};
// ---------- 夜市シティポップ（城市流行，C 大調七和弦） ----------
const CITYPOP = {
  CHORD: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [55, 60, 62, 65], [48, 52, 55, 59], [45, 48, 52, 55], [50, 53, 57, 60], [55, 59, 62, 65]],
  ROOT: [41, 40, 38, 43, 36, 45, 38, 43],
  MEL: [
    [76, null, 77, 76, 72, null, 69, null], [71, null, 72, null, 74, null, 76, null],
    [77, null, 76, 74, 72, null, 74, null], [74, null, null, null, 79, null, null, null],
    [76, null, 79, null, 83, null, 81, 79], [76, null, 72, null, 74, null, 76, null],
    [77, 76, 74, 72, 74, null, 71, null], [72, null, null, null, null, null, null, null],
  ],
};
// ---------- 鉄板音頭（盆踊り，D 陽音階、跳拍） ----------
const ONDO = {
  ROOT: [38, 38, 43, 38, 45, 43, 40, 38],
  MEL: [
    [74, null, 76, null, 79, null, 76, 74], [71, null, 74, null, 69, null, null, null],
    [74, null, 79, null, 81, 79, 76, null], [79, null, 76, null, 74, null, null, null],
    [81, null, 83, null, 86, null, 83, 81], [79, null, 81, null, 76, null, 74, null],
    [76, 79, 81, 79, 76, 74, 71, 74], [74, null, null, null, null, null, null, null],
  ],
};
// ---------- 鉄板サンバ（森巴，D 大調） ----------
const SAMBA = {
  CHORD: [[62, 66, 69], [59, 62, 66], [64, 67, 71], [57, 61, 64], [62, 66, 69], [55, 59, 62], [57, 61, 64], [62, 66, 69]],
  ROOT: [38, 35, 40, 33, 38, 43, 33, 38],
  MEL: [
    [74, 76, 78, null, 74, null, 71, null], [74, null, 71, 69, 66, null, null, null],
    [76, 78, 79, null, 76, null, 73, null], [76, null, 73, 71, 69, null, null, null],
    [78, null, 81, 78, 83, null, 81, null], [79, null, 78, 76, 74, null, 71, null],
    [73, 74, 76, 78, 79, 81, 78, 76], [74, null, null, null, null, null, null, null],
  ],
};
// ---------- 波乗りヤタイ（衝浪搖滾，E 小調） ----------
const SURF = {
  CHORD: [[52, 55, 59], [52, 55, 59], [48, 52, 55], [50, 54, 57], [52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 51, 54]],
  ROOT: [40, 40, 36, 38, 40, 36, 38, 35],
  MEL: [
    [64, null, 67, 69, 71, null, 69, 67], [64, null, null, null, 59, null, 62, null],
    [64, null, 67, 69, 72, null, 71, 69], [71, null, null, null, 74, null, null, null],
    [76, null, 74, 72, 71, null, 69, 67], [72, null, 71, 69, 67, null, 64, null],
    [66, 67, 69, 71, 72, 71, 69, 66], [64, null, null, null, null, null, null, null],
  ],
};
// ---------- ミラーボール屋台（迪斯可浩室，G 小調） ----------
const DISCO = {
  CHORD: [[55, 58, 62], [51, 55, 58], [58, 62, 65], [53, 57, 60], [55, 58, 62], [51, 55, 58], [58, 62, 65], [54, 57, 60, 62]],
  ROOT: [43, 39, 46, 41, 43, 39, 46, 38],
  MEL: [
    // 迪斯可弦樂的八度跳躍＋同音連擊（不走歐陸節拍的上下爬）
    [67, 79, null, 67, 79, null, 77, 79], [null, 75, null, 74, null, 70, null, null],
    [70, 82, null, 70, 82, null, 81, 82], [null, 81, null, 77, null, 72, null, null],
    [74, null, 74, 74, null, 77, null, 79], [79, null, 79, 79, null, 82, null, 84],
    [86, null, 84, null, 82, null, 77, null], [78, null, null, 74, null, null, 72, null],
  ],
};
// ---------- 鉄板ブギウギ（布基烏基，C 藍調） ----------
const BOOGIE = {
  ROOT: [36, 36, 41, 41, 36, 43, 41, 36],
  WALK: [0, 4, 7, 9, 10, 9, 7, 4],   // 左手經典低音型（相對根音）
  MEL: [
    [72, null, 75, 76, 79, null, 76, null], [79, null, 82, null, 79, 76, 75, null],
    [77, null, 80, 81, 84, null, 81, null], [84, null, 82, 81, 77, null, null, null],
    [79, 80, 79, 76, 72, null, 75, 76], [79, null, 74, null, 71, null, 67, null],
    [77, null, 76, null, 75, null, 74, null], [72, null, null, null, null, null, null, null],
  ],
};
// ---------- 灼熱テッパンロック（日系搖滾，D 小調） ----------
const JROCK = {
  ROOT: [38, 34, 36, 33, 38, 34, 36, 33],
  MEL: [
    [74, null, 77, null, 81, null, 79, 77], [77, null, 74, null, 70, null, 72, 74],
    [72, null, 76, null, 79, null, 77, 76], [76, null, 73, null, 69, null, 73, 76],
    [86, null, 84, 81, 77, null, 81, 84], [82, null, 81, 77, 74, null, 77, null],
    [79, 81, 82, 84, 82, 81, 79, 76], [74, null, null, null, null, null, null, null],
  ],
};
// ---------- 屋台ホーダウン（藍草，G 大調） ----------
const HOEDOWN = {
  CHORD: [[55, 59, 62], [55, 59, 62], [55, 60, 64], [55, 59, 62], [55, 59, 62], [54, 57, 62], [54, 57, 62], [55, 59, 62]],
  ROOT: [43, 43, 48, 43, 43, 50, 50, 43],
  MEL: [
    [79, 78, 79, 81, 83, null, 81, 79], [76, 74, 76, 78, 79, null, 74, null],
    [72, 74, 76, 77, 79, 81, 79, 76], [74, null, 71, 74, 79, null, null, null],
    [83, 81, 83, 84, 86, null, 84, 83], [81, 79, 78, 76, 78, null, 74, null],
    [74, 76, 78, 79, 81, 83, 81, 78], [79, null, null, null, null, null, null, null],
  ],
};

SONGS.push(
  {
    id: 'musicbox', title: 'オルゴール夜市', stars: 1, color: '#f5c4ff',
    sub: { zh: '音樂盒夜市', ja: 'Music Box Night Market', en: 'Music Box Night Market' },
    genre: { zh: '音樂盒・搖籃曲', ja: 'オルゴール', en: 'Lullaby Chimes' },
    sections: [{ bpm: 72, lv: [0] }, { bpm: 78, lv: [0] }, { bpm: 84, lv: [0, 1] }, { bpm: 90, lv: [1] }, { bpm: 96, lv: [1, 2] }],
    arrange(ms, add) {
      const M = MUSICBOX, mi = ms.idx % 8, ch = M.CHORD[mi], rest = ms.kind === 'rest';
      // 音樂盒的分解和弦（每個八分音符一顆），像發條轉動
      for (let s = 0; s < 8; s++) { const n = ch[[0, 1, 2, 1, 0, 1, 2, 1][s]] - 12; add(ms.at(s), (x, d) => SND.bell(x, n, 1, d)); }
      if (ms.sec >= 1) add(ms.at(0), (x, d) => SND.walk(x, M.ROOT[mi], ms.bd * 2, 0.8, d));
      if (ms.sec >= 1) add(ms.at(4), (x, d) => SND.walk(x, M.ROOT[mi] + 7, ms.bd * 1.6, 0.6, d));
      if (ms.sec >= 2) for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.shaker(x, s % 2 ? 0.4 : 0.22, d));
      if (ms.sec >= 3) [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.3, d)));
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.6, d));
      if (rest) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.bell(x, ch[2] + 12, 0.7, d)));
      melody(M.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.bell(x, n, 2.2, d);
        if (ms.sec >= 4) SND.bell(x + 0.01, n + 12, 0.7, d);
      });
    },
    outro(ms, add) {
      [77, 81, 84, 89].forEach((n, i) => add(ms.at(i), (x, d) => SND.bell(x, n, 0.9, d)));
      add(ms.at(0), (x, d) => { SND.pad(x, [53, 57, 60, 65], 2.4, 1, d); SND.walk(x, 41, 2, 0.6, d); });
    },
  },
  {
    id: 'reggae', title: '南国屋台レゲエ', stars: 1, color: '#7ee08a', swing: 0.58,
    sub: { zh: '南國屋台雷鬼', ja: 'Tropical Yatai Reggae', en: 'Tropical Yatai Reggae' },
    genre: { zh: '雷鬼・口風琴', ja: 'レゲエ', en: 'Island Melodica' },
    sections: [{ bpm: 76, lv: [0] }, { bpm: 82, lv: [0] }, { bpm: 88, lv: [0, 1] }, { bpm: 94, lv: [1] }, { bpm: 100, lv: [1, 2] }],
    arrange(ms, add) {
      const R = REGGAE, mi = ms.idx % 8, ch = R.CHORD[mi], r = R.ROOT[mi], rest = ms.kind === 'rest';
      // One Drop：大鼓＋邊擊只在第 3 拍
      add(ms.at(4), (x, d) => { SND.kick(x, 0.8, d); SND.rim(x, 0.9, d); });
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.4 : 0.25, d));
      // 反拍刷奏（短促的和弦）＋風琴「啵啵」
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.organ(x, ch.map(n => n + 12), ms.sd * 0.35, 1.5, d)));
      if (ms.sec >= 1) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.organ(x, [ch[0]], ms.sd * 0.3, 0.6, d)));
      // 低音：切分
      [[0, 0], [3, 0], [4, 7], [6, 12]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.sub(x, r - 12 + k, ms.sd * 1.4, 1.25, d)));
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.5, d));
      if (rest) [5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.35 + s * 0.04, d)));
      melody(R.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.melodica(x, n, dur, 1.6, d);
        if (ms.sec >= 4) SND.melodica(x, n - 12, dur, 0.7, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.kick(x, 0.8, d); SND.organ(x, [67, 71, 74, 79], 1.2, 1, d); SND.sub(x, 31, 1.4, 1, d); SND.melodica(x, 79, 1.4, 1, d); });
    },
  },
  {
    id: 'citypop', title: '夜市シティポップ', stars: 2, color: '#ff9ec7',
    sub: { zh: '夜市城市流行', ja: 'Night Market City Pop', en: 'Night Market City Pop' },
    genre: { zh: '城市流行・電鋼琴', ja: 'シティポップ', en: '80s Electric Piano' },
    sections: [{ bpm: 100, lv: [0] }, { bpm: 106, lv: [0, 1] }, { bpm: 112, lv: [1] }, { bpm: 118, lv: [1, 2] }, { bpm: 126, lv: [2] }, { bpm: 134, lv: [2, 3] }],
    arrange(ms, add) {
      const C = CITYPOP, mi = ms.idx % 8, ch = C.CHORD[mi], r = C.ROOT[mi], rest = ms.kind === 'rest';
      [0, 5].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.75, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.5, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.3 : 0.5, d, s === 7));
      // 電鋼琴：切分和弦
      [0, 3, 6].forEach(s => add(ms.at(s), (x, d) => SND.epiano(x, ch, s ? 1 : 1.3, d, ms.bd * 1.2)));
      // 低音：根音＋八度跳
      [[0, 0], [2, 12], [3, 0], [5, 7], [6, 12]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.walk(x, r - 12 + k, ms.sd * 1.2, 0.9, d)));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.strings(x, ch[3] + 12, ms.bd * 4, 0.6, d));
      if (ms.sec >= 3) [3, 7].forEach(s => add(ms.at(s), (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.5, 0.7, d)));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); [6, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.5, d))); }
      melody(C.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.sax(x, n, dur, 1.4, d);
        if (ms.sec >= 4) SND.epiano(x, [n + 12], 0.5, d, dur);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 0.8, d); SND.kick(x, 0.8, d); SND.epiano(x, [48, 55, 59, 62, 64], 1.2, d, 2); SND.walk(x, 36, 1.6, 0.9, d); SND.sax(x, 76, 1.4, 1, d); });
    },
  },
  {
    id: 'ondo', title: '鉄板音頭', stars: 2, color: '#ffcf6e', swing: 0.66,
    sub: { zh: '鐵板盆踊音頭', ja: 'Teppan Ondo', en: 'Teppan Ondo' },
    genre: { zh: '盆踊・音頭', ja: '盆踊り', en: 'Bon Dance Folk' },
    sections: [{ bpm: 104, lv: [0] }, { bpm: 110, lv: [0, 1] }, { bpm: 116, lv: [1] }, { bpm: 122, lv: [1, 2] }, { bpm: 128, lv: [2] }, { bpm: 136, lv: [2, 3] }],
    arrange(ms, add) {
      const O = ONDO, mi = ms.idx % 8, r = O.ROOT[mi], rest = ms.kind === 'rest';
      // 「ドドンがドン」的跳拍太鼓
      [[0, 'don'], [1, 'don'], [2, 'ka'], [4, 'don'], [5, 'don'], [6, 'ka']].forEach(([s, k]) => add(ms.at(s), (x, d) => (k === 'don' ? SND.don(x, s % 4 === 0 ? 0.5 : 0.32, d) : SND.ka(x, 0.8, d))));
      // チャンチキ（鉦）每個八分音符＋手拍子
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.kane(x, s % 2 ? 0.35 : 0.6, d));
      if (ms.sec >= 1) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.clap(x, d)));
      [[0, 0], [2, 7], [4, 0], [6, 7]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.walk(x, r - 12 + k, ms.sd * 1.3, 0.8, d)));
      if (ms.sec >= 2) [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.koto(x, r + 24, 0.5, d)));
      if (rest) for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.don(x, 0.28 + s * 0.05, d));
      melody(O.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.flute(x, n, dur, 1.1, d);
        if (ms.sec >= 3) SND.shamisen(x, m2f(n - 12), d, 0.8);
      });
    },
    outro(ms, add) {
      [0, 1, 2].forEach(s => add(ms.at(s), (x, d) => SND.don(x, 0.9, d)));
      add(ms.at(4), (x, d) => { SND.don(x, 1, d); SND.kane(x, 1.4, d); SND.flute(x, 74, 1.2, 1, d); SND.walk(x, 38, 1.2, 0.8, d); });
    },
  },
  {
    id: 'samba', title: '鉄板サンバ', stars: 3, color: '#ffe14a',
    sub: { zh: '鐵板森巴', ja: 'Teppan Samba', en: 'Teppan Samba' },
    genre: { zh: '森巴・打擊樂', ja: 'サンバ', en: 'Carnival Percussion' },
    sections: [{ bpm: 112, lv: [1] }, { bpm: 118, lv: [1] }, { bpm: 126, lv: [1, 2] }, { bpm: 134, lv: [2] }, { bpm: 142, lv: [2, 3] }, { bpm: 148, lv: [3] }],
    arrange(ms, add) {
      const S = SAMBA, mi = ms.idx % 8, ch = S.CHORD[mi], r = S.ROOT[mi], rest = ms.kind === 'rest';
      // 蘇爾多大鼓：第 2、4 拍重
      [[0, 0.5], [2, 1], [4, 0.5], [6, 1]].forEach(([s, v]) => add(ms.at(s), (x, d) => SND.surdo(x, v, d)));
      // 阿哥哥鈴（高低兩音）
      [[0, 1], [1, 1], [3, 0], [4, 1], [6, 0]].forEach(([s, hi]) => add(ms.at(s), (x, d) => SND.agogo(x, hi, 1, d)));
      // 坦博林 16 分音符
      if (ms.sec >= 1) for (let i = 0; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.shaker(x, i % 4 === 0 ? 0.8 : 0.4, d));
      if (ms.sec >= 2) [3, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.3, d)));
      [[0, 0], [3, 7], [4, 0], [7, 7]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.walk(x, r + k, ms.sd * 1.2, 0.9, d)));
      [1, 4, 6].forEach(s => add(ms.at(s), (x, d) => SND.nylon(x, ch, 0.6, d)));
      if (ms.sec >= 3) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.5, 0.7, d)));
      if (rest) { for (let i = 0; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.snare(x, 0.15 + i * 0.04, d)); [0, 2, 4].forEach(s => add(ms.at(s), (x, d) => SND.agogo(x, 1, 1.4, d))); }
      melody(S.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.marimba(x, n, 1, d);
        if (ms.sec >= 1) SND.flute(x, n, dur, 0.55, d);
        if (ms.sec >= 4) SND.marimba(x, n + 12, 0.4, d);
      });
    },
    outro(ms, add) {
      [0, 1, 2, 3].forEach(s => add(ms.at(s), (x, d) => SND.surdo(x, 0.8, d)));
      add(ms.at(4), (x, d) => { SND.crash(x, 1, d); SND.brass(x, [62, 66, 69, 74], 1, 1.3, d); SND.walk(x, 38, 1.2, 1, d); SND.agogo(x, 1, 1.4, d); });
    },
  },
  {
    id: 'surf', title: '波乗りヤタイ', stars: 3, color: '#6ad6ff',
    sub: { zh: '衝浪屋台', ja: "Surfin' Yatai", en: "Surfin' Yatai" },
    genre: { zh: '衝浪搖滾', ja: 'サーフロック', en: '60s Reverb Guitar' },
    sections: [{ bpm: 116, lv: [1] }, { bpm: 122, lv: [1] }, { bpm: 130, lv: [1, 2] }, { bpm: 138, lv: [2] }, { bpm: 144, lv: [2, 3] }, { bpm: 150, lv: [3] }],
    arrange(ms, add) {
      const S = SURF, mi = ms.idx % 8, ch = S.CHORD[mi], r = S.ROOT[mi], rest = ms.kind === 'rest';
      [0, 3, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.85, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.6, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.ride(x, s % 2 ? 0.5 : 0.8, d));
      // 低音：八分音符一直推（根音／八度）
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.walk(x, r - 12 + (s === 3 || s === 7 ? 12 : 0), ms.sd * 0.85, 0.8, d));
      if (ms.sec >= 1) [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.guitar(x, r, ms.bd * 0.9, 0.5, d)));
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.organ(x, ch.map(n => n + 12), ms.bd * 3.5, 0.5, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); [4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.4 + s * 0.05, d))); }
      melody(S.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.twang(x, n, dur, 1.2, d);
        if (ms.sec >= 4 && dur > ms.sd) SND.twang(x + ms.sd / 2, n, dur / 2, 0.6, d);   // 顫音撥奏
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1, d); SND.kick(x, 1, d); SND.guitar(x, 40, 1.4, 0.8, d); SND.twang(x, 76, 1.2, 1.2, d); SND.walk(x, 28, 1.4, 1, d); });
    },
  },
  {
    id: 'disco', title: 'ミラーボール屋台', stars: 4, color: '#c79bff',
    sub: { zh: '迪斯可燈球屋台', ja: 'Mirrorball Yatai', en: 'Mirrorball Yatai' },
    genre: { zh: '迪斯可浩室', ja: 'ディスコハウス', en: 'Disco House' },
    sections: [{ bpm: 122, lv: [1] }, { bpm: 128, lv: [1, 2] }, { bpm: 136, lv: [2] }, { bpm: 144, lv: [2, 3] }, { bpm: 152, lv: [3] }, { bpm: 160, lv: [3] }],
    arrange(ms, add) {
      const D = DISCO, mi = ms.idx % 8, ch = D.CHORD[mi], r = D.ROOT[mi], rest = ms.kind === 'rest';
      if (ms.idx === 0) add(ms.at(0), (x, d) => SND.crash(x, 0.8, d));
      // 四拍大鼓＋反拍開鈸＋2、4 拍拍手
      [0, 2, 4, 6].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.95, d)));
      [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.hat(x, 0.6, d, true)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.clap(x, d)));
      // 浩室鋼琴：切分和弦
      [1, 3, 6].forEach(s => add(ms.at(s), (x, d) => SND.piano(x, ch.map(n => n + 12), 0.8, d, 0.25)));
      // 低音：切分
      [[0, 0], [1, 12], [3, 0], [4, 7], [6, 12]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.sub(x, r - 12 + k, ms.sd * 0.8, 0.9, d)));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.6, d, 'sawtooth'));
      if (ms.sec >= 3) for (let i = 0; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.shaker(x, 0.4, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); for (let i = 8; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.clap(x, d)); }
      melody(D.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.strings(x, n, dur, 1.2, d);
        if (ms.sec >= 1) SND.pluck(x, n + 12, 0.6, d);
        if (ms.sec >= 4) SND.strings(x, n - 12, dur, 0.6, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.2, d); SND.kick(x, 1, d); SND.piano(x, [67, 70, 74, 79], 1, d, 1.4); SND.strings(x, 79, 1.4, 1.2, d); SND.sub(x, 31, 1.2, 1, d); });
    },
  },
  {
    id: 'boogie', title: '鉄板ブギウギ', stars: 4, color: '#ffa860', swing: 0.66,
    sub: { zh: '鐵板布基烏基', ja: 'Teppan Boogie-Woogie', en: 'Teppan Boogie-Woogie' },
    genre: { zh: '布基烏基・鋼琴', ja: 'ブギウギ', en: 'Barrelhouse Piano' },
    sections: [{ bpm: 124, lv: [1, 2] }, { bpm: 130, lv: [2] }, { bpm: 138, lv: [2, 3] }, { bpm: 146, lv: [3] }, { bpm: 152, lv: [3] }, { bpm: 160, lv: [3] }],
    arrange(ms, add) {
      const B = BOOGIE, mi = ms.idx % 8, r = B.ROOT[mi], rest = ms.kind === 'rest';
      // 左手：經典布基低音（八分音符走一圈）
      B.WALK.forEach((k, s) => add(ms.at(s), (x, d) => SND.piano(x, [r + k], 1.9, d, ms.sd * 1.1)));
      // 右手：反拍和弦（大三＋小七）
      [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.piano(x, [r + 16, r + 19, r + 22], 1, d, ms.sd * 0.6)));
      [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.7, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.55, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.ride(x, s % 2 ? 0.5 : 0.8, d));
      if (ms.sec >= 2) [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.walk(x, r - 12, ms.bd * 0.9, 0.7, d)));
      if (ms.sec >= 3) [3, 7].forEach(s => add(ms.at(s), (x, d) => SND.brass(x, [r + 16, r + 19, r + 22].map(n => n + 12), ms.sd * 0.5, 0.7, d)));
      if (rest) [1, 3, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.35 + s * 0.05, d)));
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.sax(x, n, dur, 1.5, d);
        if (ms.sec >= 4) SND.piano(x, [n + 12], 0.6, d, 0.2);
      });
    },
    outro(ms, add) {
      [0, 4, 7, 10].forEach((k, i) => add(ms.at(i), (x, d) => SND.piano(x, [48 + k, 60 + k], 1, d, 0.3)));
      add(ms.at(4), (x, d) => { SND.crash(x, 1, d); SND.kick(x, 0.9, d); SND.piano(x, [48, 52, 55, 58, 60, 64], 1.2, d, 1.6); SND.sax(x, 72, 1.4, 1, d); SND.walk(x, 24, 1.4, 1, d); });
    },
  },
  {
    id: 'jrock', title: '灼熱テッパンロック', stars: 5, color: '#ff5050',
    sub: { zh: '灼熱鐵板搖滾', ja: 'Scorching Teppan Rock', en: 'Scorching Teppan Rock' },
    genre: { zh: '日系搖滾', ja: 'J-ロック', en: 'Japanese Guitar Band' },
    sections: [{ bpm: 150, lv: [2] }, { bpm: 158, lv: [2, 3] }, { bpm: 166, lv: [3] }, { bpm: 172, lv: [3] }, { bpm: 180, lv: [3] }, { bpm: 186, lv: [3] }],
    arrange(ms, add) {
      const J = JROCK, mi = ms.idx % 8, r = J.ROOT[mi], rest = ms.kind === 'rest';
      if (mi === 0) add(ms.at(0), (x, d) => SND.crash(x, 1, d));
      [0, 3, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 1, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.8, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.45 : 0.7, d));
      // 破音吉他：八分音符刷強力和弦（悶音），重拍放開
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.guitar(x, r + 12, s % 4 === 0 ? ms.sd * 1.6 : ms.sd * 0.5, s % 4 === 0 ? 0.85 : 0.6, d));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.sub(x, r - 12, ms.sd * 0.8, 0.9, d));
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, [r + 24, r + 27, r + 31], ms.bd * 4, 0.5, d, 'sawtooth'));
      if (rest) {
        for (let i = 0; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.snare(x, 0.15 + i * 0.045, d));
        add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d));
      }
      melody(J.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.glead(x, n, dur, 1.2, d);
        if (ms.sec >= 4) SND.glead(x, n - 12, dur, 0.5, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.2, d); SND.kick(x, 1, d); SND.guitar(x, 50, 1.8, 1, d); SND.glead(x, 86, 1.6, 1.2, d); SND.sub(x, 26, 1.6, 1, d); });
    },
  },
  {
    id: 'hoedown', title: '屋台ホーダウン', stars: 5, color: '#d8b07a',
    sub: { zh: '屋台方塊舞', ja: 'Yatai Hoedown', en: 'Yatai Hoedown' },
    genre: { zh: '藍草・斑鳩琴', ja: 'ブルーグラス', en: 'Bluegrass' },
    sections: [{ bpm: 152, lv: [2, 3] }, { bpm: 160, lv: [3] }, { bpm: 168, lv: [3] }, { bpm: 176, lv: [3] }, { bpm: 182, lv: [3] }, { bpm: 188, lv: [3] }],
    arrange(ms, add) {
      const H = HOEDOWN, mi = ms.idx % 8, ch = H.CHORD[mi], r = H.ROOT[mi], rest = ms.kind === 'rest';
      // 斑鳩琴三指滾奏（16 分音符，三音一組不斷繞）
      const roll = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[2] + 7];
      for (let i = 0; i < 16; i++) add(ms.start + i * ms.bd / 4, (x, d) => SND.banjo(x, roll[i % 3 === 0 && i % 4 === 3 ? 3 : i % 3], i % 4 === 0 ? 1.4 : 1, d));
      // 低音提琴：二拍子（根音、五度）
      [[0, 0], [4, 7]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.walk(x, r - 12 + k, ms.bd * 0.9, 1.3, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.nylon(x, ch, 0.7, d)));   // 吉他反拍刷奏
      // 洗衣板＋輕鼓
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.shaker(x, s % 2 ? 0.7 : 0.4, d));
      if (ms.sec >= 1) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.35, d)));
      if (ms.sec >= 2) [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.6, d)));
      if (rest) [4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.clap(x, d)));
      melody(H.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.fiddle(x, n, dur, 1.8, d);
        if (ms.sec >= 4) SND.fiddle(x, n - 12, dur, 0.75, d);
      });
    },
    outro(ms, add) {
      [79, 83, 86, 91].forEach((n, i) => add(ms.start + i * ms.bd / 4, (x, d) => SND.banjo(x, n, 1, d)));
      add(ms.at(2), (x, d) => { SND.nylon(x, [43, 50, 55, 59, 62, 67], 1.2, d); SND.walk(x, 31, 1.2, 1, d); SND.fiddle(x, 79, 1.2, 1, d); SND.kick(x, 0.8, d); });
    },
  },
);

// ================= VOL.3：曲風與節奏感大幅變化（1 星 2、2 星電音 2、3 星動漫 1、4 星英搖 2、5 星金屬 3） =================
// 每首都有自己的打擊節奏型（patterns），玩起來的手感也不同
const t16 = (ms, k) => ms.start + k * ms.bd / 4;   // 第 k 個 16 分音符（不搖擺）
// ---------- ガムラン夜市（峇里島甘美朗，D 佩洛格音階） ----------
const GAMELAN = {
  SCALE: [62, 63, 65, 69, 70, 74, 75, 77, 81, 82, 86, 87, 89, 93],
  MEL: [
    [74, null, 77, null, 74, null, 70, null], [69, null, 70, null, 74, null, 69, null],
    [65, null, 69, null, 70, null, 74, null], [77, null, 74, null, 70, null, 69, null],
    [74, null, 75, null, 77, null, 81, null], [82, null, 81, null, 77, null, 74, null],
    [75, null, 74, null, 70, null, 69, null], [74, null, null, null, null, null, null, null],
  ],
  KOTEKAN: [1, 0, 2, 1, 0, 1, 2, 0],   // 交錯織體（相對目前骨幹音的音階級數）
};
// ---------- ウクレレ浜辺屋台（夏威夷，C 大調、跳拍） ----------
const HAWAII = {
  CHORD: [[60, 64, 67, 72], [60, 65, 69, 72], [59, 62, 67, 71], [60, 64, 67, 72], [60, 64, 67, 72], [61, 64, 67, 69], [62, 65, 69, 74], [59, 62, 65, 67]],
  ROOT: [48, 53, 55, 48, 48, 45, 50, 43],
  STRUM: [[0, 1, true], [2, 0.6, true], [3, 0.7, false], [5, 0.7, false], [6, 0.8, true], [7, 0.6, false]],   // 下刷 / 上刷
  MEL: [
    [76, null, null, 79, 76, null, 72, null], [77, null, null, 76, 74, null, null, null],
    [74, null, null, 77, 79, null, 77, 74], [76, null, null, null, 72, null, null, null],
    [79, null, null, 81, 79, null, 76, null], [76, null, null, 73, 76, null, 79, null],
    [77, null, 74, null, 71, null, 74, null], [72, null, null, null, null, null, null, null],
  ],
};
// ---------- ネオン屋台ウェーブ（合成器浪潮 Synthwave，A 小調） ----------
const SYNTHWAVE = {
  CHORD: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
  ROOT: [45, 41, 48, 43, 45, 41, 43, 40],
  MEL: [
    [76, null, null, null, 74, null, 72, null], [72, null, null, null, 69, null, null, null],
    [72, null, 74, null, 76, null, 79, null], [79, null, null, null, 74, null, null, null],
    [81, null, null, 79, 76, null, 74, null], [77, null, 76, 74, 72, null, 69, null],
    [74, null, 76, null, 79, null, 80, null], [81, null, null, null, null, null, null, null],
  ],
};
// ---------- フューチャー屋台ベース（未來貝斯，半速節奏，D 小調） ----------
const FUTURE = {
  CHORD: [[62, 65, 69, 72], [58, 62, 65, 69], [65, 69, 72, 76], [60, 64, 67, 72], [62, 65, 69, 72], [58, 62, 65, 69], [60, 65, 67, 72], [60, 64, 67, 70]],
  ROOT: [38, 34, 41, 36, 38, 34, 36, 36],
  MEL: [
    // 3+2+3 的長短切分（切片人聲）：一句往下、下一句往上翻
    [81, null, null, 79, null, 77, null, null], [74, null, null, 77, null, 81, null, null],
    [84, null, null, 81, null, 79, null, null], [76, null, null, 79, null, 84, null, null],
    [86, null, null, 84, null, 81, null, null], [82, null, null, 81, null, 77, null, null],
    [79, null, 81, null, 84, null, 86, null], [88, null, null, null, 84, null, null, null],
  ],
};
// ---------- 鉄板ヒーロー！（動漫片頭曲，D 大調 → 高潮升 E 大調） ----------
const ANIME = {
  CHORD: [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62], [62, 66, 69], [57, 61, 64], [55, 59, 62], [57, 61, 64]],
  ROOT: [38, 45, 47, 43, 38, 37, 43, 45],
  MEL: [
    [74, null, 76, 78, null, 78, 76, 74], [76, null, 73, null, 69, null, null, 73],
    [74, null, 76, 78, null, 81, null, 78], [79, null, 78, 76, null, 74, null, null],
    [81, null, 83, 81, null, 78, null, 76], [78, null, 76, 73, null, 76, null, null],
    [79, 78, 76, 74, 73, null, 69, null], [74, null, null, null, null, null, null, null],
  ],
};
// ---------- ブリティッシュ屋台アンセム（英式搖滾 Britpop，G 大調） ----------
const BRITPOP = {
  CHORD: [[55, 59, 62, 67], [54, 57, 62, 66], [52, 55, 59, 64], [48, 52, 55, 60], [55, 59, 62, 67], [50, 54, 57, 62], [48, 52, 55, 60], [50, 54, 57, 62]],
  ROOT: [43, 42, 40, 36, 43, 38, 36, 38],
  MEL: [
    [74, null, 74, null, 74, 76, 74, null], [74, null, null, 71, 69, null, 67, null],
    [71, null, 71, null, 71, 72, 74, null], [72, null, 71, null, 67, null, null, null],
    [79, null, 79, null, 78, 76, 74, null], [74, null, null, 76, 78, null, 74, null],
    [76, null, 76, null, 74, null, 72, 71], [71, null, null, null, null, null, null, null],
  ],
};
// ---------- インディー屋台ダンス（英式獨立舞曲龐克，B 小調） ----------
const DANCEPUNK = {
  CHORD: [[59, 62, 66], [55, 59, 62], [62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62], [57, 61, 64], [54, 58, 61]],
  ROOT: [47, 43, 38, 45, 47, 43, 45, 42],
  MEL: [
    [71, null, 71, 74, null, 71, 69, null], [67, null, 67, 71, null, 67, 66, null],
    [74, null, 74, 78, null, 74, 73, null], [73, null, null, 69, null, null, null, null],
    [78, null, 76, 74, 71, null, 74, null], [76, null, 74, 71, 67, null, 71, null],
    [73, null, 71, 69, 66, null, 70, null], [71, null, null, null, null, null, null, null],
  ],
};
// ---------- スラッシュ鉄板（鞭擊金屬，E 小調＋弗里吉亞半音） ----------
const THRASH = {
  ROOT: [40, 40, 41, 40, 40, 43, 42, 41],
  MEL: [
    [76, null, 74, null, 76, null, 79, null], [77, null, 76, null, 74, null, 72, null],
    [76, null, 74, null, 72, null, 71, null], [72, null, 71, null, 69, null, 68, null],
    [79, null, 77, null, 76, null, 74, null], [79, null, 81, null, 83, null, 84, null],
    [83, null, 81, null, 79, null, 77, null], [76, null, null, null, null, null, null, null],
  ],
};
// ---------- ドラゴン鉄板（力量金屬，C 小調） ----------
const POWER = {
  CHORD: [[60, 63, 67], [56, 60, 63], [58, 62, 65], [55, 59, 62], [60, 63, 67], [56, 60, 63], [58, 62, 65], [55, 59, 62]],
  ROOT: [36, 44, 46, 43, 36, 44, 46, 43],
  MEL: [
    [72, null, 74, 75, 77, null, 75, 74], [72, null, null, null, 68, null, 72, null],
    [74, null, 75, 77, 79, null, 77, 75], [74, null, null, null, 71, null, 74, null],
    [79, null, 80, 82, 84, null, 82, 80], [80, null, 79, 77, 75, null, 77, null],
    [79, null, 77, 75, 74, null, 71, 74], [72, null, null, null, null, null, null, null],
  ],
};
// ---------- 鬼焼きメタル（和風金屬，D 陰音階） ----------
const WAMETAL = {
  ROOT: [38, 38, 39, 38, 43, 39, 38, 37],
  CHUG: [[0, 1], [1, 0.6], [3, 0.8], [5, 0.8], [6, 0.7]],   // 切分的悶音重擊（停—打—停）
  MEL: [
    [74, null, 75, null, 79, null, 75, 74], [70, null, 69, null, 67, null, null, null],
    [74, null, 79, null, 81, null, 82, 81], [79, null, 75, null, 74, null, null, null],
    [86, null, 82, null, 81, null, 79, null], [81, null, 82, null, 79, null, 75, null],
    [74, 75, 79, 81, 82, 81, 79, 75], [74, null, null, null, null, null, null, null],
  ],
};

SONGS.push(
  {
    id: 'gamelan', title: 'ガムラン夜市', stars: 1, color: '#e8c070',
    sub: { zh: '甘美朗夜市', ja: 'Gamelan Night Market', en: 'Gamelan Night Market' },
    genre: { zh: '峇里島甘美朗・鑼', ja: 'ガムラン', en: 'Balinese Gongs' },
    sections: [{ bpm: 70, lv: [0] }, { bpm: 76, lv: [0] }, { bpm: 82, lv: [0, 1] }, { bpm: 88, lv: [1] }, { bpm: 94, lv: [1, 2] }],
    patterns: [   // 甘美朗的重音在第 4 拍（鑼落在句尾）
      [[0, 2], [2], [0, 3], [1, 3], [3]],
      [[0, 1, 3], [1, 2, 3], [0, 1.5, 3], [0, 2, 3]],
      [[0, 1, 2, 3], [0, 1.5, 2, 3], [0, 0.5, 2, 3], [1, 1.5, 3]],
    ],
    arrange(ms, add) {
      const G = GAMELAN, mi = ms.idx % 8, row = G.MEL[mi], rest = ms.kind === 'rest';
      // 骨幹旋律（薩隆琴）
      melody(row, ms, add, (x, n, dur, d) => { SND.metallo(x, n, 3, d, 1.1); if (ms.sec >= 3) SND.metallo(x, n - 12, 1.4, d, 1.4); });
      // 交錯織體（博南鑼）：跟著骨幹音在音階上下繞
      if (ms.sec >= 1) {
        let base = G.SCALE.indexOf(row[0] || 74); if (base < 0) base = 5;
        for (let s = 0; s < 8; s++) {
          if (row[s] !== null && row[s] !== undefined) { const k = G.SCALE.indexOf(row[s]); if (k >= 0) base = k; }
          const n = G.SCALE[Math.min(G.SCALE.length - 1, base + G.KOTEKAN[s])] + 12;
          add(ms.at(s), (x, d) => SND.metallo(x, n, 1.1, d, 0.35));
        }
      }
      // 克農鑼（每小節第 2、4 拍）、肯普爾小鑼（第 3 拍）、大鑼（每 8 小節最後）
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.metallo(x, 57, 1.5, d, 1.6)));
      if (ms.sec >= 1) add(ms.at(4), (x, d) => SND.gong(x, 50, 1, d));
      if (mi === 7) add(ms.at(6), (x, d) => SND.gong(x, 38, 2, d));
      // 肯當鼓
      if (ms.sec >= 2) [[0, 'don'], [3, 'ka'], [5, 'ka'], [6, 'don']].forEach(([s, k]) => add(ms.at(s), (x, d) => (k === 'don' ? SND.don(x, 0.35, d) : SND.ka(x, 0.4, d))));
      if (rest) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.metallo(x, 86, 0.8, d, 0.3)));
    },
    outro(ms, add) {
      [74, 77, 81, 86].forEach((n, i) => add(ms.at(i), (x, d) => SND.metallo(x, n, 1.3, d, 1.4)));
      add(ms.at(4), (x, d) => SND.gong(x, 38, 1.5, d));
    },
  },
  {
    id: 'hawaii', title: 'ウクレレ浜辺屋台', stars: 1, color: '#7ee8d0', swing: 0.62,
    sub: { zh: '烏克麗麗海灘屋台', ja: 'Ukulele Beach Yatai', en: 'Ukulele Beach Yatai' },
    genre: { zh: '夏威夷・滑棒吉他', ja: 'ハワイアン', en: 'Hawaiian' },
    sections: [{ bpm: 78, lv: [0] }, { bpm: 84, lv: [0] }, { bpm: 90, lv: [0, 1] }, { bpm: 96, lv: [1] }, { bpm: 102, lv: [1, 2] }],
    patterns: [   // 跳拍的反拍（.5 落在搖擺的後半）
      [[0, 2], [0, 1.5], [2, 3.5], [0, 3]],
      [[0, 1.5, 2], [0, 1, 2.5], [1.5, 2, 3], [0, 1.5, 3]],
      [[0, 1.5, 2, 3.5], [0, 0.5, 1.5, 3], [0, 1, 1.5, 2.5]],
    ],
    arrange(ms, add) {
      const H = HAWAII, mi = ms.idx % 8, ch = H.CHORD[mi], r = H.ROOT[mi], rest = ms.kind === 'rest';
      H.STRUM.forEach(([s, v, down]) => add(ms.at(s), (x, d) => SND.uke(x, ch, v * 1.9, d, down)));
      [[0, 0], [3, 7], [4, 12], [6, 7]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.walk(x, r - 12 + k, ms.sd * 1.3, 1.2, d)));
      for (let s = 0; s < 8; s++) if (ms.sec >= 1) add(ms.at(s), (x, d) => SND.shaker(x, s % 2 ? 0.6 : 0.35, d));
      if (ms.sec >= 2) [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.3, d)));
      if (ms.sec >= 2) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.rim(x, 0.5, d)));
      if (rest) [5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.uke(x, ch, 0.8, d, s % 2 === 0)));
      melody(H.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.steel(x, n, dur, 1.9, d);
        if (ms.sec >= 4) SND.uke(x, [n - 12], 1.1, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.uke(x, [60, 64, 67, 72, 76], 1.2, d); SND.steel(x, 84, 1.8, 1, d); SND.walk(x, 36, 1.6, 0.8, d); });
    },
  },
  {
    id: 'synthwave', title: 'ネオン屋台ウェーブ', stars: 2, color: '#ff6ad5',
    sub: { zh: '霓虹屋台浪潮', ja: 'Neon Yatai Wave', en: 'Neon Yatai Wave' },
    genre: { zh: '合成器浪潮（電音）', ja: 'シンセウェイヴ', en: '80s Retro Synth' },
    sections: [{ bpm: 100, lv: [0] }, { bpm: 106, lv: [0, 1] }, { bpm: 112, lv: [1] }, { bpm: 118, lv: [1, 2] }, { bpm: 126, lv: [2] }, { bpm: 134, lv: [2, 3] }],
    patterns: [   // 一路往前推的連續八分音符
      [[0, 2], [0, 1, 2], [1, 2, 3], [0, 3]],
      [[0, 0.5, 1], [2, 2.5, 3], [0, 1, 2, 2.5], [0, 0.5, 2]],
      [[0, 0.5, 1, 2], [2, 2.5, 3, 3.5], [0, 1, 1.5, 2, 3]],
      [[0, 0.5, 1, 1.5, 2], [0, 0.5, 1, 2, 2.5, 3]],
    ],
    arrange(ms, add) {
      const S = SYNTHWAVE, mi = ms.idx % 8, ch = S.CHORD[mi], r = S.ROOT[mi], rest = ms.kind === 'rest';
      [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.9, d)));
      if (ms.sec >= 2) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.6, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.gsnare(x, 1, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.5 : 0.25, d));
      // 16 分音符合成器低音（根音、根音、八度、根音…）
      for (let k = 0; k < 16; k++) { const n = r - 12 + (k % 4 === 2 ? 12 : 0); add(t16(ms, k), (x, d) => SND.synbass(x, n, ms.bd / 4 * 0.9, k % 4 === 0 ? 1 : 0.7, d)); }
      add(ms.at(0), (x, d) => SND.pad(x, ch.map(n => n + 12), ms.bd * 4, 0.9, d, 'sawtooth'));
      if (ms.sec >= 3) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.pluck(x, ch[k % 3] + 24, 0.45, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); [6, 7].forEach(s => add(ms.at(s), (x, d) => SND.gsnare(x, 0.8, d))); }
      melody(S.MEL[mi], ms, add, (x, n, dur, d) => { SND.synlead(x, n, dur, 1.2, d); if (ms.sec >= 4) SND.synlead(x, n - 12, dur, 0.5, d); });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.kick(x, 1, d); SND.gsnare(x, 1, d); SND.pad(x, [57, 60, 64, 69, 72], 2.4, 1.2, d, 'sawtooth'); SND.synbass(x, 33, 1.4, 1, d); SND.synlead(x, 81, 1.6, 1.2, d); });
    },
  },
  {
    id: 'future', title: 'フューチャー屋台ベース', stars: 2, color: '#8ad8ff',
    sub: { zh: '未來屋台貝斯', ja: 'Future Yatai Bass', en: 'Future Yatai Bass' },
    genre: { zh: '未來貝斯（電音）', ja: 'フューチャーベース', en: 'Supersaw EDM' },
    sections: [{ bpm: 100, lv: [0] }, { bpm: 106, lv: [0, 1] }, { bpm: 112, lv: [1] }, { bpm: 120, lv: [1, 2] }, { bpm: 128, lv: [2] }, { bpm: 136, lv: [2, 3] }],
    patterns: [   // 半速節奏＋切分（踩在空拍上）
      [[0, 2], [0, 2.5], [0, 1.5], [2]],
      [[0, 1.5, 2], [0, 0.5, 2], [0, 1.5, 3], [1.5, 2.5]],
      [[0, 0.5, 1.5, 2], [0, 1.5, 2, 3.5], [0.5, 1.5, 2.5]],
      [[0, 0.5, 1.5, 2, 2.5], [0, 1.5, 2, 2.5, 3.5]],
    ],
    arrange(ms, add) {
      const F = FUTURE, mi = ms.idx % 8, ch = F.CHORD[mi], r = F.ROOT[mi], rest = ms.kind === 'rest';
      // 半速：大鼓 1、2&，小鼓只在第 3 拍
      [0, 3].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 1, d)));
      add(ms.at(4), (x, d) => { SND.snare(x, 0.9, d); SND.clap(x, d); });
      // Trap 鈸：八分音符，每兩小節尾巴來一串 16、32 分音符滾奏
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, 0.4, d));
      if (ms.sec >= 1 && mi % 2 === 1) for (let k = 0; k < 8; k++) add(ms.start + ms.bd * 3 + k * ms.bd / 8, (x, d) => SND.hat(x, 0.25 + k * 0.05, d));
      // 抽動的和弦（每拍重新起音＝側鏈壓縮的感覺）
      [0, 2, 4, 6].forEach(s => add(ms.at(s), (x, d) => ch.forEach(n => SND.supersaw(x + 0.06, n + 12, ms.bd * 0.75, 0.55, d))));
      add(ms.at(0), (x, d) => SND.b808(x, r - 12, ms.bd * 2.5, 1, d));
      add(ms.at(5), (x, d) => SND.b808(x, r - 12, ms.bd * 1.2, 0.8, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); for (let k = 8; k < 16; k++) add(t16(ms, k), (x, d) => SND.snare(x, 0.2 + k * 0.03, d)); }
      melody(F.MEL[mi], ms, add, (x, n, dur, d) => { SND.chop(x, n, dur, 1.3, d); if (ms.sec >= 3) SND.pluck(x, n + 12, 0.6, d); });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.kick(x, 1, d); [62, 65, 69, 72, 77].forEach(n => SND.supersaw(x, n, 1.6, 0.6, d)); SND.b808(x, 26, 1.8, 1, d); SND.chop(x, 86, 0.6, 1.2, d); });
    },
  },
  {
    id: 'anime', title: '鉄板ヒーロー！', stars: 3, color: '#ff8a3c',
    sub: { zh: '鐵板英雄！', ja: 'Teppan Hero!', en: 'Teppan Hero!' },
    genre: { zh: '動漫片頭曲', ja: 'アニソン', en: 'Anime Opening' },
    sections: [{ bpm: 120, lv: [1] }, { bpm: 126, lv: [1] }, { bpm: 132, lv: [1, 2] }, { bpm: 138, lv: [2] }, { bpm: 146, lv: [2, 3] }, { bpm: 152, lv: [3] }],
    patterns: [
      null,
      [[0, 1.5, 3], [0, 1, 2.5], [0.5, 1.5, 3], [0, 2, 3.5]],   // 動漫歌的「搶拍」切分
      [[0, 1.5, 2, 3], [0, 0.5, 1.5, 3], [0, 1, 2.5, 3.5], [0.5, 1.5, 2.5, 3]],
      [[0, 0.5, 1.5, 2, 3], [0, 1, 1.5, 2.5, 3.5], [0.5, 1, 1.5, 2.5, 3]],
    ],
    arrange(ms, add) {
      const N = ANIME, mi = ms.idx % 8, tp = ms.sec >= 4 ? 2 : 0, ch = N.CHORD[mi].map(n => n + tp), r = N.ROOT[mi] + tp, rest = ms.kind === 'rest';   // 第 5 段起升 2 個半音（高潮）
      if (mi === 0) add(ms.at(0), (x, d) => SND.crash(x, 0.9, d));
      (ms.sec >= 2 ? [0, 2, 4, 6] : [0, 3, 4]).forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.95, d)));   // 副歌改四拍大鼓
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.7, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.55 : 0.3, d, s % 2 === 1 && ms.sec >= 2));
      // 鋼琴八分音符和弦＋切分低音
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.piano(x, ch.map(n => n + 12), s % 2 ? 0.45 : 0.7, d, 0.18));
      [[0, 0], [1, 12], [3, 0], [4, 12], [6, 0], [7, 12]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.sub(x, r - 12 + k, ms.sd * 0.8, 0.8, d)));
      if (ms.sec >= 1) add(ms.at(0), (x, d) => SND.strings(x, ch[2] + 12, ms.bd * 4, 0.7, d));
      if (ms.sec >= 3) [3, 7].forEach(s => add(ms.at(s), (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.5, 0.9, d)));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); [4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.4 + s * 0.06, d))); }
      melody(N.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.lead(x, n + tp, dur, 1.2, d); SND.strings(x, n + tp, dur, 0.6, d);
        if (ms.sec >= 4) SND.lead(x, n + tp - 12, dur, 0.5, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.2, d); SND.kick(x, 1, d); SND.brass(x, [64, 68, 71, 76], 1.2, 1.3, d); SND.strings(x, 88, 1.6, 1, d); SND.sub(x, 28, 1.4, 1, d); });
    },
  },
  {
    id: 'britpop', title: 'ブリティッシュ屋台アンセム', stars: 4, color: '#5a8cff',
    sub: { zh: '英倫屋台頌歌', ja: 'British Yatai Anthem', en: 'British Yatai Anthem' },
    genre: { zh: '英式搖滾 Britpop', ja: 'ブリットポップ', en: '90s UK Guitar Pop' },
    sections: [{ bpm: 120, lv: [1] }, { bpm: 126, lv: [1, 2] }, { bpm: 134, lv: [2] }, { bpm: 142, lv: [2, 3] }, { bpm: 150, lv: [3] }, { bpm: 158, lv: [3] }],
    patterns: [
      null,
      [[0, 1, 2, 3], [0, 1, 2], [0, 2, 3, 3.5], [1, 2, 3]],   // 跟著拍子大合唱（正拍為主）
      [[0, 1, 2, 3, 3.5], [0, 1, 1.5, 2, 3], [0, 0.5, 1, 2, 3]],
      [[0, 0.5, 1, 2, 3, 3.5], [0, 1, 1.5, 2, 2.5, 3]],
    ],
    arrange(ms, add) {
      const B = BRITPOP, mi = ms.idx % 8, ch = B.CHORD[mi], r = B.ROOT[mi], rest = ms.kind === 'rest';
      if (mi === 0) add(ms.at(0), (x, d) => SND.crash(x, 0.8, d));
      [0, 4, 5].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.9, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.75, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.tamb(x, s % 2 ? 0.6 : 1, d));   // 鈴鼓
      // 大聲刷的破音吉他（八分音符、重拍放開）
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.dguitar(x, ch, s % 4 === 0 ? ms.bd * 0.9 : ms.sd * 0.8, s % 2 ? 0.55 : 0.8, d, { strum: 0.008 }));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.walk(x, r - 12, ms.sd * 0.85, 0.85, d));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.strings(x, ch[3] + 12, ms.bd * 4, 0.7, d));   // 美樂托朗弦樂
      if (rest) [4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => { SND.snare(x, 0.5 + s * 0.05, d); SND.kick(x, 0.6, d); }));
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.3, d); if (ms.sec >= 4) SND.vox(x, n + 12, dur, 0.45, d); });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.2, d); SND.kick(x, 1, d); SND.dguitar(x, [43, 50, 55, 59, 62, 67], 2, 1.2, d, { strum: 0.02 }); SND.vox(x, 79, 1.6, 1.2, d); SND.walk(x, 31, 1.6, 1, d); });
    },
  },
  {
    id: 'dancepunk', title: 'インディー屋台ダンス', stars: 4, color: '#c8ff5a',
    sub: { zh: '獨立屋台舞曲', ja: 'Indie Yatai Dance', en: 'Indie Yatai Dance' },
    genre: { zh: '英式獨立舞曲龐克', ja: 'UKダンスパンク', en: 'UK Post-Punk Revival' },
    sections: [{ bpm: 126, lv: [1] }, { bpm: 132, lv: [1, 2] }, { bpm: 140, lv: [2] }, { bpm: 148, lv: [2, 3] }, { bpm: 156, lv: [3] }, { bpm: 164, lv: [3] }],
    patterns: [
      null,
      [[0.5, 1.5, 2.5], [0, 1.5, 3], [0.5, 2, 2.5], [0, 2.5, 3.5]],   // 反拍跳舞
      [[0.5, 1.5, 2.5, 3.5], [0, 0.5, 1.5, 2.5], [0, 1.5, 2, 3.5]],
      [[0, 0.5, 1.5, 2, 2.5, 3.5], [0.5, 1, 1.5, 2.5, 3.5]],
    ],
    arrange(ms, add) {
      const P = DANCEPUNK, mi = ms.idx % 8, ch = P.CHORD[mi], r = P.ROOT[mi], rest = ms.kind === 'rest';
      [0, 2, 4, 6].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.95, d)));   // 四拍大鼓
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.7, d)));
      [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.hat(x, 0.6, d, true)));   // 迪斯可開鈸
      if (ms.sec >= 1) [1, 5].forEach(s => add(ms.at(s), (x, d) => SND.agogo(x, 1, 0.7, d)));   // 牛鈴
      // 一刀一刀的悶音吉他（反拍）＋重拍放開
      [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.dguitar(x, ch.map(n => n + 12), ms.sd * 0.6, 0.75, d, { mute: true })));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.dguitar(x, ch, ms.bd, 0.7, d, { strum: 0.01 }));
      // 推進的八分音符低音
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.sub(x, r - 12 + (s % 4 === 3 ? 12 : 0), ms.sd * 0.75, 0.9, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); for (let k = 8; k < 16; k++) add(t16(ms, k), (x, d) => SND.snare(x, 0.25 + k * 0.03, d)); }
      melody(P.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.2, d); if (ms.sec >= 3) SND.glead(x, n + 12, dur, 0.35, d); });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.2, d); SND.kick(x, 1, d); SND.dguitar(x, [47, 54, 59, 62, 66], 1.6, 1.1, d, { strum: 0.015 }); SND.sub(x, 35, 1.4, 1, d); SND.vox(x, 83, 1.4, 1, d); });
    },
  },
  {
    id: 'thrash', title: 'スラッシュ鉄板', stars: 5, color: '#b0b8c8',
    sub: { zh: '鞭擊鐵板', ja: 'Thrash Teppan', en: 'Thrash Teppan' },
    genre: { zh: '鞭擊金屬', ja: 'スラッシュメタル', en: 'Speed Metal' },
    sections: [{ bpm: 140, lv: [2] }, { bpm: 146, lv: [2] }, { bpm: 152, lv: [2, 3] }, { bpm: 158, lv: [3] }, { bpm: 164, lv: [3] }, { bpm: 170, lv: [3] }],
    patterns: [
      null, null,
      [[0, 0.5, 1], [2, 2.5, 3], [0, 2, 2.5], [0, 1, 2]],   // 馳騁（噠—噠噠）；每小節最多 4 下、連續八分音符最多 3 下
      [[0, 0.5, 1, 2], [0, 2, 2.5, 3], [0, 0.5, 2, 3], [1, 2, 2.5]],
    ],
    arrange(ms, add) {
      const T = THRASH, mi = ms.idx % 8, r = T.ROOT[mi], rest = ms.kind === 'rest';
      if (mi === 0) add(ms.at(0), (x, d) => SND.crash(x, 1, d));
      // 鞭擊鼓（skank beat）：大鼓在正拍、小鼓在每個反拍
      for (let b = 0; b < 4; b++) { add(t16(ms, b * 4), (x, d) => SND.kick(x, 0.75, d)); add(t16(ms, b * 4 + 2), (x, d) => SND.snare(x, 0.6, d)); }
      for (let b = 0; b < 4; b++) add(t16(ms, b * 4), (x, d) => SND.ride(x, 0.5, d));
      // 馳騁悶音：每拍「八分＋兩個十六分」，每小節第一下放開成強力和弦
      for (let b = 0; b < 4; b++) [0, 2, 3].forEach(k => {
        const open = b === 0 && k === 0;
        add(t16(ms, b * 4 + k), (x, d) => SND.dguitar(x, open ? [r, r + 7, r + 12] : [r], open ? ms.bd * 0.9 : ms.bd / 4 * 0.9, open ? 0.7 : 0.6, d, { mute: !open }));
        add(t16(ms, b * 4 + k), (x, d) => SND.sub(x, r - 12, ms.bd / 4 * 0.9, 0.55, d));
      });
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => { SND.snare(x, 0.2 + k * 0.045, d); if (k % 2 === 0) SND.kick(x, 0.8, d); });
      if (ms.sec >= 2) melody(T.MEL[mi], ms, add, (x, n, dur, d) => { SND.glead(x, n, dur, 0.9, d); if (ms.sec >= 4) SND.glead(x, n - 5, dur, 0.5, d); });   // 吉他獨奏（四度和聲）
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.3, d); SND.kick(x, 1, d); SND.dguitar(x, [40, 47, 52], 2.2, 1.2, d); SND.glead(x, 88, 1.8, 1.2, d); SND.sub(x, 28, 1.8, 1, d); });
    },
  },
  {
    id: 'power', title: 'ドラゴン鉄板', stars: 5, color: '#ffd23f',
    sub: { zh: '飛龍鐵板', ja: 'Dragon Teppan', en: 'Dragon Teppan' },
    genre: { zh: '力量金屬', ja: 'パワーメタル', en: 'Power Metal' },
    sections: [{ bpm: 138, lv: [2] }, { bpm: 144, lv: [2] }, { bpm: 150, lv: [2, 3] }, { bpm: 156, lv: [3] }, { bpm: 162, lv: [3] }, { bpm: 168, lv: [3] }],
    patterns: [
      null, null,
      [[0, 0.5, 1], [2, 2.5, 3], [0, 1, 2, 3], [0, 2, 2.5]],   // 一路衝刺的八分音符；每小節最多 4 下
      [[0, 0.5, 1, 2], [0, 2, 2.5, 3], [0, 1, 2, 3], [0, 0.5, 2, 3]],
    ],
    arrange(ms, add) {
      const P = POWER, mi = ms.idx % 8, ch = P.CHORD[mi], r = P.ROOT[mi], rest = ms.kind === 'rest';
      add(ms.at(0), (x, d) => SND.crash(x, 0.8, d));
      // 雙大鼓 16 分音符連打（第 2 段起）
      for (let k = 0; k < 16; k++) if (ms.sec >= 1 || k % 4 === 0) add(t16(ms, k), (x, d) => SND.kick(x, k % 4 === 0 ? 0.7 : 0.42, d));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.85, d)));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.ride(x, 0.5, d));
      // 節奏吉他：八分音符強力和弦
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.dguitar(x, [r, r + 7, r + 12], ms.sd * 0.9, s % 2 ? 0.55 : 0.7, d, { mute: s % 2 === 1 }));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.sub(x, r - 12, ms.sd * 0.85, 0.8, d));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.choir(x, ch.map(n => n + 12), ms.bd * 4, 0.9, d));   // 合唱團
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.snare(x, 0.2 + k * 0.045, d));
      melody(P.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.glead(x, n, dur, 1.1, d);
        if (ms.sec >= 3) SND.glead(x, n + 4, dur, 0.55, d);   // 雙吉他三度和聲
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.3, d); SND.kick(x, 1, d); SND.dguitar(x, [36, 43, 48], 2.2, 1.2, d); SND.choir(x, [60, 63, 67, 72], 2.2, 1.2, d); SND.glead(x, 84, 1.8, 1.2, d); SND.glead(x, 87, 1.8, 0.6, d); });
    },
  },
  {
    id: 'wametal', title: '鬼焼きメタル', stars: 5, color: '#ff3a6a',
    sub: { zh: '鬼燒金屬', ja: 'Oni-yaki Metal', en: 'Oni-yaki Metal' },
    genre: { zh: '和風金屬・太鼓・三味線', ja: '和風メタル', en: 'Taiko & Shamisen Shred' },
    sections: [{ bpm: 136, lv: [2] }, { bpm: 142, lv: [2] }, { bpm: 148, lv: [2, 3] }, { bpm: 154, lv: [3] }, { bpm: 160, lv: [3] }, { bpm: 166, lv: [3] }],
    patterns: [
      null, null,
      [[0, 0.5, 2], [0, 1.5, 3], [0, 2.5], [1.5, 3]],   // 停—打—停的切分；每小節最多 4 下
      [[0, 0.5, 1.5, 3], [0, 1.5, 2.5, 3], [0, 0.5, 2.5, 3], [1.5, 2, 3]],
    ],
    arrange(ms, add) {
      const M = WAMETAL, mi = ms.idx % 8, r = M.ROOT[mi], rest = ms.kind === 'rest';
      if (mi === 0) add(ms.at(0), (x, d) => { SND.crash(x, 0.8, d); SND.gong(x, 38, 0.4, d); });
      // 切分的悶音重擊，大鼓跟著吉他
      M.CHUG.forEach(([s, v]) => {
        add(ms.at(s), (x, d) => SND.dguitar(x, s === 0 ? [r, r + 7, r + 12] : [r], s === 0 ? ms.sd * 1.6 : ms.sd * 0.8, v * 0.6, d, { mute: s !== 0 }));
        add(ms.at(s), (x, d) => { SND.kick(x, 0.6 * v + 0.1, d); SND.sub(x, r - 12, ms.sd * 0.9, 0.6, d); });
      });
      // 小鼓：前兩段半速（第 3 拍），之後雙倍（2、4 拍）
      (ms.sec >= 2 ? [2, 6] : [4]).forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.85, d)));
      // 太鼓＋鉦
      [[0, 0.7], [4, 0.55], [7, 0.42]].forEach(([s, v]) => add(ms.at(s), (x, d) => SND.don(x, v, d)));
      if (ms.sec >= 1) for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.kane(x, s % 2 ? 0.35 : 0.6, d));
      if (ms.sec >= 3) for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.ride(x, 0.4, d));
      if (rest) for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => { SND.don(x, 0.32 + s * 0.04, d); SND.ka(x, 0.5, d); });
      melody(M.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.shamisen(x, m2f(n), d, 0.95);
        if (ms.sec >= 1) SND.fue(x, m2f(n), dur, d);
        if (ms.sec >= 3) SND.glead(x, n - 12, dur, 0.55, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.crash(x, 1.3, d); SND.don(x, 1.2, d); SND.gong(x, 38, 1.2, d); SND.dguitar(x, [38, 45, 50], 2.2, 1.2, d); SND.shamisen(x, m2f(74), d, 1.4); SND.fue(x, m2f(86), 1.6, d); });
    },
  },
);

// ================= VOL.2：世界各地與跨年代的曲風（星級分佈同內建曲目：1 星 2、2 星 2、3 星 2、4 星 2、5 星 2） =================
// 每首都有自己的打擊節奏型（patterns）：演歌的長音、藍調的搖擺、探戈的 3-3-2、騷莎的克拉維、硬核的四拍大鼓
// ---------- 港町屋台演歌（演歌，A 小調四七拔き音階） ----------
const ENKA = {
  CHORD: [[57, 60, 64], [57, 62, 65], [56, 59, 62, 64], [57, 60, 64], [57, 60, 65], [55, 59, 62], [56, 59, 62, 64], [57, 60, 64]],
  ROOT: [45, 50, 40, 45, 41, 43, 40, 45],
  MEL: [
    [76, null, null, 77, 76, null, 72, null], [71, null, 72, null, 69, null, null, null],
    [72, null, null, 76, 77, null, 81, null], [80, null, null, null, 76, null, null, null],
    [77, null, null, 76, 72, null, 76, null], [74, null, 72, null, 71, null, null, null],
    [72, null, 71, null, 69, null, 68, null], [69, null, null, null, null, null, null, null],
  ],
};
// ---------- 夜更けブルース（8 小節藍調，E 調、搖擺） ----------
const BLUES = {
  CHORD: [[52, 56, 59, 62], [52, 56, 59, 62], [57, 61, 64, 67], [57, 61, 64, 67], [52, 56, 59, 62], [59, 63, 66, 69], [57, 61, 64, 67], [52, 56, 59, 62]],
  ROOT: [40, 40, 45, 45, 40, 47, 45, 40],
  WALK: [0, 4, 7, 9],   // 每拍：根音、三度、五度、六度
  MEL: [
    [76, null, 74, 76, null, null, 71, null], [74, null, 71, null, 69, null, 67, null],
    [69, null, null, 72, 69, null, 67, null], [64, null, 67, null, 69, 70, 71, null],
    [76, null, 79, null, 76, null, 74, null], [75, null, 74, null, 71, null, null, null],
    [73, null, 71, null, 69, null, 67, null], [64, null, null, null, null, null, null, null],
  ],
};
// ---------- 鉄板ポルカ（波卡，C 大調、碰—恰） ----------
const POLKA = {
  CHORD: [[60, 64, 67], [59, 62, 65, 67], [60, 64, 67], [60, 64, 67], [60, 65, 69], [60, 64, 67], [59, 62, 65, 67], [60, 64, 67]],
  ROOT: [36, 43, 36, 36, 41, 36, 43, 36],
  MEL: [
    [72, 76, 79, null, 79, null, 76, null], [74, 77, 79, null, 77, null, 74, null],
    [72, 76, 79, 84, 79, null, 76, null], [74, null, 72, null, 72, null, null, null],
    [77, null, 81, null, 79, null, 77, null], [76, null, 79, null, 77, null, 76, null],
    [74, null, 76, null, 77, null, 74, 71], [72, null, null, null, null, null, null, null],
  ],
};
// ---------- 夜霧のタンゴ（阿根廷探戈，D 小調、3-3-2） ----------
const TANGO = {
  CHORD: [[62, 65, 69], [61, 64, 67, 69], [62, 65, 69], [62, 65, 69], [62, 67, 70], [62, 65, 69], [61, 64, 67], [62, 65, 69]],
  ROOT: [38, 45, 38, 38, 43, 38, 45, 38],
  MEL: [
    [74, null, null, 76, 77, null, 74, null], [73, null, null, null, 69, null, null, null],
    [74, null, null, 76, 77, null, 81, null], [81, null, 79, 77, 76, null, null, null],
    [79, null, null, 77, 76, null, 74, null], [77, null, null, 76, 74, null, 72, null],
    [73, null, 74, null, 76, null, 73, null], [74, null, null, null, null, null, null, null],
  ],
};
// ---------- ケルト屋台リール（愛爾蘭里爾舞，D 大調、連續八分音符） ----------
const CELTIC = {
  CHORD: [[62, 66, 69], [62, 67, 71], [62, 66, 69], [61, 64, 69], [62, 66, 69], [62, 67, 71], [61, 64, 69], [62, 66, 69]],
  ROOT: [38, 43, 38, 45, 38, 43, 45, 38],
  MEL: [
    [74, 76, 78, 74, 81, 78, 74, 78], [79, 78, 79, 81, 83, 79, 78, 76],
    [74, 76, 78, 74, 81, 78, 74, 78], [76, 74, 73, 71, 69, 71, 73, 76],
    [78, 81, 83, 81, 78, 76, 74, 76], [79, 81, 83, 86, 83, 81, 79, 78],
    [76, 78, 79, 76, 73, 76, 74, 73], [74, null, null, null, 74, null, null, null],
  ],
};
// ---------- バングラ鉄板（旁遮普舞曲，G 混合利地亞、多爾鼓 chaal 節奏） ----------
const BHANGRA = {
  CHORD: [[55, 59, 62], [55, 59, 62], [53, 57, 60], [55, 59, 62], [55, 59, 62], [55, 59, 62], [53, 57, 60], [55, 59, 62]],
  ROOT: [43, 43, 41, 43, 43, 43, 41, 43],
  DHOL: [[0, false], [1, true], [2, true], [3, false], [4, false], [5, true], [6, true], [7, false]],   // chaal：低—答答—低低—答答—低
  MEL: [
    [79, null, 79, 81, 79, null, 77, null], [74, null, 77, null, 79, null, null, null],
    [79, null, 79, 81, 83, null, 81, 79], [77, null, 74, null, 72, null, null, null],
    [86, null, 84, null, 83, 81, 79, null], [81, null, 79, null, 77, null, 79, null],
    [77, 79, 81, null, 79, null, 77, 74], [79, null, null, null, null, null, null, null],
  ],
};
// ---------- サルサ・デ・テッパン（騷莎，C 大調、3-2 克拉維） ----------
const SALSA = {
  CHORD: [[60, 64, 67], [60, 65, 69], [59, 62, 65, 67], [60, 65, 69], [60, 64, 67], [60, 65, 69], [59, 62, 65, 67], [60, 64, 67]],
  ROOT: [36, 41, 43, 41, 36, 41, 43, 36],
  CLAVE: [[0, 3, 6], [2, 4]],   // 3-2 克拉維（兩小節一組）
  MEL: [
    [72, null, 74, 76, null, 79, null, 76], [77, null, 76, 74, null, 72, null, null],
    [71, null, 74, 77, null, 79, null, 77], [76, null, 74, 72, null, 69, null, null],
    [72, null, 74, 76, null, 79, null, 81], [81, null, 79, 77, null, 76, null, null],
    [74, null, 77, 79, null, 83, null, 79], [84, null, null, null, null, null, null, null],
  ],
};
// ---------- フラメンコ鉄板ルンバ（佛朗明哥倫巴，A 弗里吉亞、安達魯西亞終止） ----------
const FLAMENCO = {
  CHORD: [[57, 60, 64, 69], [55, 59, 62, 67], [53, 57, 60, 65], [52, 56, 59, 64], [57, 60, 64, 69], [55, 59, 62, 67], [53, 57, 60, 65], [52, 56, 59, 64]],
  ROOT: [45, 43, 41, 40, 45, 43, 41, 40],
  STRUM: [[0, 1, false], [1, 0.4, true], [2, 0.5, true], [3, 0.9, false], [4, 0.4, true], [5, 0.5, true], [6, 0.9, false], [7, 0.4, true]],   // 3-3-2 重音；true = 悶音刷
  MEL: [
    [76, 77, 76, 74, 72, null, 74, 72], [71, null, 74, null, 71, 69, 67, null],
    [69, 71, 72, 74, 72, 71, 69, null], [68, null, 69, null, 71, null, null, null],
    [81, 82, 81, 79, 77, null, 79, 77], [76, null, 79, null, 76, 74, 72, null],
    [77, 76, 74, 72, 74, 72, 71, 69], [68, null, null, null, null, null, null, null],
  ],
};
// ---------- ガバ鉄板ハードコア（Gabber 硬核電音，A 小調） ----------
const GABBER = {
  CHORD: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
  ROOT: [45, 41, 48, 43, 45, 41, 43, 40],
  MEL: [
    // 硬核的同音連發（碰碰—碰—碰）＋半音往下溜，最後用 E 大和弦往上衝
    [81, 81, null, 81, null, 81, 80, null], [77, null, null, 77, null, 77, 76, null],
    [79, 79, null, 79, null, 79, 77, null], [74, null, 76, null, 77, null, 79, null],
    [84, 84, null, 84, null, 83, 81, null], [81, null, 77, null, 81, null, 84, null],
    [86, null, 84, null, 83, null, 79, null], [76, null, 80, null, 83, null, 88, null],
  ],
};

SONGS.push(
  {
    id: 'enka', title: '港町屋台演歌', stars: 1, color: '#e07aa0',
    sub: { zh: '港町屋台演歌', ja: 'Harbor Yatai Enka', en: 'Harbor Yatai Enka' },
    genre: { zh: '演歌・尺八・弦樂', ja: '演歌', en: 'Enka Ballad' },
    sections: [{ bpm: 72, lv: [0] }, { bpm: 78, lv: [0] }, { bpm: 84, lv: [0, 1] }, { bpm: 90, lv: [1] }, { bpm: 96, lv: [1, 2] }],
    patterns: [   // 長音為主，重音在第 1、3 拍
      [[0, 2], [0], [2], [0, 3]],
      [[0, 2, 3], [0, 1, 2], [0, 2, 2.5], [0, 3, 3.5]],
      [[0, 1, 2, 3], [0, 1.5, 2, 3], [0, 2, 2.5, 3]],
    ],
    arrange(ms, add) {
      const E = ENKA, mi = ms.idx % 8, ch = E.CHORD[mi], r = E.ROOT[mi], rest = ms.kind === 'rest';
      add(ms.at(0), (x, d) => ch.forEach(n => SND.strings(x, n, ms.bd * 3.8, 0.9, d)));
      [[0, 0], [4, 7]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.walk(x, r + k, ms.bd * 1.7, 1, d)));
      if (ms.sec >= 1) [1, 3, 5, 7].forEach((s, i) => add(ms.at(s), (x, d) => SND.koto(x, ch[i % ch.length] + 12, 0.7, d)));   // 琴的分散和弦
      add(ms.at(0), (x, d) => SND.kick(x, 0.45, d));
      if (ms.sec >= 2) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.3, d)));
      if (ms.sec >= 3) for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.shaker(x, s % 2 ? 0.5 : 0.3, d));
      if (rest) [0, 1, 2, 3, 4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.koto(x, 81 - s * 2, 0.6, d)));   // 琴往下刷
      melody(E.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.shaku(x, n, dur, 1.5, d);
        if (ms.sec >= 4) SND.strings(x, n - 12, dur, 0.8, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { [57, 60, 64, 69].forEach(n => SND.strings(x, n, 2.6, 1, d)); SND.shaku(x, 81, 2.2, 1.5, d); SND.walk(x, 45, 2, 1, d); SND.don(x, 0.5, d); });
      [81, 76, 72, 69].forEach((n, i) => add(ms.at(2 + i), (x, d) => SND.koto(x, n, 0.7, d)));
    },
  },
  {
    id: 'blues', title: '夜更けブルース', stars: 1, color: '#5a8adf', swing: 0.66,
    sub: { zh: '深夜藍調', ja: 'Late Night Blues', en: 'Late Night Blues' },
    genre: { zh: '藍調・風琴・吉他', ja: 'ブルース', en: 'Shuffle Blues' },
    sections: [{ bpm: 76, lv: [0] }, { bpm: 82, lv: [0] }, { bpm: 88, lv: [0, 1] }, { bpm: 94, lv: [1] }, { bpm: 100, lv: [1, 2] }],
    patterns: [   // 搖擺的反拍（.5 落在三連音的後面）
      [[0, 2], [0], [0, 3], [2, 3]],
      [[0, 1.5, 2], [0, 2, 3.5], [0, 1, 2], [1.5, 2, 3]],
      [[0, 1.5, 2, 3.5], [0, 1, 1.5, 3], [0, 1.5, 2, 3]],
    ],
    arrange(ms, add) {
      const B = BLUES, mi = ms.idx % 8, ch = B.CHORD[mi], r = B.ROOT[mi], rest = ms.kind === 'rest';
      add(ms.at(0), (x, d) => SND.organ(x, ch, ms.bd * 3.6, 0.9, d));
      B.WALK.forEach((k, i) => add(ms.at(i * 2), (x, d) => SND.walk(x, r + k, ms.bd * 0.9, 1.1, d)));   // 搖擺的走路低音
      [0, 4].forEach(s => add(ms.at(s), (x, d) => SND.kick(x, 0.5, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.4, d)));
      if (ms.sec >= 1) for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.ride(x, s % 2 ? 0.5 : 0.8, d));
      if (ms.sec >= 2) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.piano(x, ch.map(n => n + 12), 0.5, d, 0.2)));
      if (rest) [4, 5, 6, 7].forEach((s, i) => add(ms.at(s), (x, d) => SND.glead(x, [71, 70, 69, 68][i], ms.sd, 1, d)));   // 半音往下的過門
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.glead(x, n, dur, 1.3, d);
        if (ms.sec >= 4) SND.organ(x, [n - 12], dur, 0.8, d);
      });
    },
    outro(ms, add) {
      [76, 75, 74, 73].forEach((n, i) => add(ms.at(i), (x, d) => SND.glead(x, n, ms.sd, 1.2, d)));
      add(ms.at(4), (x, d) => { SND.organ(x, [52, 56, 59, 62, 66], 1.8, 1, d); SND.glead(x, 76, 1.6, 1.2, d); SND.walk(x, 40, 1.6, 1, d); SND.crash(x, 0.6, d); });
    },
  },
  {
    id: 'polka', title: '鉄板ポルカ', stars: 2, color: '#ff7a7a',
    sub: { zh: '鐵板波卡', ja: 'Teppan Polka', en: 'Teppan Polka' },
    genre: { zh: '波卡・手風琴・低音號', ja: 'ポルカ', en: 'Accordion Polka' },
    sections: [{ bpm: 104, lv: [0] }, { bpm: 110, lv: [0, 1] }, { bpm: 116, lv: [1] }, { bpm: 124, lv: [1, 2] }, { bpm: 130, lv: [2] }, { bpm: 136, lv: [2, 3] }],
    patterns: [   // 碰—恰：反拍的「恰」也要打
      [[0, 2], [2], [0, 1], [1, 3]],
      [[0, 1, 3], [1, 3], [0, 1, 2], [0, 2, 3]],
      [[0, 1, 2, 3], [0, 0.5, 1, 3], [1, 2, 2.5, 3]],
      [[0, 0.5, 1, 2, 3], [0, 1, 1.5, 2, 3], [0, 1, 2, 2.5, 3]],
    ],
    arrange(ms, add) {
      const P = POLKA, mi = ms.idx % 8, ch = P.CHORD[mi], r = P.ROOT[mi], rest = ms.kind === 'rest';
      [[0, 0], [4, 7]].forEach(([s, k]) => add(ms.at(s), (x, d) => { SND.tuba(x, r + k, ms.bd * 0.8, 1.5, d); SND.kick(x, 0.6, d); }));   // 碰
      [2, 6].forEach(s => add(ms.at(s), (x, d) => { SND.accordion(x, ch, ms.bd * 0.5, 1.3, d); SND.snare(x, 0.45, d); }));            // 恰
      if (ms.sec >= 2) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.hat(x, 0.5, d)));
      if (ms.sec >= 3) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.tamb(x, 0.8, d)));
      if (rest) [4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.3 + s * 0.05, d)));
      melody(P.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.accordion(x, [n], dur, 2, d);
        if (ms.sec >= 2) SND.clarinet(x, n + 12, dur, 0.7, d);
        if (ms.sec >= 4) SND.trumpet(x, n - 12, dur, 1, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.accordion(x, [67, 72, 76], 0.2, 1.2, d); SND.tuba(x, 43, 0.3, 1.2, d); });
      add(ms.at(2), (x, d) => { SND.accordion(x, [72, 76, 79, 84], 1.2, 1.4, d); SND.tuba(x, 36, 1.2, 1.3, d); SND.kick(x, 0.8, d); SND.crash(x, 0.6, d); });
    },
  },
  {
    id: 'tango', title: '夜霧のタンゴ', stars: 2, color: '#d83a5a',
    sub: { zh: '夜霧探戈', ja: 'Night Mist Tango', en: 'Night Mist Tango' },
    genre: { zh: '阿根廷探戈・班多鈕', ja: 'アルゼンチン・タンゴ', en: 'Argentine Tango' },
    sections: [{ bpm: 100, lv: [0] }, { bpm: 106, lv: [0, 1] }, { bpm: 112, lv: [1] }, { bpm: 118, lv: [1, 2] }, { bpm: 126, lv: [2] }, { bpm: 132, lv: [2, 3] }],
    patterns: [   // 3-3-2：第 1 拍、第 2 拍半、第 4 拍
      [[0, 3], [0], [0, 1.5], [3]],
      [[0, 1.5, 3], [0, 2], [0, 1.5, 2], [1.5, 3]],
      [[0, 1.5, 3], [0, 1, 1.5, 3], [0, 1.5, 2, 3]],
      [[0, 1.5, 2, 3, 3.5], [0, 0.5, 1.5, 3], [0, 1, 1.5, 2.5, 3]],
    ],
    arrange(ms, add) {
      const T = TANGO, mi = ms.idx % 8, ch = T.CHORD[mi], r = T.ROOT[mi], rest = ms.kind === 'rest';
      [0, 3, 6].forEach((s, i) => add(ms.at(s), (x, d) => { SND.walk(x, r + [0, 7, 12][i], ms.sd * 1.4, 1.5, d); SND.piano(x, ch, 1.1, d, 0.25); }));   // 3-3-2
      if (ms.sec >= 1) [0, 2, 4, 6].forEach(s => add(ms.at(s), (x, d) => ch.forEach(n => SND.strings(x, n, ms.sd * 0.5, 0.7, d))));   // 弦樂斷奏 marcato
      add(ms.at(0), (x, d) => SND.kick(x, 0.45, d));
      if (ms.sec >= 2) [3, 6].forEach(s => add(ms.at(s), (x, d) => SND.rim(x, 0.6, d)));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); [4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.piano(x, [r + 12, r + 24], 0.8, d, 0.15))); }
      melody(T.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.accordion(x, [n, n - 12], dur, 1.6, d);   // 班多鈕（兩個八度一起）
        if (ms.sec >= 3) SND.strings(x, n, dur, 0.9, d);
      });
    },
    outro(ms, add) {
      add(ms.at(0), (x, d) => { SND.accordion(x, [61, 64, 69], 0.4, 1.2, d); SND.walk(x, 45, 0.4, 1.2, d); });
      add(ms.at(3), (x, d) => { SND.accordion(x, [62, 65, 69, 74], 0.25, 1.4, d); SND.piano(x, [38, 50, 62], 1, d, 0.3); SND.walk(x, 38, 0.3, 1.3, d); SND.kick(x, 0.7, d); });
    },
  },
  {
    id: 'celtic', title: 'ケルト屋台リール', stars: 3, color: '#4ac07a',
    sub: { zh: '凱爾特屋台里爾舞', ja: 'Celtic Yatai Reel', en: 'Celtic Yatai Reel' },
    genre: { zh: '愛爾蘭・小提琴・錫笛', ja: 'アイリッシュ', en: 'Irish Fiddle & Whistle' },
    sections: [{ bpm: 112, lv: [1] }, { bpm: 118, lv: [1] }, { bpm: 124, lv: [1, 2] }, { bpm: 132, lv: [2] }, { bpm: 140, lv: [2, 3] }, { bpm: 148, lv: [3] }],
    patterns: [   // 一路往前跑的八分音符
      null,
      [[0, 2], [0, 1, 2], [0, 2, 3], [0, 2, 2.5]],
      [[0, 1, 2, 3], [0, 0.5, 2], [0, 2, 2.5, 3], [0, 1, 2]],
      [[0, 0.5, 1, 2, 3], [0, 1, 2, 2.5, 3], [0, 0.5, 2, 3], [0, 1, 1.5, 2]],
    ],
    arrange(ms, add) {
      const C = CELTIC, mi = ms.idx % 8, ch = C.CHORD[mi], r = C.ROOT[mi], rest = ms.kind === 'rest';
      // 寶思蘭鼓（低音每拍＋反拍輕敲）
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => (s % 2 ? SND.ka(x, 0.25, d) : SND.don(x, s % 4 === 0 ? 0.55 : 0.4, d)));
      // 吉他碰—恰
      [[0, 0.9], [2, 0.6], [3, 0.5], [4, 0.9], [6, 0.6]].forEach(([s, v]) => add(ms.at(s), (x, d) => SND.nylon(x, ch, v * 1.3, d)));
      if (ms.sec >= 1) [[0, 0], [4, 7]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.walk(x, r + k, ms.bd * 1.6, 1, d)));
      if (ms.sec >= 3) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.snare(x, 0.3, d)));
      if (rest) [4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.don(x, 0.4 + s * 0.06, d)));
      melody(C.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.fiddle(x, n, dur, 1.6, d);
        if (ms.sec >= 2) SND.flute(x, n + 12, dur, 0.6, d);   // 錫笛
      });
    },
    outro(ms, add) {
      [74, 78, 81, 86].forEach((n, i) => add(ms.at(i), (x, d) => SND.fiddle(x, n, ms.sd, 1.5, d)));
      add(ms.at(4), (x, d) => { SND.nylon(x, [50, 57, 62, 66, 69, 74], 1.4, d); SND.fiddle(x, 86, 1.4, 1.5, d); SND.flute(x, 86, 1.4, 0.7, d); SND.walk(x, 38, 1.4, 1, d); SND.don(x, 0.8, d); });
    },
  },
  {
    id: 'bhangra', title: 'バングラ鉄板', stars: 3, color: '#ffb020', swing: 0.6,
    sub: { zh: '旁遮普鐵板', ja: 'Bhangra Teppan', en: 'Bhangra Teppan' },
    genre: { zh: '旁遮普舞曲・多爾鼓', ja: 'バングラ', en: 'Punjabi Dhol Beat' },
    sections: [{ bpm: 116, lv: [1] }, { bpm: 122, lv: [1] }, { bpm: 128, lv: [1, 2] }, { bpm: 136, lv: [2] }, { bpm: 144, lv: [2, 3] }, { bpm: 150, lv: [3] }],
    patterns: [   // 多爾鼓的跳躍感（反拍落在搖擺的後半）
      null,
      [[0, 2], [0, 1.5, 2], [0, 3.5], [1.5, 3]],
      [[0, 1.5, 2], [0, 2, 3.5], [0, 1.5, 3], [0, 0.5, 2]],
      [[0, 1.5, 2, 3.5], [0, 0.5, 2, 3.5], [0, 1.5, 2.5, 3], [0, 0.5, 1.5, 2, 3]],
    ],
    arrange(ms, add) {
      const B = BHANGRA, mi = ms.idx % 8, r = B.ROOT[mi], rest = ms.kind === 'rest';
      B.DHOL.forEach(([s, hi]) => add(ms.at(s), (x, d) => SND.dhol(x, hi, hi ? 0.8 : 1, d)));
      [0, 3].forEach(s => add(ms.at(s), (x, d) => SND.b808(x, r - 12, ms.sd * 1.4, 0.9, d)));
      if (ms.sec >= 1) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.clap(x, d)));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.pad(x, B.CHORD[mi], ms.bd * 4, 0.6, d, 'sawtooth'));
      if (ms.sec >= 3) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.tamb(x, 0.6, d)));
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.dhol(x, k % 2 === 1 || k > 11, 0.4 + k * 0.035, d));   // 多爾鼓滾奏
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.tumbi(x, n, dur, 1.6, d);
        if (ms.sec >= 3) SND.flute(x, n - 12, dur, 0.8, d);
      });
    },
    outro(ms, add) {
      [0, 1, 2, 3].forEach(s => add(ms.at(s), (x, d) => SND.dhol(x, s % 2 === 1, 1, d)));
      add(ms.at(4), (x, d) => { SND.dhol(x, false, 1.2, d); SND.tumbi(x, 91, 1, 1.6, d); SND.b808(x, 31, 1.2, 1, d); SND.crash(x, 0.8, d); });
    },
  },
  {
    id: 'salsa', title: 'サルサ・デ・テッパン', stars: 4, color: '#ff5a3a',
    sub: { zh: '鐵板騷莎', ja: 'Salsa de Teppan', en: 'Salsa de Teppan' },
    genre: { zh: '騷莎・康加鼓・銅管', ja: 'サルサ', en: 'Salsa & Brass' },
    sections: [{ bpm: 120, lv: [1] }, { bpm: 126, lv: [1, 2] }, { bpm: 134, lv: [2] }, { bpm: 142, lv: [2, 3] }, { bpm: 150, lv: [3] }, { bpm: 158, lv: [3] }],
    patterns: [   // 跟著克拉維打（第 1 拍、第 2 拍半、第 4 拍…）
      null,
      [[0, 1.5, 3], [1, 2.5], [0, 1.5, 2], [0, 2.5]],
      [[0, 1.5, 2, 3], [0, 1.5, 3], [1, 1.5, 2.5], [0, 1.5, 2.5, 3.5]],
      [[0, 0.5, 1.5, 2, 3], [0, 1.5, 2.5, 3], [0, 1.5, 2, 2.5, 3.5], [0.5, 1, 1.5, 3]],
    ],
    arrange(ms, add) {
      const S = SALSA, mi = ms.idx % 8, ch = S.CHORD[mi], r = S.ROOT[mi], nr = S.ROOT[(mi + 1) % 8], rest = ms.kind === 'rest';
      S.CLAVE[mi % 2].forEach(s => add(ms.at(s), (x, d) => SND.rim(x, 1, d)));
      // 鋼琴 montuno（八度＋和弦交錯）
      [0, 1, 2, 3, 4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.piano(x, s % 2 ? [ch[1] + 12, ch[2] + 12] : [ch[0] + 12, ch[0] + 24], 0.75, d, 0.18)));
      // tumbao 低音：搶拍落在第 2 拍半、第 4 拍（下一個和弦的根音）
      [[3, r], [6, nr]].forEach(([s, n]) => add(ms.at(s), (x, d) => SND.walk(x, n, ms.bd * 1.2, 1.2, d)));
      // 康加鼓
      [[2, true], [3, false], [6, true], [7, false]].forEach(([s, hi]) => add(ms.at(s), (x, d) => SND.conga(x, hi, 0.9, d)));
      if (ms.sec >= 1) [0, 2, 4, 6].forEach(s => add(ms.at(s), (x, d) => SND.agogo(x, s === 0, 0.8, d)));   // 牛鈴
      if (ms.sec >= 2) [3, 6].forEach(s => add(ms.at(s), (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.6, 1, d)));   // 銅管重音
      add(ms.at(0), (x, d) => SND.kick(x, 0.5, d));
      if (rest) [4, 5, 6, 7].forEach(s => add(ms.at(s), (x, d) => SND.conga(x, s % 2 === 0, 1, d)));
      melody(S.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.trumpet(x, n, dur, 1.6, d);
        if (ms.sec >= 3) SND.brass(x, [n - 12], dur, 0.8, d);
      });
    },
    outro(ms, add) {
      [0, 3].forEach(s => add(ms.at(s), (x, d) => { SND.brass(x, [67, 72, 76], ms.sd * 0.6, 1.2, d); SND.conga(x, true, 1, d); }));
      add(ms.at(6), (x, d) => { SND.brass(x, [72, 76, 79, 84], 1.2, 1.3, d); SND.trumpet(x, 84, 1.2, 1.5, d); SND.walk(x, 36, 1.2, 1.2, d); SND.crash(x, 0.8, d); SND.kick(x, 0.8, d); });
    },
  },
  {
    id: 'flamenco', title: 'フラメンコ鉄板ルンバ', stars: 5, color: '#ff3a3a',
    sub: { zh: '佛朗明哥鐵板倫巴', ja: 'Flamenco Teppan Rumba', en: 'Flamenco Teppan Rumba' },
    genre: { zh: '佛朗明哥・吉他・拍手', ja: 'フラメンコ', en: 'Flamenco Rumba' },
    sections: [{ bpm: 144, lv: [2] }, { bpm: 150, lv: [2, 3] }, { bpm: 156, lv: [3] }, { bpm: 162, lv: [3] }, { bpm: 168, lv: [3] }, { bpm: 176, lv: [3] }],
    patterns: [   // 3-3-2 的刷弦重音
      null, null,
      [[0, 1.5, 3], [0, 1.5, 2, 3], [0, 1, 1.5, 3], [0, 3]],
      [[0, 0.5, 1.5, 3], [0, 1.5, 2, 3, 3.5], [0, 1, 1.5, 3], [0, 0.5, 1.5, 2, 3]],
    ],
    arrange(ms, add) {
      const F = FLAMENCO, mi = ms.idx % 8, ch = F.CHORD[mi], r = F.ROOT[mi], rest = ms.kind === 'rest';
      // 倫巴刷弦：重音放開、其他悶音（拍弦）
      F.STRUM.forEach(([s, v, mute]) => add(ms.at(s), (x, d) => (mute ? SND.scratch(x, v * 1.4, d) : SND.nylon(x, ch, v * 1.7, d))));
      [0, 3, 6].forEach(s => add(ms.at(s), (x, d) => SND.cajon(x, false, 0.9, d)));
      [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.cajon(x, true, 0.8, d)));
      [[0, 0], [3, 7], [6, 0]].forEach(([s, k]) => add(ms.at(s), (x, d) => SND.walk(x, r + k, ms.sd * 1.3, 1, d)));
      if (ms.sec >= 1) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.palmas(x, 1, d)));
      if (ms.sec >= 2) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.palmas(x, 0.55, d)));   // 反拍拍手（contratiempo）
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.nylon(x, ch, 0.5 + k * 0.05, d));   // 輪指刷弦（rasgueado）
      melody(F.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.nylon(x, [n], 2.2, d);
        if (ms.sec >= 3) SND.strings(x, n, dur, 0.8, d);
        if (ms.sec >= 4) SND.nylon(x, [n - 12], 1.2, d);
      });
    },
    outro(ms, add) {
      for (let k = 0; k < 8; k++) add(t16(ms, k), (x, d) => SND.nylon(x, [52, 56, 59, 64], 0.6 + k * 0.08, d));
      add(ms.at(4), (x, d) => { SND.nylon(x, [45, 52, 57, 60, 64, 69], 2.2, d); SND.cajon(x, false, 1.2, d); SND.palmas(x, 1.2, d); SND.walk(x, 45, 1.4, 1, d); });
    },
  },
  {
    id: 'gabber', title: 'ガバ鉄板ハードコア', stars: 5, color: '#a0ff3a',
    sub: { zh: '硬核鐵板', ja: 'Gabber Teppan', en: 'Gabber Teppan Hardcore' },
    genre: { zh: '硬核電音（Gabber）', ja: 'ガバ・ハードコア', en: 'Gabber Hardcore' },
    sections: [{ bpm: 150, lv: [2] }, { bpm: 156, lv: [2, 3] }, { bpm: 164, lv: [3] }, { bpm: 170, lv: [3] }, { bpm: 176, lv: [3] }, { bpm: 182, lv: [3] }],
    patterns: [   // 跟著四拍破音大鼓一路敲
      null, null,
      [[0, 1, 2, 3], [0, 2, 2.5], [0, 1, 2], [0, 1, 3]],
      [[0, 0.5, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 2.5], [0, 0.5, 2, 3]],
    ],
    arrange(ms, add) {
      const G = GABBER, mi = ms.idx % 8, ch = G.CHORD[mi], r = G.ROOT[mi], rest = ms.kind === 'rest';
      if (mi === 0) add(ms.at(0), (x, d) => SND.crash(x, 0.9, d));
      if (!rest) [0, 2, 4, 6].forEach(s => add(ms.at(s), (x, d) => SND.gkick(x, 1, d)));   // 四拍破音大鼓
      [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.hat(x, 0.7, d, true)));
      if (ms.sec >= 1) [2, 6].forEach(s => add(ms.at(s), (x, d) => SND.clap(x, d)));
      if (ms.sec >= 2) [1, 3, 5, 7].forEach(s => add(ms.at(s), (x, d) => SND.hoover(x, ch[0], ms.sd * 0.6, 1.1, d)));   // 反拍 hoover 和弦
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.6, d, 'sawtooth'));
      if (rest) {   // 大鼓滾奏＋往上衝
        for (let k = 0; k < 16; k += (k < 8 ? 2 : 1)) add(t16(ms, k), (x, d) => SND.gkick(x, 0.45 + k * 0.03, d));
        add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d));
      }
      melody(G.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.hoover(x, n, dur, 2.2, d);
        if (ms.sec >= 4) SND.supersaw(x, n + 12, dur, 0.5, d);
      });
    },
    outro(ms, add) {
      [0, 1, 2, 3].forEach(s => add(ms.at(s), (x, d) => SND.gkick(x, 1, d)));
      add(ms.at(4), (x, d) => { SND.gkick(x, 1.1, d); SND.crash(x, 1.2, d); SND.hoover(x, 69, 1.6, 1.6, d); SND.hoover(x, 57, 1.6, 1.2, d); SND.sub(x, 33, 1.4, 1, d); });
    },
  },
);

// ================= 各 VOL 追加 10 首（2～5 星；每首自己的曲風與打擊節奏型） =================
// 共用：依星級產生 6 段（BPM 從 b0 漸快到 b1；節奏難度的級數同各集同星級的歌）
const SEC_LV = { 2: [[0], [0, 1], [1], [1, 2], [2], [2, 3]], 3: [[1], [1], [1], [1, 2], [2], [2, 3]], 4: [[1], [1], [1, 2], [2], [2, 3], [3]], 5: [[2], [2], [2, 3], [3], [3], [3]] };
const secs = (stars, b0, b1) => SEC_LV[stars].map((lv, i) => ({ bpm: Math.round(b0 + (b1 - b0) * i / 5), lv }));
// 共用的打擊節奏型（每首挑一種手感）：BACK 反拍 2、4 拍／SYNC 切分／RUN 八分音符奔跑／OFF 反拍／HALF 半速／DRIVE 一路衝
const PT = {
  BACK: [[[1, 3], [0, 2], [1], [3]], [[0, 1, 3], [1, 2, 3], [1, 3, 3.5], [0, 1, 2]], [[0, 1, 2, 3], [1, 1.5, 3], [0, 1, 3, 3.5], [1, 2, 3, 3.5]], [[0, 1, 1.5, 3, 3.5], [0, 1, 2, 3, 3.5], [0.5, 1, 2, 3]]],
  SYNC: [[[0, 2], [0, 1.5], [2, 3.5], [0, 3]], [[0, 1.5, 2], [0, 1, 2.5], [1.5, 2, 3], [0, 1.5, 3]], [[0, 1.5, 2, 3.5], [0, 0.5, 1.5, 3], [0, 1, 1.5, 2.5]], [[0, 0.5, 1.5, 2, 3.5], [0, 1.5, 2, 3.5], [0, 0.5, 1.5, 3, 3.5], [0, 1.5, 2.5, 3]]],
  RUN: [[[0, 2], [0, 1, 2], [2, 3], [0, 3]], [[0, 1, 2], [0, 2, 2.5], [0, 0.5, 2], [1, 2, 3]], [[0, 1, 2, 3], [0, 0.5, 1, 2], [0, 2, 2.5, 3], [0, 1, 2, 2.5]], [[0, 0.5, 1, 2, 3], [0, 1, 2, 3], [0, 1, 1.5, 2, 3], [0, 0.5, 2, 3]]],
  OFF: [[[0.5, 2.5], [0, 2.5], [1.5, 3.5], [0, 1.5]], [[0.5, 1.5, 2.5], [0, 1.5, 3], [0.5, 2, 2.5], [0, 2.5, 3.5]], [[0.5, 1.5, 2.5, 3.5], [0, 0.5, 1.5, 2.5], [0, 1.5, 2, 3.5]], [[0, 0.5, 1.5, 2.5, 3.5], [0.5, 1.5, 2.5, 3.5], [0, 0.5, 1.5, 2, 3.5], [0, 1.5, 2, 3.5]]],
  HALF: [[[0], [0, 2], [2], [0, 3]], [[0, 2, 3], [0, 1.5, 2], [0, 2.5]], [[0, 1.5, 2, 3], [0, 0.5, 2, 3.5], [0, 2, 2.5, 3]], [[0, 0.5, 1.5, 2, 3], [0, 1.5, 2, 2.5, 3.5], [0, 0.5, 2, 3, 3.5]]],
  DRIVE: [null, [[0, 1, 2, 3], [0, 2, 3], [0, 1, 2]], [[0, 1, 2, 3, 3.5], [0, 0.5, 1, 2, 3], [0, 1, 2, 2.5, 3]], [[0, 0.5, 1, 2, 3], [0, 1, 2, 3], [0, 1, 1.5, 2, 3], [0, 1, 2, 3.5]]],
};
// 在小節的第 s 個八分音符（陣列）上排同一個聲音
const beatAt = (ms, add, steps, fn) => steps.forEach(s => add(ms.at(s), (x, d) => fn(x, d, s)));
// 每小節共用的過門：rest 小節最後兩拍小鼓漸強
const fillSnare = (ms, add) => { for (let k = 8; k < 16; k++) add(t16(ms, k), (x, d) => SND.snare(x, 0.2 + k * 0.03, d)); };

// ---------------- VOL.1 追加 ----------------
const SOUL = {   // C 大調 I-IV-ii-V（Motown）；旋律開頭跳五度、句尾停在屬音（下一圈再解決）
  CHORD: [[60, 64, 67], [60, 65, 69], [62, 65, 69, 72], [59, 62, 65, 67], [60, 64, 67], [60, 65, 69], [57, 60, 64], [55, 59, 62, 65]],
  ROOT: [48, 41, 38, 43, 48, 41, 45, 43],
  MEL: [[67, 72, null, 72, 74, null, 76, null], [77, null, 76, 77, 81, null, null, null], [77, null, 74, null, 72, 74, null, null], [71, null, 74, null, 79, null, null, null],
    [67, 72, null, 72, 74, null, 76, 79], [81, null, 79, null, 77, null, 76, null], [76, null, 72, null, 69, null, 72, null], [74, null, 71, null, 67, null, null, null]],
};
const BOOMBAP = {   // A 小調 Am7-Dm7
  CHORD: [[57, 60, 64, 67], [57, 60, 64, 67], [62, 65, 69, 72], [62, 65, 69, 72], [57, 60, 64, 67], [57, 60, 64, 67], [55, 59, 62, 65], [52, 56, 59, 62]],
  ROOT: [45, 45, 50, 50, 45, 45, 43, 40],
  // 爵士取樣般的短樂句：前半句、休息、後半句往下（兩小節一問一答）
  MEL: [[69, null, 72, 74, null, 72, null, null], [null, null, 76, null, 74, 72, 69, null], [74, null, 77, 79, null, 77, null, null], [null, null, 81, null, 79, 77, 74, null],
    [81, null, null, 79, null, null, 76, null], [null, 76, 74, null, 72, null, null, null], [71, null, 74, null, 77, null, 79, null], [80, null, null, null, 76, null, null, null]],
};
const GOSPEL = {   // F 大調（12/8 的搖擺手拍）
  CHORD: [[57, 60, 65], [58, 62, 65], [57, 60, 65], [60, 64, 67, 70], [57, 60, 65], [58, 62, 65], [60, 64, 67], [57, 60, 65]],
  ROOT: [41, 46, 41, 48, 41, 46, 48, 41],
  MEL: [[69, null, 72, null, 74, null, 72, null], [74, null, 77, null, 74, null, null, null], [72, null, 69, null, 67, null, 65, null], [67, null, null, null, 64, null, null, null],
    [69, null, 72, null, 77, null, 76, null], [74, null, 72, null, 74, null, 77, null], [76, null, 74, null, 72, null, 70, null], [69, null, null, null, null, null, null, null]],
};
const AFRO = {   // D 多利安（一個和弦的循環）
  CHORD: [[62, 65, 69, 72], [62, 65, 69, 72], [67, 71, 74], [62, 65, 69, 72], [62, 65, 69, 72], [62, 65, 69, 72], [67, 71, 74], [64, 67, 71]],
  ROOT: [38, 38, 43, 38, 38, 38, 43, 40],
  BASS: [0, null, null, 0, null, 7, 10, null],   // 切分的低音
  // 銅管的短促 riff（同音兩下＋切分），五聲音階
  MEL: [[74, 74, null, 77, null, 74, null, null], [null, 72, null, 69, 72, null, 74, null], [74, 74, null, 77, null, 79, null, null], [null, 81, null, 79, 77, null, 74, null],
    [86, null, null, 84, null, 81, null, 79], [81, null, 79, null, 77, null, null, null], [79, 79, null, 81, null, 84, null, 81], [79, null, null, null, 76, null, null, null]],
};
const KPOP = {   // F# 小調（流行舞曲）
  CHORD: [[57, 61, 66], [57, 62, 66], [57, 61, 64], [56, 59, 64], [57, 61, 66], [57, 62, 66], [56, 61, 64], [56, 59, 63]],
  ROOT: [42, 38, 45, 40, 42, 38, 40, 44],
  MEL: [[78, null, 78, 76, null, 73, null, 76], [74, null, 73, null, 71, null, 73, null], [76, null, 76, 78, null, 81, null, 78], [76, null, null, null, 71, null, null, null],
    [81, null, 80, 78, null, 76, 78, null], [81, null, 83, null, 81, null, 78, null], [76, 78, 80, null, 78, null, 76, null], [78, null, null, null, null, null, null, null]],
};
const TRANCE = {   // A 小調（Am-F-C-G）
  CHORD: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],
  ROOT: [45, 41, 48, 43, 45, 41, 48, 43],
  MEL: [[76, null, null, 76, 79, null, 76, null], [77, null, null, 77, 76, null, 72, null], [79, null, null, 79, 84, null, 79, null], [79, null, 77, null, 74, null, null, null],
    [81, null, null, 81, 84, null, 81, null], [81, null, 79, null, 77, null, 76, null], [76, null, 79, null, 84, null, 83, null], [81, null, null, null, null, null, null, null]],
};
const ESWING = {   // D 小調（搖擺爵士＋四拍大鼓）
  CHORD: [[62, 65, 69], [62, 65, 69], [58, 62, 65], [57, 61, 64, 67], [62, 65, 69], [62, 65, 69], [55, 58, 62], [57, 61, 64, 67]],
  ROOT: [38, 38, 46, 45, 38, 38, 43, 45],
  MEL: [[74, null, 77, null, 74, 73, 74, null], [81, null, 77, null, 74, null, null, null], [70, null, 74, null, 77, 76, 74, null], [73, null, 76, null, 79, null, 76, null],
    [86, null, 84, null, 81, null, 77, null], [74, null, 77, null, 81, null, 79, null], [79, null, 77, null, 74, null, 70, null], [69, null, null, 73, 74, null, null, null]],
};
const BIGBEAT = {   // E 小調（破音低音＋警報主旋律）
  ROOT: [40, 40, 43, 40, 40, 40, 45, 43],
  MEL: [[76, null, 76, null, 79, null, 76, 74], [76, null, null, null, 71, null, null, null], [76, null, 76, null, 79, null, 81, null], [79, null, 78, null, 76, null, null, null],
    [83, null, 81, null, 79, null, 81, 83], [84, null, 83, null, 81, null, 79, null], [78, null, 79, null, 81, null, 83, null], [76, null, null, null, null, null, null, null]],
};
const PUNK = {   // A 大調（強力和弦三和弦循環）
  ROOT: [45, 45, 50, 52, 45, 45, 50, 52],
  MEL: [[76, null, 76, null, 76, 78, 76, null], [73, null, 73, null, 71, null, 69, null], [74, null, 74, null, 74, 76, 78, null], [76, null, null, null, 76, null, null, null],
    [81, null, 81, null, 80, 78, 76, null], [78, null, 78, null, 76, null, 74, null], [73, null, 74, null, 76, null, 78, null], [81, null, null, null, null, null, null, null]],
};

SONGS.push(
  {
    id: 'soul', title: 'ソウル屋台', stars: 2, color: '#e8a050',
    sub: { zh: '靈魂屋台', ja: 'Soul Yatai', en: 'Soul Yatai' }, genre: { zh: '靈魂樂・Motown', ja: 'ソウル', en: 'Motown Soul' },
    sections: secs(2, 100, 132), patterns: PT.BACK,
    arrange(ms, add) {
      const S = SOUL, mi = ms.idx % 8, ch = S.CHORD[mi], r = S.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 4], (x, d) => SND.kick(x, 0.7, d)); beatAt(ms, add, [2, 6], (x, d) => { SND.snare(x, 0.6, d); SND.clap(x, d); });
      beatAt(ms, add, [2, 6], (x, d) => SND.tamb(x, 1, d));
      beatAt(ms, add, [0, 1, 3, 4, 6, 7], (x, d, s) => SND.walk(x, r - 12 + [0, 12, 0, 7, 0, 12, 0, 10][s], ms.sd * 0.9, 1.1, d));   // 忙碌的 Motown 低音
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.organ(x, ch, ms.sd * 0.7, 0.7, d));
      if (ms.sec >= 2) beatAt(ms, add, [3, 7], (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.6, 0.9, d));
      if (rest) fillSnare(ms, add);
      melody(S.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.2, d); if (ms.sec >= 4) SND.sax(x, n - 12, dur, 0.7, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.brass(x, [72, 76, 79, 84], 1.2, 1.2, d); SND.vox(x, 84, 1.2, 1.2, d); SND.walk(x, 36, 1.2, 1.1, d); SND.crash(x, 0.8, d); SND.kick(x, 0.8, d); }); },
  },
  {
    id: 'boombap', title: 'ブーンバップ屋台', stars: 2, color: '#8a7a6a', swing: 0.58,
    sub: { zh: '嘻哈屋台', ja: 'Boom Bap Yatai', en: 'Boom Bap Yatai' }, genre: { zh: '嘻哈・Boom bap', ja: 'ブーンバップ', en: 'Boom Bap Hip-Hop' },
    sections: secs(2, 96, 128), patterns: PT.SYNC,
    arrange(ms, add) {
      const B = BOOMBAP, mi = ms.idx % 8, ch = B.CHORD[mi], r = B.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.kick(x, 0.9, d)); beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.8, d));
      beatAt(ms, add, [0, 1, 2, 3, 4, 5, 6, 7], (x, d, s) => SND.hat(x, s % 2 ? 0.4 : 0.7, d));
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.sub(x, r - 12, ms.sd * 1.2, 1, d));
      add(ms.at(0), (x, d) => SND.epiano(x, ch, 0.8, d, ms.bd * 2)); if (ms.sec >= 1) add(ms.at(4), (x, d) => SND.epiano(x, ch, 0.6, d, ms.bd * 1.5));
      if (ms.sec >= 2 && mi % 2 === 1) add(ms.at(7), (x, d) => SND.scratch(x, 1.2, d));
      if (rest) beatAt(ms, add, [4, 5, 6, 7], (x, d) => SND.scratch(x, 1.3, d));
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => { SND.bell(x, n, 1.1, d); if (ms.sec >= 3) SND.chop(x, n, dur, 0.6, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.epiano(x, [57, 60, 64, 67, 71], 1, d, 1.6); SND.sub(x, 33, 1.4, 1, d); SND.kick(x, 0.9, d); SND.scratch(x, 1.4, d); }); },
  },
  {
    id: 'gospel', title: '鉄板ゴスペル', stars: 2, color: '#f0d070', swing: 0.66,
    sub: { zh: '鐵板福音', ja: 'Teppan Gospel', en: 'Teppan Gospel' }, genre: { zh: '福音合唱・風琴', ja: 'ゴスペル', en: 'Gospel Choir' },
    sections: secs(2, 98, 130), patterns: PT.BACK,
    arrange(ms, add) {
      const G = GOSPEL, mi = ms.idx % 8, ch = G.CHORD[mi], r = G.ROOT[mi], rest = ms.kind === 'rest';
      add(ms.at(0), (x, d) => SND.choir(x, ch, ms.bd * 3.8, 1, d));
      add(ms.at(0), (x, d) => SND.organ(x, ch.map(n => n - 12), ms.bd * 3.6, 0.6, d));
      beatAt(ms, add, [0, 4], (x, d) => SND.walk(x, r - 12, ms.bd * 1.5, 1, d));
      beatAt(ms, add, [2, 6], (x, d) => { SND.clap(x, d); SND.tamb(x, 0.9, d); });
      if (ms.sec >= 1) beatAt(ms, add, [0, 4], (x, d) => SND.kick(x, 0.55, d));
      if (ms.sec >= 2) beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.piano(x, ch.map(n => n + 12), 0.55, d, 0.25));
      if (rest) beatAt(ms, add, [4, 5, 6, 7], (x, d) => SND.clap(x, d));
      melody(G.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.3, d); if (ms.sec >= 4) SND.choir(x, [n + 12], dur, 0.6, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.choir(x, [53, 57, 60, 65, 69], 2.4, 1.3, d); SND.organ(x, [41, 53], 2.2, 0.8, d); SND.vox(x, 77, 2, 1.3, d); }); },
  },
  {
    id: 'afrobeat', title: 'アフロ鉄板ビート', stars: 3, color: '#e85a2a',
    sub: { zh: '非洲鐵板節拍', ja: 'Afro Teppan Beat', en: 'Afro Teppan Beat' }, genre: { zh: '非洲節拍・銅管', ja: 'アフロビート', en: 'Afrobeat' },
    sections: secs(3, 112, 148), patterns: PT.SYNC,
    arrange(ms, add) {
      const F = AFRO, mi = ms.idx % 8, ch = F.CHORD[mi], r = F.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.kick(x, 0.8, d)); beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.5, d));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.shaker(x, s % 2 ? 0.8 : 0.5, d));
      beatAt(ms, add, [0, 2, 3, 5, 6], (x, d, s) => SND.agogo(x, s === 0 || s === 3, 0.8, d));   // 牛鈴的固定型
      F.BASS.forEach((k, s) => { if (k !== null) add(ms.at(s), (x, d) => SND.slap(x, r + k, 1.1, d)); });
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.scratch(x, 0.8, d));   // 吉他刷「切」
      if (ms.sec >= 1) beatAt(ms, add, [0, 4], (x, d) => SND.organ(x, ch, ms.bd * 1.6, 0.6, d));
      if (ms.sec >= 3) beatAt(ms, add, [1, 7], (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.6, 1, d));
      if (rest) fillSnare(ms, add);
      melody(F.MEL[mi], ms, add, (x, n, dur, d) => { SND.sax(x, n, dur, 1.4, d); if (ms.sec >= 2) SND.trumpet(x, n + 12, dur, 0.7, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.brass(x, [62, 65, 69, 74], 1.2, 1.3, d); SND.slap(x, 38, 1.2, d); SND.kick(x, 0.9, d); SND.crash(x, 0.8, d); }); },
  },
  {
    id: 'kpop', title: 'K-POP鉄板ダンス', stars: 4, color: '#ff6ab0',
    sub: { zh: 'K-POP 鐵板舞曲', ja: 'K-Pop Teppan Dance', en: 'K-Pop Teppan Dance' }, genre: { zh: 'K-POP 舞曲', ja: 'K-POP', en: 'K-Pop Dance' },
    sections: secs(4, 122, 160), patterns: PT.OFF,
    arrange(ms, add) {
      const K = KPOP, mi = ms.idx % 8, ch = K.CHORD[mi], r = K.ROOT[mi], rest = ms.kind === 'rest';
      if (!rest) beatAt(ms, add, [0, 2, 4, 6], (x, d) => SND.kick(x, 0.95, d));
      beatAt(ms, add, [2, 6], (x, d) => { SND.clap(x, d); SND.snare(x, 0.4, d); });
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.hat(x, 0.6, d, true));
      beatAt(ms, add, [0, 1, 3, 4, 6], (x, d, s) => SND.synbass(x, r - 12 + (s === 1 || s === 6 ? 12 : 0), ms.sd * 0.8, 1.1, d));
      if (ms.sec >= 1) beatAt(ms, add, [0, 3, 6], (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.5, 0.9, d));   // 合成器銅管 hit
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.6, d, 'sawtooth'));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); fillSnare(ms, add); }
      melody(K.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.2, d); if (ms.sec >= 2) SND.chop(x, n + 12, dur, 0.5, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.brass(x, [66, 69, 73, 78], 1.2, 1.2, d); SND.kick(x, 1, d); SND.crash(x, 1, d); SND.vox(x, 78, 1.2, 1.2, d); SND.synbass(x, 30, 1.2, 1.1, d); }); },
  },
  {
    id: 'trance', title: '夜市トランス', stars: 4, color: '#6ad0ff',
    sub: { zh: '夜市迷幻舞曲', ja: 'Night Market Trance', en: 'Night Market Trance' }, genre: { zh: 'Trance（電音）', ja: 'トランス', en: 'Uplifting Trance' },
    sections: secs(4, 126, 162), patterns: PT.RUN,
    arrange(ms, add) {
      const T = TRANCE, mi = ms.idx % 8, ch = T.CHORD[mi], r = T.ROOT[mi], rest = ms.kind === 'rest';
      if (!rest) beatAt(ms, add, [0, 2, 4, 6], (x, d) => SND.kick(x, 1, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => { SND.sub(x, r - 12, ms.sd * 0.8, 1.1, d); SND.hat(x, 0.6, d, true); });   // 反拍低音
      if (ms.sec >= 1) beatAt(ms, add, [2, 6], (x, d) => SND.clap(x, d));
      if (ms.sec >= 1) for (let i = 0; i < 16; i++) { const n = ch[[0, 1, 2, 1][i % 4]] + 12; add(ms.start + i * ms.bd / 4, (x, d) => SND.pluck(x, n, 0.8, d)); }
      add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.8, d, 'sawtooth'));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); fillSnare(ms, add); }
      melody(T.MEL[mi], ms, add, (x, n, dur, d) => { SND.supersaw(x, n, dur, 1.1, d); if (ms.sec >= 4) SND.supersaw(x, n - 12, dur, 0.5, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.supersaw(x, 81, 1.6, 1.2, d); SND.supersaw(x, 76, 1.6, 0.8, d); SND.pad(x, [57, 60, 64], 2, 1, d, 'sawtooth'); SND.sub(x, 33, 1.4, 1, d); SND.crash(x, 1, d); SND.kick(x, 1, d); }); },
  },
  {
    id: 'eswing', title: 'エレクトロ・スウィング屋台', stars: 4, color: '#d8b04a', swing: 0.64,
    sub: { zh: '電子搖擺屋台', ja: 'Electro Swing Yatai', en: 'Electro Swing Yatai' }, genre: { zh: '電子搖擺', ja: 'エレクトロスウィング', en: 'Electro Swing' },
    sections: secs(4, 118, 156), patterns: PT.SYNC,
    arrange(ms, add) {
      const E = ESWING, mi = ms.idx % 8, ch = E.CHORD[mi], r = E.ROOT[mi], rest = ms.kind === 'rest';
      if (!rest) beatAt(ms, add, [0, 2, 4, 6], (x, d) => SND.kick(x, 0.95, d));
      beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.7, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.ride(x, 0.7, d));
      beatAt(ms, add, [0, 2, 4, 6], (x, d, s) => SND.walk(x, r - 12 + [0, 4, 7, 9][s / 2], ms.bd * 0.9, 1.2, d));   // 走路低音
      beatAt(ms, add, [1, 5], (x, d) => SND.piano(x, ch.map(n => n + 12), 0.7, d, 0.2));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.crackle(x, ms.bd * 4, d));
      if (ms.sec >= 3) beatAt(ms, add, [3, 7], (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.5, 0.9, d));
      if (rest) fillSnare(ms, add);
      melody(E.MEL[mi], ms, add, (x, n, dur, d) => { SND.trumpet(x, n, dur, 1.6, d); if (ms.sec >= 2) SND.clarinet(x, n - 12, dur, 0.9, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.brass(x, [62, 65, 69, 74], 1.3, 1.2, d); SND.trumpet(x, 86, 1.3, 1.5, d); SND.walk(x, 26, 1.2, 1.2, d); SND.crash(x, 0.8, d); }); },
  },
  {
    id: 'bigbeat', title: 'ビッグビート鉄板', stars: 5, color: '#ff4a2a',
    sub: { zh: '大節拍鐵板', ja: 'Big Beat Teppan', en: 'Big Beat Teppan' }, genre: { zh: 'Big beat（碎拍電子）', ja: 'ビッグビート', en: 'Big Beat Breaks' },
    sections: secs(5, 144, 176), patterns: PT.SYNC,
    arrange(ms, add) {
      const B = BIGBEAT, mi = ms.idx % 8, r = B.ROOT[mi], rest = ms.kind === 'rest';
      // 碎拍鼓組（breakbeat）
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.kick(x, 1, d)); beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.9, d)); beatAt(ms, add, [7], (x, d) => SND.snare(x, 0.35, d));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.45 : 0.7, d));
      beatAt(ms, add, [0, 3, 4, 6], (x, d) => SND.dguitar(x, [r - 12, r - 5], ms.sd * 0.9, 0.7, d, { mute: true }));   // 破音低音
      if (ms.sec >= 2 && mi % 4 === 3) add(ms.at(6), (x, d) => SND.scratch(x, 1.5, d));
      if (ms.sec >= 3) beatAt(ms, add, [0, 4], (x, d) => SND.crash(x, 0.4, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); fillSnare(ms, add); }
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => { SND.synlead(x, n, dur, 1.2, d); if (ms.sec >= 4) SND.glead(x, n - 12, dur, 0.6, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.dguitar(x, [28, 35, 40], 1.6, 1.1, d); SND.synlead(x, 88, 1.4, 1.2, d); SND.crash(x, 1.2, d); SND.kick(x, 1, d); }); },
  },
  {
    id: 'punk', title: 'パンク屋台', stars: 5, color: '#ff3a8a',
    sub: { zh: '龐克屋台', ja: 'Punk Yatai', en: 'Punk Yatai' }, genre: { zh: '龐克搖滾', ja: 'パンク', en: 'Punk Rock' },
    sections: secs(5, 150, 182), patterns: PT.DRIVE,
    arrange(ms, add) {
      const P = PUNK, mi = ms.idx % 8, r = P.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 4], (x, d) => SND.kick(x, 1, d)); beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.9, d));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => { SND.hat(x, 0.55, d, s % 2 === 1); SND.dguitar(x, [r, r + 7, r + 12], ms.sd * 0.85, 0.6, d); SND.sub(x, r - 12, ms.sd * 0.8, 0.8, d); });   // 全下刷強力和弦
      if (mi === 0) add(ms.at(0), (x, d) => SND.crash(x, 1, d));
      if (rest) fillSnare(ms, add);
      melody(P.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.3, d); if (ms.sec >= 3) SND.glead(x, n + 12, dur, 0.5, d); });
    },
    outro(ms, add) { [0, 1, 2, 3].forEach(s => add(ms.at(s), (x, d) => { SND.dguitar(x, [45, 52, 57], ms.sd, 0.8, d); SND.snare(x, 0.8, d); })); add(ms.at(4), (x, d) => { SND.dguitar(x, [45, 52, 57, 61], 1.6, 1.1, d); SND.crash(x, 1.2, d); SND.kick(x, 1, d); }); },
  },
);

// ---------------- VOL.2 追加 ----------------
const CALYPSO = {   // F 大調（鋼鼓）
  CHORD: [[57, 60, 65], [58, 62, 65], [60, 64, 67, 70], [57, 60, 65], [57, 60, 65], [58, 62, 65], [60, 64, 67, 70], [57, 60, 65]],
  ROOT: [41, 46, 48, 41, 41, 46, 48, 41],
  MEL: [[77, null, 77, 79, null, 81, 79, null], [77, null, 74, null, 70, null, null, null], [76, null, 76, 77, null, 79, 77, null], [76, null, 72, null, 69, null, null, null],
    [81, null, 81, 82, null, 84, 82, null], [81, null, 77, null, 74, null, 77, null], [79, null, 76, null, 72, null, 76, null], [77, null, null, null, null, null, null, null]],
};
const OKINAWA = {   // 琉球音階（C E F G B）
  CHORD: [[60, 64, 67], [60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
  ROOT: [48, 48, 53, 55, 48, 53, 55, 48],
  MEL: [[72, null, 71, 72, 76, null, 72, null], [71, null, 67, null, 64, null, null, null], [65, null, 67, 71, 72, null, 71, null], [67, null, null, null, 64, null, null, null],
    [76, null, 77, 76, 72, null, 71, null], [72, null, 76, null, 77, null, 79, null], [76, null, 72, null, 71, null, 67, null], [72, null, null, null, null, null, null, null]],
};
const MINYUE = {   // D 宮調五聲音階（D E F# A B）
  CHORD: [[62, 66, 69], [62, 66, 69], [59, 62, 66], [57, 62, 66], [62, 66, 69], [59, 62, 66], [57, 61, 64], [62, 66, 69]],
  ROOT: [38, 38, 47, 45, 38, 47, 45, 38],
  PENT: [62, 64, 66, 69, 71, 74, 76, 78, 81, 83],
  MEL: [[74, null, 76, 78, 81, null, 78, null], [76, null, 74, null, 71, null, null, null], [69, null, 71, 74, 76, null, 74, null], [71, null, 69, null, 66, null, null, null],
    [81, null, 83, 81, 78, null, 76, null], [78, null, 81, null, 83, null, 81, null], [78, null, 76, 74, 71, null, 69, null], [74, null, null, null, null, null, null, null]],
};
const ARABIC = {   // D 庫爾德音階（D Eb F G A Bb C）：長音起句、句中的迴音（turn）裝飾
  ROOT: [38, 38, 46, 38, 43, 46, 38, 38],
  MAQSUM: [[0, false], [1, true], [3, true], [4, false], [6, true]],   // dum tek - tek dum - tek -
  MEL: [[81, null, null, null, 79, 77, 79, null], [77, 75, 77, null, 74, null, null, null], [70, null, 74, null, 77, null, 82, null], [81, 82, 81, 79, 77, null, null, null],
    [79, null, 81, 82, 84, null, 82, 81], [82, null, 79, null, 75, null, 77, null], [74, null, 75, null, 77, 79, 77, 75], [74, null, null, null, null, null, null, null]],
};
const CUMBIA = {   // A 小調（手風琴＋刮瓜）
  CHORD: [[57, 60, 64], [57, 60, 64], [56, 59, 64], [56, 59, 64], [57, 60, 64], [55, 59, 62], [53, 57, 60], [56, 59, 64]],
  ROOT: [45, 45, 40, 40, 45, 43, 41, 40],
  MEL: [[76, null, 76, 74, null, 72, 74, null], [76, null, null, 71, null, null, null, null], [76, null, 76, 77, null, 76, 74, null], [71, null, null, 68, null, null, null, null],
    [81, null, 81, 79, null, 77, 76, null], [79, null, 77, null, 74, null, 71, null], [72, null, 74, null, 76, null, 77, null], [76, null, null, null, null, null, null, null]],
};
const BAROQUE = {   // D 大調（對位的八分音符；大鍵琴）
  CHORD: [[62, 66, 69], [57, 61, 64], [59, 62, 66], [54, 57, 61], [55, 59, 62], [50, 54, 57], [55, 59, 62], [57, 61, 64]],
  ROOT: [50, 45, 47, 42, 43, 38, 43, 45],   // 卡農式的下行低音
  MEL: [[78, 76, 74, 76, 78, 81, 78, 74], [76, 74, 73, 74, 76, 78, 76, 73], [74, 73, 71, 73, 74, 78, 74, 71], [73, 71, 69, 71, 73, 76, 73, 69],
    [71, 69, 67, 69, 71, 74, 71, 67], [69, 67, 66, 67, 69, 74, 69, 66], [67, 69, 71, 74, 76, 74, 71, 67], [69, null, null, null, 73, null, null, null]],
};
const RAGTIME = {   // C 大調（切分的右手＋oom-pah 左手）
  CHORD: [[60, 64, 67], [60, 64, 67], [62, 66, 69, 72], [62, 66, 69, 72], [55, 59, 62, 65], [55, 59, 62, 65], [60, 64, 67], [55, 59, 62, 65]],
  ROOT: [36, 36, 38, 38, 43, 43, 36, 43],
  MEL: [[76, 77, null, 79, null, 76, 72, null], [74, 76, null, 77, null, 74, 72, null], [74, 76, null, 78, null, 81, 78, null], [76, 74, null, 72, null, 69, 66, null],
    [79, 77, null, 74, null, 71, 74, null], [77, 76, null, 74, null, 72, 71, null], [72, 74, null, 76, 79, null, 84, null], [79, null, null, null, null, null, null, null]],
};
const KALINKA = {   // A 小調（越來越快的俄羅斯舞曲）
  CHORD: [[57, 60, 64], [57, 60, 64], [52, 56, 59], [57, 60, 64], [57, 60, 64], [55, 59, 62], [52, 56, 59], [57, 60, 64]],
  ROOT: [45, 45, 40, 45, 45, 43, 40, 45],
  MEL: [[76, 74, 72, 74, 76, null, 76, null], [76, 74, 72, 74, 71, null, 71, null], [76, 74, 72, 74, 76, null, 79, null], [77, 76, 74, 72, 71, null, 69, null],
    [81, null, 79, 77, 76, null, 74, null], [79, null, 77, 76, 74, null, 72, null], [74, 76, 77, 76, 74, 72, 71, null], [69, null, null, null, null, null, null, null]],
};
const BALKAN = {   // G 小調（銅管樂隊）
  CHORD: [[55, 58, 62], [55, 58, 62], [51, 55, 58], [50, 54, 57, 60], [55, 58, 62], [53, 57, 60], [51, 55, 58], [50, 54, 57]],
  ROOT: [43, 43, 39, 38, 43, 41, 39, 38],
  MEL: [[79, 78, 79, 81, 82, null, 79, null], [78, null, 75, null, 74, null, null, null], [79, 78, 79, 81, 82, 84, 82, null], [81, null, 78, null, 74, null, null, null],
    [86, 84, 82, 81, 82, null, 79, null], [81, 79, 77, 75, 77, null, 74, null], [75, 74, 72, null, 70, null, 69, null], [67, null, null, null, null, null, null, null]],
};
const SAMUL = {   // 韓國五聲（太平簫）
  ROOT: [45, 45, 45, 45, 50, 50, 45, 45],
  MEL: [[76, null, 74, 76, 81, null, 79, null], [76, null, 74, null, 72, null, null, null], [76, null, 79, 81, 84, null, 81, null], [79, null, 76, null, 74, null, null, null],
    [84, null, 81, 79, 76, null, 79, null], [81, null, 79, null, 76, null, 74, null], [72, null, 74, null, 76, null, 79, null], [76, null, null, null, null, null, null, null]],
  JANGGU: [[0, 'dong'], [2, 'deok'], [3, 'deok'], [4, 'dong'], [5, 'deok'], [6, 'deok']],   // 長鼓：dong（雙面）／deok（細棒）
};

SONGS.push(
  {
    id: 'calypso', title: 'カリプソ鉄板', stars: 2, color: '#3ad0c0',
    sub: { zh: '鐵板卡利普索', ja: 'Calypso Teppan', en: 'Calypso Teppan' }, genre: { zh: '加勒比海 Calypso・鋼鼓', ja: 'カリプソ', en: 'Caribbean Steel Drum' },
    sections: secs(2, 100, 134), patterns: PT.OFF,
    arrange(ms, add) {
      const C = CALYPSO, mi = ms.idx % 8, ch = C.CHORD[mi], r = C.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 3, 4, 7], (x, d) => SND.kick(x, 0.6, d)); beatAt(ms, add, [2, 6], (x, d) => SND.rim(x, 0.8, d));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.shaker(x, s % 2 ? 0.8 : 0.4, d));
      beatAt(ms, add, [0, 3, 4, 6], (x, d, s) => SND.walk(x, r - 12 + (s === 4 ? 7 : 0), ms.sd * 1.1, 1.1, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.uke(x, ch, 0.9, d, false));
      if (ms.sec >= 2) beatAt(ms, add, [2, 5], (x, d) => SND.conga(x, true, 0.8, d));
      if (rest) beatAt(ms, add, [4, 5, 6, 7], (x, d, s) => SND.steeldrum(x, ch[s % 3] + 12, 1, d));
      melody(C.MEL[mi], ms, add, (x, n, dur, d) => { SND.steeldrum(x, n, 1.8, d); if (ms.sec >= 3) SND.steeldrum(x, n - 12, 0.9, d); });
    },
    outro(ms, add) { [0, 1, 2, 3].forEach(i => add(ms.at(i), (x, d) => SND.steeldrum(x, [77, 81, 84, 89][i], 1.6, d))); add(ms.at(4), (x, d) => { SND.uke(x, [57, 60, 65, 69], 1.2, d); SND.walk(x, 29, 1.2, 1.1, d); }); },
  },
  {
    id: 'okinawa', title: '島唄屋台', stars: 2, color: '#4ab0e0', swing: 0.62,
    sub: { zh: '島唄屋台', ja: 'Shima-uta Yatai', en: 'Okinawan Island Song' }, genre: { zh: '沖繩島唄・三線', ja: '沖縄民謡', en: 'Okinawan Sanshin' },
    sections: secs(2, 98, 132), patterns: PT.SYNC,
    arrange(ms, add) {
      const O = OKINAWA, mi = ms.idx % 8, ch = O.CHORD[mi], r = O.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 4], (x, d) => SND.don(x, 0.6, d)); beatAt(ms, add, [3, 7], (x, d) => SND.ka(x, 0.6, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.wood(x, false, d));   // 三板（響板）
      if (ms.sec >= 1) beatAt(ms, add, [2, 6], (x, d) => SND.clap(x, d));   // 指笛的手拍
      beatAt(ms, add, [0, 4], (x, d) => SND.walk(x, r - 12, ms.bd * 1.4, 1, d));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.5, d));
      if (rest) beatAt(ms, add, [4, 5, 6, 7], (x, d, s) => SND.sanshin(x, [72, 71, 67, 64][s - 4], 1, d));
      melody(O.MEL[mi], ms, add, (x, n, dur, d) => { SND.sanshin(x, n, 1.8, d); if (ms.sec >= 3) SND.flute(x, n + 12, dur, 0.6, d); });
    },
    outro(ms, add) { [72, 76, 79, 84].forEach((n, i) => add(ms.at(i), (x, d) => SND.sanshin(x, n, 1.6, d))); add(ms.at(4), (x, d) => { SND.don(x, 1, d); SND.pad(x, [60, 64, 67], 1.6, 0.8, d); }); },
  },
  {
    id: 'minyue', title: '屋台民楽', stars: 3, color: '#d83a3a',
    sub: { zh: '屋台國樂', ja: 'Yatai Folk Orchestra', en: 'Chinese Folk Orchestra' }, genre: { zh: '中國民樂・二胡・古箏', ja: '中国民楽', en: 'Erhu & Guzheng' },
    sections: secs(3, 112, 148), patterns: PT.RUN,
    arrange(ms, add) {
      const M = MINYUE, mi = ms.idx % 8, ch = M.CHORD[mi], r = M.ROOT[mi], rest = ms.kind === 'rest';
      // 古箏：五聲音階的分散和弦
      for (let s = 0; s < 8; s++) { const n = M.PENT[(s * 2 + mi) % 7] ; add(ms.at(s), (x, d) => SND.koto(x, n, 0.75, d)); }
      beatAt(ms, add, [0, 4], (x, d) => SND.don(x, 0.6, d)); beatAt(ms, add, [2, 6], (x, d) => SND.ka(x, 0.7, d));
      if (ms.sec >= 1) beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.kane(x, 0.5, d));   // 小鈸
      beatAt(ms, add, [0, 4], (x, d) => SND.walk(x, r - 12, ms.bd * 1.5, 1, d));
      if (mi === 7 && ms.sec >= 1) add(ms.at(6), (x, d) => SND.gong(x, 45, 0.6, d));
      if (rest) for (let k = 0; k < 8; k++) add(ms.at(k), (x, d) => SND.koto(x, M.PENT[9 - k], 0.9, d));   // 古箏刮奏
      melody(M.MEL[mi], ms, add, (x, n, dur, d) => { SND.erhu(x, n, dur, 1.6, d); if (ms.sec >= 3) SND.flute(x, n + 12, dur, 0.6, d); });
    },
    outro(ms, add) { for (let k = 0; k < 8; k++) add(t16(ms, k), (x, d) => SND.koto(x, MINYUE.PENT[k + 1], 0.9, d)); add(ms.at(4), (x, d) => { SND.erhu(x, 74, 1.6, 1.6, d); SND.gong(x, 38, 1, d); SND.walk(x, 26, 1.4, 1, d); }); },
  },
  {
    id: 'arabic', title: 'ベリーダンス夜市', stars: 3, color: '#b04ad0',
    sub: { zh: '肚皮舞夜市', ja: 'Belly Dance Bazaar', en: 'Belly Dance Bazaar' }, genre: { zh: '阿拉伯肚皮舞・烏德琴', ja: 'アラビアン', en: 'Arabic Belly Dance' },
    sections: secs(3, 114, 148), patterns: PT.SYNC,
    arrange(ms, add) {
      const Q = ARABIC, mi = ms.idx % 8, r = Q.ROOT[mi], rest = ms.kind === 'rest';
      Q.MAQSUM.forEach(([s, hi]) => add(ms.at(s), (x, d) => SND.darbuka(x, hi, 1, d)));   // 達布卡鼓的 maqsum 節奏
      if (ms.sec >= 1) beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.kane(x, 0.6, d));   // 指鈸
      beatAt(ms, add, [0, 3, 4], (x, d) => SND.oud(x, r - 12, 1.2, d));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.strings(x, r + 12, ms.bd * 3.8, 0.8, d));
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.darbuka(x, k % 4 !== 0, 0.5 + k * 0.03, d));   // 鼓的滾奏
      melody(Q.MEL[mi], ms, add, (x, n, dur, d) => { SND.oud(x, n, 1.5, d); SND.clarinet(x, n, dur, 1, d); });
    },
    outro(ms, add) { [0, 1, 3].forEach(s => add(ms.at(s), (x, d) => SND.darbuka(x, s > 0, 1.1, d))); add(ms.at(4), (x, d) => { SND.oud(x, 50, 1.6, d); SND.clarinet(x, 74, 1.4, 1.2, d); SND.darbuka(x, false, 1.2, d); SND.kane(x, 1, d); }); },
  },
  {
    id: 'cumbia', title: 'クンビア屋台', stars: 3, color: '#5ac04a',
    sub: { zh: '昆比亞屋台', ja: 'Cumbia Yatai', en: 'Cumbia Yatai' }, genre: { zh: 'Cumbia・手風琴・刮瓜', ja: 'クンビア', en: 'Colombian Cumbia' },
    sections: secs(3, 108, 142), patterns: PT.OFF,
    arrange(ms, add) {
      const C = CUMBIA, mi = ms.idx % 8, ch = C.CHORD[mi], r = C.ROOT[mi], rest = ms.kind === 'rest';
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.guiro(x, s % 2 ? 0.6 : 1, d));   // 刮瓜：一直刮
      beatAt(ms, add, [0, 4], (x, d, s) => SND.walk(x, r - 12 + (s ? 7 : 0), ms.bd * 1.2, 1.2, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.accordion(x, ch, ms.sd * 0.6, 0.8, d));
      beatAt(ms, add, [2, 6], (x, d) => SND.conga(x, true, 0.9, d)); beatAt(ms, add, [3, 7], (x, d) => SND.conga(x, false, 0.8, d));
      if (ms.sec >= 2) beatAt(ms, add, [0, 4], (x, d) => SND.kick(x, 0.5, d));
      if (rest) beatAt(ms, add, [4, 5, 6, 7], (x, d) => SND.conga(x, true, 1, d));
      melody(C.MEL[mi], ms, add, (x, n, dur, d) => { SND.accordion(x, [n], dur, 1.8, d); if (ms.sec >= 3) SND.flute(x, n + 12, dur, 0.6, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.accordion(x, [57, 60, 64, 69], 1.2, 1.4, d); SND.walk(x, 33, 1.2, 1.2, d); SND.conga(x, false, 1, d); SND.guiro(x, 1, d); }); },
  },
  {
    id: 'baroque', title: 'バロック鉄板', stars: 4, color: '#c8a070',
    sub: { zh: '巴洛克鐵板', ja: 'Baroque Teppan', en: 'Baroque Teppan' }, genre: { zh: '巴洛克・大鍵琴・弦樂', ja: 'バロック', en: 'Baroque Harpsichord' },
    sections: secs(4, 122, 158), patterns: PT.RUN,
    arrange(ms, add) {
      const B = BAROQUE, mi = ms.idx % 8, ch = B.CHORD[mi], r = B.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 2, 4, 6], (x, d, s) => SND.walk(x, r - 12 + (s === 4 ? 12 : 0), ms.bd * 0.9, 1.6, d));   // 數字低音（大提琴）
      beatAt(ms, add, [0, 4], (x, d) => SND.harpsi(x, ch, 2.2, d));
      if (ms.sec >= 1) add(ms.at(0), (x, d) => ch.forEach(n => SND.strings(x, n, ms.bd * 3.8, 1, d)));
      if (ms.sec >= 3) beatAt(ms, add, [0, 4], (x, d) => SND.don(x, 0.35, d));   // 定音鼓
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.harpsi(x, [ch[k % 3] + 12 + (k >> 2) * 2], 0.8, d));
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => { SND.harpsi(x, [n], 3, d); if (ms.sec >= 2) SND.harpsi(x, [n - 12], 1.5, d); if (ms.sec >= 4) SND.strings(x, n + 12, dur, 0.5, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.harpsi(x, [50, 57, 62, 66, 69, 74], 1.5, d); [62, 66, 69].forEach(n => SND.strings(x, n, 1.8, 0.9, d)); SND.walk(x, 26, 1.6, 1, d); SND.don(x, 0.6, d); }); },
  },
  {
    id: 'ragtime', title: 'ラグタイム屋台', stars: 4, color: '#a07a50',
    sub: { zh: '拉格泰姆屋台', ja: 'Ragtime Yatai', en: 'Ragtime Yatai' }, genre: { zh: 'Ragtime 鋼琴', ja: 'ラグタイム', en: 'Ragtime Piano' },
    sections: secs(4, 120, 156), patterns: PT.SYNC,
    arrange(ms, add) {
      const R = RAGTIME, mi = ms.idx % 8, ch = R.CHORD[mi], r = R.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 4], (x, d, s) => SND.piano(x, [r - 12 + (s ? 7 : 0), r + (s ? 7 : 0)], 3.2, d, 0.3));   // 左手 oom
      beatAt(ms, add, [2, 6], (x, d) => SND.piano(x, ch, 2.5, d, 0.2));                                          // 左手 pah
      if (ms.sec >= 2) { beatAt(ms, add, [0, 4], (x, d) => SND.kick(x, 0.35, d)); beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.3, d)); }
      if (ms.sec >= 3) beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.ride(x, 0.5, d));
      if (rest) beatAt(ms, add, [4, 5, 6, 7], (x, d, s) => SND.piano(x, [ch[s % 3] + 12, ch[s % 3] + 24], 2, d, 0.15));
      melody(R.MEL[mi], ms, add, (x, n, dur, d) => { SND.piano(x, [n, n + 12], 3.6, d, Math.min(0.5, dur)); });
    },
    outro(ms, add) { [0, 1, 2].forEach(s => add(ms.at(s), (x, d) => SND.piano(x, [84 - s * 5, 72 - s * 5], 1.1, d, 0.2))); add(ms.at(4), (x, d) => SND.piano(x, [36, 48, 60, 64, 67, 72], 1.3, d, 1.4)); },
  },
  {
    id: 'kalinka', title: 'カリンカ鉄板', stars: 5, color: '#e8483a',
    sub: { zh: '卡林卡鐵板', ja: 'Kalinka Teppan', en: 'Kalinka Teppan' }, genre: { zh: '俄羅斯民謠・巴拉萊卡', ja: 'ロシア民謡', en: 'Russian Balalaika' },
    sections: secs(5, 140, 180), patterns: PT.RUN,
    arrange(ms, add) {
      const K = KALINKA, mi = ms.idx % 8, ch = K.CHORD[mi], r = K.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 4], (x, d, s) => { SND.tuba(x, r - 12 + (s ? 7 : 0), ms.bd * 0.8, 1.6, d); SND.kick(x, 0.7, d); });
      beatAt(ms, add, [2, 6], (x, d) => { SND.accordion(x, ch, ms.sd * 0.8, 1, d); SND.snare(x, 0.5, d); });
      for (let k = 0; k < 16; k += 2) add(t16(ms, k), (x, d) => SND.banjo(x, ch[(k >> 1) % 3] + 12, 0.9, d));   // 巴拉萊卡快速撥奏
      if (ms.sec >= 2) beatAt(ms, add, [3, 7], (x, d) => SND.clap(x, d));   // 「嘿！」的拍手
      if (rest) fillSnare(ms, add);
      melody(K.MEL[mi], ms, add, (x, n, dur, d) => { SND.accordion(x, [n], dur, 2.1, d); if (ms.sec >= 3) SND.fiddle(x, n + 12, dur, 0.8, d); });
    },
    outro(ms, add) { [0, 1, 2, 3].forEach(s => add(ms.at(s), (x, d) => { SND.banjo(x, [69, 72, 76, 81][s], 1, d); SND.clap(x, d); })); add(ms.at(4), (x, d) => { SND.accordion(x, [57, 60, 64, 69], 1.2, 1.4, d); SND.tuba(x, 33, 1.2, 1.2, d); SND.crash(x, 0.8, d); }); },
  },
  {
    id: 'balkan', title: 'バルカン・ブラス屋台', stars: 5, color: '#c87a20',
    sub: { zh: '巴爾幹銅管屋台', ja: 'Balkan Brass Yatai', en: 'Balkan Brass Yatai' }, genre: { zh: '巴爾幹銅管樂隊', ja: 'バルカン・ブラス', en: 'Balkan Brass Band' },
    sections: secs(5, 146, 178), patterns: PT.OFF,
    arrange(ms, add) {
      const B = BALKAN, mi = ms.idx % 8, ch = B.CHORD[mi], r = B.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 2, 4, 6], (x, d, s) => { SND.tuba(x, r - 12 + (s % 4 ? 7 : 0), ms.sd * 0.9, 1.3, d); SND.kick(x, 0.7, d); });
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => { SND.brass(x, ch, ms.sd * 0.5, 0.9, d); SND.snare(x, 0.45, d); });   // 反拍的銅管「恰」
      if (ms.sec >= 2) beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.hat(x, 0.6, d, true));
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.snare(x, 0.3 + k * 0.03, d));
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => { SND.trumpet(x, n, dur, 1.7, d); SND.clarinet(x, n + 12, dur, 0.6, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.brass(x, [55, 58, 62, 67], 1.3, 1.4, d); SND.trumpet(x, 79, 1.3, 1.6, d); SND.tuba(x, 31, 1.2, 1.3, d); SND.crash(x, 1, d); SND.kick(x, 1, d); }); },
  },
  {
    id: 'samul', title: 'サムルノリ鉄板', stars: 5, color: '#4a7ad8',
    sub: { zh: '四物遊戲鐵板', ja: 'Samulnori Teppan', en: 'Samulnori Teppan' }, genre: { zh: '韓國四物打擊・長鼓', ja: 'サムルノリ', en: 'Korean Samulnori' },
    sections: secs(5, 140, 176), patterns: PT.SYNC,
    arrange(ms, add) {
      const S = SAMUL, mi = ms.idx % 8, r = S.ROOT[mi], rest = ms.kind === 'rest';
      S.JANGGU.forEach(([s, k]) => add(ms.at(s), (x, d) => (k === 'dong' ? SND.don(x, 0.8, d) : SND.ka(x, 0.9, d))));   // 長鼓
      beatAt(ms, add, [0, 4], (x, d) => SND.kick(x, 0.6, d));   // 北（大鼓）
      for (let k = 0; k < 16; k += (ms.sec >= 2 ? 1 : 2)) add(t16(ms, k), (x, d) => SND.kane(x, k % 4 === 0 ? 1.1 : 0.55, d));   // 小鑼（꽹과리）
      if (mi % 2 === 0) add(ms.at(0), (x, d) => SND.gong(x, 45, 0.5, d));   // 鉦（징）
      beatAt(ms, add, [0, 3, 4], (x, d) => SND.walk(x, r - 12, ms.sd * 1.2, 0.9, d));
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => (k % 2 ? SND.ka(x, 0.6 + k * 0.02, d) : SND.don(x, 0.5 + k * 0.02, d)));
      melody(S.MEL[mi], ms, add, (x, n, dur, d) => { SND.clarinet(x, n + 12, dur, 1.5, d); SND.fue(x, m2f(n), dur, d); });   // 太平簫（嗩吶般的尖亮音）
    },
    outro(ms, add) { for (let k = 0; k < 8; k++) add(t16(ms, k), (x, d) => SND.don(x, 0.6 + k * 0.05, d)); add(ms.at(4), (x, d) => { SND.gong(x, 40, 1.4, d); SND.kick(x, 1, d); SND.clarinet(x, 88, 1.3, 1.4, d); }); },
  },
);

// ---------------- VOL.3 追加 ----------------
const TRAP = {   // C 小調（半速：小鼓在第 3 拍）
  ROOT: [36, 36, 39, 39, 41, 41, 43, 43],
  // 高音區的陰暗鈴聲（3+3+2），C 小調和聲小調，最後停在 G 大和弦的導音
  MEL: [[84, null, null, 87, null, null, 86, null], [84, null, null, 79, null, null, null, null], [84, null, null, 87, null, null, 91, null], [89, null, null, 87, null, null, 86, null],
    [84, null, null, 80, null, null, 79, null], [77, null, null, 80, null, null, 84, null], [86, null, null, 83, null, null, 79, null], [83, null, null, null, 79, null, null, null]],
};
const VAPOR = {   // Eb 大七和弦的慢搖（Vaporwave）
  CHORD: [[63, 67, 70, 74], [60, 63, 67, 70], [56, 60, 63, 67], [58, 62, 65, 68], [63, 67, 70, 74], [60, 63, 67, 70], [56, 60, 63, 67], [58, 62, 65, 69]],
  ROOT: [39, 36, 44, 46, 39, 36, 44, 46],
  MEL: [[79, null, null, null, 77, null, 75, null], [74, null, null, null, 70, null, null, null], [72, null, 75, null, 79, null, 77, null], [77, null, null, null, 74, null, null, null],
    [82, null, null, 79, 77, null, 75, null], [75, null, 74, null, 70, null, 72, null], [72, null, 75, null, 80, null, 79, null], [79, null, null, null, null, null, null, null]],
};
const GARAGE = {   // G 小調（2-step）
  CHORD: [[58, 62, 65, 69], [58, 62, 65, 69], [55, 58, 62, 65], [57, 60, 64, 67], [58, 62, 65, 69], [58, 62, 65, 69], [55, 58, 62, 65], [54, 57, 62]],
  ROOT: [43, 43, 39, 45, 43, 43, 39, 38],
  MEL: [[74, null, 77, null, null, 74, null, 72], [70, null, null, 69, null, 67, null, null], [74, null, 77, null, null, 79, null, 77], [76, null, null, 74, null, 72, null, null],
    [79, null, 81, null, null, 82, null, 81], [79, null, null, 77, null, 74, null, null], [72, null, 74, null, 77, null, 78, null], [79, null, null, null, null, null, null, null]],
};
const HOUSE = {   // A 小調（鋼琴和弦）
  CHORD: [[57, 60, 64, 69], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [57, 60, 64, 69], [57, 60, 64, 69], [53, 57, 60, 65], [52, 56, 59, 64]],
  ROOT: [45, 45, 41, 43, 45, 45, 41, 40],
  // 浩室女聲的長音：撐住一整拍半、再大跳上去
  MEL: [[76, null, null, null, null, null, 81, null], [79, null, 76, null, null, null, null, null], [77, null, null, null, null, null, 84, null], [83, null, 79, null, null, null, null, null],
    [81, null, null, 83, 84, null, 83, 81], [79, null, null, 81, 79, null, 76, null], [77, null, 81, null, 84, null, 81, null], [80, null, null, null, 83, null, null, null]],
};
const GLITCH = {   // E 小調（斷斷續續的切片）
  ROOT: [40, 40, 43, 43, 45, 45, 47, 47],
  // 連續分解和弦的電玩音（上上下下），每兩小節換和弦
  MEL: [[76, 79, 83, 79, 76, 79, 83, null], [88, null, null, null, 86, null, 83, null], [79, 83, 86, 83, 79, 83, 86, null], [91, null, null, null, 88, null, 86, null],
    [81, 84, 88, 84, 81, 84, 88, null], [86, null, 84, null, 81, null, 79, null], [83, 87, 90, 87, 83, 87, 90, null], [90, null, 87, null, 83, null, 78, null]],
  STUTTER: [0, 0, 1, 0, 0, 1, 0, 1],   // 哪幾小節要「卡帶」重複
};
const MATHROCK = {   // D 大調（點弦分散和弦）
  CHORD: [[62, 66, 69, 74], [59, 62, 66, 71], [55, 59, 62, 67], [57, 61, 64, 69], [62, 66, 69, 74], [59, 62, 66, 71], [55, 59, 64, 67], [57, 61, 64, 69]],
  ROOT: [38, 35, 43, 45, 38, 35, 43, 45],
  KICK: [[0, 3, 6], [0, 2, 5], [0, 3, 5, 7], [0, 3, 6]],   // 不對稱的大鼓
  MEL: [[78, null, 76, 78, null, 81, null, 78], [74, null, null, 73, null, 71, null, null], [79, null, 78, 79, null, 83, null, 79], [76, null, null, 74, null, 73, null, null],
    [81, null, 79, 81, null, 86, null, 81], [83, null, 81, null, 78, null, 74, null], [79, null, 78, null, 76, null, 73, null], [74, null, null, null, null, null, null, null]],
};
const INDUSTRIAL = {   // C# 小調（金屬撞擊）
  ROOT: [37, 37, 37, 40, 37, 37, 42, 40],
  MEL: [[73, null, 73, null, 76, null, 73, null], [72, null, null, null, 68, null, null, null], [73, null, 73, null, 76, null, 78, null], [76, null, 75, null, 73, null, null, null],
    [80, null, 80, null, 81, null, 80, null], [78, null, 76, null, 75, null, 73, null], [72, null, 73, null, 75, null, 76, null], [73, null, null, null, null, null, null, null]],
};
const JERSEY = {   // F 小調（Jersey club 的三連發大鼓）
  CHORD: [[60, 65, 68], [61, 65, 68], [63, 67, 70], [60, 64, 67], [60, 65, 68], [61, 65, 68], [63, 67, 70], [60, 64, 67]],
  ROOT: [41, 37, 39, 36, 41, 37, 39, 36],
  KICK: [0, 4, 8, 10, 12],   // 16 分音符位置：碰、碰、碰碰碰
  // 一個長音停住、後半拍連珠炮四個音往下滾（澤西俱樂部的急停急衝）
  MEL: [[77, null, null, null, 80, 79, 77, 75], [77, null, null, null, 80, null, 77, null], [79, null, null, null, 82, 80, 79, 77], [76, null, null, null, 79, null, 84, null],
    [84, null, null, null, 87, 85, 84, 80], [85, null, null, null, 80, null, 77, null], [82, null, null, null, 79, 82, 87, null], [88, null, null, null, 84, null, 79, null]],
};

SONGS.push(
  {
    id: 'trap', title: 'トラップ屋台', stars: 2, color: '#8a5ad8',
    sub: { zh: '陷阱屋台', ja: 'Trap Yatai', en: 'Trap Yatai' }, genre: { zh: 'Trap（電音）・808', ja: 'トラップ', en: 'Trap 808' },
    sections: secs(2, 100, 136), patterns: PT.HALF,
    arrange(ms, add) {
      const T = TRAP, mi = ms.idx % 8, r = T.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 3], (x, d) => { SND.kick(x, 0.9, d); SND.b808(x, r - 12, ms.bd * 1.4, 1, d); });
      add(ms.at(4), (x, d) => { SND.snare(x, 0.8, d); SND.clap(x, d); });   // 半速：小鼓在第 3 拍
      for (let k = 0; k < 16; k += 2) add(t16(ms, k), (x, d) => SND.hat(x, 0.6, d));
      if (ms.sec >= 2) [13, 14, 15].forEach(k => add(t16(ms, k), (x, d) => SND.hat(x, 0.45, d)));   // 鈸的滾奏
      if (rest) { for (let k = 8; k < 16; k++) add(t16(ms, k), (x, d) => SND.hat(x, 0.3 + k * 0.03, d)); add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); }
      melody(T.MEL[mi], ms, add, (x, n, dur, d) => { SND.bell(x, n, 1.2, d); if (ms.sec >= 3) SND.pluck(x, n - 12, 0.8, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.b808(x, 24, 1.6, 1.1, d); SND.bell(x, 84, 1.2, d); SND.bell(x, 79, 1, d); SND.kick(x, 1, d); }); },
  },
  {
    id: 'vapor', title: 'ヴェイパー夜市', stars: 2, color: '#ff8ad8',
    sub: { zh: '蒸氣波夜市', ja: 'Vapor Night Market', en: 'Vapor Night Market' }, genre: { zh: 'Vaporwave（慢速電子）', ja: 'ヴェイパーウェイヴ', en: 'Vaporwave' },
    sections: secs(2, 96, 128), patterns: PT.BACK,
    arrange(ms, add) {
      const V = VAPOR, mi = ms.idx % 8, ch = V.CHORD[mi], r = V.ROOT[mi], rest = ms.kind === 'rest';
      add(ms.at(0), (x, d) => SND.crackle(x, ms.bd * 4, d));
      beatAt(ms, add, [0, 5], (x, d) => SND.kick(x, 0.7, d)); beatAt(ms, add, [2, 6], (x, d) => SND.gsnare(x, 0.9, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.hat(x, 0.4, d));
      add(ms.at(0), (x, d) => SND.epiano(x, ch, 0.9, d, ms.bd * 3.6));
      beatAt(ms, add, [0, 3, 6], (x, d) => SND.synbass(x, r - 12, ms.sd * 1.4, 1, d));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.6, d));
      if (rest) beatAt(ms, add, [4, 5, 6, 7], (x, d, s) => SND.epiano(x, [ch[s % 4] + 12], 0.8, d, 0.3));
      melody(V.MEL[mi], ms, add, (x, n, dur, d) => { SND.sax(x, n, dur, 1.3, d); if (ms.sec >= 4) SND.chop(x, n + 12, dur, 0.4, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.epiano(x, [51, 55, 58, 62, 67], 1, d, 2); SND.sax(x, 79, 1.8, 1.2, d); SND.synbass(x, 27, 1.6, 1, d); SND.crackle(x, 2, d); }); },
  },
  {
    id: 'garage', title: 'UKガラージ屋台', stars: 2, color: '#5ad0a0', swing: 0.6,
    sub: { zh: '英倫車庫屋台', ja: 'UK Garage Yatai', en: 'UK Garage Yatai' }, genre: { zh: 'UK Garage（2-step）', ja: 'UKガラージ', en: '2-Step Garage' },
    sections: secs(2, 104, 136), patterns: PT.OFF,
    arrange(ms, add) {
      const G = GARAGE, mi = ms.idx % 8, ch = G.CHORD[mi], r = G.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 5], (x, d) => SND.kick(x, 0.9, d)); beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.7, d));   // 2-step：大鼓跳過第 3 拍
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.7 : 0.35, d, s % 2 === 1));
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.sub(x, r - 12, ms.sd * 1.2, 1.1, d));
      beatAt(ms, add, [1, 4], (x, d) => SND.organ(x, ch, ms.sd * 0.5, 0.8, d));   // 管風琴 stab
      if (ms.sec >= 2) beatAt(ms, add, [3, 7], (x, d) => SND.chop(x, ch[2] + 12, ms.sd, 0.7, d));
      if (rest) fillSnare(ms, add);
      melody(G.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.2, d); if (ms.sec >= 3) SND.epiano(x, [n - 12], 0.6, d, dur); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.organ(x, [55, 58, 62, 65], 1.4, 1, d); SND.vox(x, 79, 1.4, 1.2, d); SND.sub(x, 31, 1.2, 1.1, d); SND.kick(x, 0.9, d); }); },
  },
  {
    id: 'house', title: '夜市ハウス', stars: 3, color: '#4ab0ff',
    sub: { zh: '夜市浩室', ja: 'Night Market House', en: 'Night Market House' }, genre: { zh: 'House・鋼琴和弦', ja: 'ハウス', en: 'Piano House' },
    sections: secs(3, 116, 148), patterns: PT.OFF,
    arrange(ms, add) {
      const H = HOUSE, mi = ms.idx % 8, ch = H.CHORD[mi], r = H.ROOT[mi], rest = ms.kind === 'rest';
      if (!rest) beatAt(ms, add, [0, 2, 4, 6], (x, d) => SND.kick(x, 1, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.hat(x, 0.7, d, true)); beatAt(ms, add, [2, 6], (x, d) => SND.clap(x, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.sub(x, r - 12, ms.sd * 0.8, 1, d));
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.piano(x, ch, 1, d, 0.25));   // House 鋼琴 stab（切分）
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.strings(x, ch[0] + 12, ms.bd * 3.8, 0.6, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); fillSnare(ms, add); }
      melody(H.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.2, d); if (ms.sec >= 2) SND.piano(x, [n + 12], 0.5, d, dur); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.piano(x, [45, 57, 60, 64, 69], 1.3, d, 1.6); SND.vox(x, 81, 1.4, 1.2, d); SND.sub(x, 33, 1.2, 1, d); SND.kick(x, 1, d); SND.crash(x, 0.8, d); }); },
  },
  {
    id: 'glitch', title: 'グリッチホップ屋台', stars: 3, color: '#3ae0e0', swing: 0.58,
    sub: { zh: '故障嘻哈屋台', ja: 'Glitch Hop Yatai', en: 'Glitch Hop Yatai' }, genre: { zh: 'Glitch hop（故障電子）', ja: 'グリッチホップ', en: 'Glitch Hop' },
    sections: secs(3, 110, 146), patterns: PT.SYNC,
    arrange(ms, add) {
      const G = GLITCH, mi = ms.idx % 8, r = G.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.kick(x, 0.95, d)); beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.85, d));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.4 : 0.6, d));
      beatAt(ms, add, [0, 3, 5, 6], (x, d) => SND.b808(x, r - 12, ms.sd * 1.1, 0.9, d));
      if (G.STUTTER[mi] && ms.sec >= 1) for (let k = 12; k < 16; k++) add(t16(ms, k), (x, d) => { SND.chop(x, r + 24, ms.bd / 4, 0.7, d); SND.snare(x, 0.4, d); });   // 卡帶般的重複
      if (ms.sec >= 2) add(ms.at(7), (x, d) => SND.scratch(x, 1.2, d));
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.chop(x, r + 24 + (k % 4) * 2, ms.bd / 4, 0.4 + k * 0.03, d));
      melody(G.MEL[mi], ms, add, (x, n, dur, d) => { SND.marimba(x, n, 1.7, d); SND.epiano(x, [n - 12], 0.7, d, Math.min(dur, 0.6)); });   // 柔和的馬林巴＋電鋼琴（不用 8-bit 方波）
    },
    outro(ms, add) { for (let k = 0; k < 6; k++) add(t16(ms, k), (x, d) => SND.chop(x, 64 + k, 0.08, 0.8, d)); add(ms.at(4), (x, d) => { SND.b808(x, 28, 1.4, 1, d); SND.marimba(x, 76, 1.6, d); SND.epiano(x, [64, 71, 76], 0.8, d, 1.2); SND.kick(x, 1, d); }); },
  },
  {
    id: 'mathrock', title: 'マスロック鉄板', stars: 4, color: '#f0a040',
    sub: { zh: '數學搖滾鐵板', ja: 'Math Rock Teppan', en: 'Math Rock Teppan' }, genre: { zh: '數學搖滾・點弦吉他', ja: 'マスロック', en: 'Math Rock Tapping' },
    sections: secs(4, 124, 160), patterns: PT.SYNC,
    arrange(ms, add) {
      const M = MATHROCK, mi = ms.idx % 8, ch = M.CHORD[mi], r = M.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, M.KICK[mi % 4], (x, d) => SND.kick(x, 0.9, d)); beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.7, d));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.ride(x, 0.45, d));
      for (let k = 0; k < 16; k++) { const n = ch[[0, 2, 1, 3, 2, 1][k % 6]] + 12; add(t16(ms, k), (x, d) => SND.twang(x, n, ms.bd / 4, 0.55, d)); }   // 點弦（6 個一組，和 4 拍錯開）
      beatAt(ms, add, [0, 3, 6], (x, d) => SND.walk(x, r - 12, ms.sd * 1.4, 1, d));
      if (rest) fillSnare(ms, add);
      melody(M.MEL[mi], ms, add, (x, n, dur, d) => { SND.glead(x, n, dur, 1, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { [62, 66, 69, 74, 78].forEach((n, i) => SND.twang(x + i * 0.05, n, 1.2, 0.8, d)); SND.walk(x, 26, 1.4, 1, d); SND.crash(x, 0.9, d); SND.kick(x, 0.9, d); }); },
  },
  {
    id: 'industrial', title: 'インダストリアル屋台', stars: 4, color: '#9aa0a8',
    sub: { zh: '工業電子屋台', ja: 'Industrial Yatai', en: 'Industrial Yatai' }, genre: { zh: '工業電子・金屬撞擊', ja: 'インダストリアル', en: 'Industrial Electronic' },
    sections: secs(4, 120, 158), patterns: PT.RUN,
    arrange(ms, add) {
      const I = INDUSTRIAL, mi = ms.idx % 8, r = I.ROOT[mi], rest = ms.kind === 'rest';
      if (!rest) beatAt(ms, add, [0, 2, 4, 6], (x, d) => SND.gkick(x, 0.6, d));
      beatAt(ms, add, [2, 6], (x, d) => { SND.snare(x, 0.8, d); SND.metallo(x, 88, 0.5, d, 0.3); });   // 金屬撞擊
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.kane(x, 0.5, d));
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.dguitar(x, [r - 12], ms.sd * 0.7, 0.85, d, { mute: true }));   // 機械般的低音
      if (ms.sec >= 2) beatAt(ms, add, [3], (x, d) => SND.reese(x, r, ms.bd * 2, 0.8, d));
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.metallo(x, 76 + (k % 4) * 3, 0.4 + k * 0.03, d, 0.2));
      melody(I.MEL[mi], ms, add, (x, n, dur, d) => { SND.synlead(x, n, dur, 1.5, d); if (ms.sec >= 3) SND.dguitar(x, [n - 24], dur, 0.4, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.dguitar(x, [25, 32, 37], 1.6, 1.1, d); SND.metallo(x, 85, 1.5, d, 1); SND.gkick(x, 1, d); SND.crash(x, 1, d); }); },
  },
  {
    id: 'jersey', title: 'ジャージークラブ屋台', stars: 5, color: '#ffa03a',
    sub: { zh: '澤西俱樂部屋台', ja: 'Jersey Club Yatai', en: 'Jersey Club Yatai' }, genre: { zh: 'Jersey club（三連發大鼓）', ja: 'ジャージークラブ', en: 'Jersey Club' },
    sections: secs(5, 140, 172), patterns: PT.SYNC,
    arrange(ms, add) {
      const J = JERSEY, mi = ms.idx % 8, ch = J.CHORD[mi], r = J.ROOT[mi], rest = ms.kind === 'rest';
      if (!rest) J.KICK.forEach(k => add(t16(ms, k), (x, d) => SND.kick(x, 1, d)));   // 碰、碰、碰碰碰
      beatAt(ms, add, [2, 6], (x, d) => SND.clap(x, d)); beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.hat(x, 0.5, d));
      if (ms.sec >= 1) [2, 7, 11, 14].forEach(k => add(t16(ms, k), (x, d) => SND.chop(x, ch[2] + 12, ms.bd / 4, 0.6, d)));   // 床彈簧般的人聲切片
      beatAt(ms, add, [0, 4, 5], (x, d) => SND.b808(x, r - 12, ms.sd * 1.1, 0.9, d));
      if (ms.sec >= 3) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.5, d, 'sawtooth'));
      if (rest) for (let k = 0; k < 16; k++) add(t16(ms, k), (x, d) => SND.kick(x, 0.35 + k * 0.03, d));
      melody(J.MEL[mi], ms, add, (x, n, dur, d) => { SND.pluck(x, n, 1.5, d); SND.vox(x, n, dur, 0.8, d); });
    },
    outro(ms, add) { [0, 2, 4, 5, 6].forEach(k => add(t16(ms, k), (x, d) => SND.kick(x, 1, d))); add(ms.at(4), (x, d) => { SND.chop(x, 80, 0.6, 1, d); SND.b808(x, 29, 1.4, 1, d); SND.vox(x, 77, 1.2, 1.1, d); SND.crash(x, 1, d); }); },
  },
);


// ---------------- 換曲（明亮、好入耳的新曲） ----------------
const NEWJACK = {   // C 大調七和弦（Cmaj7－Am7－Dm7－G7）；搖擺的同音兩下＋往下收
  CHORD: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]],
  ROOT: [48, 45, 50, 43, 48, 45, 41, 43],
  MEL: [[76, null, 79, 79, null, 76, null, null], [72, null, 76, 76, null, 72, 69, null], [77, null, 81, 81, null, 77, null, null], [79, null, 77, 74, null, 71, null, null],
    [84, null, 83, 84, null, 79, null, null], [81, null, 79, 81, null, 76, null, null], [77, 79, 81, null, 84, null, 81, null], [79, null, null, null, 74, null, 71, null]],
};
const DIXIE = {   // F 大調（1920 年代熱爵士：小號主奏、單簧管、斑鳩琴、低音號）
  CHORD: [[57, 60, 65], [57, 60, 65], [55, 58, 60, 64], [57, 60, 65], [58, 62, 65], [57, 60, 65], [55, 60, 64, 70], [57, 60, 65]],
  ROOT: [41, 41, 48, 41, 46, 41, 48, 41],
  MEL: [[72, 74, 76, 77, null, 81, null, 77], [76, null, 77, null, 72, null, null, null], [70, 72, 74, 76, null, 79, null, 76], [77, null, 76, 77, 81, null, null, null],
    [82, null, 81, 82, 86, null, 82, null], [81, null, 79, 77, 76, null, 77, null], [79, 81, 82, null, 79, null, 76, null], [77, null, null, null, null, null, null, null]],
};
const BOUNCE = {   // G 大調（G－D－Em－C）；彈跳的分解和弦主旋律
  CHORD: [[55, 59, 62], [54, 57, 62], [52, 55, 59], [48, 52, 55, 60], [55, 59, 62], [54, 57, 62], [52, 55, 59], [48, 52, 55, 60]],
  ROOT: [43, 38, 40, 36, 43, 38, 40, 36],
  MEL: [[79, null, 83, null, 86, 83, null, 79], [78, null, 81, null, 86, 81, null, 78], [76, null, 79, null, 83, 79, null, 76], [76, null, 79, 81, 84, null, 81, null],
    [83, null, 86, null, 91, 86, null, 83], [81, null, 86, null, 90, 86, null, 81], [79, null, 83, null, 88, 83, null, 79], [84, null, 81, null, 79, null, null, null]],
};
const HYPERPOP = {   // E 大調（E－C#m－A－B）；甜亮的高音、大跳
  CHORD: [[64, 68, 71], [61, 64, 68], [57, 61, 64], [59, 63, 66], [64, 68, 71], [61, 64, 68], [57, 61, 64], [59, 63, 66]],
  ROOT: [40, 37, 45, 47, 40, 37, 45, 47],
  MEL: [[83, 80, 76, 80, 83, null, 88, null], [85, null, 80, null, 76, null, 73, null], [81, 76, 73, 76, 81, null, 85, null], [83, null, 87, null, 90, null, 87, null],
    [88, null, 88, 87, 85, null, 83, null], [80, null, 80, 81, 83, null, 85, null], [81, null, 83, null, 85, null, 88, 90], [87, null, null, null, 83, null, null, null]],
};

SONGS.push(
  {
    id: 'newjack', title: 'ニュージャック鉄板', stars: 3, color: '#ff8a4a', swing: 0.6,
    sub: { zh: '新傑克搖擺鐵板', ja: 'New Jack Teppan', en: 'New Jack Teppan' }, genre: { zh: 'New Jack Swing（搖擺節奏藍調）', ja: 'ニュージャックスウィング', en: 'New Jack Swing' },
    sections: secs(3, 108, 142), patterns: PT.SYNC,
    arrange(ms, add) {
      const N = NEWJACK, mi = ms.idx % 8, ch = N.CHORD[mi], r = N.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.kick(x, 0.95, d)); beatAt(ms, add, [2, 6], (x, d) => { SND.snare(x, 0.8, d); SND.clap(x, d); });
      for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.hat(x, s % 2 ? 0.45 : 0.7, d));
      beatAt(ms, add, [0, 3, 4, 6], (x, d, s) => SND.synbass(x, r - 12 + (s === 6 ? 12 : 0), ms.sd * 0.9, 1.1, d));
      beatAt(ms, add, [1, 5], (x, d) => SND.brass(x, ch.map(n => n + 12), ms.sd * 0.5, 1, d));   // 亮亮的銅管 stab
      if (ms.sec >= 1) add(ms.at(0), (x, d) => SND.epiano(x, ch, 0.7, d, ms.bd * 1.8));
      if (ms.sec >= 3) beatAt(ms, add, [3, 7], (x, d) => SND.tamb(x, 0.8, d));
      if (rest) fillSnare(ms, add);
      melody(N.MEL[mi], ms, add, (x, n, dur, d) => { SND.vox(x, n, dur, 1.3, d); if (ms.sec >= 2) SND.synlead(x, n + 12, dur, 0.45, d); });
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.brass(x, [72, 76, 79, 83], 1.2, 1.2, d); SND.vox(x, 84, 1.2, 1.2, d); SND.synbass(x, 36, 1.2, 1.1, d); SND.kick(x, 0.9, d); SND.crash(x, 0.8, d); }); },
  },
  {
    id: 'dixie', title: 'ディキシー屋台', stars: 4, color: '#f0c040', swing: 0.62,
    sub: { zh: '迪克西蘭屋台', ja: 'Dixieland Yatai', en: 'Dixieland Yatai' }, genre: { zh: '1920 年代熱爵士（Dixieland）', ja: 'ディキシーランド', en: 'Dixieland Hot Jazz' },
    sections: secs(4, 124, 160), patterns: PT.SYNC,
    arrange(ms, add) {
      const X = DIXIE, mi = ms.idx % 8, ch = X.CHORD[mi], r = X.ROOT[mi], rest = ms.kind === 'rest';
      beatAt(ms, add, [0, 2, 4, 6], (x, d, s) => SND.tuba(x, r - 12 + (s % 4 ? 7 : 0), ms.bd * 0.8, 1.4, d));   // 低音號 oom-pah
      beatAt(ms, add, [0, 2, 4, 6], (x, d, s) => SND.uke(x, ch.map(n => n + 12), s % 4 ? 1 : 1.4, d));        // 斑鳩琴刷四拍
      beatAt(ms, add, [2, 6], (x, d) => SND.snare(x, 0.4, d)); for (let s = 0; s < 8; s++) add(ms.at(s), (x, d) => SND.ride(x, 0.35, d));
      if (ms.sec >= 2) beatAt(ms, add, [0, 4], (x, d) => SND.kick(x, 0.45, d));
      if (rest) beatAt(ms, add, [4, 5, 6, 7], (x, d, s) => SND.trumpet(x, [77, 81, 84, 89][s - 4], ms.sd, 1.4, d));
      melody(X.MEL[mi], ms, add, (x, n, dur, d) => {
        SND.trumpet(x, n, dur, 1.7, d);
        if (ms.sec >= 1) SND.clarinet(x, n + 12, dur, 0.7, d);   // 單簧管在上面飄
        if (ms.sec >= 3) SND.brass(x, [n - 12], dur, 0.7, d);   // 長號在下面
      });
    },
    outro(ms, add) { [0, 1, 2].forEach(s => add(ms.at(s), (x, d) => SND.uke(x, [69, 72, 77], 1.4, d))); add(ms.at(4), (x, d) => { SND.trumpet(x, 89, 1.4, 1.6, d); SND.clarinet(x, 84, 1.4, 1, d); SND.tuba(x, 29, 1.2, 1.4, d); SND.crash(x, 0.7, d); }); },
  },
  {
    id: 'bounce', title: 'バウンス鉄板', stars: 3, color: '#3ad0ff',
    sub: { zh: '彈跳鐵板', ja: 'Bounce Teppan', en: 'Bounce Teppan' }, genre: { zh: 'Melbourne Bounce（彈跳電音）', ja: 'メルボルン・バウンス', en: 'Melbourne Bounce' },
    sections: secs(3, 118, 148), patterns: PT.OFF,
    arrange(ms, add) {
      const B = BOUNCE, mi = ms.idx % 8, ch = B.CHORD[mi], r = B.ROOT[mi], rest = ms.kind === 'rest';
      if (!rest) beatAt(ms, add, [0, 2, 4, 6], (x, d) => SND.kick(x, 1, d));
      beatAt(ms, add, [1, 3, 5, 7], (x, d) => { SND.hat(x, 0.6, d, true); SND.sub(x, r - 12, ms.sd * 0.7, 1, d); });   // 反拍低音（乾淨的方波，不破音）
      beatAt(ms, add, [2, 6], (x, d) => SND.clap(x, d));
      if (ms.sec >= 2) add(ms.at(0), (x, d) => SND.pad(x, ch, ms.bd * 4, 0.6, d));
      if (ms.sec >= 3) beatAt(ms, add, [1, 3, 5, 7], (x, d) => SND.pluck(x, ch[1] + 12, 0.7, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); fillSnare(ms, add); }
      melody(B.MEL[mi], ms, add, (x, n, dur, d) => { SND.pluck(x, n, 1.6, d); SND.flute(x, n, Math.min(dur, 0.25), 0.7, d); });   // 彈跳的撥音＋口哨般的亮音
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.pluck(x, 91, 1.4, d); SND.pad(x, [55, 59, 62, 67], 1.6, 1, d); SND.sub(x, 31, 1.2, 1, d); SND.kick(x, 1, d); SND.crash(x, 0.9, d); }); },
  },
  {
    id: 'hyperpop', title: 'ハイパーポップ屋台', stars: 5, color: '#ff7ae0',
    sub: { zh: '超流行屋台', ja: 'Hyperpop Yatai', en: 'Hyperpop Yatai' }, genre: { zh: 'Hyperpop（甜亮電子流行）', ja: 'ハイパーポップ', en: 'Hyperpop' },
    sections: secs(5, 148, 178), patterns: PT.SYNC,
    arrange(ms, add) {
      const H = HYPERPOP, mi = ms.idx % 8, ch = H.CHORD[mi], r = H.ROOT[mi], rest = ms.kind === 'rest';
      // 切分的碎拍（不是四拍大鼓）
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.kick(x, 0.9, d)); beatAt(ms, add, [2, 6], (x, d) => { SND.snare(x, 0.7, d); SND.clap(x, d); });
      for (let k = 0; k < 16; k += (ms.sec >= 3 ? 1 : 2)) add(t16(ms, k), (x, d) => SND.hat(x, k % 4 === 2 ? 0.55 : 0.35, d));
      beatAt(ms, add, [0, 3, 5], (x, d) => SND.b808(x, r - 12, ms.sd * 1.2, 0.8, d));
      beatAt(ms, add, [1, 4, 7], (x, d) => SND.supersaw(x, ch[2] + 12, ms.sd * 0.6, 0.6, d));   // 亮晶晶的和弦切片
      if (ms.sec >= 2) beatAt(ms, add, [0, 4], (x, d) => SND.bell(x, ch[0] + 24, 0.7, d));
      if (rest) { add(ms.start, (x, d) => SND.riser(x, ms.bd * 4, d)); for (let k = 8; k < 16; k++) add(t16(ms, k), (x, d) => SND.chop(x, ch[k % 3] + 24, ms.bd / 4, 0.5, d)); }
      melody(H.MEL[mi], ms, add, (x, n, dur, d) => { SND.chop(x, n, dur, 1, d); SND.supersaw(x, n, dur, 0.8, d); });   // 高音人聲切片＋超鋸齒
    },
    outro(ms, add) { add(ms.at(0), (x, d) => { SND.supersaw(x, 88, 1.6, 1.2, d); SND.supersaw(x, 83, 1.6, 0.8, d); SND.bell(x, 100, 1, d); SND.b808(x, 28, 1.4, 1, d); SND.crash(x, 1, d); SND.kick(x, 1, d); }); },
  },
);
// ---- 曲目排列：第 0 組 = 內建曲目（一開始就能玩、不收費、不算 VOL 系列）；之後是追加的 VOL.1～VOL.6，各 10 首、各自付費；每組依星級由易到難 ----
// VOL.1～VOL.3 = 最早做的 30 首（VOL.2 的クレズマー已換成ディキシー）；VOL.4～VOL.6 = 後來新作的 30 首，
// 依曲風分成三組（靈魂・嘻哈・流行／世界音樂／電子），每組 2～5 星各 2～3 首，難度分布平均
// song.vol = 第幾組（0 = 內建曲目）；畫面上的名稱用 volName()
const VOL_ORDER = [
  ['tsukimi', 'bossa', 'yatai', 'chindon', 'swing', 'ska', 'funk', 'chip', 'hyper', 'dnb'],                       // 內建曲目
  ['musicbox', 'reggae', 'citypop', 'ondo', 'samba', 'surf', 'disco', 'boogie', 'jrock', 'hoedown'],              // VOL.1
  ['enka', 'blues', 'polka', 'tango', 'celtic', 'bhangra', 'salsa', 'dixie', 'flamenco', 'gabber'],               // VOL.2
  ['gamelan', 'hawaii', 'synthwave', 'future', 'anime', 'britpop', 'dancepunk', 'thrash', 'power', 'wametal'],    // VOL.3
  ['soul', 'boombap', 'gospel', 'afrobeat', 'newjack', 'kpop', 'trance', 'eswing', 'bigbeat', 'punk'],            // VOL.4：靈魂・嘻哈・流行
  ['calypso', 'okinawa', 'minyue', 'arabic', 'cumbia', 'baroque', 'ragtime', 'kalinka', 'balkan', 'samul'],      // VOL.5：世界音樂
  ['trap', 'vapor', 'garage', 'bounce', 'house', 'glitch', 'mathrock', 'industrial', 'hyperpop', 'jersey'],       // VOL.6：電子
];
{
  const all = SONGS.splice(0);
  VOL_ORDER.forEach((ids, v) => ids.forEach((id, k) => { const s = all.find(x => x.id === id); s.vol = v; s.no = k + 1; SONGS.push(s); }));
}
const volSize = v => VOL_ORDER[v].length;   // 每組幾首（目前都是 10 首）
const volName = v => (v === 0 ? tr('內建曲目') : 'VOL.' + v);
const VOL_COLORS = ['#e8a040', '#2a8ad6', '#2a9a6a', '#8a3ad6', '#d6457a', '#2aa6b0', '#5a5ad6'];   // 各組的代表色（樂曲組選單、商店卡片）

// 選單背景音樂用哪一首（index）
const MENU_SONG = SONGS.findIndex(s => s.id === 'yatai');
const songById = id => SONGS.find(s => s.id === id) || SONGS[MENU_SONG];

// ---- 難度（試作）：音樂不變，只改要打的音符；普通 = 原本的譜面 ----
// suffix：紀錄（HISCORE、獎章）用的 id 後綴（普通沒有後綴 → 原本的紀錄都算普通）
// card：選曲畫面曲目卡的木板色調（multiply 疊在木紋上，像換一種木頭：普通 = 胡桃木、困難 = 紅木；null = 原木色）
const DIFFS = [
  { key: 'easy', name: '簡單', color: '#2e9a3e', card: null, delta: -1, suffix: '_easy' },
  { key: 'normal', name: '普通', color: '#e07a10', card: '#e8c49c', delta: 0, suffix: '' },
  { key: 'hard', name: '困難', color: '#c8321e', card: '#d9a196', delta: 1, suffix: '_hard' },
];
const curDiff = () => clamp(Save.data.diff === undefined ? 1 : Save.data.diff, 0, DIFFS.length - 1);
// 歌名與小標（依語言；選曲、遊戲中、結算、分享圖共用）：中文 = 中文歌名＋英文小標；日文 = 原本的日文歌名＋日文小標；英文 = 英文歌名＋英文曲風
const songName = song => !song.sub ? song.title : Save.data.lang === 'zh' ? song.sub.zh : Save.data.lang === 'en' ? song.sub.en : song.title;
const songSub = song => Save.data.lang === 'zh' ? song.sub.en + '・' + song.genre.en : Save.data.lang === 'en' ? song.genre.en : song.sub.ja + '・' + song.genre.ja;
const recId = (song, d = curDiff()) => song.id + DIFFS[d].suffix;
// 5 星歌選困難 = 6 星（第 6 顆是紅的）；1 星歌選簡單 = 0 星（空心，跟普通的 1 星分得出來）
const diffStars = (song, d = curDiff()) => clamp(song.stars + DIFFS[d].delta, 0, 6);
// 0 星（1 星歌的簡單）專用：每小節最多 2 下，只在第 1 拍或第 1、3 拍
const ZERO_PATTERNS = [[0], [0, 2], [0], [2], [0, 2], [0]];
// 困難：原本已經是最高級的段落，加一組更密、切分更多的「第 4 級」節奏型
const HARD_EXTRA = [[0, 0.5, 1, 1.5, 2, 3], [0, 1, 1.5, 2, 2.5, 3.5], [0, 0.5, 1.5, 2, 3, 3.5], [0.5, 1, 1.5, 2.5, 3, 3.5]];
// 困難的強度依原本星級遞減（高星歌本來就很密，再加就太過頭）：
// extra = 用「第 4 級」節奏型的機率、addOff = 再補一個反拍的機率；cap = 每秒最多幾下
const HARD_TUNE = { 1: { extra: 0.5, addOff: 0.6 }, 2: { extra: 0.5, addOff: 0.6 }, 3: { extra: 0.5, addOff: 0.6 }, 4: { extra: 0.25, addOff: 0.45 }, 5: { extra: 0, addOff: 0.3 }, cap: 4.2 };
// 依難度調整一個小節的節奏型（lv = 這一段原本挑到的難度級、bd = 一拍幾秒）
function diffPattern(song, lv, d, bd = 0.5) {
  const pick = pl => pl[(Math.random() * pl.length) | 0];
  const pl = L => (song.patterns && song.patterns[L]) || PATTERNS[L];
  if (d === 0 && song.stars <= 1) return pick(ZERO_PATTERNS);   // 0 星
  if (d === 0) {   // 簡單：低一級、只留正拍、每小節最多 3 下
    const p = pick(pl(Math.max(0, lv - 1))).filter(b => b % 1 === 0).slice(0, 3);
    return p.length ? p : [0];
  }
  if (d === 2) {   // 困難：高一級；已經最高級的話有機率用第 4 級；再隨機補一個反拍（強度依星級，見 HARD_TUNE）
    const T = HARD_TUNE[clamp(song.stars, 1, 5)];
    let p = lv >= 3 && Math.random() < T.extra ? pick(HARD_EXTRA).slice() : pick(pl(Math.min(3, lv + 1))).slice();
    const free = p.filter(b => b % 1 === 0 && b + 0.5 < 4 && !p.includes(b + 0.5));
    if (free.length && Math.random() < T.addOff) p = [...p, pick(free) + 0.5].sort((a, b) => a - b);
    // 上限：每秒最多 cap 下（超過時先拿掉反拍，再從後面拿）
    const max = Math.max(3, Math.floor(HARD_TUNE.cap * 4 * bd));
    while (p.length > max) { const k = p.findIndex(b => b % 1 !== 0); p.splice(k >= 0 ? k : p.length - 1, 1); }
    return p;
  }
  return pick(pl(lv));
}
