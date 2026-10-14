# 檢查 docs/App Store 上架文字.md 每個欄位的字數有沒有超過 App Store Connect 的上限
# 用法：powershell -ExecutionPolicy Bypass -File tools\check-store-text.ps1
# 讀法：「## 語系」底下，「**欄位名稱**」後面接的程式碼框＝欄位內容；App 內購買表格的第 2、3 欄＝顯示名稱、描述
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$lines = Get-Content -Encoding UTF8 (Join-Path $root 'docs\App Store 上架文字.md')

# 欄位名稱（中文或英文）→ 上限
$limits = @{ '名稱' = 30; 'Name' = 30; '副標題' = 30; 'Subtitle' = 30; '宣傳文字' = 170; 'Promotional Text' = 170;
             '關鍵字' = 100; 'Keywords' = 100; '說明' = 4000; 'Description' = 4000 }

$lang = ''; $label = $null; $inCode = $false; $buf = @(); $rows = @(); $bad = 0
function Add-Row($lang, $field, $text, $limit) {
  $n = $text.Length
  $script:rows += [pscustomobject]@{ Lang = $lang; Field = $field; Chars = $n; Limit = $limit; OK = $(if ($n -le $limit) { 'OK' } else { 'OVER' }) }
  if ($n -gt $limit) { $script:bad++ }
}
foreach ($l in $lines) {
  if ($inCode) {
    if ($l -match '^```') { $inCode = $false; if ($label) { Add-Row $lang $label (($buf -join "`n")) $limits[$label] }; $label = $null; $buf = @() }
    else { $buf += $l }
    continue
  }
  if ($l -match '^## (.+)$') { $lang = $Matches[1].Trim(); continue }
  if ($l -match '^\*\*([^*]+)\*\*') { $k = $Matches[1].Trim(); $label = $(if ($limits.ContainsKey($k)) { $k } else { $null }); continue }
  if ($l -match '^```') { $inCode = $true; continue }
  # App 內購買表格：| `商品 ID` | `顯示名稱` | `描述` |
  if ($l -match '^\|\s*`com\.[^`]+`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|') {
    Add-Row $lang 'IAP 顯示名稱' $Matches[1] 30
    Add-Row $lang 'IAP 描述' $Matches[2] 45
  }
}
$rows | Format-Table -AutoSize | Out-String -Width 200 | Write-Host
if ($bad) { Write-Host "$bad 個欄位超過上限" -ForegroundColor Red; exit 1 } else { Write-Host '全部在上限內' -ForegroundColor Green }
