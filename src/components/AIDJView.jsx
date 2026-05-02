import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, Volume2, VolumeX, Music,
  Brain, Shuffle, Clock, Crown, GripVertical, ChevronRight, ThumbsUp
} from 'lucide-react';
import AudioEngine from '../audioEngine';
import DualWaveform from './DualWaveform';
import VinylDisc from './VinylDisc';
import EQKnob from './EQKnob';
import CrossfaderPanel from './CrossfaderPanel';
import EnergyFlowPanel from './EnergyFlowPanel';
import CrowdFXPanel from './CrowdFXPanel';
import TransitionPanel from './TransitionPanel';
import CuePanel from './CuePanel';

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
  const [beatFlash, setBeatFlash] = useState(false);
  const [autoMix, setAutoMix] = useState(true);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [aiStatus, setAiStatus] = useState('AI ready — press play to start');
  const [analyzed, setAnalyzed] = useState(false);
  
  // DJ Controls state
  const [transitionFX, setTransitionFX] = useState('riser');
  const [transitionBeats, setTransitionBeats] = useState(16);
  const [transitionStyle, setTransitionStyle] = useState('blend');
  const [crossfader, setCrossfader] = useState(50);
  const [tempo, setTempo] = useState(100);
  const [crowdFX, setCrowdFX] = useState(false);
  
  const [activeDeck, setActiveDeck] = useState('A');
  const [analysisA, setAnalysisA] = useState(null);
  const [analysisB, setAnalysisB] = useState(null);
  
  // EQs (we just maintain one set for simplicity or duplicate for A/B)
  const [eqA, setEqA] = useState({ low: 0, mid: 0, high: 0 });
  const [eqB, setEqB] = useState({ low: 0, mid: 0, high: 0 });

  const rafRef = useRef(null);
  const autoAdvanceRef = useRef(false);

  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes);
  const currentTrack = sortedQueue[currentTrackIdx] || null;
  const nextTrack = sortedQueue[(currentTrackIdx + 1) % sortedQueue.length] || null;

  // Track Analysis Loading
  useEffect(() => {
    if (currentTrack && audioEngine) {
      const a = audioEngine.getAnalysis(currentTrack.src);
      if (a) setAnalysisA(a);
    }
    if (nextTrack && audioEngine) {
      const b = audioEngine.getAnalysis(nextTrack.src);
      if (b) setAnalysisB(b);
    }
  }, [currentTrack, nextTrack, analyzed, audioEngine]);

  // Animation Loop
  useEffect(() => {
    const tick = () => {
      if (audioEngine) {
        setIsPlaying(audioEngine.isPlaying);
        setProgress(audioEngine.getProgress());
        setCurrentTime(audioEngine.getCurrentTime());
        setDuration(audioEngine.getDuration());
        setActiveDeck(audioEngine.activeDeck || 'A');

        if (audioEngine.isPlaying) {
          const beat = audioEngine.detectBeat();
          setBpm(audioEngine.getBPM());
          setEnergy(audioEngine.getEnergy());
          if (beat) { setBeatFlash(true); setTimeout(() => setBeatFlash(false), 100); }

          if (autoMix && audioEngine.shouldAutoAdvance() && !autoAdvanceRef.current) {
            autoAdvanceRef.current = true;
            handleSkip();
            setTimeout(() => { autoAdvanceRef.current = false; }, 12000);
          }
        }
        
        // Update crossfader visually during auto-transition
        if (audioEngine.isCrossfading && autoAdvanceRef.current) {
          // just let css animation sweep do it, or we could update slider
        }
        setIsCrossfading(audioEngine.isCrossfading);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioEngine, autoMix, currentTrackIdx, queue]);

  // Status updates
  useEffect(() => {
    if (isCrossfading) {
      setAiStatus(`🎵 EQ transition: ${transitionStyle} → blending ${transitionBeats} beats`);
    } else if (isPlaying && bpm > 0) {
      const rem = duration - currentTime;
      if (rem < 15 && rem > 0 && autoMix) {
        setAiStatus(`⏳ Auto-mix in ${Math.ceil(rem)}s — phrase-aligned transition queued`);
      } else {
        const curBPM = analysisA?.bpm || bpm;
        setAiStatus(`🎧 Live: ${curBPM} BPM · ${transitionStyle} ready`);
      }
    } else if (isPlaying) {
      setAiStatus('🔬 Analyzing audio — detecting BPM & beat grid...');
    } else if (analyzed) {
      setAiStatus('✅ Tracks analyzed — ready');
    } else {
      setAiStatus('AI ready — press play to start');
    }
  }, [isPlaying, bpm, isCrossfading, currentTime, duration, autoMix, analyzed, transitionBeats, transitionStyle, analysisA]);

  // Handlers
  const handlePlayPause = async () => {
    if (!audioEngine || !currentTrack) return;
    if (!hasStarted) {
      await audioEngine.loadAndPlay(currentTrack.src, currentTrack);
      setHasStarted(true);
      setAnalysisA(audioEngine.getAnalysis(currentTrack.src));
    } else if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.play();
    }
  };

  const handleSkip = useCallback(async () => {
    const nextIdx = (currentTrackIdx + 1) % sortedQueue.length;
    if (nextIdx === currentTrackIdx || !sortedQueue[nextIdx]) return;
    const next = sortedQueue[nextIdx];
    
    // Auto-select transition if in automix mode
    if (autoMix && audioEngine && analysisA) {
      const inEnergy = audioEngine.getTrackEnergy(next.src);
      const outEnergy = analysisA.energyLevel;
      if (audioEngine._autoSelectTransition) {
        const autoTrans = audioEngine._autoSelectTransition(outEnergy, inEnergy);
        setTransitionStyle(autoTrans.style);
        setTransitionFX(autoTrans.fx);
        audioEngine.setTransitionStyle(autoTrans.style);
        audioEngine.setTransitionFX(autoTrans.fx);
      }
    }

    setCurrentTrackIdx(nextIdx);
    setIsCrossfading(true);
    
    if (hasStarted && audioEngine) {
      await audioEngine.crossfadeTo(next.src, next);
    } else if (audioEngine) {
      await audioEngine.loadAndPlay(next.src, next);
      setHasStarted(true);
    }
    
    setAnalysisA(audioEngine?.getAnalysis(next.src));
    setCrossfader(activeDeck === 'A' ? 100 : 0); // visually flip
    
    setTimeout(() => setIsCrossfading(false), 3200);
  }, [audioEngine, currentTrackIdx, sortedQueue, hasStarted, autoMix, analysisA, activeDeck]);

  const handleSeek = (f) => audioEngine?.seek(f);
  const handleVolume = (e) => { const v = Number(e.target.value); setVolume(v); audioEngine?.setVolume(v / 100); };
  
  const handleAnalyze = async () => {
    if (!audioEngine) return;
    setAiStatus('🔬 Pre-analyzing all tracks...');
    await audioEngine.preDecodeAll(sortedQueue);
    setAnalyzed(true);
  };

  const handleReorder = () => {
    if (!audioEngine) return;
    const ordered = audioEngine.orderByEnergyFlow(sortedQueue);
    setQueue(ordered);
  };

  const handleEQ = (deck, band, val) => {
    if (deck === 'A') setEqA(p => ({...p, [band]: val}));
    else setEqB(p => ({...p, [band]: val}));
    // To properly support dual eq in engine we'd need to expand it, 
    // for now we just apply to active deck if it matches
    if (deck === activeDeck) audioEngine?.setEQ(band, val);
  };

  return (
    <div className="space-y-4 animate-slide-up w-full">
      {/* AI Status Bar */}
      <div className="panel-dark p-3">
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
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${autoMix ? 'bg-neon-green/10 border-neon-green/40 text-neon-green glow-green' : 'bg-club-surface border-club-border text-club-muted'}`}>
              <Shuffle size={10} /> Auto-Mix {autoMix ? 'ON' : 'OFF'}
            </button>
            <button onClick={handleAnalyze}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border bg-club-surface border-club-border text-club-muted hover:border-neon-purple/50 transition-all">
              Analyze All
            </button>
          </div>
        </div>
        <p className="ai-ticker text-club-muted mt-2 truncate">{aiStatus}</p>
      </div>

      {/* Main Dual Deck Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* DECK A */}
        <div className={`deck-card deck-a p-4 ${activeDeck==='A' && isPlaying ? 'deck-active-a' : ''}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <VinylDisc 
                isPlaying={activeDeck==='A' && isPlaying} 
                energy={activeDeck==='A' ? energy : 0} 
                beatFlash={activeDeck==='A' && beatFlash} 
                accentColor="#b44fff" size={80} 
              />
              <div className="max-w-[160px]">
                <h3 className="text-sm font-bold text-white truncate">{currentTrack?.track || 'Load Track'}</h3>
                <p className="text-[10px] text-club-muted truncate">{currentTrack?.artist || '--'}</p>
                <div className="flex gap-2 mt-2">
                  <span className="badge bg-neon-purple/20 text-neon-purple">{analysisA?.bpm || '--'} BPM</span>
                  <span className="badge bg-club-surface text-club-text border border-club-border">{analysisA?.key || '--'}</span>
                </div>
              </div>
            </div>
            {activeDeck==='A' && isPlaying && (
              <div className="bpm-display text-neon-purple text-glow-purple">{analysisA?.bpm || bpm}</div>
            )}
          </div>
          
          <div className="mb-4">
            <DualWaveform 
              peaks={analysisA?.peaks} 
              progress={activeDeck==='A' ? progress : 0} 
              beatGrid={analysisA?.beatGrid} 
              cuePoints={analysisA?.cuePoints || audioEngine?.getCuePoints(currentTrack?.src)} 
              duration={analysisA?.duration} 
              accentColor="#b44fff" accentRgb="180,79,255"
              isPlaying={activeDeck==='A' && isPlaying} 
              height={80} 
              onSeek={activeDeck==='A' ? handleSeek : null}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <CuePanel 
                cuePoints={analysisA?.cuePoints || audioEngine?.getCuePoints(currentTrack?.src)} 
                currentTime={activeDeck==='A' ? currentTime : 0} 
                onJump={(t) => { if(activeDeck==='A') audioEngine?.seek(t/duration); }} 
              />
            </div>
            <div className="flex gap-3">
              <EQKnob value={eqA.low} label="LOW" color="#b44fff" onChange={(v)=>handleEQ('A','low',v)} />
              <EQKnob value={eqA.mid} label="MID" color="#ff2d78" onChange={(v)=>handleEQ('A','mid',v)} />
              <EQKnob value={eqA.high} label="HI" color="#00e5ff" onChange={(v)=>handleEQ('A','high',v)} />
            </div>
          </div>
        </div>

        {/* DECK B (Next Track / Incoming) */}
        <div className={`deck-card deck-b p-4 ${activeDeck==='B' && isPlaying ? 'deck-active-b' : ''}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <VinylDisc 
                isPlaying={activeDeck==='B' && isPlaying} 
                energy={activeDeck==='B' ? energy : 0} 
                beatFlash={activeDeck==='B' && beatFlash} 
                accentColor="#00e5ff" size={80} 
              />
              <div className="max-w-[160px]">
                <h3 className="text-sm font-bold text-white truncate">{nextTrack?.track || 'Load Track'}</h3>
                <p className="text-[10px] text-club-muted truncate">{nextTrack?.artist || '--'}</p>
                <div className="flex gap-2 mt-2">
                  <span className="badge bg-neon-cyan/20 text-neon-cyan">{analysisB?.bpm || '--'} BPM</span>
                  <span className="badge bg-club-surface text-club-text border border-club-border">{analysisB?.key || '--'}</span>
                </div>
              </div>
            </div>
            {activeDeck==='B' && isPlaying && (
              <div className="bpm-display text-neon-cyan text-glow-cyan">{analysisB?.bpm || bpm}</div>
            )}
          </div>
          
          <div className="mb-4">
            <DualWaveform 
              peaks={analysisB?.peaks} 
              progress={activeDeck==='B' ? progress : 0} 
              beatGrid={analysisB?.beatGrid} 
              cuePoints={analysisB?.cuePoints || audioEngine?.getCuePoints(nextTrack?.src)} 
              duration={analysisB?.duration} 
              accentColor="#00e5ff" accentRgb="0,229,255"
              isPlaying={activeDeck==='B' && isPlaying} 
              height={80} 
              transitionZone={isCrossfading}
              onSeek={activeDeck==='B' ? handleSeek : null}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <CuePanel 
                cuePoints={analysisB?.cuePoints || audioEngine?.getCuePoints(nextTrack?.src)} 
                currentTime={activeDeck==='B' ? currentTime : 0} 
                onJump={(t) => { if(activeDeck==='B') audioEngine?.seek(t/(analysisB?.duration||1)); }} 
              />
            </div>
            <div className="flex gap-3">
              <EQKnob value={eqB.low} label="LOW" color="#00e5ff" onChange={(v)=>handleEQ('B','low',v)} />
              <EQKnob value={eqB.mid} label="MID" color="#ff2d78" onChange={(v)=>handleEQ('B','mid',v)} />
              <EQKnob value={eqB.high} label="HI" color="#b44fff" onChange={(v)=>handleEQ('B','high',v)} />
            </div>
          </div>
        </div>

      </div>

      {/* Mixer Center Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="md:col-span-2">
          <CrossfaderPanel 
            value={crossfader} 
            isCrossfading={isCrossfading} 
            onChange={(v) => { setCrossfader(v); audioEngine?.setCrossfader(v/100); }} 
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <TransitionPanel 
              transitionFX={transitionFX} transitionStyle={transitionStyle} transitionBeats={transitionBeats}
              onFX={(fx) => { setTransitionFX(fx); audioEngine?.setTransitionFX(fx); }}
              onStyle={(s) => { setTransitionStyle(s); audioEngine?.setTransitionStyle(s); }}
              onBeats={(b) => { setTransitionBeats(b); audioEngine?.setTransitionBeats(b); }}
            />
            <div className="space-y-4">
              <EnergyFlowPanel 
                currentStage={audioEngine?.getEnergyFlowCategory(currentTrack?.src) || 'groove'} 
                onReorder={handleReorder} 
                trackCount={queue.length} 
              />
              <CrowdFXPanel 
                crowdAmbience={crowdFX} 
                onToggleCrowd={() => { const r = audioEngine?.toggleCrowdAmbience(); setCrowdFX(r); }}
                onApplause={() => audioEngine?.playApplause()}
                dropFlash={beatFlash && energy > 0.8}
              />
            </div>
          </div>
        </div>
        
        {/* Master Controls & Transport */}
        <div className="panel-dark p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Master Out</span>
              {volume === 0 ? <VolumeX size={14} className="text-club-muted" /> : <Volume2 size={14} className="text-club-muted" />}
            </div>
            <input type="range" min="0" max="100" value={volume} onChange={handleVolume} className="w-full h-1 accent-neon-pink mb-4" />
          </div>

          <div className="flex items-center justify-center gap-6 mt-auto py-4">
            <button className="transport-btn" onClick={() => {}}><Clock size={16} /></button>
            <button onClick={handlePlayPause} className={activeDeck==='A' ? 'play-btn-a' : 'play-btn-b'}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <button onClick={handleSkip} className="transport-btn"><SkipForward size={16} /></button>
          </div>
        </div>

      </div>

      {/* Queue / Timeline */}
      <div className="panel-dark p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Smart Playlist Flow</h3>
          <span className="text-[10px] text-club-muted bg-club-surface px-2 py-0.5 rounded-full">{queue.length} tracks</span>
        </div>
        
        <div className="space-y-1">
          {sortedQueue.map((song, idx) => {
            const isCurrent = idx === currentTrackIdx;
            const isNext = idx === (currentTrackIdx + 1) % sortedQueue.length;
            const hScore = audioEngine?.getHarmonicScore(analysisA?.key, audioEngine?.getTrackKey(song.src));
            
            return (
              <div key={song.id} className={`track-row ${isCurrent ? 'is-current' : isNext ? 'is-next' : ''}`}>
                <GripVertical size={12} className="text-club-muted/40 flex-shrink-0 cursor-grab" />
                
                {isCurrent ? (
                  <div className="w-6 text-center"><div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse mx-auto" /></div>
                ) : isNext ? (
                  <div className="w-6 text-center"><ChevronRight size={14} className="text-neon-cyan mx-auto" /></div>
                ) : (
                  <span className="text-[10px] font-bold text-club-muted w-6 text-center">#{idx + 1}</span>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{song.track}</p>
                  <p className="text-[10px] text-club-muted truncate">{song.artist}</p>
                </div>
                
                {/* AI Badges */}
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  {audioEngine && !isCurrent && (
                    <span className={`badge border ${hScore > 80 ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-club-surface text-club-muted border-club-border'}`}>
                      {hScore > 80 ? '✨ Harmonic Match' : 'OK Match'}
                    </span>
                  )}
                  {audioEngine?.getEnergyFlowCategory(song.src) && (
                    <span className="badge bg-club-surface text-club-muted border border-club-border capitalize">
                      {audioEngine.getEnergyFlowCategory(song.src)}
                    </span>
                  )}
                </div>

                <button onClick={() => onVote?.(song.id)} className="flex items-center gap-1 px-2 py-1 rounded bg-club-surface hover:bg-neon-purple/20 border border-club-border transition-all group flex-shrink-0">
                  <ThumbsUp size={10} className="text-neon-purple group-hover:scale-110" />
                  <span className="text-[10px] font-bold text-neon-purple">{song.votes}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
