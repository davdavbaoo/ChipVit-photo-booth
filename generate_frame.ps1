Add-Type -AssemblyName System.Drawing

$W = 600
$H = 3800

$headerH = 335
$sidePad = 14
$pw = $W - ($sidePad * 2) # 572
$ph = 763
$gap = 14

$slot1Y = $headerH                   # 335..1098
$slot2Y = $slot1Y + $ph + $gap       # 1112..1875
$slot3Y = $slot2Y + $ph + $gap       # 1889..2652
$slot4Y = $slot3Y + $ph + $gap       # 2666..3429
# Footer: 3429..3800 (height = 371)

$slots = @(
    @{ X = $sidePad; Y = $slot1Y; W = $pw; H = $ph },
    @{ X = $sidePad; Y = $slot2Y; W = $pw; H = $ph },
    @{ X = $sidePad; Y = $slot3Y; W = $pw; H = $ph },
    @{ X = $sidePad; Y = $slot4Y; W = $pw; H = $ph }
)

$bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# 1. Soft Pastel Tri-Tone Ombre Gradient:
# Top: Blossom Pink (#FFD5E5)
# Middle: Bubbles Baby Blue (#D5E8FC)
# Bottom: Buttercup Mint Green (#D6F5E3)
$bgRect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, [System.Drawing.Color]::White, [System.Drawing.Color]::White, 90.0)
$cb = New-Object System.Drawing.Drawing2D.ColorBlend
$cb.Colors = @(
    [System.Drawing.Color]::FromArgb(255, 255, 213, 229), # Blossom Pink
    [System.Drawing.Color]::FromArgb(255, 213, 232, 252), # Bubbles Baby Blue
    [System.Drawing.Color]::FromArgb(255, 214, 245, 227)  # Buttercup Mint Green
)
$cb.Positions = @(0.0, 0.50, 1.0)
$bgBrush.InterpolationColors = $cb
$g.FillRectangle($bgBrush, $bgRect)
$bgBrush.Dispose()

# Helper for rounded rect path
function Get-RoundedRectPath($x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2.0
    $path.AddArc([float]$x, [float]$y, [float]$d, [float]$d, 180.0, 90.0)
    $path.AddArc([float]($x + $w - $d), [float]$y, [float]$d, [float]$d, 270.0, 90.0)
    $path.AddArc([float]($x + $w - $d), [float]($y + $h - $d), [float]$d, [float]$d, 0.0, 90.0)
    $path.AddArc([float]$x, [float]($y + $h - $d), [float]$d, [float]$d, 90.0, 90.0)
    $path.CloseFigure()
    return $path
}

# 2. Punch Transparent Cutouts for 4 Photo Slots
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$clearBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
foreach ($s in $slots) {
    $slotPath = Get-RoundedRectPath $s.X $s.Y $s.W $s.H 20.0
    $g.FillPath($clearBrush, $slotPath)
    $slotPath.Dispose()
}
$clearBrush.Dispose()
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver

# 3. Photo Aperture Outlines (Crisp White + Subtle Shadow)
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 3.0)
$shadowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 0, 0, 0), 1.5)

foreach ($s in $slots) {
    $shadowPath = Get-RoundedRectPath ($s.X - 1) ($s.Y - 1) ($s.W + 2) ($s.H + 2) 21.0
    $g.DrawPath($shadowPen, $shadowPath)
    $shadowPath.Dispose()
    
    $borderPath = Get-RoundedRectPath $s.X $s.Y $s.W $s.H 20.0
    $g.DrawPath($borderPen, $borderPath)
    $borderPath.Dispose()
}
$borderPen.Dispose()
$shadowPen.Dispose()

