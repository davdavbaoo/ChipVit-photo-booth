Add-Type -AssemblyName System.Drawing

$overlay = [System.Drawing.Bitmap]::FromFile((Resolve-Path 'assets/ppg_birthday_frame.png'))
$W = $overlay.Width
$H = $overlay.Height

$composite = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($composite)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background behind photos
$g.Clear([System.Drawing.Color]::White)

# Load sample photos
$sampleFiles = @(
    'assets/poses/bubbles_peace.jpg',
    'assets/poses/blossom_chin_rest.jpg',
    'assets/poses/buttercup_sassy.jpg',
    'assets/poses/ppg_group_hug.jpg'
)

$headerH = 335
$slotGap = 14
$sidePad = 14
$photoW = 572
$photoH = 763

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

for ($i = 0; $i -lt 4; $i++) {
    $sy = $headerH + $i * ($photoH + $slotGap)
    if (Test-Path $sampleFiles[$i]) {
        $img = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sampleFiles[$i]))
        $state = $g.Save()
        $clipPath = Get-RoundedRectPath $sidePad $sy $photoW $photoH 20.0
        $g.SetClip($clipPath)
        $g.DrawImage($img, [float]$sidePad, [float]$sy, [float]$photoW, [float]$photoH)
        $clipPath.Dispose()
        $g.Restore($state)
        $img.Dispose()
    }
}

# Draw the transparent frame overlay on top!
$g.DrawImage($overlay, 0, 0, $W, $H)

$composite.Save('assets/test_ppg_birthday_composite.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$composite.Dispose()
$overlay.Dispose()
Write-Host "Created test composite at assets/test_ppg_birthday_composite.png"
