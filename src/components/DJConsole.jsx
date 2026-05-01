import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Disc3, Volume2, Headphones, Radio
} from 'lucide-react';
import DJDeck from './DJDeck';
import TrackLibrary from './TrackLibrary';
import AIPanel from './AIPanel';

export default function DJConsole({ audioEngine, tracks }) {
  const [crossfader, setCrossfader] = useState(50); // 0-100, maps to 0-1
  const [masterVol, setMasterVol] = useState(85);
  const [deckATrigger, setDeckATrigger] = useState(0);
  const [deckBTrigger, setDeckBTrigger] = useState(0);

  // Handle dropping a track on a deck
  const handleDeckDrop = useCallback(async (deckId, trackData) => {
    if (!audioEngine) return;
    await audioEngine.loadDeck(deckId, trackData.src, {
      track: trackData.track,
      artist: trackData.artist,
    });
    // Force re-render
    if (deckId === 'A') setDeckATrigger(t => t + 1);
    else setDeckBTrigger(t => t + 1);
  }, [audioEngine]);

  // Crossfader
  const handleCrossfader = (e) => {
    const val = Number(e.target.value);
    setCrossfader(val);
    audioEngine?.setCrossfader(val / 100);
  };

  // Master volume
  const handleMasterVol = (e) => {
    const val = Number(e.target.value);
    setMasterVol(val);
    audioEngine?.setMasterVolume(val / 100);
  };

  // AI Crossfade handler
  const handleAICrossfade = useCallback((fromDeck, toDeck) => {
    if (!audioEngine) return;
    audioEngine.aiCrossfade(fromDeck, toDeck, 3);

    // Animate the crossfader UI
    const targetVal = toDeck === 'B' ? 100 : 0;
    const startVal = crossfader;
    const startTime = Date.now();
    const dur = 3000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / dur);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const current = Math.round(startVal + (targetVal - startVal) * eased);
      setCrossfader(current);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [audioEngine, crossfader]);

  return (
    <div className="dj-console">
      {/* ─── Decks Row ─── */}
      <div className="dj-decks-row">
        <DJDeck
          deckId="A"
          audioEngine={audioEngine}
          onDrop={handleDeckDrop}
          key={`A-${deckATrigger}`}
        />
        <DJDeck
          deckId="B"
          audioEngine={audioEngine}
          onDrop={handleDeckDrop}
          key={`B-${deckBTrigger}`}
        />
      </div>

      {/* ─── Crossfader ─── */}
      <div className="crossfader-section">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <span className="text-[10px] font-bold text-neon-purple uppercase tracking-wider w-12 text-right">
            Deck A
          </span>
          <div className="flex-1 crossfader-track">
            <input
              type="range"
              min="0"
              max="100"
              value={crossfader}
              onChange={handleCrossfader}
              className="crossfader-input"
            />
          </div>
          <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-wider w-12">
            Deck B
          </span>
          {/* Master Volume */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-club-border/30">
            <Volume2 size={12} className="text-club-muted" />
            <input
              type="range"
              min="0"
              max="100"
              value={masterVol}
              onChange={handleMasterVol}
              className="w-16 h-1 accent-neon-purple"
            />
            <span className="text-[10px] text-club-muted w-8">{masterVol}%</span>
          </div>
        </div>
      </div>

      {/* ─── AI Panel ─── */}
      <AIPanel
        audioEngine={audioEngine}
        onAICrossfade={handleAICrossfade}
      />

      {/* ─── Track Library ─── */}
      <TrackLibrary
        tracks={tracks}
        audioEngine={audioEngine}
      />
    </div>
  );
}
