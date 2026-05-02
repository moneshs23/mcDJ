import { useState } from 'react';
import { ThumbsUp, Music, Users, Crown, TrendingUp, Flame } from 'lucide-react';

export default function CrowdView({ queue, setQueue, users, userName, onVote }) {
  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes);
  const nowPlaying = sortedQueue[0] || null;

  const handleVote = (id) => onVote?.(id);

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Now Playing */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Now Playing</span>
        </div>

        {nowPlaying ? (
          <div className="flex items-center gap-4">
            <div className="now-playing-art playing">
              <Music size={28} className="text-white relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-text-primary truncate">{nowPlaying.track}</h3>
              <p className="text-text-muted text-sm truncate">{nowPlaying.artist}</p>
              <p className="text-xs text-accent mt-1 flex items-center gap-1">
                <Crown size={10} /> Requested by {nowPlaying.requestedBy}
              </p>
            </div>
            <div className="eq-bars flex-shrink-0">
              {[...Array(5)].map((_, i) => <div key={i} className="eq-bar" />)}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Music size={36} className="text-text-muted/30 mx-auto mb-2" />
            <p className="text-text-muted text-sm">Waiting for music...</p>
          </div>
        )}
      </div>

      {/* Vote Queue */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-sm font-bold text-text-primary">Vote Queue</span>
          </div>
          <span className="badge badge-muted">{queue.length} tracks</span>
        </div>

        <div className="space-y-1">
          {sortedQueue.map((song, idx) => (
            <div key={song.id}
              className={`track-row ${idx === 0 ? 'current' : ''}`}
            >
              <span className={`text-xs font-bold w-6 text-center flex-shrink-0 ${idx === 0 ? 'text-accent' : 'text-text-muted'}`}>
                {idx === 0 ? <Crown size={12} className="inline" /> : `#${idx + 1}`}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{song.track}</p>
                <p className="text-[10px] text-text-muted truncate">{song.artist} · by {song.requestedBy}</p>
              </div>

              <button onClick={() => handleVote(song.id)} className="vote-btn flex-shrink-0">
                <ThumbsUp size={11} />
                <span>{song.votes}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Online */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-accent" />
          <span className="text-sm font-bold text-text-primary">Crowd</span>
          <span className="badge badge-green text-[10px]">{users.length} online</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {users.map((u, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border text-[10px] ${u.name === userName ? 'border-accent/40' : 'border-border'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
              <span className="text-text-secondary font-medium">{u.name}</span>
              {u.name === userName && <span className="text-accent font-bold">(you)</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
