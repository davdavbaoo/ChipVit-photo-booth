// =========================================================================
// js/filter-worker.js - Natural Studio Pro Image Processing Web Worker
// Performs tone-mapping, skin clarity, and 3x3 unsharp mask in background
// =========================================================================

self.onmessage = function (e) {
  const { id, imgData, width, height, mode, isCamera } = e.data;
  const processed = applyNaturalStudioPro(imgData, width, height, mode, isCamera);
  self.postMessage({ id, imgData: processed }, [processed.data.buffer]);
};

function applyNaturalStudioPro(imgData, width, height, mode, isCamera = true) {
  const data = imgData.data;
  const len = data.length;

  // Strength calibration: full strength (1.0) for webcams, gentle half-strength (0.45) for uploads
  const strength = isCamera ? 1.0 : 0.45;
  const unsharpAmount = 0.42 * strength;

  // 1. Studio Tone-Curve & Color Balance Pass
  if (mode === 'bw') {
    const S = 1.22 * strength + (1 - strength) * 1.10;
    const M = 126;
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Flattering studio luminance weights (skin friendly: higher red/green contribution)
      let y = 0.35 * r + 0.55 * g + 0.10 * b;
      // Shadow lift curve (brighten midtones without blowing highlights)
      y = y + (Math.sin((y / 255) * Math.PI) * 14 * strength);
      let yp = S * (y - M) + M;
      if (yp < 0) yp = 0;
      if (yp > 255) yp = 255;

      // Subtle fine micro-texture
      const grain = (Math.random() - 0.5) * (3.5 * strength);
      data[i] = Math.min(255, Math.max(0, yp + 2 + grain));
      data[i + 1] = Math.min(255, Math.max(0, yp + grain));
      data[i + 2] = Math.min(255, Math.max(0, yp - 1 + grain));
    }
  } else {
    // Natural Studio Pro Color Mode
    const contrast = 1.04 * strength + (1 - strength) * 1.02;
    const satBoost = 1.08 * strength + (1 - strength) * 1.04;
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // S-curve shadow lift: lift dark underexposed areas
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const lift = Math.sin((luma / 255) * Math.PI) * (12 * strength);
      r += lift;
      g += lift;
      b += lift;

      // Gentle studio contrast
      r = contrast * (r - 128) + 128;
      g = contrast * (g - 128) + 128;
      b = contrast * (b - 128) + 128;

      // Natural skin-tone warmth and vibrancy
      const newLuma = 0.299 * r + 0.587 * g + 0.114 * b;
      r = newLuma + (r - newLuma) * satBoost + (2.2 * strength);
      g = newLuma + (g - newLuma) * satBoost + (0.5 * strength);
      b = newLuma + (b - newLuma) * satBoost - (1.2 * strength);

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
  }

  // 2. Calibrated 3x3 Unsharp Mask Pass (Edge Clarity)
  if (unsharpAmount > 0.05) {
    applyUnsharpMaskKernel(data, width, height, unsharpAmount);
  }

  return imgData;
}

// 3x3 Unsharp Mask Convolution: sharpens eyes, hair, contours
function applyUnsharpMaskKernel(data, w, h, amount) {
  const copy = new Uint8ClampedArray(data);
  const k = amount;
  const center = 1 + 4 * k;

  for (let y = 1; y < h - 1; y++) {
    const rowOffset = y * w * 4;
    const topRow = (y - 1) * w * 4;
    const botRow = (y + 1) * w * 4;

    for (let x = 1; x < w - 1; x++) {
      const idx = rowOffset + x * 4;
      const leftIdx = rowOffset + (x - 1) * 4;
      const rightIdx = rowOffset + (x + 1) * 4;
      const topIdx = topRow + x * 4;
      const botIdx = botRow + x * 4;

      for (let c = 0; c < 3; c++) {
        const val = center * copy[idx + c] -
          k * (copy[leftIdx + c] + copy[rightIdx + c] + copy[topIdx + c] + copy[botIdx + c]);
        data[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }
}
