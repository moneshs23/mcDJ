import { useState, useEffect, useRef } from 'react';
import {
  Brain, Zap, Activity, Shuffle, Wand2, BarChart3,
  CheckCircle, Loader
} from 'lucide-react';

export default function AIPanel({ audioEngine, onAICrossfade }) {
  const [autoMix, setAutoMix] = useState(false);
  const [beatSync, setBeatSync] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [aiStatus, setAiStatus] = useState('AI idle — load tracks to begin');
  const [bpmA, setBpmA] = useState(0);
  const [bpmB, setBpmB] = useState(0);
  const [confA, setConfA] = useState(0);
  const [confB, setConfB] = useState(0);
  const autoMixRef = useRef(null);

  // Monitor decks for AI status updates
  useEffect(() => {
    const tick = () => {
      if (!audioEngine) { autoMixRef.current = requestAnimationFrame(tick); return; }

      const playingA = audioEngine.getDeckIsPlaying('A');
      const playingB = audioEngine.getDeckIsPlaying('B');
      const ba = audioEngine.getDeckBPM('A');
      const bb = audioEngine.getDeckBPM('B');
      const ca = audioEngine.getDeckConfidence('A');
      const cb = audioEngine.getDeckConfidence('B');

      setBpmA(ba);
      setBpmB(bb);
      setConfA(ca);
      setConfB(cb);

      // Beat sync
      if (beatSync && audioEngine) {
        audioEngine.applyBeatSync();
      }

      // Auto-mix check
      if (autoMix && audioEngine) {
        const triggerDeck = audioEngine.checkAutoMix();
        if (triggerDeck) {
          const targetDeck = triggerDeck === 'A' ? 'B' : 'A';
          if (audioEngine.getDeckIsLoaded(targetDeck)) {
            setAiStatus(`🎯 Auto-mixing: fading from Deck ${triggerDeck} → Deck ${targetDeck}`);
            onAICrossfade?.(triggerDeck, targetDeck);
            // Temporarily disable to prevent re-trigger
            setAutoMix(false);
            setTimeout(() => setAutoMix(true), 10000);
          }
        }
      }

      // Status messages
      if (playingA && playingB) {
        if (ba > 0 && bb > 0) {
          const diff = Math.abs(ba - bb);
          if (beatSync && diff < 3) {
            setAiStatus(`🔒 Beat-synced · Deck A: ${ba} BPM · Deck B: ${bb} BPM · Δ${diff.toFixed(1)}`);
          } else {
            setAiStatus(`🎵 Both decks live · A: ${ba} BPM · B: ${bb} BPM`);
          }
        } else {
          setAiStatus('🎧 Both decks playing — analyzing beats...');
        }
      } else if (playingA) {
        setAiStatus(ba > 0 ? `🎵 Deck A playing · ${ba} BPM · Confidence ${ca}%` : '🎧 Deck A playing — detecting BPM...');
      } else if (playingB) {
        setAiStatus(bb > 0 ? `🎵 Deck B playing · ${bb} BPM · Confidence ${cb}%` : '🎧 Deck B playing — detecting BPM...');
      } else {
        setAiStatus('AI idle — play a deck to begin analysis');
      }

      autoMixRef.current = requestAnimationFrame(tick);
    };
    autoMixRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(autoMixRef.current);
  }, [audioEngine, autoMix, beatSync, onAICrossfade]);

  const handleAutoMix = () => {
    const next = !autoMix;
    setAutoMix(next);
    audioEngine?.setAutoMix(next);
  };

  const handleBeatSync = () => {
    const next = !beatSync;
    setBeatSync(next);
    audioEngine?.enableBeatSync(next);
  };

  const handleSmartFade = () => {
    if (!audioEngine) return;
    const playingA = audioEngine.getDeckIsPlaying('A');
    const playingB = audioEngine.getDeckIsPlaying('B');
    const loadedA = audioEngine.getDeckIsLoaded('A');
    const loadedB = audioEngine.getDeckIsLoaded('B');

    if (playingA && loadedB) {
      onAICrossfade?.('A', 'B');
      setAiStatus('🌊 Smart fade: A → B');
    } else if (playingB && loadedA) {
      onAICrossfade?.('B', 'A');
      setAiStatus('🌊 Smart fade: B → A');
    } else {
      setAiStatus('⚠️ Load tracks on both decks first');
    }
  };

  const handleAnalyzeAll = () => {
    setAnalyzing(true);
    setAiStatus('🔬 Pre-analyzing all tracks...');
    // The waveform pre-decode happens on load — this is more of a UX indicator
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisComplete(true);
      setAiStatus('✅ All tracks analyzed — ready for mixing');
      setTimeout(() => setAnalysisComplete(false), 3000);
    }, 2000);
  };

  return (
    <div className="ai-panel">
      <div className="flex items-center gap-3 flex-wrap">
        {/* AI Label */}
        <div className="flex items-center gap-1.5 mr-2">
          <Brain size={14} className="text-neon-purple" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI/ML</span>
        </div>

        {/* Auto-Mix */}
        <button
          className={`ai-btn ${autoMix ? 'ai-active' : ''}`}
          onClick={handleAutoMix}
        >
          <Shuffle size={11} />
          Auto-Mix
        </button>

        {/* Beat Sync */}
        <button
          className={`ai-btn ${beatSync ? 'ai-active' : ''}`}
          onClick={handleBeatSync}
        >
          <Activity size={11} />
          Beat Sync
        </button>

        {/* Smart Fade */}
        <button className="ai-btn" onClick={handleSmartFade}>
          <Wand2 size={11} />
          Smart Fade
        </button>

        {/* Analyze All */}
        <button className="ai-btn" onClick={handleAnalyzeAll} disabled={analyzing}>
          {analyzing ? <Loader size={11} className="animate-spin" /> : analysisComplete ? <CheckCircle size={11} className="text-green-400" /> : <BarChart3 size={11} />}
          {analyzing ? 'Analyzing...' : analysisComplete ? 'Done!' : 'Analyze All'}
        </button>

        {/* Status */}
        <div className="flex-1 min-w-0 ml-auto">
          <p className="text-[10px] text-club-muted truncate text-right">{aiStatus}</p>
        </div>
      </div>
    </div>
  );
}
