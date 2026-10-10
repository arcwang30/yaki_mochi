param([string]$Engine = 'http://127.0.0.1:50021')

# 用本機的 VOICEVOX 引擎產生遊戲語音（assets/audio/*.wav），再執行 embed_voices.ps1 內嵌成 js/voices.js。
# 聲音：VOICEVOX:玄野武宏（喜び，style 39）。商用可，須在遊戲內標示「VOICEVOX:玄野武宏(CV:ガロ)」（見 CREDIT 畫面）。
# 先啟動 VOICEVOX 引擎（run.exe，預設 port 50021），再執行：
#   powershell -ExecutionPolicy Bypass -File tools\voicevox_voices.ps1
$ErrorActionPreference = 'Stop'
$speaker = 39
$lines = [ordered]@{ 'voice_irasshaimase.wav' = 'いらっしゃいませ！'; 'voice_select_song.wav' = '曲を選んでや！' }
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object Text.UTF8Encoding $false
foreach ($f in $lines.Keys) {
  $q = $utf8.GetString((Invoke-WebRequest -UseBasicParsing -Method Post "$Engine/audio_query?speaker=$speaker&text=$([Uri]::EscapeDataString($lines[$f]))").RawContentStream.ToArray()) | ConvertFrom-Json
  $q.prePhonemeLength = 0.02    # 開頭幾乎不留空白：遊戲裡語音和畫面同時出現
  $q.postPhonemeLength = 0.1
  $body = $utf8.GetBytes(($q | ConvertTo-Json -Depth 20 -Compress))
  Invoke-WebRequest -UseBasicParsing -Method Post -ContentType 'application/json; charset=utf-8' -Body $body -OutFile (Join-Path $root "assets\audio\$f") "$Engine/synthesis?speaker=$speaker"
  Write-Host "$f  $($lines[$f])"
}
