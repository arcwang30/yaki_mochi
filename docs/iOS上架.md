# iOS App 上架

網頁版維持原樣（不需要 Node）；iOS App 用 [Capacitor](https://capacitorjs.com/) 把同一份遊戲包進原生殼。以下步驟都在 **Mac** 上做。

## 需要的工具

- Xcode（App Store 最新要求的版本）＋ Command Line Tools
- Node.js LTS（`brew install node` 或到 nodejs.org 下載）

## 第一次設定

```sh
npm install @capacitor/core @capacitor/ios @capacitor/haptics @capacitor/share @capacitor/filesystem @capgo/native-purchases @fontsource/mochiy-pop-one
npm install -D @capacitor/cli
npm run build            # 產生 www/
npx cap add ios          # 產生 Xcode 專案 ios/
npm run ios:setup        # 設定 Info.plist（方向、狀態列、加密合規）
npx cap open ios         # 開 Xcode
```

裝好後 `package.json` 會多出套件版本，連同 `package-lock.json`、`ios/` 一起進 git。

在 Xcode 裡：

1. 左邊點 **App** 專案 → TARGETS **App** → **Signing & Capabilities**：Team 選自己的開發者帳號（帳號還沒核准前可以先用個人 Apple ID 在實機測試）
2. **General** → Supported Destinations：確認有 iPhone、iPad；Minimum Deployments 用預設即可
3. App 圖示：**App/Assets → AppIcon**，放 1024×1024 的圖（不可透明、不可圓角）
4. **Signing & Capabilities** → 左上 **+ Capability** → 加入 **In-App Purchase**

## 平常改完遊戲之後

```sh
npm run sync             # 重新產生 www/ 並複製進 Xcode 專案
```

然後在 Xcode 按 ▶ 執行（模擬器或接上的 iPhone / iPad）。

## 設定說明

| 項目 | 位置 | 內容 |
| --- | --- | --- |
| Bundle ID | `capacitor.config.json` 的 `appId` | `com.arcconceptgames.daioyaki`。**在 App Store Connect 註冊後就不能改**，要換請在 `npx cap add ios` 之前改好 |
| App 名稱（主畫面下方的字） | `capacitor.config.json` 的 `appName` | 大王焼き |
| 方向 | `tools/ios-setup.mjs` | iPhone 直式；iPad 直式＋倒立直式（左右空白掛廣島燒掛簾與燈籠，見 `js/sides.js`；點兩側也算打擊） |
| 原生版判斷 | `js/config.js` 的 `NATIVE_APP` | 不註冊 Service Worker、不顯示「安裝到主畫面」、忽略網址測試參數（`?fast`、`?shop=test` 等） |
| 字型 | `tools/build-web.mjs` | 改用 App 內附的 Mochiy Pop One（OFL 授權），不連 Google Fonts |

## iOS 原生功能（`js/native.js`）

App 版才會用到；網頁版行為不變。官方外掛（Haptics、Share、Filesystem）由 `npx cap sync` 自動加進 Xcode 專案，JS 這邊用 `Capacitor.registerPlugin` 直接呼叫原生。

| 項目 | 做法 |
| --- | --- |
| 震動 | iPhone 用觸覺回饋（打中＝輕、失誤＝中）；iPad 沒有觸覺引擎，設定裡顯示「此裝置不支援震動」 |
| 分享成績圖 | 寫成暫存檔，叫出 iOS 分享選單（LINE、IG、存到照片…） |
| 匯出存檔碼 | 複製到剪貼簿，同時叫出分享選單（可以存成 `daioyaki-save.txt` 到「檔案」或傳給自己） |
| 存檔備份 | 每次存檔（1 秒內合併）另寫一份 `Library/save.json`（跟著 iCloud 備份）；切到背景時立刻寫。iOS 清掉 localStorage 時，下次開啟自動從備份還原 |
| 靜音開關 | 打開靜音開關也有聲音（`navigator.audioSession.type = 'playback'`，iOS 16.4+）；會暫停其他 App 正在播的音樂 |
| 音訊被打斷 | 來電、Siri、鬧鐘：遊戲自動暫停，回來後點一下就恢復聲音 |

測試清單（實機 iPhone 為主）：

| 測試 | 預期 |
| --- | --- |
| 打開靜音開關玩一首 | 有聲音 |
| 玩到一半叫 Siri／打電話進來 | 遊戲暫停；回來按繼續，音樂和判定正常 |
| 玩到一半切到背景再回來 | 遊戲暫停、沒有聲音殘留 |
| 設定 → 震動開關、遊玩中打擊 | iPhone 有觸覺回饋；iPad 顯示不支援 |
| 結算 → 分享 | 出現分享選單，圖片正確；取消也不會出錯 |
| 設定 → 存檔備份 → 匯出 | 出現分享選單（可存到「檔案」）；提示已複製；到「備忘錄」貼上是一串 `DAIOYAKI1.` 開頭的碼 |
| 匯入剛剛的存檔碼 | 重新載入後成績、設定都在 |
| 備份還原：玩幾首 → Safari 開發者工具（Mac Safari → 開發 → 模擬器）執行 `localStorage.clear()` → 重開 App | 成績、設定都還在 |

## 內購規劃

### 商品

全部是**非消耗型**（買一次永久擁有、可恢復購買）。商品 ID 一旦建立就不能改、刪掉後也不能再用。

| 商品 | 程式裡的 sku（`js/shop.js`） | App Store Connect 的商品 ID | 狀態 |
| --- | --- | --- | --- |
| VOL.1 | `vol1` | `com.arcconceptgames.daioyaki.vol1` | 首發 |
| VOL.2 | `vol2` | `com.arcconceptgames.daioyaki.vol2` | 首發 |
| VOL.3 | `vol3` | `com.arcconceptgames.daioyaki.vol3` | 首發 |
| VOL.4～6 | `vol4`～`vol6` | `com.arcconceptgames.daioyaki.vol4`～`vol6` | 之後推出 |
| VOL.1～3 合購包 | `vol1_3` | `com.arcconceptgames.daioyaki.vol1_3` | 規劃中 |

價格在 App Store Connect 從 Apple 的價格級距選；遊戲顯示的價格是 App Store 回傳的當地價格，不寫在程式裡。

### 分集推出

- App 版開放到第幾集由 `js/config.js` 的 `RELEASED_VOLS` 決定（目前 3）；網頁版全開
- 還沒開放的集數**完全不顯示**（選曲、樂曲組、商店、成就都沒有），不放「即將推出」：避免審核 2.1（未完成／佔位內容）
- 開放新的一集一定要送新版本，不做遠端開關：符合審核 2.3.1（不可有隱藏、可遠端開啟的功能）；樂曲是程式碼，本來也只能透過 App 更新加入
- 已解鎖的成就不會因為曲數增加而收回；「夜市全制覇」的曲數會跟著變多

推出新的一集（例如 VOL.4）：

1. `RELEASED_VOLS` 改成 4，`npm run sync`，Xcode 建置新版本
2. App Store Connect 建立 `com.arcconceptgames.daioyaki.vol4`
3. 新版本送審時把 vol4 商品一起勾選送審

### 程式架構

- 內購套件：[@capgo/native-purchases](https://github.com/Cap-go/capacitor-native-purchases)（開源 MPL-2.0、StoreKit 2、iOS 15+），不需要第三方帳號或自己的伺服器
- `js/shop.js` 的 `AppleStore`：App 版自動使用（網頁版不受影響）
  - 擁有清單：StoreKit 的 currentEntitlements（退款／撤銷的不算，家人共享的算），另存一份在存檔，開啟 App 時先用存檔、背景再跟 StoreKit 核對
  - 價格：向 App Store 查到的當地價格（查到之前不顯示價格）
  - 家長同意（Ask to Buy）：顯示「等待核准中」，核准後 StoreKit 通知就自動解鎖
  - 恢復購買：`AppStore.sync()`，會請玩家登入 Apple 帳號，所以只在按「恢復購買」時呼叫
- `tools/build-web.mjs` 把 Capacitor 執行環境（`capacitor.js`）和內購套件的瀏覽器版（`plugins/native-purchases.js`）放進 www/，在遊戲腳本之前載入

### 本機測試內購（不需要開發者帳號，用 Xcode 的 StoreKit 設定檔）

1. Xcode：**File → New → File from Template… → StoreKit Configuration File**，取名 `Products.storekit`，**不要**勾「Sync this file with an app in App Store Connect」（帳號下來、商品建好後可以再改成同步）
2. 打開 `Products.storekit`，左下 **+ → Add Non-Consumable In-App Purchase**，建立三個商品：
   - Reference Name `VOL.1`、Product ID `com.arcconceptgames.daioyaki.vol1`、價格隨意（例如 90）
   - VOL.2、VOL.3 同樣做法（`.vol2`、`.vol3`）
3. **Product → Scheme → Edit Scheme… → Run → Options → StoreKit Configuration** 選 `Products.storekit`
4. ▶ 執行（模擬器即可）

測試清單：

| 測試 | 做法 | 預期 |
| --- | --- | --- |
| 價格 | 打開商店「追加樂曲」 | VOL.1～3 顯示 StoreKit 設定檔裡的價格 |
| 購買 | 買 VOL.1 → 確認付款 | 解鎖訊息、鎖頭消失、選曲可以玩 VOL.1 |
| 取消 | 買 VOL.2 → 付款畫面按取消 | 「已取消購買」，還是鎖著 |
| 家長同意 | Xcode 開著 `Products.storekit` 時選 **Editor → Enable Ask to Buy**，再買 VOL.2 | 「等待核准中」；在 **Debug → StoreKit → Manage Transactions** 核准後自動解鎖 |
| 退款 | Manage Transactions 對 VOL.1 按 **Refund**，回到 App | VOL.1 重新上鎖 |
| 恢復購買 | 刪掉 App 重新安裝 → 商店按「恢復購買」 | 「已恢復購買」，買過的都解鎖 |
| 離線 | 買過之後開飛航模式重開 App | 買過的仍然解鎖（存檔＋StoreKit 快取） |

### 合購包（規劃中）

- 程式已經支援：`js/shop.js` 的 `BUNDLES`，買了合購包＝擁有裡面每一集；擁有判定不看是否上架，買過永遠有效
- 上架：`released` 改 `true`、App Store Connect 建立同 ID 的非消耗型商品，跟新版本一起送審
- Apple 不支援「補差價」：已經買了其中一集的人再買合購包會重複付費。上架前要決定商店怎麼呈現，建議**已擁有其中任一集的人不顯示合購包**（或顯示但標示「已擁有 VOL.1」），商店畫面到時再做

## 進度

- [x] 階段 1：Capacitor 設定、原生版開關、字型內附、建置腳本
- [x] 階段 2：iPad 直式（兩側掛簾、點兩側算打擊、不顯示轉向提示）
- [ ] 階段 3：App Store 內購（VOL.1～3 首發，非消耗型）：程式完成，待 Mac 上用 StoreKit 設定檔測試
- [ ] 階段 4：iOS 原生功能（震動、分享、存檔備份、靜音開關、音訊打斷）：程式完成，待 Mac 上實機測試
- [ ] 階段 5：App Store Connect（App、內購商品、隱私問卷）、TestFlight、送審

## 上架資料（階段 5）

### 公開網站（隱私權政策、支援頁面）

App Store Connect 必填「隱私權政策網址」和「支援網址」。放在一個**獨立的公開網站**，遊戲的 repo 維持私人（不推出網頁版，原始碼與付費內容不公開）。

| 頁面 | 網址 | 填在 App Store Connect |
| --- | --- | --- |
| 首頁 | https://arcconceptgames.github.io/ | （行銷網址，選填） |
| 隱私權政策 | https://arcconceptgames.github.io/daioyaki/privacy/ | App 資訊 → 隱私權政策網址 |
| 支援 | https://arcconceptgames.github.io/daioyaki/support/ | 版本資訊 → 支援網址 |

各頁網址加 `?lang=zh|ja|en` 指定語言，沒指定時依瀏覽器語言（App Store Connect 各語系可以填不同的網址）。

檔案在本 repo 的 `site/`（共用 `style.css`、`lang.js`；不載入任何外部資源）。

**第一次設定（GitHub 網站上操作）**

1. 遊戲 repo 收起來：`arcwang30/yaki_mochi` → Settings → Pages 取消發佈；Settings → General → Danger Zone → Change visibility → **Private**
2. 建組織：GitHub 右上角 **+ → New organization** → Free 方案，名稱 `arcconceptgames`
3. 在組織下建 **公開** repo，名稱必須是 `arcconceptgames.github.io`
4. 把 `site/` 裡的**所有檔案**（含 `.nojekyll`）上傳到那個 repo 的根目錄（網頁上 **Add file → Upload files** 拖進去即可）
5. 那個 repo → Settings → Pages：Source 選 **Deploy from a branch**、`main` / `(root)`；幾分鐘後上面三個網址就能打開

**之後要改內容**：改 `site/` 裡的檔案，再上傳覆蓋到 `arcconceptgames.github.io` repo。

**內容維護**
- 隱私權政策：遊戲功能改變時要跟著更新（例如加了分析工具、排行榜、帳號、廣告），並更新生效日期
- 支援頁面：常見問題寫的是遊戲裡的實際選單名稱，改了選單文字要一起改
- 上架後在首頁的作品卡片加上 App Store 連結
- App Store Connect 的「App 隱私權」問卷：依目前功能可以填 **「未收集資料」（Data Not Collected）**
