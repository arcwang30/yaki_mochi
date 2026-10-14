# iOS App 上架

網頁版維持原樣（不需要 Node）；iOS App 用 [Capacitor](https://capacitorjs.com/) 把同一份遊戲包進原生殼。以下步驟都在 **Mac** 上做。

## 需要的工具

- Xcode（App Store 最新要求的版本）＋ Command Line Tools
- Node.js LTS（`brew install node` 或到 nodejs.org 下載）

## 第一次設定

```sh
npm install @capacitor/core @capacitor/ios @fontsource/mochiy-pop-one
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

## 進度

- [x] 階段 1：Capacitor 設定、原生版開關、字型內附、建置腳本
- [x] 階段 2：iPad 直式（兩側掛簾、點兩側算打擊、不顯示轉向提示）
- [ ] 階段 3：App Store 內購（VOL.1～6，非消耗型），先用 Xcode 的 StoreKit 設定檔在本機測試
- [ ] 階段 4：iOS 音訊（解鎖、背景暫停、靜音鍵）、存檔改原生儲存、原生分享
- [ ] 階段 5：App Store Connect（App、內購商品、隱私問卷）、TestFlight、送審
