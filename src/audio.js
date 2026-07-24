export class LabAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.hum = null;
    this.humGain = null;
    this.enabled = false;
    this.pendingTimers = new Set();
  }

  async unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
      this.createHum();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.enabled = true;
    this.master.gain.setTargetAtTime(0.16, this.ctx.currentTime, 0.04);
    return true;
  }

  setMuted(muted) {
    if (!this.ctx || !this.master) return;
    this.enabled = !muted;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.16, this.ctx.currentTime, 0.04);
  }

  createHum() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = 49;
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    gain.gain.value = 0.025;
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start();
    this.hum = osc;
    this.humGain = gain;
  }

  tone(freq = 220, duration = 0.08, type = 'square', volume = 0.08, slide = 0) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), now + duration);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noise(duration = 0.12, volume = 0.08, highpass = 800) {
    if (!this.ctx || !this.enabled) return;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  schedule(callback, delay) {
    const timer = setTimeout(() => {
      this.pendingTimers.delete(timer);
      callback();
    }, delay);
    this.pendingTimers.add(timer);
    return timer;
  }

  clearSequence() {
    for (const timer of this.pendingTimers) clearTimeout(timer);
    this.pendingTimers.clear();
  }

  startup() {
    this.clearSequence();
    this.tone(84, 0.28, 'sine', 0.12, 120);
    this.schedule(() => this.tone(420, 0.08, 'square', 0.07, 190), 110);
    this.schedule(() => this.noise(0.18, 0.05, 1200), 170);
  }

  relay() { this.tone(310, 0.035, 'square', 0.045, -120); }
  select() { this.tone(520, 0.055, 'triangle', 0.06, 80); }
  fire(clarity = 0.5) { this.tone(150 + clarity * 180, 0.055, 'sawtooth', 0.07, 230); }
  impact() { this.noise(0.06, 0.055, 1000); this.tone(74, 0.09, 'square', 0.04, -25); }
  damage() { this.noise(0.2, 0.1, 300); this.tone(95, 0.26, 'sawtooth', 0.09, -50); }
  pickup() { this.tone(440, 0.08, 'triangle', 0.06, 220); }
  warning() { this.tone(170, 0.12, 'square', 0.07, 0); }
  ability() { this.tone(90, 0.42, 'sine', 0.12, 600); }
  boss() { this.tone(42, 0.8, 'sawtooth', 0.12, 35); }
  victory() {
    this.clearSequence();
    [220, 330, 440, 660].forEach((f, i) => this.schedule(() => this.tone(f, 0.2, 'triangle', 0.075, 60), i * 115));
  }
  failure() {
    this.clearSequence();
    [180, 130, 85].forEach((f, i) => this.schedule(() => this.tone(f, 0.35, 'sawtooth', 0.075, -30), i * 160));
  }

  async destroy() {
    this.clearSequence();
    if (this.hum) {
      try { this.hum.stop(); } catch { /* oscillator may already be stopped */ }
      this.hum.disconnect();
    }
    this.humGain?.disconnect();
    this.master?.disconnect();
    if (this.ctx && this.ctx.state !== 'closed') await this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.hum = null;
    this.humGain = null;
    this.enabled = false;
  }
}
