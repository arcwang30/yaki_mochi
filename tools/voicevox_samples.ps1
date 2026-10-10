param(
  [string]$Engine = 'http://127.0.0.1:50021',
  [string]$OutDir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'voice_samples')
)

# 用本機的 VOICEVOX 引擎，替所有男聲角色（每種語氣）產生兩句台詞的試聽檔，並做一個試聽網頁 voice_samples/index.html。
# 先啟動 VOICEVOX 引擎（run.exe，預設 port 50021），再執行：
#   powershell -ExecutionPolicy Bypass -File tools\voicevox_samples.ps1
$ErrorActionPreference = 'Stop'
$lines = [ordered]@{ irasshaimase = 'いらっしゃいませ！'; selectSong = '曲を選ぶじゃ' }
# 男聲角色（名稱包含即算）
$male = @('玄野武宏', '白上虎太郎', '青山龍星', '剣崎雌雄', 'ちび式じい', '麒ヶ島宗麟', '雀松朱司', '紅桜', '満別花丸')

New-Item -ItemType Directory -Force $OutDir | Out-Null
$utf8 = New-Object Text.UTF8Encoding $false
# PowerShell 5.1 的 Invoke-RestMethod 不會用 UTF-8 解碼：自己讀位元組再解析，角色名才不會變亂碼
$speakers = $utf8.GetString((Invoke-WebRequest -UseBasicParsing "$Engine/speakers").RawContentStream.ToArray()) | ConvertFrom-Json
$rows = @()
foreach ($sp in $speakers) {
  if (-not ($male | Where-Object { $sp.name -like "*$_*" })) { continue }
  foreach ($st in $sp.styles) {
    $id = $st.id
    foreach ($k in $lines.Keys) {
      $q = Invoke-WebRequest -UseBasicParsing -Method Post "$Engine/audio_query?speaker=$id&text=$([Uri]::EscapeDataString($lines[$k]))"
      $wav = Join-Path $OutDir ("{0:D3}_{1}.wav" -f $id, $k)
      Invoke-WebRequest -UseBasicParsing -Method Post -ContentType 'application/json; charset=utf-8' -Body $utf8.GetBytes($q.Content) -OutFile $wav "$Engine/synthesis?speaker=$id"
    }
    $rows += [pscustomobject]@{ id = $id; name = $sp.name; style = $st.name }
    Write-Host "$id $($sp.name)（$($st.name)）"
  }
}

# 試聽網頁
$sb = New-Object Text.StringBuilder
[void]$sb.AppendLine('<!doctype html><meta charset="utf-8"><title>VOICEVOX 試聽</title>')
[void]$sb.AppendLine('<style>body{font-family:sans-serif;background:#14182e;color:#eee;padding:16px}td{padding:6px 10px;border-bottom:1px solid #333}audio{height:32px}</style>')
[void]$sb.AppendLine('<h2>大王焼き 語音試聽（VOICEVOX）</h2><p>台詞：「いらっしゃいませ！」／「曲を選ぶじゃ」。商用前請確認各角色的利用規約。</p><table>')
[void]$sb.AppendLine('<tr><th>ID</th><th>角色（語氣）</th><th>いらっしゃいませ！</th><th>曲を選ぶじゃ</th></tr>')
foreach ($r in $rows) {
  $a = '{0:D3}_irasshaimase.wav' -f $r.id; $b = '{0:D3}_selectSong.wav' -f $r.id
  [void]$sb.AppendLine("<tr><td>$($r.id)</td><td>$($r.name)（$($r.style)）</td><td><audio controls preload=none src=""$a""></audio></td><td><audio controls preload=none src=""$b""></audio></td></tr>")
}
[void]$sb.AppendLine('</table>')
[IO.File]::WriteAllText((Join-Path $OutDir 'index.html'), $sb.ToString(), $utf8)
Write-Host "Done: $OutDir\index.html"
