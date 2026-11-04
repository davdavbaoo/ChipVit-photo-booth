Add-Type -AssemblyName System.Drawing

function Extract-Silhouette {
    param(
        [string]$InputPath,
        [string]$OutputPath
    )

    $src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $InputPath))
    $w = $src.Width
    $h = $src.Height
    $dest = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    # Use a BFS flood fill from (0,0) and borders to mark background
    $visited = New-Object 'bool[,]' $w, $h
    $queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]

    # Enqueue borders
    for ($x = 0; $x -lt $w; $x++) {
        $queue.Enqueue((New-Object System.Drawing.Point $x, 0))
        $queue.Enqueue((New-Object System.Drawing.Point $x, ($h - 1)))
        $visited[$x, 0] = $true
        $visited[$x, ($h - 1)] = $true
    }
    for ($y = 0; $y -lt $h; $y++) {
        if (-not $visited[0, $y]) {
            $queue.Enqueue((New-Object System.Drawing.Point 0, $y))
            $visited[0, $y] = $true
        }
        if (-not $visited[($w - 1), $y]) {
            $queue.Enqueue((New-Object System.Drawing.Point ($w - 1), $y))
            $visited[($w - 1), $y] = $true
        }
    }

    $dirs = @(
        (New-Object System.Drawing.Point -1, 0),
        (New-Object System.Drawing.Point 1, 0),
        (New-Object System.Drawing.Point 0, -1),
        (New-Object System.Drawing.Point 0, 1)
    )

    while ($queue.Count -gt 0) {
        $pt = $queue.Dequeue()
        $px = $src.GetPixel($pt.X, $pt.Y)

        # Stop when hitting the black outline (outline has brightness < 0.28 or dark color)
        $brightness = $px.GetBrightness()
        $isDarkOutline = ($px.R -lt 55 -and $px.G -lt 55 -and $px.B -lt 55)

        if (-not $isDarkOutline) {
            foreach ($d in $dirs) {
                $nx = $pt.X + $d.X
                $ny = $pt.Y + $d.Y
                if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
                    if (-not $visited[$nx, $ny]) {
                        $visited[$nx, $ny] = $true
                        $queue.Enqueue((New-Object System.Drawing.Point $nx, $ny))
                    }
                }
            }
        }
    }

    # Now copy pixels: if visited, transparent. If not, copy pixel
    for ($x = 0; $x -lt $w; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            if (-not $visited[$x, $y]) {
                $dest.SetPixel($x, $y, $src.GetPixel($x, $y))
            } else {
                $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }

    $dest.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    $src.Dispose()
    Write-Host "Extracted to $OutputPath"
}

Extract-Silhouette 'assets/poses/bubbles_peace.jpg' 'assets/poses/bubbles_peace_trans.png'
Extract-Silhouette 'assets/poses/bubbles_cheek_poke.jpg' 'assets/poses/bubbles_cheek_poke_trans.png'
Extract-Silhouette 'assets/poses/blossom_heart.jpg' 'assets/poses/blossom_heart_trans.png'
Extract-Silhouette 'assets/poses/buttercup_sassy.jpg' 'assets/poses/buttercup_sassy_trans.png'
