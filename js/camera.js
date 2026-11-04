// =========================================================================
// js/camera.js - Live Webcam Stream & Automated 4-Shot Studio Capture
// =========================================================================

(function (window) {
  'use strict';

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function triggerWhiteFlash() {
    const flash = window.el && window.el.flashOverlay;
    if (!flash) return;
    flash.classList.add('flash-active');
    setTimeout(() => {
      flash.classList.remove('flash-active');
    }, 320);
  }

  function grabVideoFrame(videoEl) {
    const c = document.createElement('canvas');
    c.width = window.STRIP_GEO.photoW;
    c.height = window.STRIP_GEO.photoH;
    const ctx = c.getContext('2d');
    const vw = videoEl.videoWidth || 640;
    const vh = videoEl.videoHeight || 480;

    const targetRatio = c.width / c.height;
    const srcRatio = vw / vh;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (srcRatio > targetRatio) {
      sw = vh * targetRatio;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / targetRatio;
      sy = (vh - sh) / 2;
    }

    ctx.save();
    if (window.state && window.state.cameraMirrored) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, c.width, c.height);
    ctx.restore();

    // Mark as webcam snapshot for full-strength studio clarity
    c._isCameraSnapshot = true;
    return c;
  }

  async function startCameraMode() {
    const state = window.state;
    const el = window.el;
    state.activePhotoSource = 'camera';
    state.capturedPhotos = [null, null, null, null];
    el.shotCounterBadge.textContent = 'SHOT 1/4';
    el.cameraStatusBanner.textContent = 'Initializing camera...';
    window.switchScreen('camera');

    try {
      if (state.webcamStream) {
        state.webcamStream.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 960 },
          facingMode: 'user'
        },
        audio: false
      });
      state.webcamStream = stream;
      el.webcamVideo.srcObject = stream;
      await el.webcamVideo.play();
      el.cameraStatusBanner.textContent = "Click green 'start' button!";
    } catch (err) {
      console.warn('Webcam unavailable:', err);
      el.cameraErrorMsg.textContent =
        'Unable to access camera. Please allow camera permissions or upload your photos directly.';
      window.switchScreen('error');
    }
  }

  function stopCameraStream() {
    const state = window.state;
    if (state && state.webcamStream) {
      state.webcamStream.getTracks().forEach((t) => t.stop());
      state.webcamStream = null;
    }
  }

  async function executePhotoSequence() {
    const state = window.state;
    const el = window.el;
    const audioEngine = window.audioEngine;

    if (state.isCapturingSequence) return;
    state.isCapturingSequence = true;
    audioEngine.init();

    el.btnGreenSelect.classList.add('inactive');
    el.greenBtnLabel.textContent = '';

    const capturedFrames = [];

    for (let shotIndex = 0; shotIndex < 4; shotIndex++) {
      el.shotCounterBadge.textContent = `SHOT ${shotIndex + 1}/4`;
      el.cameraStatusBanner.textContent = `Pose #${shotIndex + 1}...`;

      for (let count = 3; count >= 1; count--) {
        el.countdownOverlay.textContent = String(count);
        el.countdownOverlay.classList.add('visible');
        audioEngine.playBeep(count === 1 ? 1760 : 880);
        await sleep(1000);
      }

      el.countdownOverlay.classList.remove('visible');

      audioEngine.playShutter();
      triggerWhiteFlash();

      const frameData = grabVideoFrame(el.webcamVideo);
      capturedFrames.push(frameData);
      state.capturedPhotos[shotIndex] = frameData;

      // Cycle compliment
      const compliment = window.getNextCompliment ? window.getNextCompliment() : 'Looking fabulous!';
      if (shotIndex < 3) {
        el.cameraStatusBanner.textContent = `${compliment} Next shot coming!`;
      } else {
        el.cameraStatusBanner.textContent = `${compliment} Developing strip...`;
      }

      await sleep(1200);
    }

    state.isCapturingSequence = false;
    stopCameraStream();
    window.transitionToPrinting(capturedFrames);
  }

  window.CameraManager = {
    startCameraMode,
    stopCameraStream,
    executePhotoSequence,
    grabVideoFrame,
    triggerWhiteFlash,
    sleep
  };
  window.startCameraMode = startCameraMode;
  window.stopCameraStream = stopCameraStream;
  window.executePhotoSequence = executePhotoSequence;
  window.triggerWhiteFlash = triggerWhiteFlash;
  window.grabVideoFrame = grabVideoFrame;
  window.sleep = sleep;
})(window);
