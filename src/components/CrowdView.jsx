import { ThumbsUp, Music, Users, Crown, TrendingUp, Flame, SkipForward, Sparkles } from 'lucide-react';

export default function CrowdView({ queue, setQueue, users, userName, onVote }) {
  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes);
  const nowPlaying = sortedQueue[0] || null;
  const upNext = sortedQueue[1] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700, margin: '0 auto' }} className="animate-slide-up">

      {/* Now Playing */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse-soft" />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Now Playing</span>
        </div>
        {nowPlaying ? (
          <div className="flex items-center gap-5">
            <div className="now-art playing">
              <Music size={28} className="text-white relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-text-primary truncate" style={{fontFamily:'Outfit'}}>{nowPlaying.track}</h3>
              <p className="text-text-muted text-sm truncate">{nowPlaying.artist}</p>
              <p className="text-xs text-accent mt-1.5 flex items-center gap-1">
                <Crown size={10} /> Requested by {nowPlaying.requestedBy}
              </p>
            </div>
            <div className="eq-bars flex-shrink-0" style={{height:28}}>
              {[...Array(5)].map((_, i) => <div key={i} className="eq-bar" style={{width:3}} />)}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <Music size={40} className="text-text-muted/20 mx-auto mb-2" />
            <p className="text-text-muted text-sm">Waiting for music...</p>
          </div>
        )}
      </div>

      {/* Play Next */}
      {upNext && (
        <div className="play-next-card">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(52,211,153,0.1))', border: '1px solid rgba(34,211,238,0.25)' }}>
              <SkipForward size={20} className="text-neon-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{color:'#22d3ee'}}>Play Next</span>
                <Sparkles size={10} className="text-neon-cyan" />
              </div>
              <p className="text-sm font-bold text-text-primary truncate" style={{fontFamily:'Outfit'}}>{upNext.track}</p>
              <p className="text-xs text-text-muted truncate">{upNext.artist}</p>
            </div>
            <span className="badge badge-green text-[9px] flex-shrink-0"><ThumbsUp size={8} /> {upNext.votes}</span>
          </div>
        </div>
      )}

      {/* Vote Queue */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-sm font-bold text-text-primary" style={{fontFamily:'Outfit'}}>Vote Queue</span>
          </div>
          <span className="badge badge-muted">{queue.length} tracks</span>
        </div>
        <div className="space-y-1">
          {sortedQueue.map((song, idx) => (
            <div key={song.id} className={`track-row ${idx === 0 ? 'current' : idx === 1 ? 'next' : ''}`}>
              <span className={`text-xs font-bold w-6 text-center flex-shrink-0 ${idx === 0 ? 'text-accent' : idx === 1 ? 'text-neon-cyan' : 'text-text-muted'}`}>
                {idx === 0 ? <Crown size={12} className="inline" /> : idx === 1 ? <SkipForward size={12} className="inline" /> : `#${idx + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{song.track}</p>
                <p className="text-[10px] text-text-muted truncate">{song.artist} · by {song.requestedBy}</p>
              </div>
              {idx === 0 && <span className="badge badge-purple text-[9px]">PLAYING</span>}
              {idx === 1 && <span className="badge badge-cyan text-[9px]">NEXT</span>}
              <button onClick={() => onVote?.(song.id)} className="vote-btn flex-shrink-0">
                <ThumbsUp size={11} /><span>{song.votes}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Online */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-accent" />
          <span className="text-sm font-bold text-text-primary" style={{fontFamily:'Outfit'}}>Crowd</span>
          <span className="badge badge-green text-[10px]">{users.length} online</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {users.map((u, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px]`}
              style={{background:'rgba(14,14,22,0.7)', border: u.name === userName ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.08)'}}>
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
