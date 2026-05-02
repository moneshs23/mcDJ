import { TrendingUp, Flame } from 'lucide-react';

const STAGES = [
  { key: 'warmup', label: 'Warm Up', emoji: '🌅', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.4)' },
  { key: 'groove', label: 'Groove', emoji: '🎵', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)' },
  { key: 'peak', label: 'Peak', emoji: '🔥', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.4)' },
  { key: 'festival', label: 'Festival', emoji: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)' },
  { key: 'outro', label: 'Outro', emoji: '🌙', color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.4)' },
];

export default function EnergyFlowPanel({ currentStage = 'groove', onReorder, trackCount }) {
  const activeIdx = STAGES.findIndex(s => s.key === currentStage);

  return (
    <div className="glass-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-neon-pink" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Energy Flow</span>
        </div>
        <button
          onClick={onReorder}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-semibold border bg-neon-pink/10 border-neon-pink/30 text-neon-pink hover:bg-neon-pink/20 transition-all"
        >
          <Flame size={8} />
          Auto-Order {trackCount ? `(${trackCount})` : ''}
        </button>
      </div>

      {/* Flow stages */}
      <div className="flex items-center gap-1">
        {STAGES.map((stage, idx) => {
          const isActive = idx === activeIdx;
          const isPast = idx < activeIdx;
          return (
            <div key={stage.key} className="flex items-center gap-1 flex-1">
              <div
                className="flex-1 flex flex-col items-center py-1 px-0.5 rounded text-center transition-all"
                style={{
                  background: isActive ? stage.bg : isPast ? 'rgba(42,42,62,0.3)' : 'transparent',
                  border: `1px solid ${isActive ? stage.border : 'rgba(42,42,62,0.3)'}`,
                  opacity: isPast ? 0.45 : 1,
                }}
              >
                <span style={{ fontSize: 11 }}>{stage.emoji}</span>
                <span style={{ fontSize: 7, color: isActive ? stage.color : '#64748b', fontWeight: 700, marginTop: 1 }}>
                  {stage.label}
                </span>
              </div>
              {idx < STAGES.length - 1 && (
                <div style={{ width: 6, height: 1, background: 'rgba(42,42,62,0.5)', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
