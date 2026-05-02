import { useState } from 'react';
import { Users, Zap, Star } from 'lucide-react';

export default function CrowdFXPanel({ crowdAmbience, onToggleCrowd, onApplause, dropFlash }) {
  const [applauseActive, setApplauseActive] = useState(false);

  const handleApplause = () => {
    setApplauseActive(true);
    onApplause?.();
    setTimeout(() => setApplauseActive(false), 2200);
  };

  return (
    <div className="glass-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <Users size={12} className="text-neon-cyan" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Crowd FX</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleCrowd}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
            crowdAmbience
              ? 'bg-neon-green/10 border-neon-green/40 text-neon-green shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-club-card border-club-border text-club-muted hover:border-neon-green/30'
          }`}
        >
          <Users size={10} />
          Ambience {crowdAmbience ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={handleApplause}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
            applauseActive
              ? 'bg-neon-yellow/10 border-neon-yellow/40 text-neon-yellow animate-pulse'
              : 'bg-club-card border-club-border text-club-muted hover:border-neon-yellow/30'
          }`}
        >
          <Star size={10} />
          Applause
        </button>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
          dropFlash
            ? 'bg-neon-pink/10 border-neon-pink/40 text-neon-pink animate-pulse'
            : 'bg-club-card border-club-border text-club-muted'
        }`}>
          <Zap size={10} />
          Drop Flash
        </div>
      </div>
    </div>
  );
}
