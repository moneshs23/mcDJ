import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, Volume2, VolumeX, Music, Disc3,
  Brain, Zap, Activity, Sparkles, ThumbsUp, Crown, TrendingUp,
  GripVertical, Wand2, BarChart3, Shuffle, Users, Flame,
  ChevronRight, Clock, AudioWaveform, Waves, Radio
} from 'lucide-react';
import AudioEngine from '../audioEngine';

export default function AIDJView({ audioEngine, tracks, queue, setQueue, users, vibeLevel, onVote }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [volume, setVolume] = useState(85);
  const [bpm, setBpm] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [beatFlash, setBeatFlash] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [autoMix, setAutoMix] = useState(true);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [aiStatus, setAiStatus] = useState('AI ready — press play to start');
  const [analyzed, setAnalyzed] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [transitionFX, setTransitionFX] = useState('riser');
  const [beatDropTime, setBeatDropTime] = useState(0);

  const spectrumRef = useRef(null);
  const waveformRef = useRef(null);
  const timelineRef = useRef(null);
  const rafRef = useRef(null);
  const autoAdvanceRef = useRef(false);

  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes);
  const currentTrack = sortedQueue[currentTrackIdx] || null;

  // Animation loop
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
          setConfidence(audioEngine.getConfidence());
          setBeatCount(audioEngine.getBeatCount());
          if (beat) { setBeatFlash(true); setTimeout(() => setBeatFlash(false), 100); }

          // Auto-advance
          if (autoMix && audioEngine.shouldAutoAdvance() && !autoAdvanceRef.current) {
            autoAdvanceRef.current = true;
            handleSkip();
            setTimeout(() => { autoAdvanceRef.current = false; }, 12000);
          }
        }

        drawSpectrum();
        drawWaveform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioEngine, autoMix, currentTrackIdx, queue]);

  // Status updates
  useEffect(() => {
    if (isCrossfading) {
      setAiStatus('🎵 AI crossfading — beat-aligned transition...');
    } else if (isPlaying && bpm > 0) {
      const rem = duration - currentTime;
      if (rem < 15 && rem > 0 && autoMix) {
        setAiStatus(`⏳ Auto-mix in ${Math.ceil(rem)}s — preparing next track`);
      } else {
        setAiStatus(`🎧 Playing · ${bpm} BPM · Confidence ${confidence}% · Energy ${Math.round(energy * 100)}%`);
      }
    } else if (isPlaying) {
      setAiStatus('🔬 Analyzing audio — detecting BPM...');
    } else if (analyzed) {
      setAiStatus('✅ All tracks analyzed — ready to mix');
    } else {
      setAiStatus('AI ready — press play to start');
    }
  }, [isPlaying, bpm, confidence, energy, isCrossfading, currentTime, duration, autoMix, analyzed]);

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
      const x = i * (bw + gap) + gap / 2, bh = v * h * 0.9;
      const g = ctx.createLinearGradient(x, h - bh, x, h);
      g.addColorStop(0, i < 8 ? `rgba(168,85,247,${0.5+v*0.5})` : i < 20 ? `rgba(236,72,153,${0.5+v*0.5})` : `rgba(6,182,212,${0.5+v*0.5})`);
      g.addColorStop(1, i < 8 ? 'rgba(168,85,247,0.08)' : i < 20 ? 'rgba(236,72,153,0.08)' : 'rgba(6,182,212,0.08)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(x, h - bh, bw, bh, 2); ctx.fill();
    });
  }, [audioEngine]);

  const drawWaveform = useCallback(() => {
    const c = waveformRef.current;
    if (!c || !audioEngine) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== c.offsetWidth * dpr) { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; ctx.scale(dpr, dpr); }
    const w = c.offsetWidth, h = c.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const wave = audioEngine.getTimeDomainData();
    ctx.beginPath(); ctx.strokeStyle = 'rgba(6,182,212,0.7)'; ctx.lineWidth = 2;
    wave.forEach((v, i) => { const x = (i / wave.length) * w, y = h / 2 + v * h * 0.4; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = 'rgba(168,85,247,0.3)'; ctx.lineWidth = 1.5;
    wave.forEach((v, i) => { const x = (i / wave.length) * w, y = h / 2 - v * h * 0.3; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();
    // Playhead
    if (audioEngine.isPlaying) {
      const px = (audioEngine.getProgress() / 100) * w;
      ctx.strokeStyle = 'rgba(236,72,153,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(px, h/2, 4, 0, Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(100,116,139,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
  }, [audioEngine]);

  // Handlers
  const handlePlayPause = async () => {
    if (!audioEngine || !currentTrack) return;
    if (!hasStarted) {
      await audioEngine.loadAndPlay(currentTrack.src, currentTrack);
      setHasStarted(true);
      const bd = audioEngine.getBeatDropTime(currentTrack.src);
      setBeatDropTime(bd);
    } else if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.play();
    }
  };

  const handleFXChange = (type) => {
    setTransitionFX(type);
    audioEngine?.setTransitionFX(type);
  };

  const handleSkip = useCallback(async () => {
    const nextIdx = (currentTrackIdx + 1) % sortedQueue.length;
    if (nextIdx === currentTrackIdx || !sortedQueue[nextIdx]) return;
    const next = sortedQueue[nextIdx];
    setCurrentTrackIdx(nextIdx);
    setIsCrossfading(true);
    if (hasStarted && audioEngine) {
      await audioEngine.crossfadeTo(next.src, next);
    } else if (audioEngine) {
      await audioEngine.loadAndPlay(next.src, next);
      setHasStarted(true);
    }
    const bd = audioEngine?.getBeatDropTime(next.src) || 0;
    setBeatDropTime(bd);
    setTimeout(() => setIsCrossfading(false), 3200);
  }, [audioEngine, currentTrackIdx, sortedQueue, hasStarted]);

  const handleSeek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    audioEngine?.seek((e.clientX - r.left) / r.width);
  };

  const handleVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    audioEngine?.setVolume(v / 100);
  };

  const handleAnalyze = async () => {
    if (!audioEngine) return;
    setAiStatus('🔬 Pre-analyzing all tracks...');
    await audioEngine.preDecodeAll(sortedQueue);
    setAnalyzed(true);
  };

  const handleVote = (id) => { onVote?.(id); };

  // Timeline drag reorder
  const handleDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newQueue = [...queue];
    const [moved] = newQueue.splice(dragIdx, 1);
    newQueue.splice(idx, 0, moved);
    setQueue(newQueue);
    setDragIdx(null); setDragOverIdx(null);
  };

  const fmt = (s) => { if (!s || !isFinite(s)) return '0:00'; return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; };

  const getVibeLabel = () => {
    if (vibeLevel > 80) return '🔥 ON FIRE';
    if (vibeLevel > 60) return '💜 VIBING';
    if (vibeLevel > 40) return '✨ WARMING UP';
    return '🎵 CHILL';
  };
  const getVibeColor = () => {
    if (vibeLevel > 80) return 'from-red-500 to-orange-500';
    if (vibeLevel > 60) return 'from-neon-pink to-red-500';
    if (vibeLevel > 40) return 'from-neon-purple to-neon-pink';
    return 'from-neon-cyan to-neon-purple';
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* AI Status Bar */}
      <div className="glass-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-neon-purple" />
            <span className="text-xs font-bold text-white">AI DJ Engine</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30 font-semibold">
              {isPlaying ? '● LIVE' : 'READY'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoMix(!autoMix)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${autoMix ? 'bg-neon-green/10 border-neon-green/40 text-neon-green' : 'bg-club-card border-club-border text-club-muted'}`}>
              <Shuffle size={10} /> Auto-Mix {autoMix ? 'ON' : 'OFF'}
            </button>
            <button onClick={handleAnalyze}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border bg-club-card border-club-border text-club-muted hover:border-neon-purple/50 transition-all">
              <BarChart3 size={10} /> Analyze All
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-club-muted truncate flex-1">{aiStatus}</p>
          {beatDropTime > 0.5 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-neon-pink/15 text-neon-pink border border-neon-pink/30 font-semibold ml-2 flex-shrink-0">
              ⚡ Beat drop at {beatDropTime.toFixed(1)}s
            </span>
          )}
        </div>
        {/* Transition FX selector */}
        <div className="flex items-center gap-2 mt-2">
          <Waves size={10} className="text-club-muted" />
          <span className="text-[9px] text-club-muted font-semibold">Transition FX:</span>
          {Object.entries(AudioEngine.FX_TYPES).map(([key, fx]) => (
            <button
              key={key}
              onClick={() => handleFXChange(key)}
              className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-all ${
                transitionFX === key
                  ? key === 'none' ? 'bg-club-surface border-club-border text-white' : 'bg-neon-purple/15 border-neon-purple/40 text-neon-purple'
                  : 'bg-transparent border-club-border/50 text-club-muted hover:border-club-border'
              }`}
            >
              {fx.name}
            </button>
          ))}
        </div>
      </div>

      {/* Vibe Meter */}
      <div className="glass-card p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Flame size={14} className={vibeLevel > 60 ? 'text-neon-pink animate-vibe-pulse' : 'text-club-muted'} />
            <span className="text-xs font-semibold text-white">Crowd Vibe</span>
          </div>
          <span className="text-[10px] font-bold">{getVibeLabel()}</span>
        </div>
        <div className="vibe-meter"><div className={`vibe-fill bg-gradient-to-r ${getVibeColor()}`} style={{width:`${vibeLevel}%`}} /></div>
      </div>

      {/* Now Playing + Spectrum */}
      <div className={`glass-card p-5 relative overflow-hidden ${isCrossfading ? 'glow-cyan' : 'glow-purple'}`}>
        {isCrossfading && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" style={{backgroundSize:'200% 100%',animation:'gradient-shift 1s ease infinite'}} />}
        {beatFlash && <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{background:'rgba(168,85,247,0.05)'}} />}

        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Now Playing</span>
          {isCrossfading && <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 font-semibold animate-pulse ml-auto">AI CROSSFADING</span>}
        </div>

        {currentTrack ? (
          <>
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center ${isPlaying ? 'animate-vibe-pulse' : ''}`}>
                <Music size={28} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{currentTrack.track}</h3>
                <p className="text-club-muted text-sm truncate">{currentTrack.artist}</p>
              </div>
              <div className="text-right hidden sm:block">
                {bpm > 0 && <p className="text-xl font-black text-neon-purple" style={{fontFamily:'Outfit'}}>{bpm}</p>}
                {bpm > 0 && <p className="text-[9px] text-club-muted uppercase -mt-0.5">BPM</p>}
              </div>
            </div>

            {/* ML Metrics */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center p-1.5 rounded-lg bg-club-surface/40">
                <Activity size={10} className="text-neon-purple mx-auto mb-0.5" />
                <p className="text-xs font-bold text-white">{bpm || '--'}</p>
                <p className="text-[8px] text-club-muted">BPM</p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-club-surface/40">
                <Zap size={10} className="text-neon-pink mx-auto mb-0.5" />
                <p className="text-xs font-bold text-white">{Math.round(energy*100)}%</p>
                <p className="text-[8px] text-club-muted">Energy</p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-club-surface/40">
                <Brain size={10} className="text-neon-cyan mx-auto mb-0.5" />
                <p className="text-xs font-bold text-white">{confidence}%</p>
                <p className="text-[8px] text-club-muted">Conf.</p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-club-surface/40">
                <AudioWaveform size={10} className="text-neon-green mx-auto mb-0.5" />
                <p className="text-xs font-bold text-white">{beatCount}</p>
                <p className="text-[8px] text-club-muted">Beats</p>
              </div>
            </div>

            {/* Waveform */}
            <div className="rounded-lg overflow-hidden bg-club-bg/50 border border-club-border/30 mb-3">
              <canvas ref={waveformRef} style={{width:'100%',height:'60px',display:'block'}} />
            </div>

            {/* Spectrum */}
            <div className="rounded-lg overflow-hidden bg-club-bg/50 border border-club-border/30 mb-3">
              <canvas ref={spectrumRef} style={{width:'100%',height:'80px',display:'block'}} />
              <div className="flex justify-between px-2 pb-1">
                <span className="text-[8px] text-neon-purple">Bass</span>
                <span className="text-[8px] text-neon-pink">Mids</span>
                <span className="text-[8px] text-neon-cyan">Highs</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="progress-track" onClick={handleSeek}>
                <div className="progress-fill" style={{width:`${progress}%`}} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-club-muted">{fmt(currentTime)}</span>
                <span className="text-[10px] text-club-muted">-{fmt(duration - currentTime)}</span>
              </div>
            </div>

            {/* Transport */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-neon-purple/30">
                  {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-0.5" />}
                </button>
                <button onClick={handleSkip} className="w-10 h-10 rounded-full bg-club-card border border-club-border flex items-center justify-center hover:border-neon-purple/50 transition-colors" title="AI Crossfade to next">
                  <SkipForward size={16} className="text-club-text" />
                </button>
                <button onClick={() => setAutoMix(!autoMix)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${autoMix ? 'bg-neon-green/10 border-neon-green/40 text-neon-green' : 'bg-club-card border-club-border text-club-muted'}`}>
                  <Wand2 size={12} /> AI Mix
                </button>
              </div>
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX size={14} className="text-club-muted" /> : <Volume2 size={14} className="text-club-muted" />}
                <input type="range" min="0" max="100" value={volume} onChange={handleVolume} className="w-20 h-1 accent-neon-purple" />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8"><Disc3 size={48} className="text-club-muted/30 mx-auto mb-3" /><p className="text-club-muted text-sm">No track loaded</p></div>
        )}
      </div>

      {/* Timeline — Drag to Reorder */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-neon-pink" />
            <span className="text-sm font-bold text-white">Mix Timeline</span>
            <span className="text-[10px] text-club-muted">— drag to reorder · vote to boost</span>
          </div>
          <span className="text-[10px] text-club-muted bg-club-card px-2 py-0.5 rounded-full">{queue.length} tracks</span>
        </div>

        <div className="space-y-1.5">
          {sortedQueue.map((song, idx) => {
            const isCurrent = idx === currentTrackIdx;
            const isNext = idx === (currentTrackIdx + 1) % sortedQueue.length;
            return (
              <div
                key={song.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, idx)}
                className={`flex items-center gap-2 p-2.5 rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                  isCurrent ? 'bg-neon-purple/15 border border-neon-purple/40 glow-purple' :
                  isNext ? 'bg-neon-cyan/8 border border-neon-cyan/20' :
                  dragOverIdx === idx ? 'bg-neon-green/10 border border-neon-green/30' :
                  'bg-club-surface/30 border border-transparent hover:border-club-border'
                } ${dragIdx === idx ? 'opacity-40' : ''}`}
              >
                <GripVertical size={12} className="text-club-muted/40 flex-shrink-0" />

                {isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
                  </div>
                ) : isNext ? (
                  <ChevronRight size={14} className="text-neon-cyan flex-shrink-0" />
                ) : (
                  <span className="text-[10px] font-bold text-club-muted w-5 text-center flex-shrink-0">#{idx + 1}</span>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{song.track}</p>
                  <p className="text-[10px] text-club-muted truncate">{song.artist}</p>
                </div>

                {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple font-bold flex-shrink-0">PLAYING</span>}
                {isNext && autoMix && <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-cyan/20 text-neon-cyan font-bold flex-shrink-0">UP NEXT</span>}

                <button
                  onClick={() => handleVote(song.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 transition-all group flex-shrink-0"
                >
                  <ThumbsUp size={10} className="text-neon-purple group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-neon-purple">{song.votes}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Crowd Online */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-neon-cyan" />
          <span className="text-sm font-bold text-white">In the Crowd</span>
          <span className="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full font-semibold">{users.length} online</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {users.map((u, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-club-surface border border-club-border text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-club-text font-medium">{u.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
