/**
 * audioEngine.js — mcDJ AI Audio Engine
 *
 * Smart audio engine that handles all mixing automatically:
 * - Single playback pipeline with auto-crossfade
 * - Real-time FFT analysis for spectrum/waveform
 * - Waveform pre-decoding for timeline display
 * - Beat detection & BPM estimation
 * - AI auto-transition with beat-aligned crossfades
 */

const CROSSFADE_DURATION = 3;

export default class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.masterGain = null;

    // Two audio elements for crossfade transitions
    this.deckA = { audio: null, source: null, gain: null };
    this.deckB = { audio: null, source: null, gain: null };
    this.activeDeck = 'A';

    this.volume = 0.85;
    this.isPlaying = false;
    this.currentTrack = null;
    this.onTrackEnd = null;
    this.isCrossfading = false;

    // FFT buffers
    this.frequencyData = null;
    this.timeDomainData = null;

    // Beat detection
    this.beatCount = 0;
    this.lastBeatTime = 0;
    this.prevEnergy = 0;
    this.bpmHistory = [];
    this.estimatedBPM = 0;

    // Waveform cache: src -> peaks array
    this.waveformCache = {};

    this._initialized = false;
  }

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

  _active() {
    return this.activeDeck === 'A' ? this.deckA : this.deckB;
  }

  _inactive() {
    return this.activeDeck === 'A' ? this.deckB : this.deckA;
  }

  async _ensureResumed() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  // ─── Playback ───

  async loadAndPlay(src, trackInfo = null) {
    this.init();
    await this._ensureResumed();

    const deck = this._active();
    deck.audio.pause();
    deck.audio.src = src;
    deck.gain.gain.value = 1;
    this.currentTrack = trackInfo;

    // Reset beat detection
    this.beatCount = 0;
    this.lastBeatTime = 0;
    this.prevEnergy = 0;
    this.bpmHistory = [];
    this.estimatedBPM = 0;

    deck.audio.onended = () => {
      this.isPlaying = false;
      this.onTrackEnd?.();
    };

    try {
      await deck.audio.play();
      this.isPlaying = true;
    } catch (err) {
      console.warn('Play failed:', err);
    }

    // Pre-decode waveform
    this._preDecodeWaveform(src);
  }

  async play() {
    this.init();
    await this._ensureResumed();
    const deck = this._active();
    if (deck.audio.src) {
      try { await deck.audio.play(); this.isPlaying = true; } catch (e) { console.warn(e); }
    }
  }

  pause() {
    this._active().audio.pause();
    this.isPlaying = false;
  }

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

  // ─── AI Crossfade to next track ───

  async crossfadeTo(src, trackInfo = null) {
    this.init();
    await this._ensureResumed();
    this.isCrossfading = true;

    const outDeck = this._active();
    const inDeck = this._inactive();

    inDeck.audio.pause();
    inDeck.audio.src = src;
    inDeck.gain.gain.value = 0;
    this.currentTrack = trackInfo;

    inDeck.audio.onended = () => {
      this.isPlaying = false;
      this.onTrackEnd?.();
    };

    try { await inDeck.audio.play(); } catch (e) { console.warn(e); }

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

    this._preDecodeWaveform(src);
  }

  // ─── Waveform ───

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
    } catch (e) {
      console.warn('Waveform decode failed:', e);
    }
  }

  getWaveformPeaks(src) {
    return this.waveformCache[src] || null;
  }

  // Pre-decode all tracks
  async preDecodeAll(trackList) {
    this.init();
    for (const t of trackList) {
      await this._preDecodeWaveform(t.src);
    }
  }

  // ─── Analysis ───

  getFrequencyData() {
    if (!this.analyser || !this.frequencyData) return new Array(32).fill(0);
    this.analyser.getByteFrequencyData(this.frequencyData);
    const bins = 32, bs = Math.floor(this.frequencyData.length / bins), r = [];
    for (let i = 0; i < bins; i++) {
      let s = 0;
      for (let j = 0; j < bs; j++) s += this.frequencyData[i * bs + j];
      r.push((s / bs) / 255);
    }
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

  // ─── AI: check if near end for auto-advance ───
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
