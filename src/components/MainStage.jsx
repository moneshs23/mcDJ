import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, Volume2, VolumeX, ThumbsUp, Trash2,
  Copy, Check, Disc3, Users, Music, TrendingUp,
  Crown, Flame, Shuffle
} from 'lucide-react';

export default function MainStage({ queue, setQueue, currentSong, setCurrentSong, users, vipCode, vibeLevel, audioEngine }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const rafRef = useRef(null);

  // Progress tracking via requestAnimationFrame
  useEffect(() => {
    const updateProgress = () => {
      if (audioEngine) {
        setProgress(audioEngine.getProgress());
        setCurrentTime(audioEngine.getCurrentTime());
        setDuration(audioEngine.getDuration());
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };
    rafRef.current = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioEngine]);

  // Auto-skip when track ends
  useEffect(() => {
    if (audioEngine) {
      audioEngine.onTrackEnd = () => {
        handleSkip();
      };
    }
  }, [audioEngine, queue]);

  const handlePlayPause = useCallback(async () => {
    if (!audioEngine || !currentSong) return;

    if (!hasStarted) {
      // First play — load the track
      await audioEngine.loadAndPlay(currentSong.src);
      setIsPlaying(true);
      setHasStarted(true);
    } else if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      await audioEngine.play();
      setIsPlaying(true);
    }
  }, [audioEngine, currentSong, isPlaying, hasStarted]);

  const handleSkip = useCallback(async () => {
    if (queue.length > 0) {
      const sorted = [...queue].sort((a, b) => b.votes - a.votes);
      const nextSong = sorted[0];
      setCurrentSong(nextSong);
      setQueue(queue.filter((s) => s.id !== nextSong.id));
      setProgress(0);

      if (audioEngine && hasStarted) {
        // DJ crossfade to next track
        setIsCrossfading(true);
        await audioEngine.crossfadeTo(nextSong.src);
        setIsPlaying(true);
        setTimeout(() => setIsCrossfading(false), 2600);
      }
    } else {
      setCurrentSong(null);
      setIsPlaying(false);
      setProgress(0);
      if (audioEngine) audioEngine.pause();
    }
  }, [queue, setQueue, setCurrentSong, audioEngine, hasStarted]);

  const handleSeek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - r.left) / r.width;
    setProgress(fraction * 100);
    if (audioEngine) audioEngine.seek(fraction);
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioEngine) audioEngine.setVolume(val / 100);
  };

  const handleVote = (id) => setQueue(queue.map((s) => s.id === id ? { ...s, votes: s.votes + 1 } : s));
  const handleRemove = (id) => setQueue(queue.filter((s) => s.id !== id));
  const copyCode = () => { navigator.clipboard?.writeText(vipCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes);

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getVibeColor = () => {
    if (vibeLevel > 80) return 'from-red-500 to-orange-500';
    if (vibeLevel > 60) return 'from-neon-pink to-red-500';
    if (vibeLevel > 40) return 'from-neon-purple to-neon-pink';
    return 'from-neon-cyan to-neon-purple';
  };
  const getVibeLabel = () => {
    if (vibeLevel > 80) return '🔥 ON FIRE';
    if (vibeLevel > 60) return '💜 VIBING';
    if (vibeLevel > 40) return '✨ WARMING UP';
    return '🎵 CHILL';
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Vibe Meter */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame size={16} className={vibeLevel > 60 ? 'text-neon-pink animate-vibe-pulse' : 'text-club-muted'} />
            <span className="text-sm font-semibold text-white">Vibe Meter</span>
          </div>
          <span className="text-xs font-bold">{getVibeLabel()}</span>
        </div>
        <div className="vibe-meter"><div className={`vibe-fill bg-gradient-to-r ${getVibeColor()}`} style={{ width: `${vibeLevel}%` }} /></div>
      </div>

      {/* Now Playing */}
      <div className="glass-card p-6 glow-purple relative overflow-hidden">
        {/* Crossfade indicator */}
        {isCrossfading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink animate-gradient-shift" style={{ backgroundSize: '200% 100%' }} />
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Live on Deck</span>
          {isCrossfading && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 font-semibold animate-pulse ml-auto">
              <Shuffle size={10} className="inline mr-1" />CROSSFADING
            </span>
          )}
        </div>
        {currentSong ? (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center ${isPlaying ? 'animate-vibe-pulse' : ''}`}>
                <Music size={32} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white truncate">{currentSong.track}</h3>
                <p className="text-club-muted text-sm truncate">{currentSong.artist}</p>
                <p className="text-xs text-neon-purple mt-1 flex items-center gap-1"><Crown size={10} />Requested by {currentSong.requestedBy}</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="progress-track" onClick={handleSeek}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-club-muted">{formatTime(currentTime)}</span>
                <span className="text-xs text-club-muted">{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button id="btn-play-pause" onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-neon-purple/30">
                  {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-0.5" />}
                </button>
                <button id="btn-skip" onClick={handleSkip} className="w-10 h-10 rounded-full bg-club-card border border-club-border flex items-center justify-center hover:border-neon-purple/50 transition-colors" title="DJ Crossfade to next">
                  <SkipForward size={16} className="text-club-text" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX size={14} className="text-club-muted" /> : <Volume2 size={14} className="text-club-muted" />}
                <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="w-20 h-1 accent-neon-purple" />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8"><Disc3 size={48} className="text-club-muted/30 mx-auto mb-3" /><p className="text-club-muted text-sm">No track playing</p></div>
        )}
      </div>

      {/* VIP Code */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-club-muted mb-1 font-medium">Room VIP Code</p><p className="text-2xl font-black tracking-[0.3em] text-neon-cyan" style={{ fontFamily: 'Outfit' }}>{vipCode}</p></div>
          <button id="btn-copy-code" onClick={copyCode} className="btn-neon btn-outline flex items-center gap-2 text-sm px-4 py-2">{copied ? <><Check size={14} className="text-green-400" />Copied!</> : <><Copy size={14} />Copy</>}</button>
        </div>
      </div>

      {/* Queue */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><TrendingUp size={16} className="text-neon-pink" /><h3 className="text-lg font-bold text-white">Crowd Queue</h3></div>
          <span className="text-xs text-club-muted bg-club-card px-2 py-1 rounded-full">{queue.length} tracks</span>
        </div>
        {sortedQueue.length > 0 ? (
          <div className="space-y-2">
            {sortedQueue.map((song, idx) => (
              <div key={song.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all animate-slide-in-right ${idx === 0 ? 'bg-neon-purple/10 border border-neon-purple/30' : 'bg-club-surface/50 border border-transparent hover:border-club-border'}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                <span className={`text-sm font-bold w-6 text-center ${idx === 0 ? 'text-neon-purple' : 'text-club-muted'}`}>{idx === 0 ? <Crown size={14} className="inline" /> : `#${idx + 1}`}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{song.track}</p><p className="text-xs text-club-muted truncate">{song.artist} · by {song.requestedBy}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleVote(song.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 transition-all group"><ThumbsUp size={12} className="text-neon-purple group-hover:scale-110 transition-transform" /><span className="text-xs font-bold text-neon-purple">{song.votes}</span></button>
                  <button onClick={() => handleRemove(song.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-club-muted hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8"><Music size={32} className="text-club-muted/30 mx-auto mb-2" /><p className="text-sm text-club-muted">Queue is empty</p></div>
        )}
      </div>

      {/* Users */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4"><Users size={16} className="text-neon-cyan" /><h3 className="text-lg font-bold text-white">In the Crowd</h3><span className="text-xs text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full font-semibold">{users.length} online</span></div>
        <div className="flex flex-wrap gap-2">
          {users.map((user, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-club-surface border border-club-border text-sm animate-slide-in-right" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-club-text text-xs font-medium">{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
