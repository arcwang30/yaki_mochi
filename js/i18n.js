'use strict';

// ===== 多語系（中文 / 日本語 / English） =====
// 以中文原文為鍵；新增畫面文字時在 ja / en 補上翻譯即可（沒有翻譯時顯示中文原文）。
// 'sub.*' 為按鈕副標，各語言刻意用「另一種語言」當副標，增加屋台的趣味。
const LANGS = [['zh', '中文'], ['ja', '日本語'], ['en', 'English']];

const I18N = {
  zh: {
    'sub.start': 'START', 'sub.howto': 'HOW TO PLAY', 'sub.ranking': 'RANKING', 'sub.settings': 'SETTINGS', 'sub.credits': 'CREDIT', 'sub.tutorial': 'TUTORIAL',
  },
  ja: {
    'sub.start': 'START', 'sub.howto': 'HOW TO PLAY', 'sub.ranking': 'RANKING', 'sub.settings': 'SETTINGS', 'sub.credits': 'CREDIT', 'sub.tutorial': 'TUTORIAL',
    // 開始 / 主選單
    '節奏熱炒遊戲': 'リズム鉄板ゲーム', '開始遊戲': 'ゲーム開始', '操作說明': 'あそびかた', '排行榜': 'ランキング', '設定': 'せってい', 'CREDIT': 'クレジット',
    '十字鍵 選擇　A 決定　B 返回': '十字キー 選択　A 決定　B 戻る', '點選按鈕': 'ボタンをタップ', '↑↓ 選擇　ENTER 決定　ESC 返回': '↑↓ 選択　ENTER 決定　ESC 戻る',
    // 暫停
    '繼續遊戲': 'つづける', '重新開始': 'やりなおす', '回主選單': 'メニューへ', '返回選擇樂曲': '曲選択へ戻る', '繼續後會先倒數 3 拍，再接回原本的節拍': '再開時は 3 拍カウントしてから元のリズムに戻ります', '跟著拍子準備！': 'リズムに合わせて準備！',
    // 遊戲中
    '廣島燒完成！': '広島焼き完成！', '打烊囉！': 'おしまい！', '{0} COMBO!': '{0} COMBO!',
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
    '晚': '遅れ', '早': '早め', '震動': 'バイブ', '省電模式': '省電力モード', '每秒 30 幀・較低解析度・減少特效（判定不受影響）': '30fps・低解像度・エフェクト控えめ（判定に影響なし）', '手機打擊時輕微震動': 'スマホで打つと軽く振動', '此裝置不支援震動': 'この端末は振動非対応', '返回遊戲': 'ゲームに戻る',
    '↑↓ 選擇　← → 調整': '↑↓ 選択　← → 調整', '語言': '言語',
    // 排行榜
    'LEADERBOARD（線上）': 'LEADERBOARD（オンライン）', 'LEADERBOARD（本機）': 'LEADERBOARD（この端末）', '名次': '順位', '姓名': '名前', '分數': 'スコア',
    '讀取中…': '読み込み中…', '無法連線，暫時無法顯示線上排行': '接続できません。オンラインランキングを表示できません', '返回主選單': 'メニューへ戻る',
    // CREDIT
    '製作名單': 'スタッフ', '企劃': '企画', '特別感謝': 'スペシャルサンクス',
    // 結算
    '本日營業結束！': '本日の営業終了！', '完成的廣島燒': '完成した広島焼き', '平均時間差：{0} {1}ms': '平均タイミング差：{0} {1}ms',
    '進榜！請輸入你的姓名': 'ランクイン！名前を入力してね', '登錄': '登録', '略過': 'スキップ', '再玩一次': 'もう一回',
    '歡迎光臨！': 'いらっしゃいませ！',
    // 節奏評價
    '節奏評價': 'リズム評価', '特上': '特上', '上': '上', '並': '並', '見習': '見習', '修行': '修行',
    // 新手教學・滑動換頁
    '新手教學': 'チュートリアル', '左右滑動可以換頁': '左右スワイプでページ切替',
    '看準時機，按下去！': 'タイミングよく押そう！', '食材丟出時會「啵」一聲，2 拍後落進金色框。落下的瞬間按下按鈕（手機點畫面任何地方）！': '食材が投げられると「ポン」と鳴り、2 拍後に金色の枠へ落ちてくる。落ちた瞬間にボタンを押そう（スマホは画面のどこをタップしてもOK）！',
    '跟著拍子連續打': 'リズムに乗って連続で！', '節奏變密囉！跟著音樂「咚、咚」的拍子按，比盯著食材更準。': 'リズムが細かくなったよ！食材を見るより、音楽の「ドン、ドン」に合わせるのがコツ。',
    '做出廣島燒！': '広島焼きを作ろう！', '炒麵、高麗菜、煎餅、培根各處理 1 個，就會合成一份廣島燒，+1000 分！右上角可以看收集進度。': '焼きそば・キャベツ・生地・ベーコンを 1 つずつ仕上げると広島焼きが完成、+1000 点！右上で集まり具合を確認できるよ。',
    '就是現在！': '今だ！', '完成！': 'クリア！', '繼續練習': '練習を続ける', '從頭開始': '最初から', '略過教學': 'チュートリアルをスキップ',
    // 自動校正
    '自動校正': '自動補正', '用藍牙耳機會有延遲：按「自動校正」量一次就好': 'Bluetooth イヤホンは遅れが出ます：「自動補正」で一度測ってね',
    '戴上平常玩的耳機（藍牙也可以），聽到「叩」聲就跟著點畫面（或按任意鍵）。前 4 下是預備。': 'いつものイヤホンをつけて（Bluetooth もOK）、「コン」が聞こえたら画面をタップ（どのキーでもOK）。最初の 4 回は準備。',
    '預備…': '準備中…', '跟著聲音點！': '音に合わせてタップ！', '準備…': 'よーい…', '點擊次數不夠，再測一次吧': 'タップが足りません。もう一度測ってね',
    '測量完成！': '測定完了！', '延遲偏大（藍牙常見）': '遅れ大きめ（Bluetooth によくある）', '延遲很小': '遅れはほぼなし', '套用': '適用する', '再測一次': 'もう一度測る',
    '歡迎光臨！': 'いらっしゃいませ！', '只要一顆按鈕！先用一首慢歌，練習跟著節拍處理食材吧。': 'ボタンはひとつだけ！まずはゆっくりな曲で、リズムに合わせて食材をさばく練習をしよう。',
    '開始練習': '練習スタート', '教學完成！': 'チュートリアル完了！', '前往選擇樂曲': '曲をえらぶ', '再練習一次': 'もう一度練習',
    '跟著音樂的拍子按，比盯著食材更準': '食材を見るより、音楽の拍に合わせて押すのがコツ', '每 8 小節會 SPEED UP，節奏越來越快': '8 小節ごとに SPEED UP、どんどん速くなる',
    '連擊越多加分越多，BAD 會中斷連擊': 'コンボが続くほど高得点、BAD でコンボが途切れる', '四種食材湊齊就是一份廣島燒！': '4 種類そろえば広島焼きが 1 枚完成！',
    '傳說的鐵板之神': '伝説の鉄板神', '鍋鏟一揮，整條夜市都在排隊！大王KUNI 也要叫你一聲師父。': 'ヘラ一振りで夜市じゅうが大行列！大王KUNIも「師匠」と呼ぶレベル。',
    '人氣排隊名攤': '行列のできる人気屋台', '節奏又穩又帥，客人邊吃邊跟著打拍子，今晚又是完售！': 'リズムばっちり！お客さんも手拍子しながら完食、今夜も売り切れ！',
    '認真的見習生': 'がんばる見習い', '有模有樣！只是偶爾把高麗菜切成高麗「塊」……': 'なかなか様になってる！たまにキャベツが千切りじゃなくてブツ切りだけど……',
    '手忙腳亂的新人': 'てんやわんやの新人', '鍋鏟揮得比拍子還快，培根飛到隔壁章魚燒攤了！': 'ヘラがリズムより速すぎて、ベーコンがお隣のたこ焼き屋まで飛んでった！',
    '鐵板上的災難': '鉄板の上の大惨事', '客人默默轉身去吃章魚燒了……明天再來練練吧！': 'お客さんは黙ってたこ焼き屋へ……また明日修行しよう！',
    // 選曲
    '選擇樂曲': '曲をえらぶ', '試聽中': '試聴中', '點兩下卡片也可以開始': 'カードを2回タップでもスタート', '↑↓ 選曲　← → 換頁　ENTER 開始': '↑↓ 選曲　← → ページ　ENTER スタート',
    '← → 切換樂曲': '← → 曲を切替', '每 8 小節節奏加快一次。共 10 首樂曲（2 集），每集 1～5 星，星越多越快、越難。': '8 小節ごとにテンポアップ。全 10 曲（2 集）、各集 ★1～5、★が多いほど速くて難しい。',
    // 安裝到主畫面
    '安裝到主畫面': 'ホーム画面に追加', '已經是 APP 模式': 'アプリとして起動中', '變成 APP，全螢幕、離線也能玩': 'アプリ化：全画面・オフラインでも遊べる', '教學 ▶': '手順 ▶',
    '安裝後可以從主畫面直接開啟：全螢幕、開啟更快，沒有網路也能玩。': 'ホーム画面から直接起動できます。全画面で、起動も速く、オフラインでも遊べます。',
    '✓ 目前已經是 APP 模式': '✓ アプリとして起動中です', '立即安裝': '今すぐインストール', '你的裝置': 'この端末',
    'iPhone／iPad（Safari）': 'iPhone／iPad（Safari）', 'Android（Chrome）': 'Android（Chrome）', '電腦（Chrome／Edge）': 'パソコン（Chrome／Edge）',
    '點畫面下方的「分享」按鈕 ⬆': '画面下の「共有」ボタン ⬆ をタップ', '往下滑，選「加入主畫面」': '下にスクロールして「ホーム画面に追加」', '按右上角「新增」就完成了': '右上の「追加」で完了',
    '※ 請用 Safari 開啟本頁': '※ Safari でこのページを開いてください',
    '點右上角的「︙」選單': '右上の「︙」メニューをタップ', '選「安裝應用程式」或「加到主畫面」': '「アプリをインストール」または「ホーム画面に追加」', '按「安裝」就完成了': '「インストール」で完了',
    '點網址列右邊的「安裝」圖示 ⊕': 'アドレスバー右の「インストール」アイコン ⊕', '按「安裝」，桌面就會出現圖示': '「インストール」でデスクトップにアイコンが出ます',
    '請將手機直立握持': 'スマホを縦に持ってください',
  },
  en: {
    'sub.start': 'はじめる', 'sub.howto': 'あそびかた', 'sub.ranking': 'ランキング', 'sub.settings': 'せってい', 'sub.credits': 'クレジット', 'sub.tutorial': 'れんしゅう',
    '節奏熱炒遊戲': 'Rhythm Teppan Game', '開始遊戲': 'PLAY', '操作說明': 'HOW TO', '排行榜': 'RANKING', '設定': 'SETTINGS', 'CREDIT': 'CREDITS',
    '十字鍵 選擇　A 決定　B 返回': 'D-pad: select   A: OK   B: back', '點選按鈕': 'Tap a button', '↑↓ 選擇　ENTER 決定　ESC 返回': '↑↓ select   ENTER: OK   ESC: back',
    '繼續遊戲': 'RESUME', '重新開始': 'RESTART', '回主選單': 'MAIN MENU', '返回選擇樂曲': 'SONG SELECT', '繼續後會先倒數 3 拍，再接回原本的節拍': 'Resuming counts in 3 beats, then picks up the beat',
    '跟著拍子準備！': 'Get ready on the beat!',
    '廣島燒完成！': 'Okonomiyaki done!', '打烊囉！': "That's all!", '{0} COMBO!': '{0} COMBO!',
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
    '晚': 'late', '早': 'early', '震動': 'Vibration', '省電模式': 'Battery Saver', '每秒 30 幀・較低解析度・減少特效（判定不受影響）': '30 fps, lower resolution, fewer effects (timing unaffected)', '手機打擊時輕微震動': 'Light vibration on hits (phone)', '此裝置不支援震動': 'Not supported on this device', '返回遊戲': 'BACK TO GAME',
    '↑↓ 選擇　← → 調整': '↑↓ select   ← → adjust', '語言': 'Language',
    'LEADERBOARD（線上）': 'LEADERBOARD (online)', 'LEADERBOARD（本機）': 'LEADERBOARD (this device)', '名次': 'Rank', '姓名': 'Name', '分數': 'Score',
    '讀取中…': 'Loading…', '無法連線，暫時無法顯示線上排行': 'Offline — online ranking unavailable', '返回主選單': 'MAIN MENU',
    '製作名單': 'STAFF', '企劃': 'Planning', '特別感謝': 'Special Thanks',
    '本日營業結束！': "That's a wrap for today!", '完成的廣島燒': 'Okonomiyaki made', '平均時間差：{0} {1}ms': 'Avg. timing: {0} {1}ms',
    '進榜！請輸入你的姓名': 'Top 20! Enter your name', '登錄': 'ENTER', '略過': 'SKIP', '再玩一次': 'PLAY AGAIN',
    '歡迎光臨！': 'Welcome!',
    '節奏評價': 'RHYTHM RATING', '特上': 'S', '上': 'A', '並': 'B', '見習': 'C', '修行': 'D',
    // Tutorial / swipe paging
    '新手教學': 'TUTORIAL', '左右滑動可以換頁': 'Swipe left / right to change page',
    '看準時機，按下去！': 'Hit it on time!', '食材丟出時會「啵」一聲，2 拍後落進金色框。落下的瞬間按下按鈕（手機點畫面任何地方）！': 'Each ingredient is thrown with a "pop" and lands in the gold frame 2 beats later. Press the button the moment it lands (on phones, tap anywhere)!',
    '跟著拍子連續打': 'Keep the beat going', '節奏變密囉！跟著音樂「咚、咚」的拍子按，比盯著食材更準。': 'More notes now! Tap along with the beat of the music - it works better than watching the food.',
    '做出廣島燒！': 'Make an okonomiyaki!', '炒麵、高麗菜、煎餅、培根各處理 1 個，就會合成一份廣島燒，+1000 分！右上角可以看收集進度。': 'Prep one each of noodles, cabbage, crepe and bacon to make an okonomiyaki: +1000! Your stock is shown at the top right.',
    '就是現在！': 'NOW!', '完成！': 'CLEAR!', '繼續練習': 'CONTINUE', '從頭開始': 'RESTART', '略過教學': 'SKIP TUTORIAL',
    // Auto calibration
    '自動校正': 'AUTO CALIBRATE', '用藍牙耳機會有延遲：按「自動校正」量一次就好': 'Bluetooth audio lags: run AUTO CALIBRATE once',
    '戴上平常玩的耳機（藍牙也可以），聽到「叩」聲就跟著點畫面（或按任意鍵）。前 4 下是預備。': 'Put on the headphones you play with (Bluetooth is fine) and tap the screen (or any key) on each "tock". The first 4 are a warm-up.',
    '預備…': 'Warm-up…', '跟著聲音點！': 'Tap with the sound!', '準備…': 'Get ready…', '點擊次數不夠，再測一次吧': 'Not enough taps - try again',
    '測量完成！': 'Done!', '延遲偏大（藍牙常見）': 'Big delay (common with Bluetooth)', '延遲很小': 'Very little delay', '套用': 'APPLY', '再測一次': 'MEASURE AGAIN',
    '歡迎光臨！': 'Welcome!', '只要一顆按鈕！先用一首慢歌，練習跟著節拍處理食材吧。': 'Just one button! Practice prepping ingredients to the beat with a slow song first.',
    '開始練習': 'START', '教學完成！': 'TUTORIAL CLEAR!', '前往選擇樂曲': 'PICK A SONG', '再練習一次': 'PRACTICE AGAIN',
    '跟著音樂的拍子按，比盯著食材更準': 'Tap to the beat of the music, not the food', '每 8 小節會 SPEED UP，節奏越來越快': 'Every 8 bars: SPEED UP!',
    '連擊越多加分越多，BAD 會中斷連擊': 'Longer combos score more; BAD breaks the combo', '四種食材湊齊就是一份廣島燒！': 'All 4 ingredients = one okonomiyaki!',
    '傳說的鐵板之神': 'Legendary Griddle God', '鍋鏟一揮，整條夜市都在排隊！大王KUNI 也要叫你一聲師父。': 'One flip of your spatula and the whole night market lines up. Even Daio KUNI calls you master!',
    '人氣排隊名攤': 'Famous Line-Up Stall', '節奏又穩又帥，客人邊吃邊跟著打拍子，今晚又是完售！': 'Smooth and stylish! Customers clap along while they eat. Sold out again tonight!',
    '認真的見習生': 'Earnest Apprentice', '有模有樣！只是偶爾把高麗菜切成高麗「塊」……': 'Looking good! Though some of that shredded cabbage came out as cabbage chunks...',
    '手忙腳亂的新人': 'Frantic Rookie', '鍋鏟揮得比拍子還快，培根飛到隔壁章魚燒攤了！': 'Your spatula outran the beat and the bacon landed at the takoyaki stall next door!',
    '鐵板上的災難': 'Griddle Disaster', '客人默默轉身去吃章魚燒了……明天再來練練吧！': 'The customers quietly left for takoyaki... Practice again tomorrow!',
    '選擇樂曲': 'SONGS', '試聽中': 'preview', '點兩下卡片也可以開始': 'Tap a card twice to start', '↑↓ 選曲　← → 換頁　ENTER 開始': '↑↓ song   ← → page   ENTER: start',
    '← → 切換樂曲': '← → change song', '每 8 小節節奏加快一次。共 10 首樂曲（2 集），每集 1～5 星，星越多越快、越難。': 'The tempo rises every 8 bars. 10 songs in 2 volumes, 1-5 ★ each; more ★ = faster and harder.',
    '安裝到主畫面': 'Add to Home Screen', '已經是 APP 模式': 'Running as an app', '變成 APP，全螢幕、離線也能玩': 'Full screen app, works offline', '教學 ▶': 'HOW ▶',
    '安裝後可以從主畫面直接開啟：全螢幕、開啟更快，沒有網路也能玩。': 'Launch it straight from your home screen: full screen, faster to open, and playable offline.',
    '✓ 目前已經是 APP 模式': '✓ Already running as an app', '立即安裝': 'INSTALL NOW', '你的裝置': 'Your device',
    'iPhone／iPad（Safari）': 'iPhone / iPad (Safari)', 'Android（Chrome）': 'Android (Chrome)', '電腦（Chrome／Edge）': 'PC (Chrome / Edge)',
    '點畫面下方的「分享」按鈕 ⬆': 'Tap the Share button ⬆ at the bottom', '往下滑，選「加入主畫面」': 'Scroll down, choose "Add to Home Screen"', '按右上角「新增」就完成了': 'Tap "Add" at the top right — done!',
    '※ 請用 Safari 開啟本頁': '* Open this page in Safari',
    '點右上角的「︙」選單': 'Tap the "︙" menu at the top right', '選「安裝應用程式」或「加到主畫面」': 'Choose "Install app" or "Add to Home screen"', '按「安裝」就完成了': 'Tap "Install" — done!',
    '點網址列右邊的「安裝」圖示 ⊕': 'Click the install icon ⊕ in the address bar', '按「安裝」，桌面就會出現圖示': 'Click "Install" — an icon appears on your desktop',
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
