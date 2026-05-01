import { useState } from 'react';
import { Music, GripVertical, Clock, Activity } from 'lucide-react';

export default function TrackLibrary({ tracks, audioEngine }) {
  const [draggingId, setDraggingId] = useState(null);

  const handleDragStart = (e, track) => {
    setDraggingId(track.id);
    e.dataTransfer.setData('application/json', JSON.stringify(track));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const estimateDuration = (sizeBytes) => {
    // ~160kbps MP3 → ~20KB/sec
    const seconds = Math.round(sizeBytes / 20000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="track-library">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Music size={13} className="text-neon-purple" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Track Library</span>
          <span className="text-[10px] text-club-muted">— drag onto a deck to load</span>
        </div>
        <span className="text-[10px] text-club-muted">{tracks.length} tracks</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`track-card ${draggingId === track.id ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, track)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-start gap-2 mb-1.5">
              <GripVertical size={12} className="text-club-muted/40 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{track.track}</p>
                <p className="text-[10px] text-club-muted truncate">{track.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-club-muted">
              <span className="flex items-center gap-1">
                <Activity size={8} className="text-neon-pink" />
                {track.bpm || '—'} BPM
              </span>
              <span className="flex items-center gap-1">
                <Clock size={8} />
                ~{track.duration || '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
