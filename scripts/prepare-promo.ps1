Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path 'yandex-promo' | Out-Null

function Resize-Img($srcPath, $destPath, $targetWidth, $targetHeight) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $destBitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($destBitmap)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $targetWidth, $targetHeight)
    $destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $destBitmap.Dispose()
    $srcImg.Dispose()
    Write-Host "Created $destPath ($targetWidth x $targetHeight)"
}

$iconSrc = "C:\Users\misha\.gemini\antigravity\brain\8006cbda-d7e0-42e9-97af-d151af782ea4\sudoku_pulse_icon_1790455095613.jpg"
$coverSrc = "C:\Users\misha\.gemini\antigravity\brain\8006cbda-d7e0-42e9-97af-d151af782ea4\sudoku_cover_4_3_1790455286596.jpg"
$bannerSrc = "C:\Users\misha\.gemini\antigravity\brain\8006cbda-d7e0-42e9-97af-d151af782ea4\sudoku_banner_16_9_1790455744729.jpg"

Resize-Img $iconSrc "yandex-promo\icon-512x512.png" 512 512
Resize-Img $coverSrc "yandex-promo\cover-800x600.png" 800 600
Resize-Img $bannerSrc "yandex-promo\cover-1920x1080.png" 1920 1080
Resize-Img $coverSrc "yandex-promo\promo-banner-480x320.png" 480 320
Resize-Img $iconSrc "public\icon.jpg" 512 512
