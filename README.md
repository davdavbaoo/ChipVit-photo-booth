# Vintage Photo Booth 📸✨

A vintage, hand-drawn doodle-styled web photobooth designed to run seamlessly across desktop and mobile devices. Built with pure zero-build vanilla web technologies (HTML5, CSS3, ES6 JavaScript, Web Audio API, and HTML5 Canvas).

---

## ✨ Features

- **🎞️ Authentic 4-Shot Photostrip**: Capture 4 sequential shots with live flash strobe, synchronized shutter audio, and automated 3-second countdown timer.
- **✨ Natural Studio Pro Portrait Filter**:
  - Live viewfinder CSS filter graphs.
  - S-curve tone-mapping (+12–16% shadow lift without blown highlights).
  - Fine 3×3 unsharp mask Laplacian kernel for crisp eyes, lips, lashes, and hair contours.
  - Dual modes: Classic Black & White and Vibrant Warm Color.
- **🎨 10 Authentic Frame Borders**: Includes Classic Black, Vintage Cream, Barbie Pink, Heart Cutouts, Ribbon Bows, Cloud Dream, Sparkle Star, Y2K Stamp, and custom colors.
- **🕹️ Hand-Drawn Doodle UI**: Custom minimalist 2D bat toggle switch, nostalgic scissors cutting animation, and interactive booth selector.
- **💡 Powerpuff Girls Recommended Poses**: Built-in visual inspiration board for solo and group photo sessions.
- **📱 Fully Responsive & Zero-Build**: Optimized for mobile devices (iPhone Safari, Android Chrome, tablets) and desktop web browsers without any build step, bundler, or dependencies.

---

## 🚀 Live Mobile & Desktop Testing (GitHub Pages)

Because mobile browsers require a secure origin (`HTTPS`) to access the device camera (`navigator.mediaDevices.getUserMedia`), this project is configured for instant deployment via **GitHub Pages**:

1. In this repository, navigate to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
3. Under **Branch**, select `main` and root folder `/(root)`. Click **Save**.
4. In 1–2 minutes, your live site will be ready at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```
5. Open this link on your smartphone or tablet, allow camera access when prompted, and enjoy the photobooth!

---

## 🛠️ Local Development

Simply open `index.html` in any modern web browser or serve locally using any lightweight HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then visit `http://localhost:8000` in your browser.

---

## 📁 Project Structure

```
├── index.html           # Main application entry point
├── .gitignore           # Git ignore rules for build and cache artifacts
├── css/
│   └── style.css        # Modular layout, animations, responsive design
├── js/
│   ├── audio.js         # Procedural Web Audio effects (shutter, clicks)
│   ├── camera.js        # Webcam streaming, softbox strobe, mirroring
│   ├── filter.js        # Natural Studio Pro tone-mapping and sharpening engine
│   ├── filter-worker.js # Offscreen worker for high-performance pixel processing
│   ├── frames.js        # 10 photostrip frame renderers & canvas compositing
│   └── app.js           # Main application coordinator and state machine
└── assets/
    └── ppg_poses.js     # Lightweight base64 reference pose illustrations
```

---

## 📄 License

MIT License. Free to use, customize, and share!
