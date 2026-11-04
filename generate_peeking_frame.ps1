Add-Type -AssemblyName System.Drawing

$W = 600
$H = 3580
$splitY = 1760

$bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# 1. Background Two-Tone Pastel Blocks
# Top half: Soft Pastel Periwinkle Blue
$blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 213, 227, 248))
$g.FillRectangle($blueBrush, 0, 0, $W, $splitY)

# Bottom half: Soft Pastel Butter Cream Yellow
$yellowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 254, 248, 184))
$g.FillRectangle($yellowBrush, 0, $splitY, $W, ($H - $splitY))

# 2. Slot Geometry (4 vertical 3:4 portrait photo slots)
$sidePad = 14
$pw = $W - ($sidePad * 2) # 572
$ph = 763
$headerH = 60
$gap = 14
$centerBandH = 320
$footerH = 120

$slot1Y = $headerH                   # 60..823
$slot2Y = $slot1Y + $ph + $gap       # 837..1600
$centerCardY = 1600                  # 1600..1920 (Center Transition Card matching 16:9 ratio)
$slot3Y = $centerCardY + $centerBandH # 1920..2683
$slot4Y = $slot3Y + $ph + $gap       # 2697..3460
# Footer: 3460..3580

$slots = @(
    @{ X = $sidePad; Y = $slot1Y; W = $pw; H = $ph },
    @{ X = $sidePad; Y = $slot2Y; W = $pw; H = $ph },
    @{ X = $sidePad; Y = $slot3Y; W = $pw; H = $ph },
    @{ X = $sidePad; Y = $slot4Y; W = $pw; H = $ph }
)

function Get-RoundedRectPath($x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

# 3. Punch Clean Transparent Cutouts for 4 Photo Slots FIRST
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$clearBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

foreach ($s in $slots) {
    $slotPath = Get-RoundedRectPath $s.X $s.Y $s.W $s.H 20
    $g.FillPath($clearBrush, $slotPath)
    $slotPath.Dispose()
}

# Revert to SourceOver for all foreground elements
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver

# 4. Aperture Double Outline (Crisp White + Subtle Shadow) for the 4 Photo Slots
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 3.0)
$shadowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 0, 0, 0), 1.5)

foreach ($s in $slots) {
    $shadowPath = Get-RoundedRectPath ($s.X - 1) ($s.Y - 1) ($s.W + 2) ($s.H + 2) 21
    $g.DrawPath($shadowPen, $shadowPath)
    $shadowPath.Dispose()
    
    $borderPath = Get-RoundedRectPath $s.X $s.Y $s.W $s.H 20
    $g.DrawPath($borderPen, $borderPath)
    $borderPath.Dispose()
}
$borderPen.Dispose()
$shadowPen.Dispose()

# 5. FOREGROUND 2D Cartoon Middle Section: Bubbles & Octi (Full-width, seamless blend, NO white card border)
# Spans the entire width (W = 600 px) and blends directly into the two-tone frame background.
# Drawn in front of the photo frame lines so Octi and Bubbles peek in the foreground!
$characterPath = "$PSScriptRoot/assets/bubbles_octi_transparent.png"
if (Test-Path $characterPath) {
    $charImg = [System.Drawing.Bitmap]::FromFile($characterPath)
    
    # Source crop from authentic 2D Cartoon Network generation:
    # X=133..1244 (W=1111), Y=26..664 (H=638)
    $srcRect = New-Object System.Drawing.Rectangle(133, 26, 1111, 638)
    
    # Destination rect: spans full width (0..600), from Y=1575 to Y=1920 (H=345)
    # Bringing Octi forward over the bottom edge of Photo Slot 2 (Y=1600)
    $dstRect = New-Object System.Drawing.Rectangle(0, 1575, $W, 345)
    
    $g.DrawImage($charImg, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $charImg.Dispose()
    Write-Host "2D Bubbles & Octi drawn full-width (0..$W) at Y=1575..1920 without white border"
}

# 6. Margin Dots / Rivets (Matching Reference)
$yellowDotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 248, 180))
$blueDotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 150, 195, 245))

