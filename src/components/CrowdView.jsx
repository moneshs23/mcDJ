import { useState } from 'react';
import {
  Search, Send, Music, Users, ThumbsUp, Disc3,
  Sparkles, Crown, TrendingUp
} from 'lucide-react';

// Real tracks from the song folder
const AVAILABLE_SONGS = [
  { track: 'Run It Up', artist: 'Hanumankind (Prod. Kalmi)', src: '/songs/Hanumankind - Run It Up ( Prod. By Kalmi ) _ (Official Music Video)(MP3_160K).mp3' },
  { track: 'Brother', artist: 'Kodaline', src: '/songs/Kodaline - Brother (Official Video)(MP3_160K).mp3' },
  { track: 'Rowdy Baby', artist: 'Dhanush & Sai Pallavi · Yuvan', src: '/songs/Maari 2 - Rowdy Baby (Video Song) _ Dhanush_ Sai Pallavi _ Yuvan Shankar Raja _ Balaji Mohan(MP3_160K).mp3' },
  { track: 'Theeyae Theeyae', artist: 'Suriya · Harris Jayaraj', src: '/songs/Maattrraan - Theeyae Theeyae Tamil Lyric _ Suriya_ Kajal _ Harris Jayaraj(MP3_160K).mp3' },
  { track: 'Show Me Love', artist: 'Tyla', src: '/songs/Show Me Love (with Tyla)(MP3_160K).mp3' },
  { track: 'Valayapatti Thavile', artist: 'Vijay · A.R. Rahman', src: '/songs/Valayapatti Thavile - Audio Song _ Azhagiya Tamil Magan _ Vijay _ Shriya _ AR Rahman(MP3_160K).mp3' },
  { track: 'Pavazha Malli', artist: 'Sai Abhyankkar ft. Shruti Haasan', src: '/songs/_SaiAbhyankkar - Pavazha Malli (Music Video) _ Kayadu _ Shruti Haasan _ Vivek _ Thejo _ Think Indie(MP3_160K).mp3' },
];

export default function CrowdView({ queue, setQueue, users, userName, onVote }) {
  const [track, setTrack] = useState('');
  const [artist, setArtist] = useState('');
  const [selectedSrc, setSelectedSrc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filteredSongs = searchQuery.length > 0
    ? AVAILABLE_SONGS.filter(s =>
        s.track.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!track.trim() || !artist.trim()) return;
    const newSong = {
      id: Date.now(),
      track: track.trim(),
      artist: artist.trim(),
      src: selectedSrc || '',
      votes: 0,
      requestedBy: userName || 'Anonymous',
    };
    setQueue(prev => [...prev, newSong]);
    setTrack('');
    setArtist('');
    setSelectedSrc('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const selectSong = (song) => {
    setTrack(song.track);
    setArtist(song.artist);
    setSelectedSrc(song.src);
    setSearchQuery('');
    setShowSearch(false);
  };

  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Search */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-neon-cyan" />
          <h3 className="text-lg font-bold text-white">Find a Track</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 font-medium ml-auto">
            {AVAILABLE_SONGS.length} available
          </span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-club-muted" />
          <input
            id="input-search"
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            placeholder="Search songs or artists..."
            className="input-club pl-9 text-sm"
          />
        </div>
        {showSearch && filteredSongs.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-club-surface border border-club-border">
            {filteredSongs.map((s, i) => (
              <button
                key={i}
                onClick={() => selectSong(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-neon-purple/10 transition-colors flex items-center gap-3 border-b border-club-border/50 last:border-0"
              >
                <Music size={14} className="text-neon-purple" />
                <div>
                  <p className="text-sm text-white font-medium">{s.track}</p>
                  <p className="text-xs text-club-muted">{s.artist}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {showSearch && searchQuery.length > 0 && filteredSongs.length === 0 && (
          <p className="mt-2 text-xs text-club-muted text-center py-3">No results — type it in manually below!</p>
        )}
      </div>

      {/* Drop a Request */}
      <div className="glass-card p-5 glow-cyan">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-neon-pink" />
          <h3 className="text-lg font-bold text-white">Drop a Request</h3>
        </div>

        {submitted && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center animate-slide-up flex items-center justify-center gap-2">
            <Sparkles size={14} /> Request dropped! Let the crowd vote! 🎶
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-club-muted mb-1.5 font-medium">Track Name</label>
            <input
              id="input-track"
              type="text"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="e.g. Rowdy Baby"
              className="input-club text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-club-muted mb-1.5 font-medium">Artist</label>
            <input
              id="input-artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Dhanush"
              className="input-club text-sm"
              required
            />
          </div>
          <button
            id="btn-drop-request"
            type="submit"
            className="btn-neon btn-pink w-full flex items-center justify-center gap-2 py-3"
          >
            <Send size={14} />
            Drop It 🎤
          </button>
        </form>
      </div>

      {/* Live Queue */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-neon-pink" />
            <h3 className="text-lg font-bold text-white">Live Queue</h3>
          </div>
          <span className="text-xs text-club-muted bg-club-card px-2 py-1 rounded-full">{queue.length} tracks</span>
        </div>
        {sortedQueue.length > 0 ? (
          <div className="space-y-2">
            {sortedQueue.map((song, idx) => (
              <div
                key={song.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${idx === 0 ? 'bg-neon-purple/10 border border-neon-purple/30' : 'bg-club-surface/50 border border-transparent hover:border-club-border'}`}
              >
                <span className={`text-sm font-bold w-6 text-center ${idx === 0 ? 'text-neon-purple' : 'text-club-muted'}`}>
                  {idx === 0 ? <Crown size={14} className="inline" /> : `#${idx + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{song.track}</p>
                  <p className="text-xs text-club-muted truncate">{song.artist} · by {song.requestedBy}</p>
                </div>
                <button
                  onClick={() => onVote(song.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 transition-all group"
                >
                  <ThumbsUp size={12} className="text-neon-purple group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-neon-purple">{song.votes}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Music size={32} className="text-club-muted/30 mx-auto mb-2" />
            <p className="text-sm text-club-muted">No requests yet — be the first!</p>
          </div>
        )}
      </div>

      {/* Users */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-neon-cyan" />
          <h3 className="text-lg font-bold text-white">In the Crowd</h3>
          <span className="text-xs text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full font-semibold">{users.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {users.map((user, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-club-surface border border-club-border text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-club-text text-xs font-medium">{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
