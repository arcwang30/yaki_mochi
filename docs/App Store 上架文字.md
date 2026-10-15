# App Store 上架文字

App Store Connect 各欄位要填的文字，三個語系：**繁體中文（zh-Hant）**、**日文（ja）**、**英文（en-US）**。
每個欄位放在程式碼框裡，直接複製貼上。字數上限與實際字數在每節的表格裡（用 `tools/check-store-text.ps1` 檢查）。

> 定價：App 本體**免費下載**（內建 15 首免費暢玩），追加樂曲 VOL.1～3 用 App 內購買。內購價格在 App Store Connect 設定，文字裡不寫價格。
>
> 名稱：**暫定**，之後可能會改。改名時要一起改的地方見文末「改名清單」。

## 共用設定（不分語系）

| 欄位 | 填什麼 |
| --- | --- |
| 主要類別 | 遊戲 → **音樂**（Games → Music） |
| 次要類別 | 遊戲 → **休閒**（Games → Casual） |
| 版權 | `2026 Arc Concept Games` |
| 隱私權政策網址 | `https://arcconceptgames.github.io/daioyaki/privacy/`（日文、英文語系加 `?lang=ja`、`?lang=en`） |
| 支援網址 | `https://arcconceptgames.github.io/daioyaki/support/`（同上加 `?lang=`） |
| 行銷網址 | `https://arcconceptgames.github.io/` |
| App 隱私權 | 未收集資料（Data Not Collected） |
| 年齡分級 | 問卷全部選「無」→ 預期是最低分級（4+） |

**注意**：關鍵字和說明裡**不要**出現其他遊戲的名稱（例如參考作品），會違反審核規定 2.3.7。

---

## 繁體中文（zh-Hant）

| 欄位 | 上限 | 字數 |
| --- | --- | --- |
| 名稱 | 30 | 10 |
| 副標題 | 30 | 14 |
| 宣傳文字 | 170 | 67 |
| 關鍵字 | 100 | 61 |
| 說明 | 4000 | 581 |

**名稱**
```
大王焼き リズム屋台
```

**副標題**
```
一顆按鈕，跟著節拍做廣島燒！
```

**宣傳文字**（可以隨時改，不用送審）
```
食材從左右飛來，落在鐵板的瞬間按下按鈕！只用一顆按鈕的日式屋台節奏遊戲。內建 15 首原創樂曲免費暢玩，三種難度從新手到高手都能挑戰。
```

**關鍵字**（逗號分隔、不要空格；名稱和副標題裡的字不用重複）
```
音樂,音遊,節奏,打擊,休閒,御好燒,大阪燒,料理,日式,和風,祭典,夜市,鐵板,太鼓,單鍵,點擊,反應,原創,音感,手速
```

**說明**
```
食材從畫面左右兩邊拋向鐵板，在落下的瞬間按下按鈕！
炒麵、高麗菜、煎餅、培根，四種食材各處理好一個，就會合成一份香噴噴的廣島燒。

《大王焼き リズム屋台》是只用一顆按鈕就能玩的日式屋台節奏遊戲。食材丟出時會發出「咻～啵」的提示音，兩拍之後落下——先聽、再按，跟著音樂的節拍就對了。

■ 一顆按鈕，誰都能上手
・不用記複雜的操作，點畫面就能玩
・沒有食材時按下也不扣分，可以放心跟著節拍按
・新手教學一步一步帶你掌握節奏

■ 原創樂曲
・內建 15 首原創樂曲，免費暢玩：Lo-fi、巴薩諾瓦、祭典太鼓、搖擺爵士、斯卡、動漫流行、8-bit……
・追加樂曲包 VOL.1～VOL.3（各 10 首）可另外購買，風格更多元
・每首歌都有「簡單」「普通」「困難」三種難度
・每 8 小節節奏加快一次，越到後面越刺激

■ 越玩越有收穫
・55 個成就等你解鎖
・用遊玩得到的遊戲幣，在商店收集店面背景、陪伴寵物、打擊音效
・節奏分析：記錄你每一下的時間差，給你音感等級與練習建議
・獲得好成績時，一鍵產生成績圖分享給朋友

■ 貼心設計
・判定校正：用藍牙耳機也能自動校正延遲
・支援 iPhone 與 iPad，iPad 直式遊玩，兩側有廣島燒掛簾與燈籠
・沒有廣告，離線也能玩
・中文／日本語／English／한국어

準備好了嗎？鐵板已經熱好了，一起來做廣島燒吧！
```

**App 內購買項目**（App Store Connect → 營利 → App 內購買項目 → 各商品的「在地化版本」）

