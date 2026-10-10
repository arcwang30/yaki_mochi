# 素材前處理用的臨時伺服器（只在本機使用）：靜態檔案 + POST /__save?name=xxx.png 寫入 assets/images
param([int]$Port = 5174, [string]$Out = 'assets\images')
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root $Out; New-Item -ItemType Directory -Force $out | Out-Null
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript'; '.webp' = 'image/webp'; '.png' = 'image/png'; '.jpg' = 'image/jpeg' }
$l = [System.Net.HttpListener]::new(); $l.Prefixes.Add("http://localhost:$Port/"); $l.Start()
Write-Host "prep server http://localhost:$Port/"
while ($l.IsListening) {
  $c = $l.GetContext(); $req = $c.Request
  try {
    if ($req.HttpMethod -eq 'POST' -and $req.Url.AbsolutePath -eq '/__save') {
      $name = [IO.Path]::GetFileName($req.QueryString['name'])
      if ($name -notmatch '^[a-z0-9_]+\.(png|jpg)$') { $c.Response.StatusCode = 400 }
      else {
        $ms = New-Object IO.MemoryStream; $req.InputStream.CopyTo($ms)
        [IO.File]::WriteAllBytes((Join-Path $out $name), $ms.ToArray())
      }
    } else {
      $p = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
      $f = [IO.Path]::GetFullPath((Join-Path $root $p))
      if ($f.StartsWith($root) -and (Test-Path $f -PathType Leaf)) {
        $b = [IO.File]::ReadAllBytes($f); $e = [IO.Path]::GetExtension($f).ToLower()
        $c.Response.ContentType = if ($types[$e]) { $types[$e] } else { 'application/octet-stream' }
        $c.Response.OutputStream.Write($b, 0, $b.Length)
      } else { $c.Response.StatusCode = 404 }
    }
  } catch { $c.Response.StatusCode = 500 }
  $c.Response.Close()
}
