/**
 * audioEngine.js — mcDJ Audio Engine
 * 
 * Dual-deck Web Audio API engine for real audio playback,
 * DJ-style crossfade merging, real-time FFT analysis,
 * volume control, seeking, and beat detection.
 */

const CROSSFADE_DURATION = 2.5; // seconds

export default class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.masterGain = null;

    // Dual decks for crossfade
    this.deckA = { audio: null, source: null, gain: null, active: false };
    this.deckB = { audio: null, source: null, gain: null, active: false };

    this.currentDeck = 'A';
    this.volume = 0.75;
    this.isPlaying = false;
    this.crossfadeTimer = null;
    this.onTrackEnd = null; // callback

    // FFT data buffers
    this.frequencyData = null;
    this.timeDomainData = null;

    // Beat detection
    this.beatCount = 0;
    this.lastBeatTime = 0;
    this.prevEnergy = 0;
    this.bpmHistory = [];
    this.estimatedBPM = 0;
  }

  /**
   * Initialize the AudioContext (must be called from a user gesture)
   */
  init() {
    if (this.ctx) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Allocate FFT buffers
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);

    // Create both decks
    this._initDeck(this.deckA);
    this._initDeck(this.deckB);
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
    deck.active = false;
  }

  _getActiveDeck() {
    return this.currentDeck === 'A' ? this.deckA : this.deckB;
  }

  _getInactiveDeck() {
    return this.currentDeck === 'A' ? this.deckB : this.deckA;
  }

  /**
   * Resume AudioContext if suspended (browser autoplay policy)
   */
  async _ensureResumed() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Load and play a track on the currently active deck
   */
  async loadAndPlay(trackSrc) {
    this.init();
    await this._ensureResumed();

    const deck = this._getActiveDeck();

    // Stop any existing playback on this deck
    deck.audio.pause();
    deck.audio.src = trackSrc;
    deck.gain.gain.value = 1;
    deck.active = true;

    // Set up track end listener
    deck.audio.onended = () => {
      if (this.onTrackEnd) this.onTrackEnd();
    };

    try {
      await deck.audio.play();
      this.isPlaying = true;
    } catch (err) {
      console.warn('Playback failed:', err);
    }
  }

  /**
   * DJ crossfade to a new track
   * Fades out current deck while fading in the new track on the other deck
   */
  async crossfadeTo(trackSrc) {
    this.init();
    await this._ensureResumed();

    const outDeck = this._getActiveDeck();
    const inDeck = this._getInactiveDeck();

    // Clear any existing crossfade
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
    }

    // Load new track on the incoming deck
    inDeck.audio.pause();
    inDeck.audio.src = trackSrc;
    inDeck.gain.gain.value = 0;
    inDeck.active = true;

    // Set up track end listener on the new deck
    inDeck.audio.onended = () => {
      if (this.onTrackEnd) this.onTrackEnd();
    };

    try {
      await inDeck.audio.play();
    } catch (err) {
      console.warn('Crossfade play failed:', err);
    }

    // Crossfade with Web Audio API scheduled ramps
    const now = this.ctx.currentTime;
    outDeck.gain.gain.setValueAtTime(outDeck.gain.gain.value, now);
    outDeck.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);

    inDeck.gain.gain.setValueAtTime(0, now);
    inDeck.gain.gain.linearRampToValueAtTime(1, now + CROSSFADE_DURATION);

    this.isPlaying = true;

    // After crossfade completes, stop the old deck
    setTimeout(() => {
      outDeck.audio.pause();
      outDeck.audio.currentTime = 0;
      outDeck.active = false;
    }, CROSSFADE_DURATION * 1000 + 100);

    // Swap active deck
    this.currentDeck = this.currentDeck === 'A' ? 'B' : 'A';
  }

  /**
   * Play / resume current deck
   */
  async play() {
    this.init();
    await this._ensureResumed();
    const deck = this._getActiveDeck();
    if (deck.audio.src) {
      try {
        await deck.audio.play();
        this.isPlaying = true;
      } catch (err) {
        console.warn('Play failed:', err);
      }
    }
  }

  /**
   * Pause current deck
   */
  pause() {
    const deck = this._getActiveDeck();
    deck.audio.pause();
    this.isPlaying = false;
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Seek to position (0-1 fraction)
   */
  seek(fraction) {
    const deck = this._getActiveDeck();
    if (deck.audio.duration && isFinite(deck.audio.duration)) {
      deck.audio.currentTime = fraction * deck.audio.duration;
    }
  }

  /**
   * Get current playback progress (0-100)
   */
  getProgress() {
    const deck = this._getActiveDeck();
    if (!deck.audio.duration || !isFinite(deck.audio.duration)) return 0;
    return (deck.audio.currentTime / deck.audio.duration) * 100;
  }

  /**
   * Get current time in seconds
   */
  getCurrentTime() {
    const deck = this._getActiveDeck();
    return deck.audio.currentTime || 0;
  }

  /**
   * Get total duration in seconds
   */
  getDuration() {
    const deck = this._getActiveDeck();
    const d = deck.audio.duration;
    return (d && isFinite(d)) ? d : 0;
  }

  /**
   * Get real-time frequency data (for spectrum visualizer)
   * Returns normalized array (0-1) of 32 bins
   */
  getFrequencyData() {
    if (!this.analyser || !this.frequencyData) {
      return new Array(32).fill(0);
    }
    this.analyser.getByteFrequencyData(this.frequencyData);

    // Downsample to 32 bins
    const bins = 32;
    const binSize = Math.floor(this.frequencyData.length / bins);
    const result = [];
    for (let i = 0; i < bins; i++) {
      let sum = 0;
      for (let j = 0; j < binSize; j++) {
        sum += this.frequencyData[i * binSize + j];
      }
      result.push((sum / binSize) / 255);
    }
    return result;
  }

  /**
   * Get real-time time-domain data (for waveform visualizer)
   * Returns normalized array (-1 to 1) of 120 points
   */
  getTimeDomainData() {
    if (!this.analyser || !this.timeDomainData) {
      return new Array(120).fill(0);
    }
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Downsample to 120 points
    const points = 120;
    const step = Math.floor(this.timeDomainData.length / points);
    const result = [];
    for (let i = 0; i < points; i++) {
      result.push((this.timeDomainData[i * step] - 128) / 128);
    }
    return result;
  }

  /**
   * Get energy level (RMS of frequency data, 0-1)
   */
  getEnergy() {
    if (!this.analyser || !this.frequencyData) return 0;
    this.analyser.getByteFrequencyData(this.frequencyData);
    let sum = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      const v = this.frequencyData[i] / 255;
      sum += v * v;
    }
    return Math.sqrt(sum / this.frequencyData.length);
  }

  /**
   * Beat detection using spectral flux
   * Call this in an animation loop. Returns true if a beat was detected.
   */
  detectBeat() {
    const energy = this.getEnergy();
    const threshold = 0.15;
    const now = Date.now();
    const minInterval = 250; // at most 240 BPM

    const delta = energy - this.prevEnergy;
    this.prevEnergy = energy;

    if (delta > threshold && (now - this.lastBeatTime) > minInterval) {
      // Record inter-beat interval for BPM estimation
      if (this.lastBeatTime > 0) {
        const interval = now - this.lastBeatTime;
        const instantBPM = 60000 / interval;
        if (instantBPM > 60 && instantBPM < 200) {
          this.bpmHistory.push(instantBPM);
          if (this.bpmHistory.length > 20) this.bpmHistory.shift();
          this.estimatedBPM = Math.round(
            this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length
          );
        }
      }
      this.lastBeatTime = now;
      this.beatCount++;
      return true;
    }
    return false;
  }

  /**
   * Get estimated BPM from beat detection
   */
  getBPM() {
    return this.estimatedBPM || 0;
  }

  /**
   * Get total detected beats
   */
  getBeatCount() {
    return this.beatCount;
  }

  /**
   * Get confidence (based on BPM stability)
   */
  getConfidence() {
    if (this.bpmHistory.length < 4) return 0;
    const avg = this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length;
    const variance = this.bpmHistory.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / this.bpmHistory.length;
    const stddev = Math.sqrt(variance);
    // Lower stddev = higher confidence
    return Math.max(0, Math.min(100, Math.round(100 - stddev * 3)));
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.crossfadeTimer) clearInterval(this.crossfadeTimer);
    this.deckA.audio?.pause();
    this.deckB.audio?.pause();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
  }
}
