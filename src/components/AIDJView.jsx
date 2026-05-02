import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, Music, Brain, Zap, ThumbsUp, Users,
  ChevronRight, TrendingUp, Flame, Clock, Shuffle
} from 'lucide-react';

export default function AIDJView({ audioEngine, tracks, queue, setQueue, users, vibeLevel, onVote }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [bpm, setBpm] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [beatFlash, setBeatFlash] = useState(false);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [aiStatus, setAiStatus] = useState('Ready to play');
  const [analyzed, setAnalyzed] = useState(false);
  const [nextTrackInfo, setNextTrackInfo] = useState(null);

  const waveformRef = useRef(null);
  const spectrumRef = useRef(null);
  const rafRef = useRef(null);
  const autoAdvanceRef = useRef(false);

  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes);
  const currentTrack = sortedQueue[currentTrackIdx] || null;

  // Tick loop
  useEffect(() => {
    const tick = () => {
      if (audioEngine) {
        setIsPlaying(audioEngine.isPlaying);
        setProgress(audioEngine.getProgress());
        setCurrentTime(audioEngine.getCurrentTime());
        setDuration(audioEngine.getDuration());

        if (audioEngine.isPlaying) {
          const beat = audioEngine.detectBeat();
          setBpm(audioEngine.getBPM());
          setEnergy(audioEngine.getEnergy());
          if (beat) { setBeatFlash(true); setTimeout(() => setBeatFlash(false), 120); }

          // Auto-advance with AI mixing
          if (audioEngine.shouldAutoAdvance() && !autoAdvanceRef.current) {
            autoAdvanceRef.current = true;
            handleAutoSkip();
            setTimeout(() => { autoAdvanceRef.current = false; }, 12000);
          }
        }
        drawWaveform();
        drawSpectrum();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioEngine, currentTrackIdx, queue]);

  // AI Status
  useEffect(() => {
    if (isCrossfading) {
      setAiStatus('🔀 Mixing transition in progress...');
    } else if (isPlaying && bpm > 0) {
      const rem = duration - currentTime;
      const abpm = audioEngine?.getTrackBPM(currentTrack?.src) || bpm;
      if (rem < 15 && rem > 0) {
        setAiStatus(`⏳ Next track in ${Math.ceil(rem)}s`);
      } else {
        setAiStatus(`Playing at ${abpm} BPM · ${Math.round(energy * 100)}% energy`);
      }
    } else if (analyzed) {
      setAiStatus('All tracks analyzed — ready to play');
    } else {
      setAiStatus('Press play to start AI mixing');
    }
  }, [isPlaying, bpm, energy, isCrossfading, currentTime, duration, analyzed]);

  // Draw mini waveform
  const drawWaveform = useCallback(() => {
    const c = waveformRef.current;
    if (!c || !audioEngine) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== c.offsetWidth * dpr) { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; ctx.scale(dpr, dpr); }
    const w = c.offsetWidth, h = c.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const wave = audioEngine.getTimeDomainData();
    // Fill waveform
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(139,92,246,0.6)';
    ctx.lineWidth = 1.5;
    wave.forEach((v, i) => {
      const x = (i / wave.length) * w, y = h / 2 + v * h * 0.38;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Mirror
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(139,92,246,0.2)';
    ctx.lineWidth = 1;
    wave.forEach((v, i) => {
      const x = (i / wave.length) * w, y = h / 2 - v * h * 0.25;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Center line
    ctx.strokeStyle = 'rgba(63,63,70,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    // Playhead
    if (audioEngine.isPlaying) {
      const px = (audioEngine.getProgress() / 100) * w;
      ctx.strokeStyle = 'rgba(167,139,250,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    }
  }, [audioEngine]);

  // Draw spectrum
  const drawSpectrum = useCallback(() => {
    const c = spectrumRef.current;
    if (!c || !audioEngine) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== c.offsetWidth * dpr) { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; ctx.scale(dpr, dpr); }
    const w = c.offsetWidth, h = c.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const freq = audioEngine.getFrequencyData();
    const bw = (w / 32) * 0.7, gap = (w / 32) * 0.3;
    freq.forEach((v, i) => {
      const x = i * (bw + gap) + gap / 2, bh = v * h * 0.85;
      const g = ctx.createLinearGradient(x, h - bh, x, h);
      g.addColorStop(0, `rgba(139,92,246,${0.4 + v * 0.5})`);
      g.addColorStop(1, 'rgba(139,92,246,0.05)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, h - bh, bw, bh, 2);
      ctx.fill();
    });
  }, [audioEngine]);

  // Play/Pause
  const handlePlayPause = async () => {
    if (!audioEngine || !currentTrack) return;
    if (!hasStarted) {
      setAiStatus('🔬 Analyzing tracks...');
      await audioEngine.preDecodeAll(sortedQueue);
      setAnalyzed(true);
      // Reorder by energy flow automatically
      const ordered = audioEngine.orderByEnergyFlow(sortedQueue);
      setQueue(ordered);
      await audioEngine.loadAndPlay(currentTrack.src, currentTrack);
      setHasStarted(true);
    } else if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.play();
    }
  };

  // AI auto-skip with smart transition
  const handleAutoSkip = useCallback(async () => {
    const nextIdx = (currentTrackIdx + 1) % sortedQueue.length;
    if (nextIdx === currentTrackIdx || !sortedQueue[nextIdx]) return;
    const next = sortedQueue[nextIdx];

    // Auto-select transition style based on energy
    if (audioEngine?._autoSelectTransition) {
      const outE = audioEngine.getTrackEnergy(currentTrack?.src) || 'medium';
      const inE = audioEngine.getTrackEnergy(next.src) || 'medium';
      const auto = audioEngine._autoSelectTransition(outE, inE);
      audioEngine.setTransitionStyle(auto.style);
      audioEngine.setTransitionFX(auto.fx);
    }

    // Randomly pick transition beat length
    const beatOpts = [8, 16, 32];
    audioEngine?.setTransitionBeats(beatOpts[Math.floor(Math.random() * beatOpts.length)]);

    setCurrentTrackIdx(nextIdx);
    setIsCrossfading(true);
    setNextTrackInfo(next);

    if (hasStarted && audioEngine) {
      await audioEngine.crossfadeTo(next.src, next);
    } else if (audioEngine) {
      await audioEngine.loadAndPlay(next.src, next);
      setHasStarted(true);
    }

    setTimeout(() => { setIsCrossfading(false); setNextTrackInfo(null); }, 3500);
  }, [audioEngine, currentTrackIdx, sortedQueue, hasStarted, currentTrack]);

  const handleSeek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    audioEngine?.seek((e.clientX - r.left) / r.width);
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const getVibeLabel = () => {
    if (vibeLevel > 80) return '🔥 On Fire';
    if (vibeLevel > 60) return '💜 Vibing';
    if (vibeLevel > 40) return '✨ Warming Up';
    return '🎵 Chill';
  };
  const getVibeGrad = () => {
    if (vibeLevel > 80) return 'from-red-500 to-orange-500';
    if (vibeLevel > 60) return 'from-purple-500 to-pink-500';
    if (vibeLevel > 40) return 'from-violet-500 to-purple-500';
    return 'from-blue-500 to-violet-500';
  };

  return (
    <div className="space-y-4 animate-slide-up">

      {/* AI Status */}
      <div className="ai-status">
        <Brain size={14} className="text-accent flex-shrink-0" />
        <span className="text-text-secondary flex-1 truncate">{aiStatus}</span>
        {isPlaying && <span className="badge badge-green text-[10px]">● LIVE</span>}
        {isCrossfading && <span className="badge badge-purple text-[10px] animate-pulse-soft">MIXING</span>}
      </div>

      {/* Vibe Meter */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame size={14} className={vibeLevel > 60 ? 'text-accent' : 'text-text-muted'} />
            <span className="text-xs font-semibold text-text-primary">Crowd Vibe</span>
          </div>
          <span className="text-xs font-semibold">{getVibeLabel()}</span>
        </div>
        <div className="vibe-bar"><div className={`vibe-fill bg-gradient-to-r ${getVibeGrad()}`} style={{ width: `${vibeLevel}%` }} /></div>
      </div>

      {/* Now Playing */}
      <div className={`card p-5 relative overflow-hidden transition-all ${isPlaying ? 'border-accent/30' : ''}`}>
        {isCrossfading && <div className="transition-overlay" />}
        {beatFlash && <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.04)' }} />}

        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-success animate-pulse-soft' : 'bg-text-muted'}`} />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Now Playing</span>
          {isCrossfading && nextTrackInfo && (
            <span className="ml-auto text-[10px] text-accent">→ {nextTrackInfo.track}</span>
          )}
        </div>

        {currentTrack ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className={`now-playing-art ${isPlaying ? 'playing' : ''}`}>
                <Music size={28} className="text-white relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text-primary truncate">{currentTrack.track}</h3>
                <p className="text-text-muted text-sm truncate">{currentTrack.artist}</p>
                <div className="flex gap-2 mt-1.5">
                  {bpm > 0 && <span className="badge badge-purple">{audioEngine?.getTrackBPM(currentTrack.src) || bpm} BPM</span>}
                  {audioEngine?.getTrackKey(currentTrack.src) && (
                    <span className="badge badge-muted">{audioEngine.getTrackKey(currentTrack.src)}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {isPlaying && (
                  <div className="eq-bars">
                    {[...Array(5)].map((_, i) => <div key={i} className="eq-bar" />)}
                  </div>
                )}
              </div>
            </div>

            {/* Waveform */}
            <div className="waveform-display mb-3">
              <canvas ref={waveformRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>

            {/* Spectrum */}
            <div className="rounded-lg overflow-hidden bg-surface-1 border border-border mb-3" style={{ height: 56 }}>
              <canvas ref={spectrumRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="progress-track" onClick={handleSeek}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-text-muted font-medium">{fmt(currentTime)}</span>
                <span className="text-[11px] text-text-muted font-medium">-{fmt(duration - currentTime)}</span>
              </div>
            </div>

            {/* Play/Pause — Only control */}
            <div className="flex items-center justify-center">
              <button onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
                style={{ boxShadow: '0 4px 24px rgba(139,92,246,0.35)' }}>
                {isPlaying ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <Music size={40} className="text-text-muted/30 mx-auto mb-3" />
            <p className="text-text-muted text-sm">No track loaded</p>
          </div>
        )}
      </div>

      {/* Queue — Vote to boost */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-sm font-bold text-text-primary">Up Next</span>
            <span className="text-[10px] text-text-muted">— vote to boost</span>
          </div>
          <span className="badge badge-muted">{queue.length} tracks</span>
        </div>

        <div className="space-y-1">
          {sortedQueue.map((song, idx) => {
            const isCurrent = idx === currentTrackIdx;
            const isNext = idx === (currentTrackIdx + 1) % sortedQueue.length;
            return (
              <div key={song.id} className={`track-row ${isCurrent ? 'current' : isNext ? 'next' : ''}`}>
                {isCurrent ? (
                  <div className="w-5 text-center"><div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft mx-auto" /></div>
                ) : isNext ? (
                  <ChevronRight size={14} className="text-success w-5" />
                ) : (
                  <span className="text-[10px] font-bold text-text-muted w-5 text-center">#{idx + 1}</span>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{song.track}</p>
                  <p className="text-[10px] text-text-muted truncate">{song.artist}</p>
                </div>

                {isCurrent && <span className="badge badge-purple text-[9px]">PLAYING</span>}
                {isNext && <span className="badge badge-green text-[9px]">NEXT</span>}

                <button onClick={() => onVote?.(song.id)} className="vote-btn flex-shrink-0">
                  <ThumbsUp size={11} />
                  <span>{song.votes}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Online Users */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-accent" />
          <span className="text-sm font-bold text-text-primary">In the Crowd</span>
          <span className="badge badge-green text-[10px]">{users.length} online</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {users.map((u, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-border text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
              <span className="text-text-secondary font-medium">{u.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
