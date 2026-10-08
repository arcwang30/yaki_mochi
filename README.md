# 大王焼き リズム屋台

用一顆按鈕玩的日式祭典風節奏遊戲（參考《節奏天國》）：食材從左右兩邊丟到鐵板上，跟著節拍按下按鈕處理食材，湊齊四種就合成一份廣島燒。
9:16 直式，純 HTML/CSS/JS（Canvas），不需要任何建構工具；音樂與音效全部在瀏覽器即時合成。

## 執行

- 直接雙擊 `index.html` 也能玩（部分瀏覽器對音效 / 字型較嚴格，建議用本機伺服器）
- 本機伺服器（免安裝 Node / Python）：

```
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```

然後開啟 http://localhost:5173
- 網址加 `?fast` 每段只有 3 小節（約 40 秒一局），方便測試結算與排行榜流程。

## 資料夾結構

| 路徑 | 說明 |
| --- | --- |
| `index.html` | 進入頁面 |
| `css/style.css` | 版面、縮放、姓名輸入框 |
| `js/config.js` | 全域參數（判定時間窗、計分、BPM、節奏型、食材、製作名單）— **調整難度改這裡** |
| `js/game.js` | 遊戲核心（譜面產生、可暫停的樂曲時鐘、判定、主角姿勢、特效、HUD） |
| `js/screens.js` | 畫面管理與各畫面：開始、主選單、遊戲 / 暫停、操作說明、設定、排行榜、CREDIT、結算 |
| `js/audio.js` | 即時合成的樂器、音效與選單音樂（音量 0~5） |
| `js/input.js` | 鍵盤 / 遊戲控制器 / 滑鼠與觸控 |
| `js/ui.js` | 即時模式 UI（按鈕、面板、標題帶） |
| `js/assets.js` | 圖片載入與繪圖小工具 |
| `js/save.js` | 設定與本機排行榜（localStorage） |
| `js/online.js`, `js/firebase-config.js` | 線上排行榜（選用） |
| `assets/images/` | 遊戲用圖（已去背、裁切、壓縮） |
| `assets/source/` | 原始圖片（企畫附圖、Excel 內的圖） |
| `tools/` | `serve.ps1` 本機伺服器、`build.ps1` 封裝、`prep.html` + `prep_server.ps1` 素材前處理 |
| `docs/企畫書.md` | 遊戲企畫 |
| `firebase/firestore.rules` | 線上排行榜的 Firestore 規則 |
| `prototypes/stack-flip/` | 早期雛形「疊料＋翻面」 |
| `builds/` | 封裝發佈版本（zip），**不進 git** |

## 操作

| 操作 | 鍵盤 | 遊戲手把（Xbox 標準配置） | 手機 |
| --- | --- | --- | --- |
| 處理食材（打擊） | SPACE / ENTER / F / J / D / K | A / B / X / Y / LB / RB / LT / RT | 點擊畫面任何地方 |
| 暫停 | ESC / P | START | 右上 ⏸ 按鈕 |
| 選單移動 | ↑↓←→ / WASD | 十字鍵 / 左搖桿 | 點選 |
| 決定 | ENTER / SPACE | A | 點擊按鈕 |
| 返回 | ESC / BACKSPACE | B / BACK | 返回按鈕 |

- 判定以「按下瞬間」的事件時間戳記計算，不受畫面更新率影響；並扣除音訊輸出延遲與「設定 → 判定校正」。
- 暫停時樂曲時鐘停止、聲音立即靜音；繼續時依當下速度倒數 3 拍，倒數對齊原本的拍點後接回樂曲。
- 切到其他分頁、視窗失去焦點、手機轉成橫向時會自動暫停。

## 換圖

1. 把新圖用同樣的檔名放進 `assets/source/`
2. 執行 `powershell -ExecutionPolicy Bypass -File tools\prep_server.ps1`
3. 用瀏覽器打開 http://localhost:5174/tools/prep.html，會自動去白底、裁切、縮圖並寫入 `assets/images/`

主角跳躍姿勢（`chef_great`、`chef_cheer`）原圖人物較小，遊戲內以 `js/config.js` 的 `POSE_ADJ` 放大對齊；換成大小一致的圖時把對應設定刪掉。

## 版本控制與封裝

```
powershell -ExecutionPolicy Bypass -File tools\build.ps1 -Version 0.1.0
```

會產生 `builds\DaioYaki_v0.1.0.zip`（只含遊戲執行需要的檔案，可上傳 itch.io 等平台）。`builds/` 內容不會被 git 追蹤。

## 線上排行榜（Firebase Firestore，選用）

`js/firebase-config.js` 留空時自動使用本機排行榜（存在瀏覽器）。要開啟全球排行榜：

1. Firebase 主控台建立 Firestore Database。
2. 「規則」貼上 `firebase/firestore.rules` 的內容並發布。
3. 專案設定 → 一般 → 您的應用程式 → 新增網頁應用程式，把 SDK 設定貼進 `js/firebase-config.js`。
4. 集合 `leaderboard` 會在第一筆成績送出時自動建立。

`apiKey` 為公開資訊，安全性由 Firestore 規則把關。
