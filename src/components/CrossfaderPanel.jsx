export default function CrossfaderPanel({ value, isCrossfading, onChange }) {
  const handleSlider = (e) => {
    onChange?.(Number(e.target.value));
  };

  return (
    <div className="relative glass-card p-3 my-2 glow-purple">
      {isCrossfading && (
        <div className="crossfade-sweep" />
      )}
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-neon-purple font-black">DECK A</span>
        <span className="text-[10px] text-club-muted font-bold tracking-widest uppercase">Crossfader</span>
        <span className="text-[10px] text-neon-cyan font-black">DECK B</span>
      </div>
      
      <div className="crossfader-wrap">
        <input 
          type="range" min="0" max="100" value={value} 
          onChange={handleSlider}
          className="crossfader-slider" 
        />
      </div>
      
      {/* Tick marks */}
      <div className="flex justify-between px-10 mt-1">
        <div className="w-px h-1.5 bg-club-muted/30" />
        <div className="w-px h-1.5 bg-club-muted/50" />
        <div className="w-px h-1.5 bg-club-muted/30" />
      </div>
    </div>
  );
}
