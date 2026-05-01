import { useState, useEffect, useRef } from 'react';
import {
  Activity, Brain, AudioWaveform, BarChart3, Zap,
  CircleDot, Sparkles, TrendingUp, Cpu, Layers
} from 'lucide-react';

const NUM_FREQ_BINS = 32;
const NUM_WAVEFORM_POINTS = 120;

export default function BeatVisualizer({ audioEngine, isPlaying, currentSong }) {
  const canvasRef = useRef(null);
  const waveCanvasRef = useRef(null);
  const animRef = useRef(null);
  const waveAnimRef = useRef(null);

  const [beats, setBeats] = useState([]);
  const [mlMetrics, setMlMetrics] = useState({
    bpm: 0, confidence: 0, energy: 0, onset: false, beatCount: 0
  });

  // Real-time metrics + beat detection loop
  useEffect(() => {
    if (!audioEngine) return;
    let running = true;

    const tick = () => {
      if (!running) return;

      const isActive = audioEngine.isPlaying;
      if (isActive) {
        const beat = audioEngine.detectBeat();
        const energy = audioEngine.getEnergy();
        const bpm = audioEngine.getBPM();
        const confidence = audioEngine.getConfidence();
        const beatCount = audioEngine.getBeatCount();

        setMlMetrics({
          bpm,
          confidence,
          energy,
          onset: beat,
          beatCount,
        });

        if (beat) {
          setBeats(prev => [...prev.slice(-23), {
            time: Date.now(),
            strength: Math.min(1, 0.5 + energy),
          }]);
        }
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => { running = false; };
  }, [audioEngine]);

  // Spectrum visualizer — uses real FFT data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioEngine) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const draw = () => {
      const spectrum = audioEngine.getFrequencyData(); // real 32-bin FFT

      ctx.clearRect(0, 0, w, h);

      const barW = (w / NUM_FREQ_BINS) * 0.7;
      const gap = (w / NUM_FREQ_BINS) * 0.3;

      spectrum.forEach((val, i) => {
        const x = i * (barW + gap) + gap / 2;
        const barH = val * h * 0.9;
        const y = h - barH;

        const grad = ctx.createLinearGradient(x, y, x, h);
        if (i < 8) {
          grad.addColorStop(0, `rgba(168, 85, 247, ${0.5 + val * 0.5})`);
          grad.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
        } else if (i < 20) {
          grad.addColorStop(0, `rgba(236, 72, 153, ${0.5 + val * 0.5})`);
          grad.addColorStop(1, 'rgba(236, 72, 153, 0.1)');
        } else {
          grad.addColorStop(0, `rgba(6, 182, 212, ${0.5 + val * 0.5})`);
          grad.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 3);
        ctx.fill();

        // Glow top
        if (val > 0.5) {
          ctx.shadowColor = i < 8 ? '#a855f7' : i < 20 ? '#ec4899' : '#06b6d4';
          ctx.shadowBlur = 8;
          ctx.fillRect(x, y, barW, 2);
          ctx.shadowBlur = 0;
        }
      });

      // Beat flash overlay
      if (audioEngine.isPlaying && mlMetrics.onset) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.06)';
        ctx.fillRect(0, 0, w, h);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [audioEngine, mlMetrics.onset]);

  // Waveform visualizer — uses real time-domain data
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas || !audioEngine) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const draw = () => {
      const waveform = audioEngine.getTimeDomainData(); // real 120-point waveform
      ctx.clearRect(0, 0, w, h);

      // Waveform line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.lineWidth = 2;
      waveform.forEach((v, i) => {
        const x = (i / waveform.length) * w;
        const y = h / 2 + v * (h / 2) * 0.85;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill under waveform
      ctx.lineTo(w, h / 2);
      ctx.lineTo(0, h / 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.fill();

      // Mirror waveform
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1.5;
      waveform.forEach((v, i) => {
        const x = (i / waveform.length) * w;
        const y = h / 2 - v * (h / 2) * 0.65;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Playback progress marker
      if (audioEngine.isPlaying) {
        const progress = audioEngine.getProgress() / 100;
        const markerX = progress * w;
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(markerX, 0);
        ctx.lineTo(markerX, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Playhead dot
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(markerX, h / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(markerX, h / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center line
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      waveAnimRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(waveAnimRef.current);
  }, [audioEngine]);

  const isActive = audioEngine?.isPlaying;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-neon-purple" />
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>
              ML Beat Alignment
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30 font-semibold uppercase tracking-wider">
              Live Audio
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs text-club-muted">{isActive ? 'Analyzing' : 'Idle'}</span>
          </div>
        </div>
        {currentSong && (
          <div className="mt-2 flex items-center gap-2 text-xs text-club-muted">
            <Sparkles size={10} className="text-neon-pink" />
            <span>Analyzing: <span className="text-white font-medium">{currentSong.track}</span> — {currentSong.artist}</span>
          </div>
        )}
      </div>

      {/* ML Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity size={12} className="text-neon-purple" />
            <span className="text-[10px] text-club-muted uppercase tracking-wider font-medium">BPM</span>
          </div>
          <p className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit' }}>
            {isActive && mlMetrics.bpm > 0 ? mlMetrics.bpm : '--'}
          </p>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Cpu size={12} className="text-neon-cyan" />
            <span className="text-[10px] text-club-muted uppercase tracking-wider font-medium">Confidence</span>
          </div>
          <p className="text-2xl font-black text-neon-cyan" style={{ fontFamily: 'Outfit' }}>
            {isActive && mlMetrics.confidence > 0 ? `${mlMetrics.confidence}%` : '--'}
          </p>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap size={12} className="text-neon-pink" />
            <span className="text-[10px] text-club-muted uppercase tracking-wider font-medium">Energy</span>
          </div>
          <p className="text-2xl font-black text-neon-pink" style={{ fontFamily: 'Outfit' }}>
            {isActive ? `${Math.round(mlMetrics.energy * 100)}%` : '--'}
          </p>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CircleDot size={12} className={mlMetrics.onset ? 'text-green-400' : 'text-club-muted'} />
            <span className="text-[10px] text-club-muted uppercase tracking-wider font-medium">Beats</span>
          </div>
          <p className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit' }}>
            {isActive ? mlMetrics.beatCount : '0'}
          </p>
        </div>
      </div>

      {/* Frequency Spectrum */}
      <div className="glass-card p-4 glow-purple">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-neon-purple" />
          <span className="text-sm font-semibold text-white">Frequency Spectrum — Real-time FFT</span>
          <span className="text-[10px] text-club-muted ml-auto">2048-pt · {NUM_FREQ_BINS} bins</span>
        </div>
        <canvas
          ref={canvasRef}
          className="w-full rounded-xl bg-club-bg/50"
          style={{ height: '140px' }}
        />
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[10px] text-neon-purple font-medium">Bass</span>
          <span className="text-[10px] text-neon-pink font-medium">Mids</span>
          <span className="text-[10px] text-neon-cyan font-medium">Highs</span>
        </div>
      </div>

      {/* Waveform + Beat Alignment */}
      <div className="glass-card p-4 glow-cyan">
        <div className="flex items-center gap-2 mb-3">
          <AudioWaveform size={14} className="text-neon-cyan" />
          <span className="text-sm font-semibold text-white">Waveform · Playhead</span>
          <span className="text-[10px] text-club-muted ml-auto">
            {isActive && mlMetrics.bpm > 0 ? `${mlMetrics.bpm} BPM detected` : 'Waiting for audio...'}
          </span>
        </div>
        <canvas
          ref={waveCanvasRef}
          className="w-full rounded-xl bg-club-bg/50"
          style={{ height: '100px' }}
        />
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-neon-cyan rounded" /><span className="text-[10px] text-club-muted">Waveform</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-neon-purple rounded opacity-50" /><span className="text-[10px] text-club-muted">Mirror</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-neon-pink rounded" /><span className="text-[10px] text-club-muted">Playhead</span></div>
        </div>
      </div>

      {/* Beat Timeline */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={14} className="text-neon-pink" />
          <span className="text-sm font-semibold text-white">Beat Detection Timeline</span>
        </div>
        <div className="flex items-end gap-1 h-12 overflow-hidden">
          {beats.slice(-24).map((beat, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-150"
              style={{
                height: `${beat.strength * 100}%`,
                background: `linear-gradient(to top, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, ${beat.strength}))`,
                opacity: 0.4 + (i / 24) * 0.6,
              }}
            />
          ))}
          {beats.length === 0 && (
            <div className="w-full text-center text-xs text-club-muted py-3">
              {isActive ? 'Detecting beats...' : 'Start playback to begin analysis'}
            </div>
          )}
        </div>
      </div>

      {/* ML Pipeline Info */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-neon-purple" />
          <span className="text-sm font-semibold text-white">Audio Analysis Pipeline</span>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Audio Input', detail: 'Web Audio API · MediaElementSource', icon: AudioWaveform, color: 'text-neon-cyan' },
            { label: 'FFT Analysis', detail: '2048-point AnalyserNode', icon: BarChart3, color: 'text-neon-purple' },
            { label: 'Onset Detection', detail: 'Spectral flux + energy threshold', icon: Zap, color: 'text-neon-pink' },
            { label: 'Tempo Estimation', detail: `Inter-onset interval → ${mlMetrics.bpm > 0 ? mlMetrics.bpm : '...'} BPM`, icon: Activity, color: 'text-neon-cyan' },
            { label: 'DJ Crossfade', detail: 'Dual-deck gain ramp · 2.5s blend', icon: TrendingUp, color: 'text-green-400' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-club-surface/30">
              <div className={`w-7 h-7 rounded-lg bg-club-card flex items-center justify-center`}>
                <step.icon size={13} className={step.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{step.label}</p>
                <p className="text-[10px] text-club-muted">{step.detail}</p>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-club-muted'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
