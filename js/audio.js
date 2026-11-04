// =========================================================================
// js/audio.js - Procedural Web Audio Synthesis Engine
// 100% self-contained, procedural audio synthesis (zero external audio files)
// =========================================================================

(function (window) {
  'use strict';

  const audioEngine = {
    ctx: null,
    enabled: true,

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },

    playClick(freq = 520) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    },

    playBeep(freq = 880) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    },

    playShutter() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Mechanical click (120Hz square impulse over 25ms)
      const osc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.025);
      clickGain.gain.setValueAtTime(0.4, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      osc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);

      // Shutter wash / mirror slap (bandpassed white noise over 120ms)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800, now);
      bandpass.Q.setValueAtTime(2.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.125);

      whiteNoise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 0.13);
    },

    playPrinterMotor(durationSec = 1.6) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(65, now);
      osc2.frequency.setValueAtTime(130, now);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(8, now);
      lfoGain.gain.setValueAtTime(15, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      const motorFilter = this.ctx.createBiquadFilter();
      motorFilter.type = 'lowpass';
      motorFilter.frequency.setValueAtTime(420, now);

      const motorGain = this.ctx.createGain();
      motorGain.gain.setValueAtTime(0.001, now);
      motorGain.gain.linearRampToValueAtTime(0.12, now + 0.12);
      motorGain.gain.setValueAtTime(0.12, now + durationSec - 0.2);
      motorGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

      osc1.connect(motorFilter);
      osc2.connect(motorFilter);
      motorFilter.connect(motorGain);
      motorGain.connect(this.ctx.destination);

      const bufLen = Math.floor(this.ctx.sampleRate * durationSec);
      const noiseBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const paperFilter = this.ctx.createBiquadFilter();
      paperFilter.type = 'bandpass';
      paperFilter.frequency.setValueAtTime(3200, now);
      paperFilter.Q.setValueAtTime(1.8, now);

      const paperGain = this.ctx.createGain();
      paperGain.gain.setValueAtTime(0.001, now);
      paperGain.gain.linearRampToValueAtTime(0.08, now + 0.25);
      paperGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

      noiseSrc.connect(paperFilter);
      paperFilter.connect(paperGain);
      paperGain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      lfo.start(now);
      noiseSrc.start(now);

      osc1.stop(now + durationSec);
      osc2.stop(now + durationSec);
      lfo.stop(now + durationSec);
      noiseSrc.stop(now + durationSec);
    }
  };

  window.audioEngine = audioEngine;
})(window);
