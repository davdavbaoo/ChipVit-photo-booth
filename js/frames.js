// =========================================================================
// js/frames.js - 10 Authentic Photostrip Frames & Canvas Composite Engine
// =========================================================================

(function (window) {
  'use strict';

  // 12 authentic photostrip frames matching live photobooth specification
  const FRAMES = [
    { id: 'frame-ppg-bubbles-birthday', name: 'Powerpuff Trio Birthday Frame', type: 'ppg-birthday', bg: '#ffd5e5', pad: 14, borderColor: '#ffffff', borderWidth: 3, mockFill: '#ffe4ee' },
    { id: 'frame-ppg-bubbles-peeking', name: 'Bubbles Two-Tone Peeking Frame', type: 'ppg-peeking', bg: '#d5e3f8', pad: 14, borderColor: '#ffffff', borderWidth: 3, mockFill: '#eef5fd' },
    { id: 'frame-black', name: 'Black Frame', bg: '#111111', pad: 14, borderColor: '#000000', borderWidth: 4, mockFill: '#777777' },
    { id: 'frame-white', name: 'White Frame', bg: '#f1f1f1', pad: 12, borderColor: '#e2e2e2', borderWidth: 3, mockFill: '#777777' },
    { id: 'frame-hearts-cutout', name: 'Hearts Cutout Frame', bg: '#ffd6dc', pad: 40, cutout: 'heart', borderColor: '#9b2335', borderWidth: 6, mockFill: '#777777' },
    { id: 'frame-hearts', name: 'Hearts Frame', bg: '#e9e5e5', pad: 12, borderColor: '#d8d2d2', borderWidth: 3, mockFill: '#8a8487' },
    { id: 'frame-valentines', name: "Seasonal Frame (Valentine's)", bg: '#f5c9cf', labelText: "HAPPY VALENTINE'S DAY", labelColor: '#7a2a3a', labelFont: "600 24px 'Montserrat', sans-serif", borderColor: '#e9b3ba', borderWidth: 2, mockFill: '#8a8387' },
    { id: 'frame-be-my-valentine', name: 'Seasonal Frame 2 (Cupid)', bg: '#f3cdd2', labelText: 'be my valentine? \u2665', labelColor: '#5a2a33', labelFont: "500 26px 'Montserrat', sans-serif", borderColor: '#e6b5bb', borderWidth: 2, mockFill: '#8a8387' },
    { id: 'frame-birthday', name: 'Happy Birthday Frame', bg: '#cdc8c0', labelText: 'HAPPY BIRTHDAY', labelColor: '#4a4a4a', labelFont: "600 24px 'Montserrat', sans-serif", borderColor: '#bdb7ae', borderWidth: 2, mockFill: '#7d777a' },
    { id: 'frame-mysketchbooth', name: 'My Sketchbooth Frame', bg: '#c9c5bf', labelText: 'MYSKETCHBOOTH', labelColor: '#555555', labelFont: "600 24px 'Montserrat', sans-serif", borderColor: '#bab5ae', borderWidth: 2, mockFill: '#8a8387' },
    { id: 'frame-stars', name: 'Stars Frame', bg: '#111111', pad: 14, borderColor: '#000000', borderWidth: 4, mockFill: '#8a8387' },
    { id: 'frame-doodle', name: 'Doodle Frame', bg: '#ececec', pad: 12, borderColor: '#d9d9d9', borderWidth: 3, mockFill: '#8a8387' }
  ];

  // Slender 1:5.2 photostrip geometry (600px width × 3120px height)
  const STRIP_GEO = {
    width: 600,
    photoW: 576,
    photoH: 768
  };

  // Preload high-res transparent Canva Powerpuff Girls Bubbles Birthday Frame Overlay
  const ppgBirthdayOverlay = new Image();
  ppgBirthdayOverlay.onload = function () {
    if (window.updateFrameCarouselPreview) {
      window.updateFrameCarouselPreview();
    }
  };
  ppgBirthdayOverlay.src = (window.PPG_OVERLAYS && window.PPG_OVERLAYS.birthday)
    ? window.PPG_OVERLAYS.birthday
    : './assets/ppg_birthday_frame.png';
  window.ppgBirthdayOverlay = ppgBirthdayOverlay;

  // Preload high-res transparent Canva Powerpuff Girls Bubbles Peeking Two-Tone Overlay
  const ppgPeekingOverlay = new Image();
  ppgPeekingOverlay.onload = function () {
    if (window.updateFrameCarouselPreview) {
      window.updateFrameCarouselPreview();
    }
  };
  ppgPeekingOverlay.src = (window.PPG_OVERLAYS && window.PPG_OVERLAYS.peeking)
    ? window.PPG_OVERLAYS.peeking
    : './assets/ppg_bubbles_peeking_frame.png';
  window.ppgPeekingOverlay = ppgPeekingOverlay;

  function drawRoundedRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Computes slot positions: tall narrow strip with 4 portrait (3:4) photos
  function computeStripLayout(frameObj) {
    const W = STRIP_GEO.width;
    const slots = [];
    if (frameObj.type === 'ppg-peeking') {
      const headerH = 60;
      const footerH = 120;
      const sidePad = 14;
      const gap = 14;
      const centerBandH = 320;
      const pw = W - sidePad * 2; // 572
      const ph = 763;
      slots.push({ x: sidePad, y: headerH, w: pw, h: ph });
      slots.push({ x: sidePad, y: headerH + ph + gap, w: pw, h: ph });
      const slot3Y = headerH + ph + gap + ph + centerBandH;
      slots.push({ x: sidePad, y: slot3Y, w: pw, h: ph });
      slots.push({ x: sidePad, y: slot3Y + ph + gap, w: pw, h: ph });
      const H = slot3Y + ph + gap + ph + footerH; // 3580
      return { W, H, slots };
    }
    if (frameObj.type === 'ppg-birthday') {
      const headerH = 335;
      const footerH = 371;
      const sidePad = 14;
      const slotGap = 14;
      const pw = W - sidePad * 2; // 572
      const ph = 763;
      let y = headerH;
      for (let i = 0; i < 4; i++) {
        slots.push({ x: sidePad, y, w: pw, h: ph });
        y += ph + slotGap;
      }
      return { W, H: y - slotGap + footerH, slots }; // 3800
    }
    if (frameObj.labelText) {
      const side = 12;
      const band = 40;
      const pw = W - side * 2;
      const ph = Math.round(pw * 4 / 3);
      let y = 0;
      for (let i = 0; i < 4; i++) {
        slots.push({ x: side, y: y + band, w: pw, h: ph, labelY: y + band / 2 });
        y += band + ph;
      }
      return { W, H: y + side, slots };
    }
    const p = frameObj.pad || 12;
    const pw = W - p * 2;
    const ph = Math.round(pw * 4 / 3);
    let y = p;
    for (let i = 0; i < 4; i++) {
      slots.push({ x: p, y, w: pw, h: ph });
      y += ph + p;
    }
    return { W, H: y, slots };
  }

  // Soft, full heart cutout bezier path: centered over portrait faces
  function createHeartPath(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cleftY = y + h * 0.16;
    const lobeTop = y;
    const lobeMid = y + h * 0.36;
    const bottomY = y + h * 0.96;

    ctx.beginPath();
    ctx.moveTo(cx, cleftY);
    ctx.bezierCurveTo(cx - w * 0.18, lobeTop, x, lobeTop, x, lobeMid);
    ctx.bezierCurveTo(x, y + h * 0.62, cx - w * 0.28, y + h * 0.84, cx, bottomY);
    ctx.bezierCurveTo(cx + w * 0.28, y + h * 0.84, x + w, y + h * 0.62, x + w, lobeMid);
    ctx.bezierCurveTo(x + w, lobeTop, cx + w * 0.18, lobeTop, cx, cleftY);
    ctx.closePath();
  }

  function drawMiniHeart(ctx, cx, cy, size, fillColor, strokeColor, lineWidth = 2) {
    ctx.save();
    createHeartPath(ctx, cx - size / 2, cy - size / 2, size, size);
    if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
    if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = lineWidth; ctx.stroke(); }
    ctx.restore();
  }

  function drawRibbonBow(ctx, cx, cy, scale = 1, color = '#000000') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-18, -14, -26, 8, 0, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(18, -14, 26, 8, 0, 4); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 2, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, 4); ctx.quadraticCurveTo(-10, 16, -15, 22);
    ctx.moveTo(2, 4); ctx.quadraticCurveTo(10, 16, 15, 22);
    ctx.stroke();
    ctx.restore();
  }

  function drawSparkleStar(ctx, cx, cy, radius = 8, color = '#000000') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.quadraticCurveTo(0, 0, 0, radius);
    ctx.quadraticCurveTo(0, 0, -radius, 0);
    ctx.quadraticCurveTo(0, 0, 0, -radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStarburst(ctx, cx, cy, r, color, lw = 3) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const rr = i % 2 === 0 ? r : r * 0.55;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawFivePointStar(ctx, cx, cy, r, fill, stroke) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / 5;
      const rr = i % 2 === 0 ? r : r * 0.45;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
  }

  function formatDateStamp(style = 'dots') {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (style === 'slashes') return `${yyyy} / ${mm} / ${dd}`;
    if (style === 'iso') return `${yyyy}.${mm}.${dd}`;
    return `${mm}.${dd}.${yyyy}`;
  }

  function drawFrameDecorations(ctx, frameObj, layout) {
    const { W, H, slots } = layout;
    const id = frameObj.id;
    ctx.save();

    if (id === 'frame-hearts-cutout') {
      const ink = '#9b2335';
      for (let i = 0; i < 46; i++) {
        const x = 14 + ((i * 137) % (W - 28));
        const y = 10 + ((i * 271) % (H - 20));
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      drawMiniHeart(ctx, 60, 30, 26, ink, null);
      drawMiniHeart(ctx, 92, 22, 16, ink, null);
      ctx.strokeStyle = ink; ctx.lineWidth = 3;
      ctx.strokeRect(W - 120, 14, 54, 36);
      ctx.beginPath(); ctx.moveTo(W - 120, 14); ctx.lineTo(W - 93, 36); ctx.lineTo(W - 66, 14); ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const gy = slots[i].y + slots[i].h + 20;
        drawRibbonBow(ctx, 110, gy, 2.2, ink);
        drawStarburst(ctx, W - 100, gy + 10, 30, ink, 4);
        drawMiniHeart(ctx, W / 2, gy + 6, 22, ink, null);
      }
      drawMiniHeart(ctx, 70, H - 40, 34, null, ink, 3);
      ctx.strokeStyle = ink; ctx.lineWidth = 3;
      ctx.strokeRect(W - 96, H - 70, 50, 50);
      drawMiniHeart(ctx, W - 71, H - 45, 22, ink, null);
    } else if (id === 'frame-hearts') {
      const pts = [[0.08, 0.02], [0.92, 0.07], [0.15, 0.17], [0.7, 0.25], [0.08, 0.36], [0.9, 0.33], [0.25, 0.49], [0.92, 0.55], [0.1, 0.71], [0.78, 0.72], [0.9, 0.9], [0.1, 0.97]];
      pts.forEach(([fx, fy], i) => {
        drawMiniHeart(ctx, fx * W, fy * H, i % 3 === 0 ? 34 : 24, '#d63a3a', '#7a1c1c', 2);
      });
    } else if (id === 'frame-stars') {
      slots.forEach((s, i) => {
        const left = i % 2 === 0;
        const cx = left ? s.x + 30 : s.x + s.w - 30;
        const cy = i % 2 === 0 ? s.y + 26 : s.y + s.h - 30;
        drawFivePointStar(ctx, cx, cy, 14, '#e2b33b', null);
        drawFivePointStar(ctx, cx + (left ? 34 : -34), cy + 10, 9, '#e2b33b', null);
        drawFivePointStar(ctx, cx + (left ? 14 : -14), cy + 34, 7, '#e2b33b', null);
      });
    } else if (id === 'frame-doodle') {
      const red = '#b81d1d';
      [36, 72, 108].forEach((x) => drawMiniHeart(ctx, x, 30, 30, null, red, 3.2));
      drawStarburst(ctx, W - 40, slots[0].y + slots[0].h, 34, red, 4);
      drawStarburst(ctx, 46, H - 40, 34, red, 4);
      const s = slots[2];
      ctx.strokeStyle = red;
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x + 4, s.y + 6);
      ctx.lineTo(s.x + s.w - 2, s.y + 2);
      ctx.lineTo(s.x + s.w - 6, s.y + s.h - 4);
      ctx.lineTo(s.x + 2, s.y + s.h - 2);
      ctx.closePath();
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeRect(s.x + 12, s.y + 12, s.w - 24, s.h - 24);
    }

    ctx.restore();
  }

  // Complete 1x4 photostrip composite canvas renderer
  function renderPhotostripToCanvas(targetCanvas, photosArray, frameObj, filterMode, isPreviewMock = false) {
    const layout = computeStripLayout(frameObj);
    const { W, H, slots } = layout;
    targetCanvas.width = W;
    targetCanvas.height = H;
    const ctx = targetCanvas.getContext('2d');

    // 1. Strip paper background
    if (frameObj.type === 'ppg-peeking') {
      const splitY = 1760;
      ctx.fillStyle = '#d5e3f8';
      ctx.fillRect(0, 0, W, splitY);
      ctx.fillStyle = '#fef8b8';
      ctx.fillRect(0, splitY, W, H - splitY);
    } else if (frameObj.type === 'ppg-birthday') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#ffd5e5'); // Blossom Pink
      grad.addColorStop(0.5, '#d5e8fc'); // Bubbles Baby Blue
      grad.addColorStop(1, '#d6f5e3'); // Buttercup Mint Green
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = frameObj.bg;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Photos (or neutral grey placeholders in carousel preview)
    slots.forEach((s, idx) => {
      ctx.save();
      if (frameObj.type === 'ppg-birthday' || frameObj.type === 'ppg-peeking') {
        drawRoundedRectPath(ctx, s.x, s.y, s.w, s.h, 20);
      } else if (frameObj.cutout === 'heart') {
        const hx = s.x + 8, hy = s.y + 12, hw = s.w - 16, hh = s.h - 24;
        createHeartPath(ctx, hx, hy, hw, hh);
      } else {
        ctx.beginPath();
        ctx.rect(s.x, s.y, s.w, s.h);
      }
      ctx.clip();
      const photoSrc = photosArray && photosArray[idx];
      if (photoSrc) {
        const filterFn = window.PhotoFilter ? window.PhotoFilter.processPhotoFilter : window.processPhotoFilter;
        const filtered = filterFn ? filterFn(photoSrc, s.w, s.h, filterMode) : photoSrc;
        ctx.drawImage(filtered, s.x, s.y, s.w, s.h);
      } else {
        ctx.fillStyle = isPreviewMock ? frameObj.mockFill : '#d4d4d4';
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
      ctx.restore();

      // Thin aperture outline (overlay already contains authentic doodle borders for ppg frames)
      if (frameObj.type !== 'ppg-birthday' && frameObj.type !== 'ppg-peeking') {
        ctx.save();
        if (frameObj.cutout === 'heart') {
          const hx = s.x + 8, hy = s.y + 12, hw = s.w - 16, hh = s.h - 24;
          createHeartPath(ctx, hx, hy, hw, hh);
          ctx.strokeStyle = frameObj.borderColor;
          ctx.lineWidth = frameObj.borderWidth;
          ctx.stroke();
          createHeartPath(ctx, hx + 5, hy - 4, hw - 10, hh);
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else {
          ctx.strokeStyle = frameObj.borderColor;
          ctx.lineWidth = frameObj.borderWidth;
          ctx.strokeRect(s.x, s.y, s.w, s.h);
        }
        ctx.restore();
      }

      // Small label band above each photo
      if (frameObj.labelText) {
        ctx.save();
        ctx.fillStyle = frameObj.labelColor;
        ctx.font = frameObj.labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(frameObj.labelText, W / 2, s.labelY + 1);
        ctx.restore();
      }
    });

    // 3. Overlay / Frame-specific doodles
    if (frameObj.type === 'ppg-peeking') {
      if (window.ppgPeekingOverlay && window.ppgPeekingOverlay.complete && window.ppgPeekingOverlay.naturalWidth > 0) {
        ctx.drawImage(window.ppgPeekingOverlay, 0, 0, W, H);
      }
    } else if (frameObj.type === 'ppg-birthday') {
      if (window.ppgBirthdayOverlay && window.ppgBirthdayOverlay.complete && window.ppgBirthdayOverlay.naturalWidth > 0) {
        ctx.drawImage(window.ppgBirthdayOverlay, 0, 0, W, H);
      }
    } else {
      drawFrameDecorations(ctx, frameObj, layout);
    }
    return layout;
  }

  // Export to window
  window.FRAMES = FRAMES;
  window.STRIP_GEO = STRIP_GEO;
  window.computeStripLayout = computeStripLayout;
  window.drawRoundedRectPath = drawRoundedRectPath;
  window.createHeartPath = createHeartPath;
  window.drawMiniHeart = drawMiniHeart;
  window.drawRibbonBow = drawRibbonBow;
  window.drawSparkleStar = drawSparkleStar;
  window.drawStarburst = drawStarburst;
  window.drawFivePointStar = drawFivePointStar;
  window.formatDateStamp = formatDateStamp;
  window.renderPhotostripToCanvas = renderPhotostripToCanvas;
})(window);