# 4. Header: Trio Peeking Over Cloud Ledge with Bouncy Bubble "HAPPY BIRTHDAY"
$headerImgPath = "$PSScriptRoot/assets/ppg_birthday_header_cloud_trans.png"
if (Test-Path $headerImgPath) {
    $hImg = [System.Drawing.Bitmap]::FromFile($headerImgPath)
    # Source bounds: X: 24..1375 (W=1351), Y: 12..767 (H=755)
    $srcRect = New-Object System.Drawing.Rectangle(24, 12, 1351, 755)
    # Fit into header: W=600, H=335, meeting Photo 1 smoothly at Y=335
    $dstRect = New-Object System.Drawing.Rectangle(0, 0, $W, $headerH)
    $g.DrawImage($hImg, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $hImg.Dispose()

    # Authentic 1998 Cartoon Network Puffy Cloud Ledge wrapping seamlessly around Photo 1's top corners
    $cloudWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $blackPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 20, 20, 20), 3.4)
    $blackPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $blackPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $blackPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Continuous scalloped cloud ledge across the full width, wrapping over both shoulders (R=20)
    $scallopPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $scallopPath.AddLine(10.66, 332.0, 10.66, 335.0)
    # Left corner puff: sweeps out to X=4.0, down to Y=348, wrapping over the corner (covers 0..45)
    $scallopPath.AddBezier(10.66, 335.0, 4.0, 340.0, 5.0, 348.0, 18.0, 348.0)
    $scallopPath.AddBezier(18.0, 348.0, 32.0, 348.0, 45.0, 342.0, 65.0, 336.0)
    # Scallop 1 under Bubbles (65..190, gentle dip to 341)
    $scallopPath.AddBezier(65.0, 336.0, 100.0, 341.0, 150.0, 341.0, 190.0, 336.0)
    # Scallop 2 dip between Bubbles & Blossom (190..235, dip to 342)
    $scallopPath.AddBezier(190.0, 336.0, 205.0, 342.0, 220.0, 342.0, 235.0, 336.0)
    # Scallop 3 under Blossom (235..365, gentle dip to 341)
    $scallopPath.AddBezier(235.0, 336.0, 275.0, 341.0, 325.0, 341.0, 365.0, 336.0)
    # Scallop 4 dip between Blossom & Buttercup (365..410, dip to 342)
    $scallopPath.AddBezier(365.0, 336.0, 380.0, 342.0, 395.0, 342.0, 410.0, 336.0)
    # Scallop 5 under Buttercup (410..535, gentle dip to 341)
    $scallopPath.AddBezier(410.0, 336.0, 450.0, 341.0, 500.0, 341.0, 535.0, 336.0)
    # Right corner puff: sweeps down to Y=348 and out to X=596, wrapping over the corner (covers 555..600)
    $scallopPath.AddBezier(535.0, 336.0, 555.0, 342.0, 568.0, 348.0, 582.0, 348.0)
    $scallopPath.AddBezier(582.0, 348.0, 595.0, 348.0, 596.0, 340.0, 580.01, 335.0)
    $scallopPath.AddLine(580.01, 335.0, 580.01, 332.0)
    # Close top inside cloud body
    $scallopPath.AddLine(580.01, 332.0, 10.66, 332.0)
    $scallopPath.CloseFigure()

    $g.FillPath($cloudWhite, $scallopPath)

    # Clean cartoon outline along the exposed bottom cloud boundary
    $scallopOutline = New-Object System.Drawing.Drawing2D.GraphicsPath
    $scallopOutline.AddLine(10.66, 332.0, 10.66, 335.0)
    $scallopOutline.AddBezier(10.66, 335.0, 4.0, 340.0, 5.0, 348.0, 18.0, 348.0)
    $scallopOutline.AddBezier(18.0, 348.0, 32.0, 348.0, 45.0, 342.0, 65.0, 336.0)
    $scallopOutline.AddBezier(65.0, 336.0, 100.0, 341.0, 150.0, 341.0, 190.0, 336.0)
    $scallopOutline.AddBezier(190.0, 336.0, 205.0, 342.0, 220.0, 342.0, 235.0, 336.0)
    $scallopOutline.AddBezier(235.0, 336.0, 275.0, 341.0, 325.0, 341.0, 365.0, 336.0)
    $scallopOutline.AddBezier(365.0, 336.0, 380.0, 342.0, 395.0, 342.0, 410.0, 336.0)
    $scallopOutline.AddBezier(410.0, 336.0, 450.0, 341.0, 500.0, 341.0, 535.0, 336.0)
    $scallopOutline.AddBezier(535.0, 336.0, 555.0, 342.0, 568.0, 348.0, 582.0, 348.0)
    $scallopOutline.AddBezier(582.0, 348.0, 595.0, 348.0, 596.0, 340.0, 580.01, 335.0)
    $scallopOutline.AddLine(580.01, 335.0, 580.01, 332.0)
    $g.DrawPath($blackPen, $scallopOutline)
    $scallopOutline.Dispose()
    $scallopPath.Dispose()

    $blackPen.Dispose()
    $cloudWhite.Dispose()
    Write-Host "New header with scalloped cloud ledge, corner wrap, and bouncy bubble letters drawn"
}

# 5. Footer: Cake, Octi in Party Hat, Gifts Celebration Scene (No Candle Cut-Offs!)
$footerImgPath = "$PSScriptRoot/assets/ppg_footer_celebration_trans.png"
if (Test-Path $footerImgPath) {
    $fImg = [System.Drawing.Bitmap]::FromFile($footerImgPath)
    # Source crop: X=60..1320 (W=1260), Y=50..767 (H=717)
    $srcRect = New-Object System.Drawing.Rectangle(60, 50, 1260, 717)
    # Sized to width 520, height 296, placed at X=40, Y=3445 (16px below Photo 4)
    # Top of candles is at Y=3445, completely safe and clear below Photo 4 (ends at Y=3429)!
    $dstRect = New-Object System.Drawing.Rectangle(40, 3445, 520, 296)
    $g.DrawImage($fImg, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $fImg.Dispose()
    Write-Host "Footer celebration scene drawn with full candle breathing room"
}

# 6. Footer Date Stamp Box (Clean, Centered, NO EMOJIS, 'Make a Wish!' removed)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# Authentic photobooth date stamp: "DATE: 2026 . 11 . 04" (NO EMOJIS)
$dateBoxW = 210.0
$dateBoxH = 26.0
$dateBoxX = ($W - $dateBoxW) / 2.0
$dateBoxY = 3748.0

$dateBoxPath = Get-RoundedRectPath $dateBoxX $dateBoxY $dateBoxW $dateBoxH 6.0
$dateBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
$g.FillPath($dateBg, $dateBoxPath)
$dateBg.Dispose()

$datePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 160, 210, 190), 1.5)
$g.DrawPath($datePen, $dateBoxPath)
$datePen.Dispose()
$dateBoxPath.Dispose()

