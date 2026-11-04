Add-Type -AssemblyName System.Drawing

$W = 600
$H = 3580
$splitY = 1760

$bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# 1. Base Two-Tone Background
$blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 213, 227, 248))
$g.FillRectangle($blueBrush, 0, 0, $W, $splitY)
$yellowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 254, 248, 184))
$g.FillRectangle($yellowBrush, 0, $splitY, $W, ($H - $splitY))

# 2. Photos in apertures
$sidePad = 14
$pw = $W - ($sidePad * 2) # 572
$ph = 763
$headerH = 60
$centerBandH = 320
$gap = 14

$slots = @(
    @{ X = $sidePad; Y = $headerH; W = $pw; H = $ph },
    @{ X = $sidePad; Y = ($headerH + $ph + $gap); W = $pw; H = $ph },
    @{ X = $sidePad; Y = (1600 + $centerBandH); W = $pw; H = $ph },
    @{ X = $sidePad; Y = (1600 + $centerBandH + $ph + $gap); W = $pw; H = $ph }
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

$mockFills = @(
    [System.Drawing.Color]::FromArgb(255, 230, 238, 245),
    [System.Drawing.Color]::FromArgb(255, 242, 235, 240),
    [System.Drawing.Color]::FromArgb(255, 245, 240, 225),
    [System.Drawing.Color]::FromArgb(255, 238, 242, 230)
)

for ($i = 0; $i -lt 4; $i++) {
    $s = $slots[$i]
    $state = $g.Save()
    $clipPath = Get-RoundedRectPath $s.X $s.Y $s.W $s.H 20
    $g.SetClip($clipPath)
    
    $pBrush = New-Object System.Drawing.SolidBrush($mockFills[$i])
    $g.FillRectangle($pBrush, $s.X, $s.Y, $s.W, $s.H)
    $pBrush.Dispose()
    
    $poseFiles = @(
        "$PSScriptRoot/assets/poses/bubbles_peace_trans.png",
        "$PSScriptRoot/assets/poses/blossom_heart_trans.png",
        "$PSScriptRoot/assets/poses/buttercup_sassy_trans.png",
        "$PSScriptRoot/assets/poses/bubbles_cheek_poke_trans.png"
    )
    if (Test-Path $poseFiles[$i]) {
        $pImg = [System.Drawing.Bitmap]::FromFile($poseFiles[$i])
        $fitH = [int]($s.H * 0.88)
        $fitW = [int]($pImg.Width * ($fitH / $pImg.Height))
        $fitX = [int]($s.X + ($s.W - $fitW) / 2)
        $fitY = [int]($s.Y + ($s.H - $fitH))
        $g.DrawImage($pImg, $fitX, $fitY, $fitW, $fitH)
        $pImg.Dispose()
    }
    
    $clipPath.Dispose()
    $g.Restore($state)
}

# 3. Draw Transparent Frame Overlay on Top
$overlayPath = "$PSScriptRoot/assets/ppg_bubbles_peeking_frame.png"
$overlay = [System.Drawing.Bitmap]::FromFile($overlayPath)
$g.DrawImage($overlay, 0, 0, $W, $H)
$overlay.Dispose()

$compPath = "$PSScriptRoot/assets/test_peeking_composite.png"
$bmp.Save($compPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved updated test composite to $compPath"

$g.Dispose()
$bmp.Dispose()
