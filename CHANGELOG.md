# 📜 ChipVit Photo Booth — Changelog & Update Log

Welcome to the project changelog! Every update is documented with two perspectives:
1. **🎉 What's New (For Users)**: A friendly, simple explanation of what changed, new features, and how to use them.
2. **🛠️ Developer Technical Notes (For Bao)**: In-depth technical architecture breakdown, affected files, DOM elements, state changes, and Git commit hashes.

---

## [v1.2.0] — 2026-11-12: Segmented Timer Toggle `[ 3s | 5s ]` & 5-Second Countdown Upgrade

### 🎉 What's New (For Users)
- **More Time to Strike a Pose (5 Seconds Default!)**:
  - We heard your feedback that 3 seconds felt a bit too rushed when posing alone or gathering friends for a group shot.
  - The photobooth now gives you a comfortable **5-second countdown** (`5 → 4 → 3 → 2 → 1 → 📸 Shutter Snap!`) before each of the 4 photos is taken.
- **Brand New Segmented Timer Switch `[ 3s | 5s ]`**:
  - We removed the old colorful clock emoji and replaced it with a sleek, minimalist capsule switch centered at the top of the camera screen.
  - You can now see both **`3s`** and **`5s`** side-by-side with the active time highlighted in crisp white.
  - Want fast poses? Simply tap **`3s`**! Need extra prep time? Tap **`5s`**!
- **Distraction-Free Posing**:
  - As soon as you hit the green **"start"** button to begin taking photos, the timer pill smoothly fades away so you can focus entirely on posing without buttons cluttering the viewfinder. Once the 4 shots finish, it reappears automatically.
- **Rhythmic Audio Countdown**:
  - Retro beeps count down with you: 4 steady rhythm beeps followed by a high alert tone right before the shutter clicks and flashes!

### 🛠️ Developer Technical Notes (For Bao)
- **Architecture & State Management (`js/app.js`)**:
  - Added `timerDuration: 5` property to global `state` object (line 72).
  - Replaced legacy `btnTimerToggle` element cache with `timerSegmentedPill`, `btnTimer3s`, and `btnTimer5s` (lines 108–110).
  - Implemented centralized `setTimerDuration(duration)` helper that guards against mid-capture state changes, plays audio click via `window.audioEngine.playClick(520)`, toggles the `.active` class on the segmented buttons, and syncs `#countdownOverlay.textContent` (lines 722–753).
- **Camera Capture Engine Lifecycle (`js/camera.js`)**:
  - In `startCameraMode()`: Synchronized `.active` state on `btnTimer3s` vs `btnTimer5s` to match `state.timerDuration` and ensured `#countdownOverlay` starts with the configured duration (lines 77–86).
  - In `executePhotoSequence()`: Added automated hiding of `#timerSegmentedPill` via `.hidden` class during active capture (line 116), dynamically read `const duration = (state && state.timerDuration) ? state.timerDuration : 5;`, and updated the countdown loop from fixed `3` down to `1` to `duration` down to `1` (lines 123–128).
  - On sequence completion: Automatically restored `#timerSegmentedPill` visibility by removing `.hidden` (line 155).
- **UI Markup (`index.html`)**:
  - Updated `#countdownOverlay` default text from `3` to `5` (line 215).
  - Replaced `<button class="btn-timer-pill" id="btnTimerToggle">` with a semantic grouped container:
    ```html
    <div class="timer-segmented-pill" id="timerSegmentedPill" role="group" aria-label="Photo countdown timer">
      <button type="button" class="timer-seg-btn" id="btnTimer3s" data-time="3" title="Set 3-second countdown">3s</button>
      <button type="button" class="timer-seg-btn active" id="btnTimer5s" data-time="5" title="Set 5-second countdown">5s</button>
    </div>
    ```
- **CSS Styling (`css/style.css`)**:
  - Added `.timer-segmented-pill`: absolute centered capsule (`top: 8px; left: 50%; transform: translateX(-50%)`, `background: rgba(0, 0, 0, 0.65)`, `border: 1px solid rgba(255, 255, 255, 0.4)`, `border-radius: 16px`, `z-index: 24`).
  - Added `.timer-seg-btn`: Space Mono bold monospace font, centered text, min-width 24px, smooth background transitions.
  - Added `.timer-seg-btn.active`: High-contrast pure white pill background (`#ffffff`), dark charcoal text (`#111827`), subtle drop shadow (`box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35)`).
  - Added `.timer-segmented-pill.hidden`: Smooth scale-down and opacity fade out (`opacity: 0; pointer-events: none; transform: translateX(-50%) scale(0.85)`).
- **Git Commits**:
  - `01c8801`: `feat: upgrade countdown timer to 5s with interactive 3s/5s toggle`
  - `b223dd3`: `feat: redesign timer toggle as segmented pill [ 3s | 5s ] with centered numbers`

