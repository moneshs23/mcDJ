import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, Music, Brain, Zap, Activity, ThumbsUp, Users,
  ChevronRight, TrendingUp, Flame, AudioWaveform, BarChart3,
  Cpu, CircleDot, Layers, ArrowRightLeft, SkipForward, Sparkles
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
  const [confidence, setConfidence] = useState(0);
  const [beatCount, setBeatCount] = useState(0);
  const [beatFlash, setBeatFlash] = useState(false);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [aiStatus, setAiStatus] = useState('Press play to start AI mixing');
  const [analyzed, setAnalyzed] = useState(false);
  const [nextTrackInfo, setNextTrackInfo] = useState(null);
  const [transStyle, setTransStyle] = useState('blend');

  const waveformRef = useRef(null);
  const spectrumRef = useRef(null);
  const rafRef = useRef(null);
  const autoAdvRef = useRef(false);

  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes);
  const currentTrack = sortedQueue[currentTrackIdx] || null;
  const nextTrack = sortedQueue[(currentTrackIdx + 1) % sortedQueue.length] || null;

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
          if (beat) { setBeatFlash(true); setTimeout(() => setBeatFlash(false), 120); }
          if (audioEngine.shouldAutoAdvance() && !autoAdvRef.current) {
            autoAdvRef.current = true;
            handleAutoSkip();
            setTimeout(() => { autoAdvRef.current = false; }, 12000);
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

  useEffect(() => {
    if (isCrossfading) setAiStatus(`🔀 Mixing → ${transStyle} transition in progress`);
    else if (isPlaying && bpm > 0) {
      const rem = duration - currentTime;
      const abpm = audioEngine?.getTrackBPM(currentTrack?.src) || bpm;
      const key = audioEngine?.getTrackKey(currentTrack?.src) || '--';
      if (rem < 15 && rem > 0) setAiStatus(`⏳ Auto-mixing to next track in ${Math.ceil(rem)}s`);
      else setAiStatus(`🎧 ${abpm} BPM · Key ${key} · ${confidence}% confidence · ${Math.round(energy*100)}% energy`);
    } else if (analyzed) setAiStatus('✅ All tracks analyzed — ready');
    else setAiStatus('Press play to start AI mixing');
  }, [isPlaying, bpm, energy, confidence, isCrossfading, currentTime, duration, analyzed, transStyle]);

  const drawWaveform = useCallback(() => {
    const c = waveformRef.current;
    if (!c || !audioEngine) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== c.offsetWidth * dpr) { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; ctx.scale(dpr, dpr); }
    const w = c.offsetWidth, h = c.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const wave = audioEngine.getTimeDomainData();
    ctx.beginPath(); ctx.strokeStyle = 'rgba(139,92,246,0.7)'; ctx.lineWidth = 1.5;
    wave.forEach((v, i) => { const x = (i / wave.length) * w, y = h / 2 + v * h * 0.38; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = 'rgba(236,72,153,0.25)'; ctx.lineWidth = 1;
    wave.forEach((v, i) => { const x = (i / wave.length) * w, y = h / 2 - v * h * 0.25; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.strokeStyle = 'rgba(63,63,100,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    if (audioEngine.isPlaying) {
      const px = (audioEngine.getProgress() / 100) * w;
      ctx.strokeStyle = 'rgba(167,139,250,0.9)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
      ctx.fillStyle = '#a78bfa'; ctx.beginPath(); ctx.arc(px, h / 2, 4, 0, Math.PI * 2); ctx.fill();
    }
  }, [audioEngine]);

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
      const x = i * (bw + gap) + gap / 2, bh = v * h * 0.88;
      const g = ctx.createLinearGradient(x, h - bh, x, h);
      if (i < 8) { g.addColorStop(0, `rgba(139,92,246,${0.4+v*0.5})`); g.addColorStop(1, 'rgba(139,92,246,0.05)'); }
      else if (i < 20) { g.addColorStop(0, `rgba(236,72,153,${0.35+v*0.5})`); g.addColorStop(1, 'rgba(236,72,153,0.05)'); }
      else { g.addColorStop(0, `rgba(34,211,238,${0.35+v*0.5})`); g.addColorStop(1, 'rgba(34,211,238,0.05)'); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, h - bh, bw, bh, 2); ctx.fill();
    });
  }, [audioEngine]);

  const handlePlayPause = async () => {
    if (!audioEngine || !currentTrack) return;
    if (!hasStarted) {
      setAiStatus('🔬 Analyzing all tracks...');
      await audioEngine.preDecodeAll(sortedQueue);
      setAnalyzed(true);
      const ordered = audioEngine.orderByEnergyFlow(sortedQueue);
      setQueue(ordered);
      await audioEngine.loadAndPlay(currentTrack.src, currentTrack);
      setHasStarted(true);
    } else if (isPlaying) audioEngine.pause();
    else await audioEngine.play();
  };

  const handleAutoSkip = useCallback(async () => {
    const nextIdx = (currentTrackIdx + 1) % sortedQueue.length;
    if (nextIdx === currentTrackIdx || !sortedQueue[nextIdx]) return;
    const next = sortedQueue[nextIdx];
    if (audioEngine?._autoSelectTransition) {
      const outE = audioEngine.getTrackEnergy(currentTrack?.src) || 'medium';
      const inE = audioEngine.getTrackEnergy(next.src) || 'medium';
      const auto = audioEngine._autoSelectTransition(outE, inE);
      audioEngine.setTransitionStyle(auto.style); audioEngine.setTransitionFX(auto.fx); setTransStyle(auto.style);
    }
    audioEngine?.setTransitionBeats([8, 16, 32][Math.floor(Math.random() * 3)]);
    setCurrentTrackIdx(nextIdx); setIsCrossfading(true); setNextTrackInfo(next);
    if (hasStarted && audioEngine) await audioEngine.crossfadeTo(next.src, next);
    else if (audioEngine) { await audioEngine.loadAndPlay(next.src, next); setHasStarted(true); }
    setTimeout(() => { setIsCrossfading(false); setNextTrackInfo(null); }, 3500);
  }, [audioEngine, currentTrackIdx, sortedQueue, hasStarted, currentTrack]);

  const handleSkipNext = useCallback(async () => {
    if (!audioEngine || !nextTrack || isCrossfading) return;
    audioEngine.playTransitionSwoosh();
    await handleAutoSkip();
  }, [audioEngine, nextTrack, isCrossfading, handleAutoSkip]);

  const handleSeek = (e) => { const r = e.currentTarget.getBoundingClientRect(); audioEngine?.seek((e.clientX - r.left) / r.width); };
  const fmt = (s) => (!s || !isFinite(s)) ? '0:00' : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  const getVibeLabel = () => vibeLevel > 80 ? '🔥 On Fire' : vibeLevel > 60 ? '💜 Vibing' : vibeLevel > 40 ? '✨ Warming Up' : '🎵 Chill';
  const getVibeGrad = () => vibeLevel > 80 ? 'from-red-500 to-orange-500' : vibeLevel > 60 ? 'from-purple-500 to-pink-500' : vibeLevel > 40 ? 'from-violet-500 to-purple-500' : 'from-blue-500 to-violet-500';
  const curBPM = audioEngine?.getTrackBPM(currentTrack?.src) || bpm;
  const curKey = audioEngine?.getTrackKey(currentTrack?.src) || '--';
  const curEnergy = audioEngine?.getTrackEnergy(currentTrack?.src) || 'medium';

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {isCrossfading && <div className="transition-overlay" />}

      {/* AI Status Bar */}
      <div className="ai-status">
        <Brain size={14} className="text-accent flex-shrink-0" />
        <span className="text-text-secondary flex-1 truncate text-xs" style={{ fontFamily: 'JetBrains Mono' }}>{aiStatus}</span>
        {isPlaying && <span className="badge badge-green text-[10px]">● LIVE</span>}
        {isCrossfading && <span className="badge badge-purple text-[10px] animate-pulse-soft">MIXING</span>}
      </div>

      {/* ═══ MAIN GRID — Full width 3+2 ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5 dual-col">

        {/* LEFT COLUMN: Now Playing + Play Next + Viz (4 cols) */}
        <div className="lg:col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Now Playing */}
          <div className={`card p-6 ${isPlaying ? 'animate-glow-pulse' : ''}`}>
            {beatFlash && <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{background:'radial-gradient(circle at center, rgba(139,92,246,0.08), transparent 70%)'}} />}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-success animate-pulse-soft' : 'bg-text-muted'}`} />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Now Playing</span>
              {isPlaying && <div className="eq-bars flex-shrink-0 ml-auto" style={{height:24}}>{[...Array(5)].map((_, i) => <div key={i} className="eq-bar" style={{width:3}} />)}</div>}
            </div>
            {currentTrack ? (<>
              <div className="flex items-center gap-5 mb-5">
                <div className={`now-art ${isPlaying ? 'playing' : ''}`}>
                  <Music size={28} className="text-white relative z-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-text-primary truncate" style={{fontFamily:'Outfit'}}>{currentTrack.track}</h3>
                  <p className="text-text-muted text-sm truncate mb-2">{currentTrack.artist}</p>
                  <div className="flex gap-2 flex-wrap">
                    {curBPM > 0 && <span className="badge badge-purple">{curBPM} BPM</span>}
                    <span className="badge badge-muted">{curKey}</span>
                    <span className={`badge ${curEnergy==='high'?'badge-red':curEnergy==='medium'?'badge-amber':'badge-blue'}`}>{curEnergy}</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="progress-track" onClick={handleSeek}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-text-muted" style={{fontFamily:'JetBrains Mono'}}>{fmt(currentTime)}</span>
                  <span className="text-[10px] text-text-muted" style={{fontFamily:'JetBrains Mono'}}>-{fmt(duration - currentTime)}</span>
                </div>
              </div>
              <div className="flex justify-center">
                <button onClick={handlePlayPause}
                  className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 4px 30px rgba(139,92,246,0.4), 0 0 60px rgba(236,72,153,0.15)' }}>
                  {isPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-0.5" />}
                </button>
              </div>
            </>) : (
              <div className="text-center py-10"><Music size={40} className="text-text-muted/20 mx-auto mb-2" /><p className="text-text-muted text-sm">No track loaded</p></div>
            )}
          </div>

          {/* ══ PLAY NEXT — Clickable Card ══ */}
          {nextTrack && (
            <div className="play-next-card" style={{ cursor: hasStarted ? 'pointer' : 'default' }} onClick={hasStarted ? handleSkipNext : undefined}>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(52,211,153,0.1))', border: '1px solid rgba(34,211,238,0.25)' }}>
                  <SkipForward size={22} className="text-neon-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{color:'#22d3ee'}}>Play Next</span>
                    <Sparkles size={10} className="text-neon-cyan" />
                  </div>
                  <p className="text-base font-bold text-text-primary truncate" style={{fontFamily:'Outfit'}}>{nextTrack.track}</p>
                  <p className="text-xs text-text-muted truncate">{nextTrack.artist}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex flex-col gap-1 items-end">
                    {audioEngine?.getTrackBPM(nextTrack.src) > 0 && <span className="badge badge-cyan text-[9px]">{audioEngine.getTrackBPM(nextTrack.src)} BPM</span>}
                    <span className="badge badge-green text-[9px]"><ThumbsUp size={8} /> {nextTrack.votes}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSkipNext(); }}
                    disabled={!hasStarted || isCrossfading}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #22d3ee, #34d399)',
                      color: '#050508',
                      boxShadow: '0 2px 16px rgba(34,211,238,0.3)',
                    }}>
                    <SkipForward size={14} />
                    {isCrossfading ? 'Mixing...' : 'Skip Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ML Metrics */}
          <div className="grid grid-cols-4 gap-3 ml-grid-4">
            {[
              { icon: Activity, label: 'BPM', value: curBPM || '--', color: 'text-accent' },
              { icon: Zap, label: 'Energy', value: `${Math.round(energy*100)}%`, color: 'text-pink-400' },
              { icon: Cpu, label: 'Confidence', value: `${confidence}%`, color: 'text-blue-400' },
              { icon: CircleDot, label: 'Beats', value: beatCount, color: beatFlash ? 'text-success' : 'text-text-muted' },
            ].map((m, i) => (
              <div key={i} className="ml-metric">
                <m.icon size={14} className={`${m.color} mx-auto mb-1.5`} />
                <p className="text-lg font-bold text-text-primary" style={{fontFamily:'Outfit'}}>{m.value}</p>
                <p className="text-[9px] text-text-muted uppercase tracking-wider">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Waveform */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AudioWaveform size={12} className="text-accent" />
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Waveform · Live</span>
              <div className="flex gap-3 ml-auto text-[9px] text-text-muted">
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-accent rounded inline-block" /> Signal</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-pink-400 rounded inline-block opacity-50" /> Mirror</span>
              </div>
            </div>
            <div className="viz-container" style={{height:64}}><canvas ref={waveformRef} style={{width:'100%',height:'100%',display:'block'}} /></div>
          </div>

          {/* Spectrum */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={12} className="text-accent" />
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Frequency Spectrum · FFT</span>
              <span className="text-[9px] text-text-muted ml-auto">32 bins</span>
            </div>
            <div className="viz-container" style={{height:80}}><canvas ref={spectrumRef} style={{width:'100%',height:'100%',display:'block'}} /></div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[9px] text-accent font-medium">Bass</span>
              <span className="text-[9px] text-pink-400 font-medium">Mids</span>
              <span className="text-[9px] text-cyan-400 font-medium">Highs</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Vibe + Queue + Pipeline + Users (3 cols) */}
        <div className="lg:col-span-3" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Vibe Meter */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} className={vibeLevel > 60 ? 'text-accent' : 'text-text-muted'} />
                <span className="text-sm font-bold text-text-primary" style={{fontFamily:'Outfit'}}>Crowd Vibe</span>
              </div>
              <span className="text-sm font-bold">{getVibeLabel()}</span>
            </div>
            <div className="vibe-bar"><div className={`vibe-fill bg-gradient-to-r ${getVibeGrad()}`} style={{width:`${vibeLevel}%`}} /></div>
          </div>

          {/* Playlist */}
          <div className="card p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-accent" />
                <span className="text-sm font-bold text-text-primary" style={{fontFamily:'Outfit'}}>Playlist</span>
              </div>
              <span className="badge badge-muted">{queue.length} tracks</span>
            </div>
            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {sortedQueue.map((song, idx) => {
                const isCurrent = idx === currentTrackIdx;
                const isNext = idx === (currentTrackIdx + 1) % sortedQueue.length;
                return (
                  <div key={song.id} className={`track-row ${isCurrent ? 'current' : isNext ? 'next' : ''}`}>
                    {isCurrent ? <div className="w-5 text-center"><div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-soft mx-auto" /></div>
                    : isNext ? <ChevronRight size={14} className="text-neon-cyan w-5" />
                    : <span className="text-[10px] font-bold text-text-muted w-5 text-center">#{idx+1}</span>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{song.track}</p>
                      <p className="text-[10px] text-text-muted truncate">{song.artist}</p>
                    </div>
                    {isCurrent && <span className="badge badge-purple text-[9px]">PLAYING</span>}
                    {isNext && <span className="badge badge-cyan text-[9px]">NEXT</span>}
                    <button onClick={() => onVote?.(song.id)} className="vote-btn flex-shrink-0">
                      <ThumbsUp size={10} /><span>{song.votes}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audio Pipeline */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={12} className="text-accent" />
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Audio Pipeline</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Audio Input', detail: 'Web Audio API', icon: AudioWaveform, color: 'text-accent' },
                { label: 'FFT Analysis', detail: '2048-pt · 32 bins', icon: BarChart3, color: 'text-blue-400' },
                { label: 'Beat Detection', detail: `${curBPM || '...'} BPM`, icon: Activity, color: 'text-pink-400' },
                { label: 'Key Detection', detail: `${curKey}`, icon: Music, color: 'text-amber-400' },
                { label: 'Auto-Transition', detail: `${transStyle}`, icon: ArrowRightLeft, color: 'text-success' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{background:'rgba(10,10,18,0.5)', border:'1px solid rgba(139,92,246,0.04)'}}>
                  <s.icon size={12} className={s.color} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-text-primary">{s.label}</span>
                    <span className="text-[10px] text-text-muted ml-2">{s.detail}</span>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-success animate-pulse-soft' : 'bg-text-muted'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Users */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-accent" />
              <span className="text-sm font-bold text-text-primary" style={{fontFamily:'Outfit'}}>Crowd</span>
              <span className="badge badge-green text-[10px]">{users.length} online</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {users.map((u, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px]"
                  style={{background:'rgba(14,14,22,0.7)', border:'1px solid rgba(139,92,246,0.08)'}}>
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
                  <span className="text-text-secondary font-medium">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
