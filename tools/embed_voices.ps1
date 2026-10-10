# 把 assets/audio 的語音檔內嵌成 js/voices.js（base64）。
# 原因：桌面版（Electron）與直接雙擊 index.html 時是 file:// 開啟，瀏覽器不允許 fetch 讀檔，語音會讀不到；
# 內嵌在 JS 裡就不受影響。換了語音檔後執行一次：powershell -ExecutionPolicy Bypass -File tools\embed_voices.ps1
$root = Split-Path -Parent $PSScriptRoot
$map = [ordered]@{ irasshaimase = 'voice_irasshaimase.wav'; selectSong = 'voice_select_song.wav' }
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("'use strict';")
[void]$sb.AppendLine('')
[void]$sb.AppendLine('// ===== 語音資料（tools/embed_voices.ps1 自動產生，請勿手動修改）=====')
[void]$sb.AppendLine('// file://（桌面版、直接開 index.html）時 fetch 讀不到音檔，所以把語音檔以 base64 內嵌')
[void]$sb.AppendLine('const VOICE_DATA = {')
foreach ($k in $map.Keys) {
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root "assets\audio\$($map[$k])")))
  [void]$sb.AppendLine("  ${k}: '$b64',")
}
[void]$sb.AppendLine('};')
[IO.File]::WriteAllText((Join-Path $root 'js\voices.js'), $sb.ToString(), (New-Object Text.UTF8Encoding $false))
Write-Host 'js/voices.js updated'