| 商品 ID | 顯示名稱（上限 30） | 描述（上限 45） |
| --- | --- | --- |
| `com.arcconceptgames.daioyaki.vol1` | `追加樂曲 VOL.1` | `解鎖 10 首新樂曲，每首都有三種難度。` |
| `com.arcconceptgames.daioyaki.vol2` | `追加樂曲 VOL.2` | `解鎖 10 首新樂曲，每首都有三種難度。` |
| `com.arcconceptgames.daioyaki.vol3` | `追加樂曲 VOL.3` | `解鎖 10 首新樂曲，每首都有三種難度。` |

---

## 日本語（ja）

| 欄位 | 上限 | 字數 |
| --- | --- | --- |
| 名稱 | 30 | 10 |
| 副標題 | 30 | 16 |
| 宣傳文字 | 170 | 90 |
| 關鍵字 | 100 | 68 |
| 說明 | 4000 | 722 |

**名稱**
```
大王焼き リズム屋台
```

**副標題**
```
ボタンひとつで広島焼きを作ろう！
```

**宣傳文字**
```
左右から飛んでくる食材が鉄板に落ちる瞬間、ボタンを押せ！ボタンひとつで遊べる和風屋台リズムゲーム。収録曲 15 曲は無料で遊び放題、3 つの難易度で初心者から上級者まで楽しめます。
```

**關鍵字**
```
音ゲー,音楽,リズムゲーム,タップ,カジュアル,お好み焼き,料理,和風,祭り,夜店,鉄板,太鼓,ワンボタン,簡単,オリジナル曲,反射神経
```

**說明**
```
画面の左右から鉄板めがけて食材が飛んでくる！落ちる瞬間にボタンを押そう。
焼きそば、キャベツ、生地、ベーコン、4 種類の食材をひとつずつ仕上げると、アツアツの広島焼きが完成！

『大王焼き リズム屋台』は、ボタンひとつで遊べる和風屋台リズムゲーム。食材が投げられるときに「ヒュ～ポン」と合図の音が鳴り、2 拍後に落ちてきます。まず聴いて、それから押す。音楽のリズムに乗ればOK！

■ ボタンひとつで誰でも遊べる
・難しい操作は不要、画面をタップするだけ
・食材がないときに押してもペナルティなし、安心してリズムに乗れる
・チュートリアルでリズムのコツをていねいに解説

■ オリジナル楽曲
・収録曲 15 曲は無料で遊び放題：Lo-fi、ボサノバ、祭り太鼓、スウィングジャズ、スカ、アニソン風ポップ、8-bit……
・追加楽曲パック VOL.1～VOL.3（各 10 曲）を別途購入できます
・全曲に「かんたん」「ふつう」「むずかしい」の 3 つの難易度
・8 小節ごとにテンポアップ、後半ほど熱くなる！

■ 遊ぶほど楽しみが広がる
・55 個の実績
・プレイで貯めたコインで、ショップの屋台の背景・おともペット・打撃音を集めよう
・リズム分析：1 打ごとのズレを記録して、音感レベルと練習のアドバイスを表示
・好成績はワンタップで成績画像にしてシェア

■ うれしい機能
・タイミング調整：Bluetooth イヤホンの遅延も自動補正
・iPhone と iPad に対応。iPad は縦画面で、左右にのれんと提灯を飾ります
・広告なし、オフラインでも遊べる
・日本語／中文／English

鉄板はもうアツアツ。さあ、広島焼きを作ろう！
```

**App 内課金**

| 商品 ID | 表示名（上限 30） | 説明（上限 45） |
| --- | --- | --- |
| `com.arcconceptgames.daioyaki.vol1` | `追加楽曲 VOL.1` | `新曲 10 曲を解放。全曲 3 つの難易度で遊べます。` |
| `com.arcconceptgames.daioyaki.vol2` | `追加楽曲 VOL.2` | `新曲 10 曲を解放。全曲 3 つの難易度で遊べます。` |
| `com.arcconceptgames.daioyaki.vol3` | `追加楽曲 VOL.3` | `新曲 10 曲を解放。全曲 3 つの難易度で遊べます。` |

---

## English (en-US)

| 欄位 | 上限 | 字數 |
| --- | --- | --- |
| 名稱 | 30 | 22 |
| 副標題 | 30 | 29 |
| 宣傳文字 | 170 | 160 |
| 關鍵字 | 100 | 99 |
| 說明 | 4000 | 1556 |

**Name**
```
Daio-yaki Rhythm Yatai
```

**Subtitle**
```
One-button okonomiyaki beats!
```

**Promotional Text**
```
Ingredients fly in from both sides. Tap the moment they hit the griddle! A one-button rhythm game at a Japanese food stall, with 15 original songs free to play.
```

