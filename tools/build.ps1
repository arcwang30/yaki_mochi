param([string]$Version = (Get-Date -Format 'yyyyMMdd-HHmm'))

# 將遊戲封裝成 zip 放進 builds/（此資料夾已被 .gitignore 排除，不進版本控制）
# 只打包遊戲執行需要的檔案；原始美術（assets/source）、文件、工具、雛形都不會放進去。
# 用法：powershell -ExecutionPolicy Bypass -File tools\build.ps1 -Version 0.1.0
$ErrorActionPreference = 'Stop'
# 用 .NET ZipFile（路徑分隔為 /）；PowerShell 5.1 的 Compress-Archive 會寫成 \，在 Mac / Linux / itch.io 解壓會出錯
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "builds\DaioYaki_v$Version.zip"
$stage = Join-Path $env:TEMP "daioyaki_build_$Version"
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Force "$stage\assets" | Out-Null
foreach ($item in @('index.html', 'manifest.json', 'sw.js', 'css', 'js')) { Copy-Item -Recurse (Join-Path $root $item) $stage }
foreach ($dir in @('images', 'icons')) { Copy-Item -Recurse (Join-Path $root "assets\$dir") "$stage\assets\$dir" }
if (Test-Path $out) { Remove-Item $out }
$zip = [System.IO.Compression.ZipFile]::Open($out, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $stage -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($stage.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $zip.Dispose() }
Remove-Item -Recurse -Force $stage
Write-Host "Built: $out"