---

## [v1.1.0] — 2026-11-04: Screen 6 Canva Action Removal & Canvas Taint Hardening

### 🎉 What's New (For Users)
- **Cleaner Export Toolbar on the Final Screen**:
  - Removed the third-party Canva hyperlink button from the bottom action bar.
  - Restored a balanced, symmetrical 4-button menu: **Download**, **Share**, **Print**, and **Restart**.
  - On smartphones, the action buttons now arrange into an even, clean 2×2 grid with zero awkward wrapping.
- **Rock-Solid Photostrip Pickup**:
  - Fixed a glitch where clicking "Pick up ->" in the photo chute occasionally froze on certain devices. The photostrip now slides out and opens into the final view instantly every single time.
- **Mobile Collision Polish**:
  - Repositioned the hand-drawn curly arrow and compliment badge so they never overlap the photos on small phone screens.

### 🛠️ Developer Technical Notes (For Bao)
- **DOM & Controller Cleanup (`index.html`, `js/app.js`, `js/frames.js`)**:
  - Removed `<a id="btnCanvaEdit">` anchor from `.export-actions-toolbar` in `index.html`.
  - Removed `btnCanvaEdit` cached reference from `el` map and deleted `canvaUrl` assignment logic in `buildExportViewAssets()` in `js/app.js`.
  - Cleaned up obsolete `canvaUrl` metadata properties from Powerpuff Girls frame definitions in `js/frames.js`.
- **Canvas Taint & Chute Pickup Fix (`js/app.js`, `assets/ppg_overlays.js`)**:
  - Diagnosed `SecurityError` caused by loading frame PNG overlays via relative paths under restricted origins.
  - Packaged high-resolution transparent PPG frame overlays as base64 data URIs inside `assets/ppg_overlays.js`, eliminating cross-origin canvas tainting.
  - Added defensive `try/catch` fallbacks in `buildExportViewAssets()`: clones live `<canvas>` directly into `#finalStripContainer` if `toDataURL()` is ever blocked.
  - Wrapped `buildExportViewAssets()` in `transitionToExportView()` with `try/catch` ensuring `switchScreen('export')` always executes on chute click.
- **Responsive Media Query Refinements (`css/style.css`)**:
  - Calibrated `.your-photostrip-doodle` to `left: calc(50% + 46px)` and relocated `.compliment-doodle-cluster` below the photostrip on screens under 600px width.
- **Git Commits**:
  - `5a70252`: `fix: resolve dispensing chute pickup freeze via zero-taint base64 overlays and defensive canvas fallbacks`
  - `568fe3d`: `feat: remove canva edit button and hyperlinks from export view`

---

## [v1.0.0] — 2026-11-04: Initial Release & Modular Architecture

### 🎉 What's New (For Users)
- **Authentic Vintage Photobooth Experience**:
  - Enter the retro curtain doorway, choose from 10 authentic frame designs (Classic B&W, Hearts Cutout, Powerpuff Girls, Doodle, and more), and select Black & White or Vibrant Color via a hand-drawn 2D bat toggle switch.
- **Dual Photo Modes**:
  - **Live Camera**: Built-in webcam viewfinder with flash effects and retro shutter sounds.
  - **Photo Upload**: Drag and drop or upload 4 photos from your phone or camera roll with instant cropping.
- **Interactive Scissors Cut Strip Mode**:
  - Click the doodle scissors to slice your vertical 4-photo strip into 4 standalone vintage prints with realistic snip sound effects!
- **Zero-Build Web Deployment**:
  - Runs natively on GitHub Pages without needing any app store downloads or local software installation.

### 🛠️ Developer Technical Notes (For Bao)
- **Modular Architecture Refactor**:
  - Decomposed 3,300+ line monolithic `index.html` into a maintainable, high-performance modular structure:
    - `index.html`: Clean semantic DOM markup.
    - `css/style.css`: All design systems, animations, layout engines, and responsive media queries.
    - `js/app.js`: Global state orchestration, screen routing (`switchScreen`), and event delegation.
    - `js/frames.js`: 1:5.2 photostrip geometry engine (600×3120px) and multi-frame canvas rendering.
    - `js/camera.js`: MediaDevices webcam stream controller and automated multi-shot sequencing.
    - `js/audio.js`: Synthesized Web Audio API sound effects (coin clinks, buzzer timers, shutter clicks).
    - `js/filter.js`: Natural Studio Pro portrait filter engine (S-curve tone mapping + 3×3 Laplacian unsharp mask).
- **Git Setup & Remote Sync**:
  - Initialized Git repository, configured remote `origin` at `https://github.com/davdavbaoo/ChipVit-photo-booth.git`, and published initial production release on branch `main`.
- **Git Commit**:
  - `591574a`: `feat: modularize photo booth architecture into standalone CSS and JS modules`