# Vertical rails (X = 7 and X = 593)
for ($y = 25; $y -lt $H; $y += 38) {
    # Skip center transition area where Bubbles and pigtails span full width
    if ($y -gt 1565 -and $y -lt 1930) { continue }
    
    $dotBrush = if ($y -lt $splitY) { $yellowDotBrush } else { $blueDotBrush }
    $g.FillEllipse($dotBrush, 5.0, [float]$y, 4.5, 4.5)
    $g.FillEllipse($dotBrush, [float]($W - 9.5), [float]$y, 4.5, 4.5)
}

# Horizontal divider dots above Slot 2 (Y = 830)
for ($x = 40; $x -lt ($W - 30); $x += 65) {
    $g.FillEllipse($yellowDotBrush, [float]$x, 829.0, 4.0, 4.0)
}

# Horizontal divider dots above Slot 4 (Y = 2690)
for ($x = 40; $x -lt ($W - 30); $x += 65) {
    $g.FillEllipse($blueDotBrush, [float]$x, 2689.0, 4.0, 4.0)
}

$yellowDotBrush.Dispose()
$blueDotBrush.Dispose()

# 7. Tilted Dark Star Sticker on Top-Left of Slot 1 (Matching Reference)
function Draw-DarkStar($gfx, $cx, $cy, $radius, $angleDeg) {
    $state = $gfx.Save()
    $gfx.TranslateTransform($cx, $cy)
    $gfx.RotateTransform($angleDeg)
    
    $starPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pts = @()
    for ($i = 0; $i -lt 10; $i++) {
        $a = (-[Math]::PI / 2.0) + ([Math]::PI * $i / 5.0)
        $r = if ($i % 2 -eq 0) { $radius } else { $radius * 0.46 }
        $px = [Math]::Cos($a) * $r
        $py = [Math]::Sin($a) * $r
        $pts += New-Object System.Drawing.PointF([float]$px, [float]$py)
    }
    $starPath.AddPolygon($pts)
    
    # Soft sticker drop-shadow
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 20, 25, 35))
    $gfx.TranslateTransform(2.0, 3.0)
    $gfx.FillPath($shadowBrush, $starPath)
    $shadowBrush.Dispose()
    $gfx.TranslateTransform(-2.0, -3.0)
    
    # Dark slate star fill
    $starBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 36, 45))
    $gfx.FillPath($starBrush, $starPath)
    $starBrush.Dispose()
    
    # Crisp rim stroke
    $rimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 255, 255), 1.2)
    $gfx.DrawPath($rimPen, $starPath)
    $rimPen.Dispose()
    
    $starPath.Dispose()
    $gfx.Restore($state)
}

Draw-DarkStar $g 26 80 20 -14
Write-Host "Dark star sticker drawn at top-left"

