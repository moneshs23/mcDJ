import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Disc3, Music, Activity
} from 'lucide-react';

export default function DJDeck({ deckId, audioEngine, onDrop }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [trackInfo, setTrackInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [eqHigh, setEqHigh] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqLow, setEqLow] = useState(0);
  const [bpm, setBpm] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [dropOver, setDropOver] = useState(false);
  const [beatFlash, setBeatFlash] = useState(false);

  const waveformCanvasRef = useRef(null);
  const spectrumCanvasRef = useRef(null);
  const rafRef = useRef(null);

  const isA = deckId === 'A';
  const accentColor = isA ? '#a855f7' : '#06b6d4';
  const accentRgba = isA ? '168, 85, 247' : '6, 182, 212';

  // ─── Animation loop ───
  useEffect(() => {
    const tick = () => {
      if (!audioEngine) { rafRef.current = requestAnimationFrame(tick); return; }

      const playing = audioEngine.getDeckIsPlaying(deckId);
      const loaded = audioEngine.getDeckIsLoaded(deckId);
      const info = audioEngine.getDeckTrackInfo(deckId);

      setIsPlaying(playing);
      setIsLoaded(loaded);
      setTrackInfo(info);
      setProgress(audioEngine.getDeckProgress(deckId));
      setCurrentTime(audioEngine.getDeckCurrentTime(deckId));
      setDuration(audioEngine.getDeckDuration(deckId));

      if (playing) {
        const beat = audioEngine.detectDeckBeat(deckId);
        setBpm(audioEngine.getDeckBPM(deckId));
        setEnergy(audioEngine.getDeckEnergy(deckId));
        if (beat) {
          setBeatFlash(true);
          setTimeout(() => setBeatFlash(false), 120);
        }
      }

      // Draw waveform
      drawWaveform();
      // Draw mini spectrum
      drawSpectrum();

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioEngine, deckId]);

  // ─── Draw scrolling waveform ───
  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !audioEngine) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== canvas.offsetWidth * dpr) {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const peaks = audioEngine.getDeckWaveformPeaks(deckId);
    if (!peaks || peaks.length === 0) {
      // No waveform data — draw placeholder
      ctx.strokeStyle = `rgba(${accentRgba}, 0.15)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }

    const progressFrac = audioEngine.getDeckProgress(deckId) / 100;
    const centerIdx = Math.floor(progressFrac * peaks.length);

    // How many peaks fit in the canvas
    const peaksInView = Math.min(peaks.length, 300);
    const startIdx = Math.max(0, centerIdx - Math.floor(peaksInView / 2));
    const endIdx = Math.min(peaks.length, startIdx + peaksInView);

    const barWidth = w / peaksInView;

    for (let i = startIdx; i < endIdx; i++) {
      const x = (i - startIdx) * barWidth;
      const val = peaks[i];
      const barH = val * h * 0.85;

      const isPast = i < centerIdx;
      const isCurrent = Math.abs(i - centerIdx) < 2;

      if (isCurrent) {
        ctx.fillStyle = '#fff';
      } else if (isPast) {
        ctx.fillStyle = `rgba(${accentRgba}, 0.35)`;
      } else {
        ctx.fillStyle = `rgba(${accentRgba}, 0.7)`;
      }

      // Top half
      ctx.fillRect(x, h / 2 - barH / 2, Math.max(1, barWidth - 1), barH / 2);
      // Bottom mirror
      ctx.fillStyle = isPast
        ? `rgba(${accentRgba}, 0.15)`
        : `rgba(${accentRgba}, 0.3)`;
      ctx.fillRect(x, h / 2, Math.max(1, barWidth - 1), barH / 2);
    }

    // Center line
    ctx.strokeStyle = `rgba(${accentRgba}, 0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }, [audioEngine, deckId, accentRgba]);

  // ─── Draw mini spectrum ───
  const drawSpectrum = useCallback(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas || !audioEngine) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== canvas.offsetWidth * dpr) {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const freqData = audioEngine.getDeckFrequencyData(deckId);
    const barCount = 16;
    const barW = (w / barCount) * 0.75;
    const gap = (w / barCount) * 0.25;

    for (let i = 0; i < barCount; i++) {
      const val = freqData[i * 2] || 0;
      const barH = val * h * 0.9;
      const x = i * (barW + gap) + gap / 2;

      const grad = ctx.createLinearGradient(x, h - barH, x, h);
      grad.addColorStop(0, `rgba(${accentRgba}, ${0.5 + val * 0.5})`);
      grad.addColorStop(1, `rgba(${accentRgba}, 0.1)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, h - barH, barW, barH, 2);
      ctx.fill();
    }
  }, [audioEngine, deckId, accentRgba]);

  // ─── Handlers ───
  const handlePlayPause = async () => {
    if (!audioEngine || !isLoaded) return;
    if (isPlaying) {
      audioEngine.pauseDeck(deckId);
    } else {
      await audioEngine.playDeck(deckId);
    }
  };

  const handleSeek = (e) => {
    if (!audioEngine || !isLoaded) return;
    const r = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - r.left) / r.width;
    audioEngine.seekDeck(deckId, Math.max(0, Math.min(1, frac)));
  };

  const handleVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    audioEngine?.setDeckVolume(deckId, v / 100);
  };

  const handleEQ = (band, val) => {
    const v = Number(val);
    if (band === 'high') setEqHigh(v);
    else if (band === 'mid') setEqMid(v);
    else setEqLow(v);
    audioEngine?.setEQ(deckId, band, v);
  };

  const handleSkipFwd = () => {
    if (audioEngine && isLoaded) {
      const cur = audioEngine.getDeckCurrentTime(deckId);
      const dur = audioEngine.getDeckDuration(deckId);
      audioEngine.seekDeck(deckId, Math.min(1, (cur + 10) / dur));
    }
  };

  const handleSkipBack = () => {
    if (audioEngine && isLoaded) {
      const cur = audioEngine.getDeckCurrentTime(deckId);
      const dur = audioEngine.getDeckDuration(deckId);
      audioEngine.seekDeck(deckId, Math.max(0, (cur - 10) / dur));
    }
  };

  // ─── Drag & Drop ───
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDropOver(true);
  };
  const handleDragLeave = () => setDropOver(false);
  const handleDropEvt = (e) => {
    e.preventDefault();
    setDropOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data && data.src) {
        onDrop?.(deckId, data);
      }
    } catch (err) {
      // ignore
    }
  };

  const formatTime = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`dj-deck ${isA ? 'deck-a' : 'deck-b'} ${isPlaying ? 'deck-active' : ''} ${dropOver ? 'drop-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropEvt}
    >
      {/* Beat flash overlay */}
      {beatFlash && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{ background: `rgba(${accentRgba}, 0.06)` }}
        />
      )}

      {/* Deck label + BPM */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: `rgba(${accentRgba}, 0.15)`, color: accentColor }}
          >
            {deckId}
          </div>
          <div>
            {trackInfo ? (
              <>
                <p className="text-sm font-bold text-white truncate max-w-[160px]">{trackInfo.track}</p>
                <p className="text-[10px] text-club-muted truncate max-w-[160px]">{trackInfo.artist}</p>
              </>
            ) : (
              <p className="text-xs text-club-muted">Drop a track here</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {bpm > 0 && (
            <div className="text-right">
              <p className="bpm-badge" style={{ color: accentColor }}>{bpm}</p>
              <p className="text-[9px] text-club-muted uppercase tracking-wider -mt-1">BPM</p>
            </div>
          )}
          <Disc3 size={20} className={`${isPlaying ? 'animate-spin-slow' : ''}`} style={{ color: accentColor }} />
        </div>
      </div>

      {/* Scrolling Waveform */}
      <div className="waveform-container mb-3" onClick={handleSeek}>
        <canvas ref={waveformCanvasRef} />
        {/* Playhead */}
        <div className="waveform-playhead" style={{ left: '50%' }} />
        {!isLoaded && (
          <div className="waveform-overlay-text">
            <Music size={16} className="inline mr-1" style={{ color: accentColor }} />
            Drop Track
          </div>
        )}
      </div>

      {/* Progress bar + time */}
      <div className="mb-3">
        <div className="progress-track" onClick={handleSeek}>
          <div className="progress-fill" style={{ width: `${progress}%`, background: accentColor }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-club-muted">{formatTime(currentTime)}</span>
          <span className="text-[10px] text-club-muted">-{formatTime(duration - currentTime)}</span>
        </div>
      </div>

      {/* Controls row: Transport + EQ + Volume + Spectrum */}
      <div className="flex items-center gap-4">
        {/* Transport */}
        <div className="flex items-center gap-2">
          <button className="transport-btn" onClick={handleSkipBack}><SkipBack size={14} /></button>
          <button
            className={`transport-btn play-btn ${!isA ? 'deck-b-play' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button className="transport-btn" onClick={handleSkipFwd}><SkipForward size={14} /></button>
        </div>

        {/* EQ */}
        <div className="eq-group">
          <div className="eq-slider-wrap">
            <span className="text-[8px] text-club-muted font-bold">HI</span>
            <input
              type="range" min="-12" max="12" step="1" value={eqHigh}
              onChange={(e) => handleEQ('high', e.target.value)}
              className="eq-slider eq-hi"
            />
          </div>
          <div className="eq-slider-wrap">
            <span className="text-[8px] text-club-muted font-bold">MID</span>
            <input
              type="range" min="-12" max="12" step="1" value={eqMid}
              onChange={(e) => handleEQ('mid', e.target.value)}
              className="eq-slider eq-mid"
            />
          </div>
          <div className="eq-slider-wrap">
            <span className="text-[8px] text-club-muted font-bold">LO</span>
            <input
              type="range" min="-12" max="12" step="1" value={eqLow}
              onChange={(e) => handleEQ('low', e.target.value)}
              className="eq-slider eq-lo"
            />
          </div>
        </div>

        {/* Volume */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] text-club-muted font-bold">VOL</span>
          <input
            type="range" min="0" max="100" value={volume}
            onChange={handleVolume}
            className="vol-fader"
          />
          <span className="text-[9px] text-club-muted">{volume}%</span>
        </div>

        {/* Mini spectrum */}
        <div className="flex-1">
          <canvas
            ref={spectrumCanvasRef}
            style={{ width: '100%', height: '48px', display: 'block', borderRadius: '6px' }}
          />
        </div>
      </div>
    </div>
  );
}