**Keywords**
```
music,beat,tap,casual,cooking,okonomiyaki,japanese,festival,food,stall,chef,taiko,one button,timing
```

**Description**
```
Ingredients come flying at the griddle from both sides of the screen. Tap the button the moment they land!
Prep one each of noodles, cabbage, crepe, and bacon, and they come together into a sizzling okonomiyaki.

Daio-yaki Rhythm Yatai is a one-button rhythm game set at a Japanese food stall. Every ingredient is thrown with a "whoosh-pop" cue and lands two beats later. Listen first, then tap: just ride the beat.

■ ONE BUTTON, ANYONE CAN PLAY
- No complicated controls. Just tap the screen
- Tapping when nothing's there costs you nothing, so you can tap along freely
- A step-by-step tutorial teaches you the rhythm

■ ORIGINAL MUSIC
- 15 original songs, free to play: lo-fi, bossa nova, festival taiko, swing jazz, ska, anime pop, 8-bit, and more
- Song Packs VOL.1 to VOL.3 (10 songs each) are available as in-app purchases
- Every song has Easy, Normal, and Hard difficulties
- The tempo rises every 8 bars, so it heats up as you go

■ MORE YOU PLAY, MORE YOU GET
- 55 achievements to unlock
- Earn coins as you play and collect stall styles, pet buddies, and hit sounds in the shop
- Rhythm analysis tracks how early or late every tap was, then gives you a rhythm rank and practice tips
- Turn a great run into a score image and share it in one tap

■ THOUGHTFUL TOUCHES
- Timing calibration, with auto-calibrate for Bluetooth headphone lag
- Built for iPhone and iPad. On iPad you play in portrait, framed by okonomiyaki banners and lanterns
- No ads, and you can play offline
- English / 中文 / 日本語

The griddle's hot. Let's make some okonomiyaki!
```

**In-App Purchases**

| Product ID | Display Name (max 30) | Description (max 45) |
| --- | --- | --- |
| `com.arcconceptgames.daioyaki.vol1` | `Song Pack VOL.1` | `Unlock 10 new songs with 3 difficulties each.` |
| `com.arcconceptgames.daioyaki.vol2` | `Song Pack VOL.2` | `Unlock 10 new songs with 3 difficulties each.` |
| `com.arcconceptgames.daioyaki.vol3` | `Song Pack VOL.3` | `Unlock 10 new songs with 3 difficulties each.` |

---

## 給審核人員的備註（App Review Information → Notes，英文）

```
No account or login is required.
In-app purchases (Song Packs VOL.1-VOL.3, non-consumable) are in the main menu: SHOP > Song Packs. The same screen has a Restore Purchases button.
The 15 built-in songs are free and playable right away. Tap the screen (one button) when ingredients land on the griddle.
The game plays audio even when the device is in silent mode, because music is essential to gameplay.
```

---

## 改名清單（遊戲名稱確定後）

**不用改、也不能改的**：Bundle ID `com.arcconceptgames.daioyaki`、內購商品 ID（`….daioyaki.vol1` 等）、網站網址的 `/daioyaki/`。這些玩家看不到，而且 Bundle ID 與商品 ID 註冊後不能改。

**App Store Connect**
- 每個語系的「名稱」（30 字內，全 App Store 不能和別人重複）
- 說明、宣傳文字裡提到名稱的句子（本文件三個語系的「說明」開頭第三段都有）
- 注意：送審過的版本改名稱要跟新版本一起送審

**遊戲裡的文字**（`git grep -n "大王焼き"` 可以全部找出來）

| 檔案 | 內容 |
| --- | --- |
| `capacitor.config.json` 的 `appName` | 主畫面 App 圖示下面的名字（改完要 `npm run sync`） |
| `index.html` | 網頁標題 |
| `js/share.js` | 成績圖上的大標題、分享文字 |
| `js/i18n.js` | 分享文字的日文、英文翻譯（兩處） |
| `js/screens.js` | CREDIT 畫面的遊戲名稱 |

**圖片裡畫著名稱的**（要重畫或重新製作）
- 屋台招牌「大王焼」：`assets/images/bg_stall.jpg` 與各店面背景 `bg_*.jpg`
- 主角圍裙上的字：`assets/images/chef_*.png`
- App 圖示：`assets/icons/`、`site/daioyaki/icon.png`，以及 Xcode 裡的 AppIcon
- 宣傳圖：`promo/`

**公開網站** `site/`：三個頁面的標題、作品名稱（中日英），改完執行 `bash tools/deploy-site.sh "改名"`

**文件**：`README.md`、`docs/企畫書.md`、本文件
