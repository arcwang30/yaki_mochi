# 由 assets/source/app_icon.png（1024×1024，四角可為透明或白底）產生 assets/icons 下所有 PWA 圖示。
# 外框外側的白色四角會去背；Apple 圖示不支援透明，改填外框深色；maskable 版縮小置中，內容落在安全區。
# 用法：powershell -ExecutionPolicy Bypass -File tools\make_pwa_icons.ps1
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'assets\source\app_icon.png'
$dst = Join-Path $root 'assets\icons'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Collections.Generic;
public static class IconCut {
  // 從四角 flood fill 已透明或近白色的像素設為透明；與透明區相鄰的邊緣像素依白的程度給半透明，避免白邊
  public static Bitmap CutCorners(Bitmap s) {
    int w = s.Width, h = s.Height;
    var b = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (var g = Graphics.FromImage(b)) g.DrawImage(s, 0, 0, w, h);
    var r = new Rectangle(0, 0, w, h); var d = b.LockBits(r, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    var px = new int[w * h]; System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, px.Length);
    Func<int, int> minc = c => Math.Min(c & 255, Math.Min((c >> 8) & 255, (c >> 16) & 255)); Func<int, int> alpha = c => (c >> 24) & 255;
    var outside = new bool[w * h]; var q = new Queue<int>();
    foreach (var s0 in new[] { 0, w - 1, (h - 1) * w, h * w - 1 }) { outside[s0] = true; q.Enqueue(s0); }
    while (q.Count > 0) {
      int i = q.Dequeue(), x = i % w, y = i / w;
      int[] nb = { x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1 };
      foreach (var n in nb) if (n >= 0 && !outside[n] && (alpha(px[n]) < 128 || minc(px[n]) > 225)) { outside[n] = true; q.Enqueue(n); }
    }
    for (int i = 0; i < px.Length; i++) {
      if (outside[i]) { px[i] = 0; continue; }
      int x = i % w, y = i / w; bool edge = (x > 0 && outside[i - 1]) || (x < w - 1 && outside[i + 1]) || (y > 0 && outside[i - w]) || (y < h - 1 && outside[i + w]);
      if (edge) { int a = Math.Max(0, Math.Min(255, (255 - minc(px[i])) * 255 / 120)); a = Math.Min(a, alpha(px[i])); px[i] = (px[i] & 0xFFFFFF) | (a << 24); }
    }
    System.Runtime.InteropServices.Marshal.Copy(px, 0, d.Scan0, px.Length); b.UnlockBits(d); return b;
  }
}
'@
$img = [System.Drawing.Bitmap]::new($src)
$cut = [IconCut]::CutCorners($img)
$dark = [System.Drawing.Color]::FromArgb(255, 43, 14, 19)

function Save-Icon($size, $name, $bg, $scale) {
  $b = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
  if ($bg) { $g.Clear($bg) }
  $s = [int]($size * $scale); $o = [int](($size - $s) / 2)
  $g.DrawImage($cut, $o, $o, $s, $s)
  $g.Dispose(); $b.Save((Join-Path $dst $name), [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
  Write-Host "$name ${size}x${size}"
}
Save-Icon 512 'icon-512.png' $null 1
Save-Icon 192 'icon-192.png' $null 1
Save-Icon 32 'favicon-32.png' $null 1
Save-Icon 180 'apple-touch-icon.png' $dark 1
Save-Icon 512 'icon-maskable-512.png' $dark 0.84
$cut.Dispose(); $img.Dispose()
