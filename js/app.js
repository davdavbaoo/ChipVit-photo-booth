// =========================================================================
// js/app.js - Application State Machine, UI Routing & Event Orchestration
// =========================================================================

(function (window) {
  'use strict';

  /* =========================================================================
     1. TRUE 3-FRAME 150ms BOILING-LINE STOP-MOTION SVG ENGINE
     ========================================================================= */
  function jitterPathString(d, amplitude, seedOffset) {
    let idx = seedOffset;
    return d.replace(/-?\d+(\.\d+)?/g, (match) => {
      const val = parseFloat(match);
      idx++;
      if (Math.abs(val) <= 9) return match;
      const pseudo = Math.sin(idx * 12.9898 + seedOffset * 78.233) * 43758.5453;
      const frac = pseudo - Math.floor(pseudo);
      const delta = (frac - 0.5) * 2 * amplitude;
      return (val + delta).toFixed(1);
    });
  }

  function cloneAndJitterSvg(baseSvg, amplitude, seedOffset) {
    const clone = baseSvg.cloneNode(true);
    clone.querySelectorAll('path').forEach((p, i) => {
      const d = p.getAttribute('d');
      if (d) {
        p.setAttribute('d', jitterPathString(d, amplitude, seedOffset + i * 7));
      }
    });
    return clone;
  }

  function initBoilingLineEngine() {
    const containers = document.querySelectorAll('[data-boil-svg]');
    containers.forEach((container) => {
      const baseSvg = container.querySelector('svg');
      if (!baseSvg) return;
      const frame2 = cloneAndJitterSvg(baseSvg, 1.15, 19);
      const frame3 = cloneAndJitterSvg(baseSvg, 1.15, 47);
      frame2.style.display = 'none';
      frame3.style.display = 'none';
      container.appendChild(frame2);
      container.appendChild(frame3);
    });

    let currentBoilFrame = 0;
    setInterval(() => {
      currentBoilFrame = (currentBoilFrame + 1) % 3;
      containers.forEach((container) => {
        const children = container.children;
        if (children.length === 3) {
          children[0].style.display = currentBoilFrame === 0 ? 'block' : 'none';
          children[1].style.display = currentBoilFrame === 1 ? 'block' : 'none';
          children[2].style.display = currentBoilFrame === 2 ? 'block' : 'none';
        }
      });
    }, 150);
  }

  /* =========================================================================
     2. APPLICATION STATE
     ========================================================================= */
  const state = {
    currentScreen: 'landing', // landing | frames | source | camera | upload | printing | export | error
    selectedFrameIndex: 0,
    filterMode: 'bw', // default 'bw' matching reference screen 2
    cameraMirrored: true,
    webcamStream: null,
    isCapturingSequence: false,
    capturedPhotos: [null, null, null, null],
    uploadedPhotos: [null, null, null, null],
    activePhotoSource: 'camera',
    isStripCut: false,
    cutPhotoDataUrls: []
  };
  window.state = state;

  /* =========================================================================
     3. UI ELEMENTS CACHE
     ========================================================================= */
  const el = {
    body: document.body,
    stageLanding: document.getElementById('stage-landing'),
    stageInterior: document.getElementById('stage-interior'),
    stagePrinting: document.getElementById('stage-printing'),
    stageExport: document.getElementById('stage-export'),
    btnEnter: document.getElementById('btnEnter'),
    btnPrevFrame: document.getElementById('btnPrevFrame'),
    btnNextFrame: document.getElementById('btnNextFrame'),
    framePreviewCard: document.getElementById('framePreviewCard'),
    frameTitleBadge: document.getElementById('frameTitleBadge'),
    filterToggleCheckbox: document.getElementById('filterToggleCheckbox'),
    pegSvgBw: document.getElementById('pegSvgBw'),
    pegSvgColor: document.getElementById('pegSvgColor'),
    lblBw: document.getElementById('lblBw'),
    lblColor: document.getElementById('lblColor'),
    btnModeCamera: document.getElementById('btnModeCamera'),
    btnModeUpload: document.getElementById('btnModeUpload'),
    btnBackToFrames: document.getElementById('btnBackToFrames'),
    btnCameraBack: document.getElementById('btnCameraBack'),
    webcamVideo: document.getElementById('webcamVideo'),
    cameraStreamCanvas: document.getElementById('cameraStreamCanvas'),
    countdownOverlay: document.getElementById('countdownOverlay'),
    shotCounterBadge: document.getElementById('shotCounterBadge'),
    cameraStatusBanner: document.getElementById('cameraStatusBanner'),
    btnUploadBack: document.getElementById('btnUploadBack'),
    btnFillSamplePhotos: document.getElementById('btnFillSamplePhotos'),
    btnProceedUpload: document.getElementById('btnProceedUpload'),
    emergingStrip: document.getElementById('emergingStrip'),
    liveCompositeCanvas: document.getElementById('liveCompositeCanvas'),
    deliverySeconds: document.getElementById('deliverySeconds'),
    btnPickupStrip: document.getElementById('btnPickupStrip'),
    finalStripContainer: document.getElementById('finalStripContainer'),
    cutPhotosGrid: document.getElementById('cutPhotosGrid'),
    complimentDoodle: document.getElementById('complimentDoodle'),
    complimentText: document.getElementById('complimentText'),
    btnScissorsCut: document.getElementById('btnScissorsCut'),
    btnDownload: document.getElementById('btnDownload'),
    btnShare: document.getElementById('btnShare'),
    btnPrint: document.getElementById('btnPrint'),
    btnSwitchFrameLive: document.getElementById('btnSwitchFrameLive'),
    btnRetake: document.getElementById('btnRetake'),
    btnErrorUpload: document.getElementById('btnErrorUpload'),
    btnErrorSample: document.getElementById('btnErrorSample'),
    btnErrorHome: document.getElementById('btnErrorHome'),
    cameraErrorMsg: document.getElementById('cameraErrorMsg'),
    btnGreenSelect: document.getElementById('btnGreenSelect'),
    greenBtnLabel: document.getElementById('greenBtnLabel'),
    btnAudioToggle: document.getElementById('btnAudioToggle'),
    flashOverlay: document.getElementById('flashOverlay'),
    infoModal: document.getElementById('infoModal'),
    infoModalCard: document.getElementById('infoModalCard'),
    infoModalTitle: document.getElementById('infoModalTitle'),
    infoModalBody: document.getElementById('infoModalBody'),
    btnCloseInfoModal: document.getElementById('btnCloseInfoModal'),
    btnDismissInfoModal: document.getElementById('btnDismissInfoModal'),
    btnFeaturedBoard: document.getElementById('btnFeaturedBoard')
  };
  window.el = el;

  const interiorViews = {
    frames: document.getElementById('view-frames'),
    source: document.getElementById('view-source'),
    camera: document.getElementById('view-camera'),
    upload: document.getElementById('view-upload'),
    error: document.getElementById('view-error')
  };

  function switchScreen(screenName) {
    state.currentScreen = screenName;
    el.body.className = `state-${screenName}`;

    const isInterior = ['frames', 'source', 'camera', 'upload', 'error'].includes(screenName);
    el.stageLanding.classList.toggle('active', screenName === 'landing');
    el.stageInterior.classList.toggle('active', isInterior);
    el.stagePrinting.classList.toggle('active', screenName === 'printing');
    el.stageExport.classList.toggle('active', screenName === 'export');

    el.btnSwitchFrameLive.style.display = screenName === 'export' ? 'inline-block' : 'none';

    if (isInterior) {
      Object.keys(interiorViews).forEach((k) => {
        interiorViews[k].classList.toggle('active', k === screenName);
      });
    }

    updateHardwareControlsForScreen(screenName);
  }
  window.switchScreen = switchScreen;

  function updateHardwareControlsForScreen(screen) {
    if (screen === 'frames') {
      el.greenBtnLabel.textContent = 'select';
      el.btnGreenSelect.classList.remove('inactive');
    } else if (screen === 'source') {
      el.greenBtnLabel.textContent = '';
      el.btnGreenSelect.classList.add('inactive');
    } else if (screen === 'camera') {
      el.greenBtnLabel.textContent = 'start';
      el.btnGreenSelect.classList.remove('inactive');
    } else if (screen === 'upload') {
      const allFilled = state.uploadedPhotos.every(Boolean);
      el.greenBtnLabel.textContent = allFilled ? 'print' : '';
      el.btnGreenSelect.classList.toggle('inactive', !allFilled);
    } else if (screen === 'error') {
      el.greenBtnLabel.textContent = '';
      el.btnGreenSelect.classList.add('inactive');
    }
  }

  /* =========================================================================
     4. FRAME CAROUSEL & 3D TOGGLE LEVER LOGIC
     ========================================================================= */
  const previewMockCanvas = document.createElement('canvas');
  el.framePreviewCard.appendChild(previewMockCanvas);

  function updateFrameCarouselPreview() {
    const frame = window.FRAMES[state.selectedFrameIndex];
    el.frameTitleBadge.textContent = frame.name;

    const tilt = state.selectedFrameIndex === 0 ? 1.2 : ((state.selectedFrameIndex % 2 === 0 ? -1 : 1) * (1.8 + (state.selectedFrameIndex % 3) * 0.35));
    el.framePreviewCard.style.transform = `rotate(${tilt.toFixed(2)}deg)`;

    window.renderPhotostripToCanvas(previewMockCanvas, null, frame, state.filterMode, true);
  }
  window.updateFrameCarouselPreview = updateFrameCarouselPreview;

  function syncFilterUI() {
    const isColor = state.filterMode === 'color';
    el.filterToggleCheckbox.checked = isColor;
    el.pegSvgBw.style.display = isColor ? 'none' : 'block';
    el.pegSvgColor.style.display = isColor ? 'block' : 'none';
    el.lblBw.classList.toggle('active-mode', !isColor);
    el.lblColor.classList.toggle('active-mode', isColor);
    el.webcamVideo.classList.toggle('filter-bw', !isColor);
    el.webcamVideo.classList.toggle('filter-color', isColor);
    localStorage.setItem('photobooth_filter', state.filterMode);
    updateFrameCarouselPreview();
  }
  window.syncFilterUI = syncFilterUI;

  /* =========================================================================
     5. COMPLIMENT ENGINE
     ========================================================================= */
  const COMPLIMENTS = [
    "You look stunning! ✨",
    "Obsessed with this! 💕",
    "Total perfection! 📸",
    "Serving looks! 🔥",
    "That smile though! 😊",
    "Iconic energy! 🌟",
    "So gorgeous! 💖",
    "Picture perfect! 🎞️",
    "Such a vibe! ✌️",
    "A masterpiece! 🎨"
  ];

  let complimentIndex = 0;

  function getNextCompliment() {
    const text = COMPLIMENTS[complimentIndex % COMPLIMENTS.length];
    complimentIndex++;
    return text;
  }
  window.getNextCompliment = getNextCompliment;

  function updateComplimentDisplay(specificText) {
    const text = specificText || getNextCompliment();
    if (el.complimentText) {
      el.complimentText.textContent = text;
    }
  }

  /* =========================================================================
     6. POWERPUFF GIRLS RECOMMENDED POSES SUITE
     ========================================================================= */
  const PPG_POSE_KEYS = [
    'bubbles_peace',
    'blossom_heart',
    'buttercup_sassy',
    'bubbles_cheek_poke',
    'blossom_chin_rest',
    'ppg_group_hug'
  ];

  const ppgImageElements = {};

  function getPPGImage(key) {
    if (!ppgImageElements[key]) {
      const img = new Image();
      img.src = (window.PPG_POSES && window.PPG_POSES[key])
        ? window.PPG_POSES[key]
        : `./assets/poses/${key}.jpg`;
      ppgImageElements[key] = img;
    }
    return ppgImageElements[key];
  }
  window.getPPGImage = getPPGImage;

  function ensurePPGImagesLoaded() {
    return Promise.all(PPG_POSE_KEYS.map((key) => {
      const img = getPPGImage(key);
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve(img);
      }
      return new Promise((resolve) => {
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
      });
    }));
  }

  let cachedRecommendedPosesHtml = null;

  async function buildRecommendedPosesGrid() {
    if (cachedRecommendedPosesHtml) return cachedRecommendedPosesHtml;
    await ensurePPGImagesLoaded();

    const ppgImgs = {};
    PPG_POSE_KEYS.forEach(k => {
      ppgImgs[k] = getPPGImage(k);
    });

    const STRIP_CONFIGS = [
      {
        frame: window.FRAMES[1] || window.FRAMES[0],
        filter: 'bw',
        poses: ['bubbles_peace', 'blossom_heart', 'buttercup_sassy', 'ppg_group_hug']
      },
      {
        frame: window.FRAMES[2] || window.FRAMES[0],
        filter: 'color',
        poses: ['blossom_heart', 'bubbles_cheek_poke', 'blossom_chin_rest', 'ppg_group_hug']
      },
      {
        frame: window.FRAMES[4] || window.FRAMES[2],
        filter: 'color',
        poses: ['bubbles_cheek_poke', 'buttercup_sassy', 'bubbles_peace', 'blossom_heart']
      },
      {
        frame: window.FRAMES[6] || window.FRAMES[1],
        filter: 'bw',
        poses: ['buttercup_sassy', 'blossom_chin_rest', 'bubbles_peace', 'ppg_group_hug']
      },
      {
        frame: window.FRAMES[9] || window.FRAMES[8] || window.FRAMES[0],
        filter: 'color',
        poses: ['blossom_chin_rest', 'bubbles_peace', 'blossom_heart', 'buttercup_sassy']
      }
    ];

    let html = `<div class="community-board-grid">`;
    for (let idx = 0; idx < STRIP_CONFIGS.length; idx++) {
      const cfg = STRIP_CONFIGS[idx];
      const stripPhotos = cfg.poses.map(k => ppgImgs[k]);
      const mockCanvas = document.createElement('canvas');
      window.renderPhotostripToCanvas(mockCanvas, stripPhotos, cfg.frame, cfg.filter, false);
      let url = '';
      try {
        url = mockCanvas.toDataURL('image/jpeg', 0.88);
      } catch (err) {
        url = '';
      }
      const rot = ((idx % 2 === 0 ? -1 : 1) * (1.8 + idx * 0.6)).toFixed(1);
      html += `
        <div class="community-strip-card" style="transform: rotate(${rot}deg)">
          <img src="${url}" alt="Powerpuff Girls Recommended Pose Strip ${idx + 1}" style="width:100%;height:auto;display:block;">
        </div>
      `;
    }
    html += `</div>`;
    cachedRecommendedPosesHtml = html;
    return html;
  }

  /* =========================================================================
     7. 2x2 PHOTO UPLOAD WORKFLOW
     ========================================================================= */
  function initUploadSlots() {
    for (let i = 0; i < 4; i++) {
      const fileInput = document.getElementById(`file-${i}`);
      const slotEl = document.getElementById(`slot-${i}`);

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 25 * 1024 * 1024) {
          alert('File Too Large: Image file is too large. Please select an image smaller than 25MB.');
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            img._isCameraSnapshot = false; // Uploaded photo: half-strength studio polish
            state.uploadedPhotos[i] = img;
            const previewImg = slotEl.querySelector('.slot-preview');
            previewImg.src = ev.target.result;
            slotEl.classList.add('filled');
            window.audioEngine.playClick(640);
            checkUploadCompletion();
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function checkUploadCompletion() {
    const allReady = state.uploadedPhotos.every(Boolean);
    el.btnProceedUpload.classList.toggle('disabled', !allReady);
    updateHardwareControlsForScreen('upload');
  }

  function loadSamplePhotosIntoUploadSlots() {
    window.audioEngine.playClick(720);
    const ppgKeys = ['bubbles_peace', 'blossom_heart', 'buttercup_sassy', 'ppg_group_hug'];
    for (let i = 0; i < 4; i++) {
      const img = getPPGImage(ppgKeys[i]);
      img._isCameraSnapshot = false;
      state.uploadedPhotos[i] = img;
      const slotEl = document.getElementById(`slot-${i}`);
      const previewImg = slotEl.querySelector('.slot-preview');
      previewImg.src = img.src;
      slotEl.classList.add('filled');
    }
    checkUploadCompletion();
  }

  /* =========================================================================
     8. PRINTING & T-BAR CHUTE DISPENSING
     ========================================================================= */
  async function transitionToPrinting(photosArray) {
    state.capturedPhotos = photosArray;
    state.isStripCut = false;
    switchScreen('printing');

    const currentFrame = window.FRAMES[state.selectedFrameIndex];
    window.renderPhotostripToCanvas(
      el.liveCompositeCanvas,
      photosArray,
      currentFrame,
      state.filterMode,
      false
    );

    el.emergingStrip.classList.remove('dispensing');
    el.btnPickupStrip.classList.remove('ready');

    for (let sec = 3; sec >= 1; sec--) {
      el.deliverySeconds.textContent = String(sec);
      window.audioEngine.playClick(420);
      await window.CameraManager.sleep(750);
    }
    el.deliverySeconds.textContent = '0';

    window.audioEngine.playPrinterMotor(1.5);
    requestAnimationFrame(() => {
      el.emergingStrip.classList.add('dispensing');
    });

    setTimeout(() => {
      window.audioEngine.playClick(280);
    }, 750);

    await window.CameraManager.sleep(1200);
    el.btnPickupStrip.classList.add('ready');
  }
  window.transitionToPrinting = transitionToPrinting;

  /* =========================================================================
     9. FINAL PICKUP, SCISSORS CUT-STRIP & EXPORT
     ========================================================================= */
  function buildExportViewAssets() {
    const currentFrame = window.FRAMES[state.selectedFrameIndex];
    const layout = window.renderPhotostripToCanvas(
      el.liveCompositeCanvas,
      state.capturedPhotos,
      currentFrame,
      state.filterMode,
      false
    );

    el.finalStripContainer.innerHTML = '';
    const finalImg = document.createElement('img');
    finalImg.src = el.liveCompositeCanvas.toDataURL('image/png');
    finalImg.alt = 'Final Vintage Photostrip';
    el.finalStripContainer.appendChild(finalImg);

    state.cutPhotoDataUrls = [];
    el.cutPhotosGrid.innerHTML = '';
    const sliceH = layout.H / 4;
    for (let i = 0; i < 4; i++) {
      const singleCanvas = document.createElement('canvas');
      singleCanvas.width = layout.W;
      singleCanvas.height = Math.round(sliceH);
      const sctx = singleCanvas.getContext('2d');
      sctx.drawImage(
        el.liveCompositeCanvas,
        0, Math.round(i * sliceH), layout.W, Math.round(sliceH),
        0, 0, layout.W, Math.round(sliceH)
      );

      const url = singleCanvas.toDataURL('image/png');
      state.cutPhotoDataUrls.push(url);

      const itemDiv = document.createElement('div');
      itemDiv.className = 'cut-photo-item';
      itemDiv.title = `Click to download Photo #${i + 1}`;
      itemDiv.innerHTML = `<img src="${url}" alt="Cut Photo ${i + 1}">`;
      itemDiv.addEventListener('click', () => {
        downloadDataUrl(url, `mysketchbooth-photo-${i + 1}.png`);
      });
      el.cutPhotosGrid.appendChild(itemDiv);
    }
  }

  function transitionToExportView() {
    buildExportViewAssets();
    state.isStripCut = false;
    syncScissorsUI();
    updateComplimentDisplay();
    switchScreen('export');
  }

  function syncScissorsUI() {
    const area = el.finalStripContainer.parentElement;
    const scissorsWrap = document.getElementById('scissorsIconWrap');
    const backWrap = document.getElementById('backDoodleWrap');

    if (state.isStripCut) {
      el.finalStripContainer.style.display = 'none';
      el.cutPhotosGrid.style.display = 'flex';
      if (area) area.classList.add('cut-active');
      document.querySelectorAll('.doodle-line-1').forEach((t) => { t.textContent = 'click to'; });
      document.querySelectorAll('.doodle-line-2').forEach((t) => { t.textContent = 'download!'; });
      if (scissorsWrap) scissorsWrap.style.display = 'none';
      if (backWrap) backWrap.style.display = 'block';
      el.btnScissorsCut.title = 'Click to restore whole strip';
    } else {
      el.finalStripContainer.style.display = 'block';
      el.cutPhotosGrid.style.display = 'none';
      if (area) area.classList.remove('cut-active');
      document.querySelectorAll('.doodle-line-1').forEach((t) => { t.textContent = 'your'; });
      document.querySelectorAll('.doodle-line-2').forEach((t) => { t.textContent = 'photostrip!'; });
      if (scissorsWrap) scissorsWrap.style.display = 'block';
      if (backWrap) backWrap.style.display = 'none';
      el.btnScissorsCut.title = 'Cut strip into individual photos!';
    }
  }

  function downloadDataUrl(dataUrl, filename) {
    window.audioEngine.playClick(760);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadFullStripPng() {
    const dataUrl = el.liveCompositeCanvas.toDataURL('image/png');
    downloadDataUrl(dataUrl, 'mysketchbooth.png');
  }

  function printPhotostrip() {
    window.audioEngine.playClick(600);
    const dataUrl = el.liveCompositeCanvas.toDataURL('image/png');
    const printWin = window.open('', '_blank', 'width=700,height=900');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Print Photo Strip — Our Photo Booth</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #fff;
    }
    img {
      height: 92vh;
      max-height: 260mm;
      width: auto;
    }
  </style>
</head>
<body>
  <img src="${dataUrl}" onload="setTimeout(() => { window.print(); }, 250);" />
</body>
</html>`);
    printWin.document.close();
  }

  async function sharePhotostrip() {
    window.audioEngine.playClick(680);
    try {
      const dataUrl = el.liveCompositeCanvas.toDataURL('image/png');
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'mysketchbooth.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'MySketchBooth Photostrip',
          text: 'Created with MySketchBooth!',
          files: [file]
        });
        return;
      }
    } catch (err) {}
    downloadFullStripPng();
  }

  /* =========================================================================
     10. INFO MODALS & FEATURED COMMUNITY STRIPS BOARD
     ========================================================================= */
  async function openFeaturedCommunityModal() {
    window.audioEngine.playClick(580);
    el.infoModalCard.classList.add('wide');
    el.infoModalTitle.textContent = 'Recommended Poses';

    const gridHtml = await buildRecommendedPosesGrid();
    el.infoModalBody.innerHTML = gridHtml;
    el.infoModal.classList.add('open');
  }

  /* =========================================================================
     11. EVENT LISTENERS & HARDWARE BUTTON BINDINGS
     ========================================================================= */
  function initEvents() {
    el.btnEnter.addEventListener('click', () => {
      window.audioEngine.playClick(600);
      switchScreen('frames');
    });

    el.btnPrevFrame.addEventListener('click', () => {
      window.audioEngine.playClick(480);
      state.selectedFrameIndex = (state.selectedFrameIndex - 1 + window.FRAMES.length) % window.FRAMES.length;
      updateFrameCarouselPreview();
    });

    el.btnNextFrame.addEventListener('click', () => {
      window.audioEngine.playClick(560);
      state.selectedFrameIndex = (state.selectedFrameIndex + 1) % window.FRAMES.length;
      updateFrameCarouselPreview();
    });

    el.framePreviewCard.addEventListener('click', () => {
      window.audioEngine.playClick(660);
      switchScreen('source');
    });

    el.filterToggleCheckbox.addEventListener('change', () => {
      window.audioEngine.playClick(520);
      state.filterMode = el.filterToggleCheckbox.checked ? 'color' : 'bw';
      syncFilterUI();
    });

    el.lblBw.addEventListener('click', () => {
      if (state.filterMode !== 'bw') {
        window.audioEngine.playClick(520);
        state.filterMode = 'bw';
        syncFilterUI();
      }
    });

    el.lblColor.addEventListener('click', () => {
      if (state.filterMode !== 'color') {
        window.audioEngine.playClick(520);
        state.filterMode = 'color';
        syncFilterUI();
      }
    });

    el.btnModeCamera.addEventListener('click', () => {
      window.audioEngine.playClick(640);
      window.CameraManager.startCameraMode();
    });

    el.btnModeUpload.addEventListener('click', () => {
      window.audioEngine.playClick(640);
      state.activePhotoSource = 'upload';
      switchScreen('upload');
    });

    el.btnBackToFrames.addEventListener('click', () => {
      window.audioEngine.playClick(450);
      switchScreen('frames');
    });

    el.btnCameraBack.addEventListener('click', () => {
      if (state.isCapturingSequence) return;
      window.audioEngine.playClick(450);
      window.CameraManager.stopCameraStream();
      switchScreen('source');
    });

    el.btnUploadBack.addEventListener('click', () => {
      window.audioEngine.playClick(450);
      switchScreen('source');
    });

    el.btnFillSamplePhotos.addEventListener('click', () => {
      loadSamplePhotosIntoUploadSlots();
    });

    el.btnProceedUpload.addEventListener('click', () => {
      if (!state.uploadedPhotos.every(Boolean)) return;
      window.audioEngine.playClick(700);
      transitionToPrinting(state.uploadedPhotos.slice());
    });

    el.btnPickupStrip.addEventListener('click', () => {
      window.audioEngine.playClick(680);
      transitionToExportView();
    });

    el.finalStripContainer.addEventListener('click', () => {
      downloadFullStripPng();
    });

    el.btnDownload.addEventListener('click', () => {
      downloadFullStripPng();
    });

    el.btnShare.addEventListener('click', () => {
      sharePhotostrip();
    });

    el.btnPrint.addEventListener('click', () => {
      printPhotostrip();
    });

    el.btnSwitchFrameLive.addEventListener('click', () => {
      window.audioEngine.playClick(580);
      state.selectedFrameIndex = (state.selectedFrameIndex + 1) % window.FRAMES.length;
      buildExportViewAssets();
    });

    el.btnScissorsCut.addEventListener('click', () => {
      window.audioEngine.playShutter();
      state.isStripCut = !state.isStripCut;
      syncScissorsUI();
    });

    if (el.complimentDoodle) {
      el.complimentDoodle.addEventListener('click', () => {
        window.audioEngine.playClick(680);
        updateComplimentDisplay();
      });
    }

    el.btnRetake.addEventListener('click', () => {
      window.audioEngine.playClick(480);
      window.CameraManager.stopCameraStream();
      switchScreen('landing');
    });

    el.btnErrorUpload.addEventListener('click', () => {
      window.audioEngine.playClick(560);
      state.activePhotoSource = 'upload';
      switchScreen('upload');
    });

    el.btnErrorSample.addEventListener('click', () => {
      state.activePhotoSource = 'upload';
      switchScreen('upload');
      loadSamplePhotosIntoUploadSlots();
    });

    el.btnErrorHome.addEventListener('click', () => {
      window.audioEngine.playClick(480);
      switchScreen('landing');
    });

    el.btnGreenSelect.addEventListener('click', () => {
      if (el.btnGreenSelect.classList.contains('inactive')) return;
      window.audioEngine.playClick(680);

      switch (state.currentScreen) {
        case 'frames':
          switchScreen('source');
          break;
        case 'camera':
          window.CameraManager.executePhotoSequence();
          break;
        case 'upload':
          if (state.uploadedPhotos.every(Boolean)) {
            transitionToPrinting(state.uploadedPhotos.slice());
          }
          break;
      }
    });

    el.btnAudioToggle.addEventListener('click', () => {
      window.audioEngine.enabled = !window.audioEngine.enabled;
      el.btnAudioToggle.textContent = window.audioEngine.enabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
      if (window.audioEngine.enabled) window.audioEngine.playClick(640);
    });

    el.btnFeaturedBoard.addEventListener('click', openFeaturedCommunityModal);

    el.btnCloseInfoModal.addEventListener('click', () => {
      el.infoModal.classList.remove('open');
    });
    el.btnDismissInfoModal.addEventListener('click', () => {
      el.infoModal.classList.remove('open');
    });

    window.addEventListener('keydown', (e) => {
      if (el.infoModal.classList.contains('open')) {
        if (e.key === 'Escape') {
          el.infoModal.classList.remove('open');
        }
        return;
      }
      if (state.currentScreen === 'frames') {
        if (e.key === 'ArrowLeft') el.btnPrevFrame.click();
        if (e.key === 'ArrowRight') el.btnNextFrame.click();
      }
    });
  }

  /* =========================================================================
     12. BOOTSTRAP APPLICATION
     ========================================================================= */
  initBoilingLineEngine();
  initUploadSlots();
  initEvents();
  syncFilterUI();
  updateFrameCarouselPreview();
  switchScreen('landing');

  ensurePPGImagesLoaded().then(() => {
    setTimeout(buildRecommendedPosesGrid, 120);
  });
})(window);