# 8. Mini Octi Sticker at Bottom-Left Footer (Independent from centered text)
function Draw-MiniOcti($gfx, $cx, $cy, $size) {
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Subtle drop shadow
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50, 60, 50, 70))
    $gfx.FillEllipse($shadowBrush, [float]($cx - $size * 0.45), [float]($cy + $size * 0.4), [float]($size * 0.9), [float]($size * 0.25))
    $shadowBrush.Dispose()
    
    # Tentacles
    $tentacleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 162, 122, 202))
    $tentacleOutline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 115, 78, 155), 1.8)
    
    $tentacleXs = @(-0.35, -0.12, 0.12, 0.35)
    foreach ($tx in $tentacleXs) {
        $x = $cx + ($tx * $size)
        $y = $cy + ($size * 0.35)
        $gfx.FillEllipse($tentacleBrush, [float]($x - 6), [float]$y, 13.0, 18.0)
        $gfx.DrawEllipse($tentacleOutline, [float]($x - 6), [float]$y, 13.0, 18.0)
    }
    
    # Bulbous round purple head
    $headPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $headPath.AddEllipse([float]($cx - $size * 0.48), [float]($cy - $size * 0.48), [float]($size * 0.96), [float]($size * 0.92))
    
    $bodyBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF($cx, [float]($cy - $size * 0.5))),
        (New-Object System.Drawing.PointF($cx, [float]($cy + $size * 0.5))),
        [System.Drawing.Color]::FromArgb(255, 195, 160, 230),
        [System.Drawing.Color]::FromArgb(255, 155, 115, 195)
    )
    $gfx.FillPath($bodyBrush, $headPath)
    $bodyBrush.Dispose()
    
    $headOutline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 115, 78, 155), 2.2)
    $gfx.DrawPath($headOutline, $headPath)
    $headOutline.Dispose()
    $headPath.Dispose()
    
    # Eyes & Highlights
    $eyeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 20, 45))
    $hlBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    
    $gfx.FillEllipse($eyeBrush, [float]($cx - $size * 0.24), [float]($cy - $size * 0.08), 8.5, 8.5)
    $gfx.FillEllipse($hlBrush, [float]($cx - $size * 0.22), [float]($cy - $size * 0.06), 3.0, 3.0)
    
    $gfx.FillEllipse($eyeBrush, [float]($cx + $size * 0.14), [float]($cy - $size * 0.08), 8.5, 8.5)
    $gfx.FillEllipse($hlBrush, [float]($cx + $size * 0.16), [float]($cy - $size * 0.06), 3.0, 3.0)
    
    # Smile
    $mouthPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 85, 50, 120), 1.8)
    $gfx.DrawArc($mouthPen, [float]($cx - 5.5), [float]($cy + 2), 11.0, 8.0, 10, 160)
    $mouthPen.Dispose()
    
    # Cheeks
    $blushBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 245, 140, 175))
    $gfx.FillEllipse($blushBrush, [float]($cx - $size * 0.32), [float]($cy + 2), 7.0, 4.5)
    $gfx.FillEllipse($blushBrush, [float]($cx + $size * 0.22), [float]($cy + 2), 7.0, 4.5)
    $blushBrush.Dispose()
    
    $eyeBrush.Dispose()
    $hlBrush.Dispose()
    $tentacleBrush.Dispose()
    $tentacleOutline.Dispose()
}

Draw-MiniOcti $g 45 3516 34
Write-Host "Mini Octi drawn at bottom-left corner"

# 9. Vintage Gold Cursive Script: "Sugar & Spice" (NO TILDES, EXACTLY CENTERED AT X=300)
$goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 135, 91, 22))
$goldGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 255, 252, 224))

$scriptFontName = "Georgia"
foreach ($fn in @("Baskerville", "Edwardian Script ITC", "Lucida Calligraphy", "Monotype Corsiva", "Brush Script MT", "Georgia")) {
    $testFont = New-Object System.Drawing.Font($fn, 24.0, [System.Drawing.FontStyle]::Italic)
    if ($testFont.Name -eq $fn) {
        $scriptFontName = $fn
        $testFont.Dispose()
        break
    }
    $testFont.Dispose()
}

$scriptFont = New-Object System.Drawing.Font($scriptFontName, 26.0, [System.Drawing.FontStyle]::Italic)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# Exactly centered across full width (0..W) at Y=3495..3545 WITHOUT any tildes
$footerText = "Sugar & Spice"
foreach ($dx in @(-1.0, 1.0)) {
    foreach ($dy in @(-1.0, 1.0)) {
        $glowRect = New-Object System.Drawing.RectangleF([float](0.0 + $dx), [float](3495.0 + $dy), [float]$W, 50.0)
        $g.DrawString($footerText, $scriptFont, $goldGlow, $glowRect, $sf)
    }
}

$textRect = New-Object System.Drawing.RectangleF(0.0, 3495.0, [float]$W, 50.0)
$g.DrawString($footerText, $scriptFont, $goldBrush, $textRect, $sf)
Write-Host "Vintage gold script drawn centered at X=300 (without tildes)"

$goldBrush.Dispose()
$goldGlow.Dispose()
$scriptFont.Dispose()
$sf.Dispose()

# Save final overlay PNG
$outputPath = "$PSScriptRoot/assets/ppg_bubbles_peeking_frame.png"
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Successfully generated $outputPath ($W x $H)"

$g.Dispose()
$bmp.Dispose()
