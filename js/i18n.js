'use strict';

// ===== 多語系（中文 / 日本語 / English） =====
// 以中文原文為鍵；新增畫面文字時在 ja / en 補上翻譯即可（沒有翻譯時顯示中文原文）。
// 'sub.*' 為按鈕副標，各語言刻意用「另一種語言」當副標，增加屋台的趣味。
const LANGS = [['zh', '中文'], ['ja', '日本語'], ['en', 'English']];

const I18N = {
  zh: {
    'sub.start': 'START', 'sub.howto': 'HOW TO PLAY', 'sub.ranking': 'RANKING', 'sub.settings': 'SETTINGS', 'sub.credits': 'CREDIT',
  },
  ja: {
    'sub.start': 'START', 'sub.howto': 'HOW TO PLAY', 'sub.ranking': 'RANKING', 'sub.settings': 'SETTINGS', 'sub.credits': 'CREDIT',
    // 開始 / 主選單
    '節奏熱炒遊戲': 'リズム鉄板ゲーム', '開始遊戲': 'ゲーム開始', '操作說明': 'あそびかた', '排行榜': 'ランキング', '設定': 'せってい', 'CREDIT': 'クレジット',
    '十字鍵 選擇　A 決定　B 返回': '十字キー 選択　A 決定　B 戻る', '點選按鈕': 'ボタンをタップ', '↑↓ 選擇　ENTER 決定　ESC 返回': '↑↓ 選択　ENTER 決定　ESC 戻る',
    // 暫停
    '繼續遊戲': 'つづける', '重新開始': 'やりなおす', '回主選單': 'メニューへ', '繼續後會先倒數 3 拍，再接回原本的節拍': '再開時は 3 拍カウントしてから元のリズムに戻ります', '跟著拍子準備！': 'リズムに合わせて準備！',
    // 遊戲中
    '廣島燒完成！': '広島焼き完成！', 'おしまい！': 'おしまい！', '{0} COMBO!': '{0} COMBO!',
    // 操作說明
    '遊戲規則': 'ルール', '操作方式': '操作方法', '判定與計分': '判定とスコア', '食材圖鑑': '食材図鑑', '返回': '戻る', '← → 換頁': '← → ページ切替',
    '跟著節拍按按鈕': 'リズムに合わせてボタン', '食材會從左右兩邊丟到鐵板中央的金色框裡，落下的瞬間按下按鈕！': '食材が左右から鉄板中央の金色の枠に飛んできます。落ちた瞬間にボタンを押そう！',
    '先聽，再按': 'まず聴いて、それから押す', '食材丟出時會發出「咻～啵」提示音，2 拍之後落下。跟著音樂的節拍就對了。': '食材が投げられると「ヒュ～ポン」と合図。2 拍後に落ちてきます。音楽のリズムに乗ろう。',
    '湊齊四種食材': '4 種の食材をそろえよう', '炒麵、高麗菜、煎餅、培根各處理好 1 個，就會自動合成一份廣島燒，加 1000 分！': '焼きそば・キャベツ・生地・ベーコンを 1 つずつ仕上げると広島焼きが完成、1000 点ボーナス！',
    '越來越快': 'だんだん速く', '每 8 小節節奏加快一次，共 6 段，從 96 一路加速到 146 BPM。': '8 小節ごとにテンポアップ。全 6 段で 96 から 146 BPM まで加速します。',
    '遊戲結束時，分數進入前 20 名就能登錄姓名。': 'スコアが 20 位以内なら名前を登録できます。',
    '操作': '操作', '鍵盤': 'キーボード', '遊戲手把': 'ゲームパッド', '手機': 'スマホ',
    '處理食材': '食材を調理', '點擊畫面\n任何地方': '画面の\nどこでもタップ', '暫停': 'ポーズ', '右上\n⏸ 按鈕': '右上の\n⏸ ボタン',
    '選單移動': 'メニュー移動', '十字鍵\n左搖桿': '十字キー\n左スティック', '點選': 'タップ', '決定': '決定', '點擊按鈕': 'ボタンをタップ', '返回按鈕': '戻るボタン',
    '🎮 遊戲手把已連接': '🎮 ゲームパッド接続中', '🎮 遊戲手把：未連接（接上後按任一鍵即可使用）': '🎮 ゲームパッド：未接続（接続後どれかボタンを押すと使えます）',
    '打擊鍵按任何一顆都可以；在手機上點擊畫面任何地方都算（右上暫停鈕除外）。暫停後選「繼續遊戲」會先倒數 3 拍，再接回原本的節拍。': '打つボタンはどれでも OK。スマホは画面のどこをタップしても OK（右上のポーズボタンを除く）。ポーズから再開すると 3 拍カウントしてから元のリズムに戻ります。',
    '判定': '判定', '時間差': 'タイミング差', '得分': '得点', '±50ms 以內': '±50ms 以内', '±90ms 以內': '±90ms 以内', '±130ms 以內': '±130ms 以内', '太早／太晚／沒按': '早すぎ／遅すぎ／押さない',
    '連擊加分': 'コンボボーナス', '每次命中再加「連擊數 × 4」分（最多 +200）。BAD 會中斷連擊。': '成功するたびに「コンボ数 × 4」点を加算（最大 +200）。BAD でコンボが途切れます。',
    '廣島燒': '広島焼き', '四種食材各 1 個合成一份，+1000 分。': '4 種の食材 1 つずつで 1 枚完成、+1000 点。',
    '揮空不扣分': '空振りは減点なし', '沒有食材時按下按鈕只會揮空，可以放心跟著拍子按。': '食材がない時に押しても空振りするだけ。安心してリズムを刻もう。',
    '判定校正': 'タイミング調整', '如果總覺得判定偏早或偏晚，可以到「設定」調整。': '判定が早い・遅いと感じたら「せってい」で調整できます。',
    '主角動作：{0}': 'アクション：{0}', '提示音：{0}音「啵」': '合図：{0}の「ポン」', '低': '低い音', '中': '中くらいの音', '高': '高い音', '中高': 'やや高い音',
    '炒麵': '焼きそば', '高麗菜': 'キャベツ', '煎餅': '生地', '培根': 'ベーコン', '鍋鏟翻炒': 'ヘラで炒める', '切絲': '千切り', '淋醬': 'ソースをかける', '切塊': 'ひと口に切る',
    // 設定
    '音樂': 'BGM', '音效': '効果音', '總是判定偏晚 → 往＋調　偏早 → 往－調': '判定が遅れがち → ＋へ　早すぎ → －へ', '上一局平均：{0} {1}ms': '前回の平均：{0} {1}ms',
    '晚': '遅れ', '早': '早め', '震動': 'バイブ', '手機打擊時輕微震動': 'スマホで打つと軽く振動', '此裝置不支援震動': 'この端末は振動非対応', '返回遊戲': 'ゲームに戻る',
    '↑↓ 選擇　← → 調整': '↑↓ 選択　← → 調整', '語言': '言語',
    // 排行榜
    'LEADERBOARD（線上）': 'LEADERBOARD（オンライン）', 'LEADERBOARD（本機）': 'LEADERBOARD（この端末）', '名次': '順位', '姓名': '名前', '分數': 'スコア',
    '讀取中…': '読み込み中…', '無法連線，暫時無法顯示線上排行': '接続できません。オンラインランキングを表示できません', '返回主選單': 'メニューへ戻る',
    // CREDIT
    '製作名單': 'スタッフ', '企劃': '企画',
    // 結算
    '本日營業結束！': '本日の営業終了！', '完成的廣島燒': '完成した広島焼き', '平均時間差：{0} {1}ms': '平均タイミング差：{0} {1}ms',
    '進榜！請輸入你的姓名': 'ランクイン！名前を入力してね', '登錄': '登録', '略過': 'スキップ', '再玩一次': 'もう一回',
    '請將手機直立握持': 'スマホを縦に持ってください',
  },
  en: {
    'sub.start': 'はじめる', 'sub.howto': 'あそびかた', 'sub.ranking': 'ランキング', 'sub.settings': 'せってい', 'sub.credits': 'クレジット',
    '節奏熱炒遊戲': 'Rhythm Teppan Game', '開始遊戲': 'PLAY', '操作說明': 'HOW TO', '排行榜': 'RANKING', '設定': 'SETTINGS', 'CREDIT': 'CREDITS',
    '十字鍵 選擇　A 決定　B 返回': 'D-pad: select   A: OK   B: back', '點選按鈕': 'Tap a button', '↑↓ 選擇　ENTER 決定　ESC 返回': '↑↓ select   ENTER: OK   ESC: back',
    '繼續遊戲': 'RESUME', '重新開始': 'RESTART', '回主選單': 'MAIN MENU', '繼續後會先倒數 3 拍，再接回原本的節拍': 'Resuming counts in 3 beats, then picks up the beat',
    '跟著拍子準備！': 'Get ready on the beat!',
    '廣島燒完成！': 'Okonomiyaki done!', 'おしまい！': 'FINISH!', '{0} COMBO!': '{0} COMBO!',
    '遊戲規則': 'Rules', '操作方式': 'Controls', '判定與計分': 'Timing & Score', '食材圖鑑': 'Ingredients', '返回': 'BACK', '← → 換頁': '← → change page',
    '跟著節拍按按鈕': 'Press on the beat', '食材會從左右兩邊丟到鐵板中央的金色框裡，落下的瞬間按下按鈕！': 'Ingredients are tossed from the sides onto the golden frame on the griddle. Press the button the moment they land!',
    '先聽，再按': 'Listen, then press', '食材丟出時會發出「咻～啵」提示音，2 拍之後落下。跟著音樂的節拍就對了。': 'A "whoosh-pop" plays when an ingredient is tossed; it lands 2 beats later. Just follow the music!',
    '湊齊四種食材': 'Collect all four', '炒麵、高麗菜、煎餅、培根各處理好 1 個，就會自動合成一份廣島燒，加 1000 分！': 'Finish one each of noodles, cabbage, crepe and bacon to make an okonomiyaki: +1000 points!',
    '越來越快': 'Faster and faster', '每 8 小節節奏加快一次，共 6 段，從 96 一路加速到 146 BPM。': 'The tempo rises every 8 bars, 6 stages from 96 up to 146 BPM.',
    '遊戲結束時，分數進入前 20 名就能登錄姓名。': 'Make the top 20 to enter your name.',
    '操作': 'Action', '鍵盤': 'Keyboard', '遊戲手把': 'Gamepad', '手機': 'Phone',
    '處理食材': 'Cook', '點擊畫面\n任何地方': 'Tap\nanywhere', '暫停': 'Pause', '右上\n⏸ 按鈕': '⏸ button\ntop right',
    '選單移動': 'Move', '十字鍵\n左搖桿': 'D-pad\nleft stick', '點選': 'Tap', '決定': 'OK', '點擊按鈕': 'Tap button', '返回按鈕': 'BACK button',
    '🎮 遊戲手把已連接': '🎮 Gamepad connected', '🎮 遊戲手把：未連接（接上後按任一鍵即可使用）': '🎮 No gamepad (connect one and press any button)',
    '打擊鍵按任何一顆都可以；在手機上點擊畫面任何地方都算（右上暫停鈕除外）。暫停後選「繼續遊戲」會先倒數 3 拍，再接回原本的節拍。': 'Any hit key works. On phones, tap anywhere except the pause button. After pausing, RESUME counts in 3 beats and drops you back on the beat.',
    '判定': 'Grade', '時間差': 'Timing', '得分': 'Points', '±50ms 以內': 'within ±50ms', '±90ms 以內': 'within ±90ms', '±130ms 以內': 'within ±130ms', '太早／太晚／沒按': 'too early / late / missed',
    '連擊加分': 'Combo', '每次命中再加「連擊數 × 4」分（最多 +200）。BAD 會中斷連擊。': 'Each hit adds combo × 4 points (max +200). BAD breaks the combo.',
    '廣島燒': 'Okonomi', '四種食材各 1 個合成一份，+1000 分。': 'One of each ingredient makes one: +1000.',
    '揮空不扣分': 'No miss penalty', '沒有食材時按下按鈕只會揮空，可以放心跟著拍子按。': 'Pressing with nothing to cook is just a swing — tap along freely.',
    '判定校正': 'Timing offset', '如果總覺得判定偏早或偏晚，可以到「設定」調整。': 'If hits feel early or late, adjust it in SETTINGS.',
    '主角動作：{0}': 'Action: {0}', '提示音：{0}音「啵」': 'Cue: {0} "pop"', '低': 'low', '中': 'mid', '高': 'high', '中高': 'mid-high',
    '炒麵': 'Noodles', '高麗菜': 'Cabbage', '煎餅': 'Crepe', '培根': 'Bacon', '鍋鏟翻炒': 'Stir-fry', '切絲': 'Shred', '淋醬': 'Sauce', '切塊': 'Chop',
    '音樂': 'Music', '音效': 'Sound', '總是判定偏晚 → 往＋調　偏早 → 往－調': 'Hits judged late → ＋   early → －', '上一局平均：{0} {1}ms': 'Last game avg: {0} {1}ms',
    '晚': 'late', '早': 'early', '震動': 'Vibration', '手機打擊時輕微震動': 'Light vibration on hits (phone)', '此裝置不支援震動': 'Not supported on this device', '返回遊戲': 'BACK TO GAME',
    '↑↓ 選擇　← → 調整': '↑↓ select   ← → adjust', '語言': 'Language',
    'LEADERBOARD（線上）': 'LEADERBOARD (online)', 'LEADERBOARD（本機）': 'LEADERBOARD (this device)', '名次': 'Rank', '姓名': 'Name', '分數': 'Score',
    '讀取中…': 'Loading…', '無法連線，暫時無法顯示線上排行': 'Offline — online ranking unavailable', '返回主選單': 'MAIN MENU',
    '製作名單': 'STAFF', '企劃': 'Planning',
    '本日營業結束！': "That's a wrap for today!", '完成的廣島燒': 'Okonomiyaki made', '平均時間差：{0} {1}ms': 'Avg. timing: {0} {1}ms',
    '進榜！請輸入你的姓名': 'Top 20! Enter your name', '登錄': 'ENTER', '略過': 'SKIP', '再玩一次': 'PLAY AGAIN',
    '請將手機直立握持': 'Please hold your phone upright',
  },
};

function tr(s, ...args) {
  s = String(s);
  const L = I18N[Save.data.lang] || I18N.zh;
  let out = L[s] !== undefined ? L[s] : (I18N.zh[s] !== undefined ? I18N.zh[s] : s);
  args.forEach((a, i) => { out = out.split('{' + i + '}').join(a); });
  return out;
}
