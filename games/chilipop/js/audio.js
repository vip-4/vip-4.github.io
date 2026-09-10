'use strict';

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch {
      this.initialized = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _playTone(frequency, duration, type = 'sine', volume = 0.15) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playPop(groupSize) {
    if (!this.ctx || this.muted) return;
    const baseFreq = 400 + groupSize * 60;
    this._playTone(baseFreq, 0.1, 'sine', 0.12);
    setTimeout(() => this._playTone(baseFreq * 1.5, 0.08, 'sine', 0.08), 50);
  }

  playCombo(level) {
    if (!this.ctx || this.muted) return;
    const baseFreq = 500 + level * 100;
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.12, 'triangle', 0.1), i * 60);
    });
  }

  playFever() {
    if (!this.ctx || this.muted) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.2, 'square', 0.06), i * 80);
    });
  }

  playGameOver() {
    if (!this.ctx || this.muted) return;
    const notes = [392, 349, 330, 262];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.3, 'sine', 0.1), i * 150);
    });
  }

  playSelect() {
    this._playTone(600, 0.05, 'sine', 0.08);
  }

  playInvalid() {
    this._playTone(200, 0.15, 'sawtooth', 0.05);
  }
}