$dateFont = New-Object System.Drawing.Font("Space Mono", 10.5, [System.Drawing.FontStyle]::Regular)
if ($dateFont.Name -ne "Space Mono") {
    $dateFont.Dispose()
    $dateFont = New-Object System.Drawing.Font("Consolas", 10.5, [System.Drawing.FontStyle]::Regular)
}
$dateBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 45, 75, 65))
$dateRect = New-Object System.Drawing.RectangleF($dateBoxX, $dateBoxY, $dateBoxW, $dateBoxH)
$g.DrawString("DATE: 2026 . 11 . 04", $dateFont, $dateBrush, $dateRect, $sf)
$dateFont.Dispose()
$dateBrush.Dispose()

# 7. Dainty Pastel Confetti & Starbursts along Side Rails (NO EMOJIS)
function Draw-Starburst($gfx, $cx, $cy, $radius, $pen) {
    $gfx.DrawLine($pen, [float]($cx - $radius), [float]$cy, [float]($cx + $radius), [float]$cy)
    $gfx.DrawLine($pen, [float]$cx, [float]($cy - $radius), [float]$cx, [float]($cy + $radius))
    $r2 = $radius * 0.6
    $gfx.DrawLine($pen, [float]($cx - $r2), [float]($cy - $r2), [float]($cx + $r2), [float]($cy + $r2))
    $gfx.DrawLine($pen, [float]($cx - $r2), [float]($cy + $r2), [float]($cx + $r2), [float]($cy - $r2))
}

$pinkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 255, 120, 160), 1.8)
$bluePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 100, 175, 245), 1.8)
$greenPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 80, 205, 140), 1.8)
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 245, 195, 70), 1.8)

$pinkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 255, 140, 175))
$blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 120, 185, 250))
$greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 95, 215, 150))
$goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 250, 210, 85))

# Lightly scatter twinkles & confetti dots along the rails:
$confettiDots = @(
    # Left rail
    @{ X = 7; Y = 380; B = $pinkBrush; S = 4.0 },
    @{ X = 6; Y = 740; B = $blueBrush; S = 3.5 },
    @{ X = 8; Y = 1100; B = $goldBrush; S = 4.5 },
    @{ X = 7; Y = 1510; B = $blueBrush; S = 4.0 },
    @{ X = 6; Y = 1880; B = $pinkBrush; S = 3.5 },
    @{ X = 8; Y = 2260; B = $greenBrush; S = 4.5 },
    @{ X = 7; Y = 2660; B = $goldBrush; S = 4.0 },
    @{ X = 6; Y = 3060; B = $greenBrush; S = 4.5 },
    @{ X = 8; Y = 3420; B = $greenBrush; S = 3.5 },
    # Right rail
    @{ X = 592; Y = 390; B = $blueBrush; S = 4.0 },
    @{ X = 593; Y = 750; B = $pinkBrush; S = 3.5 },
    @{ X = 591; Y = 1110; B = $greenBrush; S = 4.5 },
    @{ X = 592; Y = 1520; B = $goldBrush; S = 4.0 },
    @{ X = 593; Y = 1890; B = $blueBrush; S = 3.5 },
    @{ X = 591; Y = 2270; B = $pinkBrush; S = 4.5 },
    @{ X = 592; Y = 2670; B = $greenBrush; S = 4.0 },
    @{ X = 593; Y = 3070; B = $goldBrush; S = 4.5 },
    @{ X = 591; Y = 3430; B = $greenBrush; S = 3.5 }
)
foreach ($cd in $confettiDots) {
    $g.FillEllipse($cd.B, [float]($cd.X - $cd.S / 2), [float]($cd.Y - $cd.S / 2), [float]$cd.S, [float]$cd.S)
}

# Starburst twinkles at slot divider levels
Draw-Starburst $g 7 1105 6.0 $goldPen
Draw-Starburst $g 592 1105 6.0 $pinkPen

Draw-Starburst $g 7 1882 6.0 $bluePen
Draw-Starburst $g 592 1882 6.0 $goldPen

Draw-Starburst $g 7 2659 6.0 $greenPen
Draw-Starburst $g 592 2659 6.0 $bluePen

$pinkPen.Dispose(); $bluePen.Dispose(); $greenPen.Dispose(); $goldPen.Dispose()
$pinkBrush.Dispose(); $blueBrush.Dispose(); $greenBrush.Dispose(); $goldBrush.Dispose()

# Save final overlay image to assets/ppg_birthday_frame.png
$outputPath = "$PSScriptRoot/assets/ppg_birthday_frame.png"
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Successfully saved $outputPath ($W x $H)"

$g.Dispose()
$bmp.Dispose()
