#!/usr/bin/env bash
# 把 site/ 發佈到公開網站 https://arcconceptgames.github.io/（repo：arcconceptgames/arcconceptgames.github.io）
# 用法（Windows 的 Git Bash 或 Mac 的終端機）：bash tools/deploy-site.sh "更新支援頁面"
# 做法：把網站 repo clone 到暫存資料夾，整個換成 site/ 的內容，有變動才 commit + push；幾分鐘後網站更新。
set -euo pipefail

REPO=https://github.com/arcconceptgames/arcconceptgames.github.io.git
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MSG="${1:-Update site}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone -q --depth 1 "$REPO" "$TMP/site"
# 網站 repo 的內容全部換成 site/（保留 .git）：site/ 刪掉的檔案，網站上也會刪掉
find "$TMP/site" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$ROOT/site/." "$TMP/site/"

cd "$TMP/site"
git config user.name "$(git -C "$ROOT" config user.name)"
git config user.email "$(git -C "$ROOT" config user.email)"
git add -A
if git diff --cached --quiet; then
  echo "網站沒有變動，不用發佈。"
  exit 0
fi
git commit -q -m "$MSG"
git push -q origin HEAD
echo "已發佈：https://arcconceptgames.github.io/ （幾分鐘後生效）"
