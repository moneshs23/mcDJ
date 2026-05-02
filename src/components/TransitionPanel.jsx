import { Waves } from 'lucide-react';

const FX_TYPES = {
  riser:    { name: 'Noise Riser', emoji: '⬆️', color: '#a855f7' },
  impact:   { name: 'Drop Impact', emoji: '💥', color: '#ec4899' },
  sweep:    { name: 'Sweep',       emoji: '🌊', color: '#06b6d4' },
  none:     { name: 'None',        emoji: '—',  color: '#64748b' },
};

const TRANS_STYLES = {
  blend:       { name: 'Club Blend',    emoji: '🎚️', energy: 'med' },
  cut:         { name: 'Quick Cut',     emoji: '✂️', energy: 'any' },
  echoOut:     { name: 'Echo Out',      emoji: '🔊', energy: 'low' },
  filterSweep: { name: 'Filter Sweep',  emoji: '🌀', energy: 'med' },
  dropSwap:    { name: 'Drop Swap',     emoji: '⚡', energy: 'high' },
  bassSwap:    { name: 'Bass Swap',     emoji: '🔉', energy: 'med' },
  reverbTail:  { name: 'Reverb Tail',   emoji: '🌌', energy: 'low' },
};

export default function TransitionPanel({ transitionFX, transitionStyle, transitionBeats, onFX, onStyle, onBeats }) {
  return (
    <div className="glass-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Waves size={12} className="text-neon-cyan" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Transition Controls</span>
      </div>

      {/* FX Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] text-club-muted font-semibold w-7">FX:</span>
        {Object.entries(FX_TYPES).map(([key, fx]) => (
          <button key={key} onClick={() => onFX(key)}
            className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-all ${
              transitionFX === key
                ? 'border-opacity-60 text-white'
                : 'bg-transparent border-club-border/40 text-club-muted hover:border-club-border'
            }`}
            style={transitionFX === key ? { background: fx.color + '22', borderColor: fx.color + '88', color: fx.color } : {}}
          >
            {fx.emoji} {fx.name}
          </button>
        ))}
      </div>

      {/* Style Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] text-club-muted font-semibold w-7">Mix:</span>
        {Object.entries(TRANS_STYLES).map(([key, s]) => (
          <button key={key} onClick={() => onStyle(key)}
            className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-all ${
              transitionStyle === key
                ? 'bg-neon-pink/15 border-neon-pink/50 text-neon-pink'
                : 'bg-transparent border-club-border/40 text-club-muted hover:border-club-border'
            }`}
          >
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

      {/* Beat Length */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-club-muted font-semibold">Length:</span>
        {[8, 16, 32].map(b => (
          <button key={b} onClick={() => onBeats(b)}
            className={`px-3 py-0.5 rounded text-[9px] font-bold border transition-all ${
              transitionBeats === b
                ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan'
                : 'bg-transparent border-club-border/40 text-club-muted hover:border-club-border'
            }`}
          >
            {b} beats
          </button>
        ))}
      </div>
    </div>
  );
}
