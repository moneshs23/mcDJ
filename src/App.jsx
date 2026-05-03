import { useState, useEffect, useCallback, useRef } from 'react';
import { Disc3, LogOut, ArrowLeftRight, Radio, Headphones, Sparkles } from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import JoinScreen from './components/JoinScreen';
import AIDJView from './components/AIDJView';
import CrowdView from './components/CrowdView';
import AudioEngine from './audioEngine';

const TRACK_LIST = [
  { id: 1, track: 'Run It Up', artist: 'Hanumankind (Prod. Kalmi)', src: '/songs/Hanumankind - Run It Up ( Prod. By Kalmi ) _ (Official Music Video)(MP3_160K).mp3', votes: 8, requestedBy: 'VibeKing' },
  { id: 2, track: 'Brother', artist: 'Kodaline', src: '/songs/Kodaline - Brother (Official Video)(MP3_160K).mp3', votes: 5, requestedBy: 'BeatDropper' },
  { id: 3, track: 'Rowdy Baby', artist: 'Dhanush & Sai Pallavi · Yuvan', src: '/songs/Maari 2 - Rowdy Baby (Video Song) _ Dhanush_ Sai Pallavi _ Yuvan Shankar Raja _ Balaji Mohan(MP3_160K).mp3', votes: 12, requestedBy: 'NightOwl' },
  { id: 4, track: 'Theeyae Theeyae', artist: 'Suriya · Harris Jayaraj', src: '/songs/Maattrraan - Theeyae Theeyae Tamil Lyric _ Suriya_ Kajal _ Harris Jayaraj(MP3_160K).mp3', votes: 3, requestedBy: 'ClubRat' },
  { id: 5, track: 'Show Me Love', artist: 'Tyla', src: '/songs/Show Me Love (with Tyla)(MP3_160K).mp3', votes: 7, requestedBy: 'MidnightDJ' },
  { id: 6, track: 'Valayapatti Thavile', artist: 'Vijay · A.R. Rahman', src: '/songs/Valayapatti Thavile - Audio Song _ Azhagiya Tamil Magan _ Vijay _ Shriya _ AR Rahman(MP3_160K).mp3', votes: 10, requestedBy: 'TamilBeats' },
  { id: 7, track: 'Pavazha Malli', artist: 'Sai Abhyankkar ft. Shruti Haasan', src: '/songs/_SaiAbhyankkar - Pavazha Malli (Music Video) _ Kayadu _ Shruti Haasan _ Vivek _ Thejo _ Think Indie(MP3_160K).mp3', votes: 9, requestedBy: 'IndieFan' },
];

const INITIAL_USERS = [
  { name: 'VibeKing', online: true },
  { name: 'BeatDropper', online: true },
  { name: 'NightOwl', online: true },
  { name: 'ClubRat', online: true },
  { name: 'MidnightDJ', online: true },
];

export default function App() {
  const [page, setPage] = useState('landing');
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [queue, setQueue] = useState([...TRACK_LIST]);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [vibeLevel, setVibeLevel] = useState(45);
  const [voteTimestamps, setVoteTimestamps] = useState([]);

  const engineRef = useRef(null);
  if (!engineRef.current) engineRef.current = new AudioEngine();
  const audioEngine = engineRef.current;

  useEffect(() => () => engineRef.current?.destroy(), []);

  useEffect(() => {
    const now = Date.now();
    const recent = voteTimestamps.filter(t => now - t < 10000);
    setVibeLevel(Math.max(15, Math.min(100, recent.length * 12)));
  }, [voteTimestamps]);

  useEffect(() => {
    const i = setInterval(() => setVoteTimestamps(p => p.filter(t => Date.now() - t < 10000)), 2000);
    return () => clearInterval(i);
  }, []);

  const handleVote = useCallback((songId) => {
    setQueue(p => p.map(s => s.id === songId ? { ...s, votes: s.votes + 1 } : s));
    setVoteTimestamps(p => [...p, Date.now()]);
  }, []);

  const handleLogin = (data) => { setRole('host'); setUserName(data.email.split('@')[0]); setPage('main'); };
  const handleJoin = (data) => { setRole('crowd'); setUserName(data.name); setUsers(p => [...p, { name: data.name, online: true }]); setPage('main'); };
  const handleLogout = () => {
    if (role === 'crowd') setUsers(p => p.filter(u => u.name !== userName));
    audioEngine.destroy();
    engineRef.current = new AudioEngine();
    setRole(null); setUserName(''); setPage('landing');
  };

  if (page === 'landing') return <LandingPage onNavigate={setPage} />;
  if (page === 'auth') return <AuthScreen onNavigate={setPage} onLogin={handleLogin} />;
  if (page === 'join') return <JoinScreen onNavigate={setPage} onJoin={handleJoin} />;

  return (
    <div className="page-bg min-h-screen">
      {/* Animated orbs */}
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /><div className="orb orb-4" />

      <header className="sticky top-0 z-50 card-glass" style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
        <div className="container-wide py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Headphones size={16} className="text-accent-light" />
            </div>
            <h1 className="text-lg font-bold" style={{ fontFamily: 'Outfit', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>mcDJ</h1>
            <span className={`badge ${role === 'host' ? 'badge-purple' : 'badge-green'}`}>
              {role === 'host' ? '🤖 AI DJ' : '🎧 Crowd'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRole(r => r === 'host' ? 'crowd' : 'host')} className="btn btn-ghost btn-xs">
              <ArrowLeftRight size={12} /> Switch View
            </button>
            <button onClick={handleLogout} className="btn btn-ghost btn-xs text-text-muted hover:text-danger">
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </header>

      <main className="container-wide py-6">
        {role === 'host' ? (
          <AIDJView audioEngine={audioEngine} tracks={TRACK_LIST} queue={queue} setQueue={setQueue} users={users} vibeLevel={vibeLevel} onVote={handleVote} />
        ) : (
          <CrowdView queue={queue} setQueue={setQueue} users={users} userName={userName} onVote={handleVote} />
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(139,92,246,0.06)' }} className="mt-4 relative z-10">
        <div className="container-wide py-4 text-center">
          <p className="text-xs text-text-muted/40 flex items-center justify-center gap-2">
            <Sparkles size={10} className="text-accent/30" /> Built by Chandramouli S, Dharnish B M & Monesh S · SEPM Project <Sparkles size={10} className="text-accent/30" />
          </p>
        </div>
      </footer>
    </div>
  );
}
