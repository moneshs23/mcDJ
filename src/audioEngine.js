/**
 * audioEngine.js — mcDJ AI Audio Engine
 *
 * Smart audio engine with:
 * - Beat-drop detection: analyzes audio to skip silence/intros, starts at first beat
 * - Transition sound effects (riser, impact, sweep) synthesized via Web Audio
 * - Auto-crossfade with beat-aligned transitions
 * - Real-time FFT analysis, BPM estimation
 * - Waveform pre-decoding for timeline display
 */

const CROSSFADE_DURATION = 3;

// Transition FX types
const FX_TYPES = {
  riser: { name: 'Riser', desc: 'Rising sweep building tension' },
  impact: { name: 'Impact', desc: 'Kick impact on the drop' },
  sweep: { name: 'Sweep', desc: 'Filter sweep transition' },
  none: { name: 'None', desc: 'Clean crossfade only' },
};

export default class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.masterGain = null;

    this.deckA = { audio: null, source: null, gain: null };
    this.deckB = { audio: null, source: null, gain: null };
    this.activeDeck = 'A';

    this.volume = 0.85;
    this.isPlaying = false;
    this.currentTrack = null;
    this.onTrackEnd = null;
    this.isCrossfading = false;

    // Transition FX
    this.transitionFX = 'riser'; // default

    // FFT buffers
    this.frequencyData = null;
    this.timeDomainData = null;

    // Beat detection
    this.beatCount = 0;
    this.lastBeatTime = 0;
    this.prevEnergy = 0;
    this.bpmHistory = [];
    this.estimatedBPM = 0;

    // Waveform cache & beat-drop cache
    this.waveformCache = {};
    this.beatDropCache = {}; // src -> seconds where first beat is

    this._initialized = false;
  }

  static get FX_TYPES() { return FX_TYPES; }
  get fxTypes() { return FX_TYPES; }

  init() {
    if (this._initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);

    this._initDeck(this.deckA);
    this._initDeck(this.deckB);
    this._initialized = true;
  }

  _initDeck(deck) {
    deck.audio = new Audio();
    deck.audio.crossOrigin = 'anonymous';
    deck.audio.preload = 'auto';
    deck.gain = this.ctx.createGain();
    deck.gain.gain.value = 0;
    deck.gain.connect(this.masterGain);
    deck.source = this.ctx.createMediaElementSource(deck.audio);
    deck.source.connect(deck.gain);
  }

  _active() { return this.activeDeck === 'A' ? this.deckA : this.deckB; }
  _inactive() { return this.activeDeck === 'A' ? this.deckB : this.deckA; }

  async _ensureResumed() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  // ──────────── BEAT-DROP DETECTION ────────────
  // Analyzes the decoded audio buffer to find where the first significant
  // energy spike occurs (the "beat drop") so we skip silence/quiet intros.

  async _findBeatDrop(src) {
    if (this.beatDropCache[src] !== undefined) return this.beatDropCache[src];

    try {
      const res = await fetch(src);
      const buf = await res.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(buf);
      const ch = decoded.getChannelData(0);
      const sampleRate = decoded.sampleRate;

      // Analyze in 50ms windows
      const windowSize = Math.floor(sampleRate * 0.05);
      const energies = [];
      for (let i = 0; i < ch.length - windowSize; i += windowSize) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          sum += ch[i + j] * ch[i + j];
        }
        energies.push(Math.sqrt(sum / windowSize));
      }

      // Find peak energy
      const maxEnergy = Math.max(...energies);
      // Threshold = 25% of peak — first window above this is the "beat drop"
      const threshold = maxEnergy * 0.25;

      let dropWindow = 0;
      for (let i = 0; i < energies.length; i++) {
        if (energies[i] > threshold) {
          dropWindow = i;
          break;
        }
      }

      // Convert window index to seconds, back up 0.1s for attack
      const dropTime = Math.max(0, (dropWindow * 0.05) - 0.1);
      this.beatDropCache[src] = dropTime;

      // Also cache waveform while we have the buffer
      if (!this.waveformCache[src]) {
        const numPeaks = 500;
        const blockSize = Math.floor(ch.length / numPeaks);
        const peaks = [];
        for (let i = 0; i < numPeaks; i++) {
          let max = 0;
          for (let j = 0; j < blockSize; j++) {
            const abs = Math.abs(ch[i * blockSize + j]);
            if (abs > max) max = abs;
          }
          peaks.push(max);
        }
        this.waveformCache[src] = peaks;
      }

      return dropTime;
    } catch (e) {
      console.warn('Beat drop detection failed:', e);
      this.beatDropCache[src] = 0;
      return 0;
    }
  }

  // ──────────── TRANSITION SOUND FX ────────────
  // Synthesized using oscillators + noise — no external files needed

  setTransitionFX(type) {
    this.transitionFX = FX_TYPES[type] ? type : 'none';
  }

  getTransitionFX() {
    return this.transitionFX;
  }

  _playTransitionFX() {
    if (!this.ctx || this.transitionFX === 'none') return;

    const now = this.ctx.currentTime;
    const fxGain = this.ctx.createGain();
    fxGain.connect(this.masterGain);

    if (this.transitionFX === 'riser') {
      // Rising sweep: oscillator sweeping up over 2.5s
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 2.5);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(6000, now + 2.5);
      filter.Q.value = 5;

      fxGain.gain.setValueAtTime(0, now);
      fxGain.gain.linearRampToValueAtTime(0.12, now + 2);
      fxGain.gain.linearRampToValueAtTime(0, now + 3);

      osc.connect(filter);
      filter.connect(fxGain);
      osc.start(now);
      osc.stop(now + 3);

    } else if (this.transitionFX === 'impact') {
      // Low kick impact at the crossfade midpoint
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now + 1.5);
      osc.frequency.exponentialRampToValueAtTime(30, now + 2);

      fxGain.gain.setValueAtTime(0, now);
      fxGain.gain.setValueAtTime(0.25, now + 1.5);
      fxGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(fxGain);
      osc.start(now + 1.5);
      osc.stop(now + 2.5);

      // Add noise burst for the impact texture
      this._playNoiseBurst(now + 1.5, 0.15, 0.08);

    } else if (this.transitionFX === 'sweep') {
      // White noise sweep with filter
      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(8000, now + 1.5);
      filter.frequency.exponentialRampToValueAtTime(200, now + 3);
      filter.Q.value = 3;

      fxGain.gain.setValueAtTime(0, now);
      fxGain.gain.linearRampToValueAtTime(0.08, now + 1);
      fxGain.gain.linearRampToValueAtTime(0.1, now + 1.5);
      fxGain.gain.linearRampToValueAtTime(0, now + 3);

      noise.connect(filter);
      filter.connect(fxGain);
      noise.start(now);
      noise.stop(now + 3);
    }
  }

  _playNoiseBurst(startTime, duration, vol) {
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1);

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(g);
    g.connect(this.masterGain);
    src.start(startTime);
    src.stop(startTime + duration);
  }

  // ──────────── PLAYBACK ────────────

  async loadAndPlay(src, trackInfo = null) {
    this.init();
    await this._ensureResumed();

    // Find beat drop first
    const beatDropTime = await this._findBeatDrop(src);

    const deck = this._active();
    deck.audio.pause();
    deck.audio.src = src;
    deck.gain.gain.value = 1;
    this.currentTrack = trackInfo;

    this.beatCount = 0;
    this.lastBeatTime = 0;
    this.prevEnergy = 0;
    this.bpmHistory = [];
    this.estimatedBPM = 0;

    deck.audio.onended = () => { this.isPlaying = false; this.onTrackEnd?.(); };

    // Wait for metadata, then seek to beat drop
    await new Promise(r => {
      deck.audio.addEventListener('loadedmetadata', r, { once: true });
      deck.audio.addEventListener('canplay', r, { once: true });
    });

    if (beatDropTime > 0.5) {
      deck.audio.currentTime = beatDropTime;
    }

    try {
      await deck.audio.play();
      this.isPlaying = true;
    } catch (err) {
      console.warn('Play failed:', err);
    }
  }

  async play() {
    this.init();
    await this._ensureResumed();
    const deck = this._active();
    if (deck.audio.src) {
      try { await deck.audio.play(); this.isPlaying = true; } catch (e) { console.warn(e); }
    }
  }

  pause() { this._active().audio.pause(); this.isPlaying = false; }

  seek(fraction) {
    const a = this._active().audio;
    if (a.duration && isFinite(a.duration)) a.currentTime = fraction * a.duration;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  getProgress() {
    const a = this._active().audio;
    if (!a || !a.duration || !isFinite(a.duration)) return 0;
    return (a.currentTime / a.duration) * 100;
  }

  getCurrentTime() { return this._active().audio?.currentTime || 0; }
  getDuration() { const d = this._active().audio?.duration; return (d && isFinite(d)) ? d : 0; }
  getRemainingTime() { return Math.max(0, this.getDuration() - this.getCurrentTime()); }

  getBeatDropTime(src) { return this.beatDropCache[src] || 0; }

  // ──────────── AI CROSSFADE ────────────

  async crossfadeTo(src, trackInfo = null) {
    this.init();
    await this._ensureResumed();
    this.isCrossfading = true;

    // Find beat drop for the incoming track
    const beatDropTime = await this._findBeatDrop(src);

    const outDeck = this._active();
    const inDeck = this._inactive();

    inDeck.audio.pause();
    inDeck.audio.src = src;
    inDeck.gain.gain.value = 0;
    this.currentTrack = trackInfo;

    inDeck.audio.onended = () => { this.isPlaying = false; this.onTrackEnd?.(); };

    // Wait for metadata, seek to beat drop
    await new Promise(r => {
      inDeck.audio.addEventListener('loadedmetadata', r, { once: true });
      inDeck.audio.addEventListener('canplay', r, { once: true });
    });

    if (beatDropTime > 0.5) {
      inDeck.audio.currentTime = beatDropTime;
    }

    try { await inDeck.audio.play(); } catch (e) { console.warn(e); }

    // Play transition FX
    this._playTransitionFX();

    // Crossfade gains
    const now = this.ctx.currentTime;
    outDeck.gain.gain.setValueAtTime(outDeck.gain.gain.value, now);
    outDeck.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);
    inDeck.gain.gain.setValueAtTime(0, now);
    inDeck.gain.gain.linearRampToValueAtTime(1, now + CROSSFADE_DURATION);

    this.isPlaying = true;
    this.beatCount = 0;
    this.lastBeatTime = 0;
    this.prevEnergy = 0;
    this.bpmHistory = [];
    this.estimatedBPM = 0;

    setTimeout(() => {
      outDeck.audio.pause();
      outDeck.audio.currentTime = 0;
      this.isCrossfading = false;
    }, CROSSFADE_DURATION * 1000 + 200);

    this.activeDeck = this.activeDeck === 'A' ? 'B' : 'A';
  }

  // ──────────── WAVEFORM ────────────

  async _preDecodeWaveform(src) {
    if (this.waveformCache[src]) return;
    try {
      const res = await fetch(src);
      const buf = await res.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(buf);
      const ch = decoded.getChannelData(0);
      const numPeaks = 500;
      const blockSize = Math.floor(ch.length / numPeaks);
      const peaks = [];
      for (let i = 0; i < numPeaks; i++) {
        let max = 0;
        for (let j = 0; j < blockSize; j++) {
          const abs = Math.abs(ch[i * blockSize + j]);
          if (abs > max) max = abs;
        }
        peaks.push(max);
      }
      this.waveformCache[src] = peaks;
    } catch (e) { console.warn('Waveform decode failed:', e); }
  }

  getWaveformPeaks(src) { return this.waveformCache[src] || null; }

  async preDecodeAll(trackList) {
    this.init();
    for (const t of trackList) {
      await this._findBeatDrop(t.src); // also caches waveform
    }
  }

  // ──────────── ANALYSIS ────────────

  getFrequencyData() {
    if (!this.analyser || !this.frequencyData) return new Array(32).fill(0);
    this.analyser.getByteFrequencyData(this.frequencyData);
    const bins = 32, bs = Math.floor(this.frequencyData.length / bins), r = [];
    for (let i = 0; i < bins; i++) { let s = 0; for (let j = 0; j < bs; j++) s += this.frequencyData[i * bs + j]; r.push((s / bs) / 255); }
    return r;
  }

  getTimeDomainData() {
    if (!this.analyser || !this.timeDomainData) return new Array(120).fill(0);
    this.analyser.getByteTimeDomainData(this.timeDomainData);
    const pts = 120, step = Math.floor(this.timeDomainData.length / pts), r = [];
    for (let i = 0; i < pts; i++) r.push((this.timeDomainData[i * step] - 128) / 128);
    return r;
  }

  getEnergy() {
    if (!this.analyser || !this.frequencyData) return 0;
    this.analyser.getByteFrequencyData(this.frequencyData);
    let s = 0;
    for (let i = 0; i < this.frequencyData.length; i++) { const v = this.frequencyData[i] / 255; s += v * v; }
    return Math.sqrt(s / this.frequencyData.length);
  }

  detectBeat() {
    const energy = this.getEnergy();
    const now = Date.now();
    const delta = energy - this.prevEnergy;
    this.prevEnergy = energy;

    if (delta > 0.12 && (now - this.lastBeatTime) > 250) {
      if (this.lastBeatTime > 0) {
        const bpm = 60000 / (now - this.lastBeatTime);
        if (bpm > 60 && bpm < 200) {
          this.bpmHistory.push(bpm);
          if (this.bpmHistory.length > 24) this.bpmHistory.shift();
          this.estimatedBPM = Math.round(this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length);
        }
      }
      this.lastBeatTime = now;
      this.beatCount++;
      return true;
    }
    return false;
  }

  getBPM() { return this.estimatedBPM || 0; }
  getBeatCount() { return this.beatCount; }
  getConfidence() {
    if (this.bpmHistory.length < 4) return 0;
    const avg = this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length;
    const v = this.bpmHistory.reduce((s, x) => s + (x - avg) ** 2, 0) / this.bpmHistory.length;
    return Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(v) * 3)));
  }

  shouldAutoAdvance() {
    const rem = this.getRemainingTime();
    return this.isPlaying && rem > 0 && rem < 8;
  }

  destroy() {
    this.deckA.audio?.pause();
    this.deckB.audio?.pause();
    if (this.ctx?.state !== 'closed') this.ctx?.close().catch(() => {});
  }
}
