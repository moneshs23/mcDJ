import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Disc3, Mic2, Headphones, LogOut, ArrowLeftRight, Radio, Brain
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import JoinScreen from './components/JoinScreen';
import MainStage from './components/MainStage';
import CrowdView from './components/CrowdView';
import BeatVisualizer from './components/BeatVisualizer';
import AudioEngine from './audioEngine';

// Real tracks from /public/songs/
const TRACK_LIST = [
  {
    id: 1,
    track: 'Run It Up',
    artist: 'Hanumankind (Prod. Kalmi)',
    src: '/songs/Hanumankind - Run It Up ( Prod. By Kalmi ) _ (Official Music Video)(MP3_160K).mp3',
    votes: 8,
    requestedBy: 'VibeKing',
  },
  {
    id: 2,
    track: 'Brother',
    artist: 'Kodaline',
    src: '/songs/Kodaline - Brother (Official Video)(MP3_160K).mp3',
    votes: 5,
    requestedBy: 'BeatDropper',
  },
  {
    id: 3,
    track: 'Rowdy Baby',
    artist: 'Dhanush & Sai Pallavi · Yuvan',
    src: '/songs/Maari 2 - Rowdy Baby (Video Song) _ Dhanush_ Sai Pallavi _ Yuvan Shankar Raja _ Balaji Mohan(MP3_160K).mp3',
    votes: 12,
    requestedBy: 'NightOwl',
  },
  {
    id: 4,
    track: 'Theeyae Theeyae',
    artist: 'Suriya · Harris Jayaraj',
    src: '/songs/Maattrraan - Theeyae Theeyae Tamil Lyric _ Suriya_ Kajal _ Harris Jayaraj(MP3_160K).mp3',
    votes: 3,
    requestedBy: 'ClubRat',
  },
  {
    id: 5,
    track: 'Show Me Love',
    artist: 'Tyla',
    src: '/songs/Show Me Love (with Tyla)(MP3_160K).mp3',
    votes: 7,
    requestedBy: 'MidnightDJ',
  },
  {
    id: 6,
    track: 'Valayapatti Thavile',
    artist: 'Vijay · A.R. Rahman',
    src: '/songs/Valayapatti Thavile - Audio Song _ Azhagiya Tamil Magan _ Vijay _ Shriya _ AR Rahman(MP3_160K).mp3',
    votes: 10,
    requestedBy: 'TamilBeats',
  },
  {
    id: 7,
    track: 'Pavazha Malli',
    artist: 'Sai Abhyankkar ft. Shruti Haasan',
    src: '/songs/_SaiAbhyankkar - Pavazha Malli (Music Video) _ Kayadu _ Shruti Haasan _ Vivek _ Thejo _ Think Indie(MP3_160K).mp3',
    votes: 9,
    requestedBy: 'IndieFan',
  },
];

const INITIAL_USERS = [
  { name: 'VibeKing', online: true },
  { name: 'BeatDropper', online: true },
  { name: 'NightOwl', online: true },
  { name: 'ClubRat', online: true },
  { name: 'MidnightDJ', online: true },
];

const VIP_CODE = 'MCDJ42';

export default function App() {
  const [page, setPage] = useState('landing');
  const [role, setRole] = useState(null); // 'host' | 'crowd'
  const [userName, setUserName] = useState('');

  // Use the real track list — first track plays now, rest go to queue
  const [queue, setQueue] = useState(TRACK_LIST.slice(1));
  const [currentSong, setCurrentSong] = useState(TRACK_LIST[0]);

  const [users, setUsers] = useState(INITIAL_USERS);
  const [vibeLevel, setVibeLevel] = useState(45);
  const [voteTimestamps, setVoteTimestamps] = useState([]);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Audio engine ref — persists across renders
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new AudioEngine();
  }
  const audioEngine = engineRef.current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  // Calculate vibe level from vote frequency
  useEffect(() => {
    const now = Date.now();
    const recent = voteTimestamps.filter(t => now - t < 10000);
    const level = Math.min(100, recent.length * 12);
    setVibeLevel(Math.max(15, level));
  }, [voteTimestamps]);

  // Decay vibe over time
  useEffect(() => {
    const interval = setInterval(() => {
      setVoteTimestamps(prev => prev.filter(t => Date.now() - t < 10000));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = useCallback((songId) => {
    setQueue(prev => prev.map(s => s.id === songId ? { ...s, votes: s.votes + 1 } : s));
    setVoteTimestamps(prev => [...prev, Date.now()]);
  }, []);

  const handleLogin = (data) => {
    setRole('host');
    setUserName(data.email.split('@')[0]);
    setPage('main');
  };

  const handleJoin = (data) => {
    setRole('crowd');
    setUserName(data.name);
    setUsers(prev => [...prev, { name: data.name, online: true }]);
    setPage('main');
  };

  const handleLogout = () => {
    if (role === 'crowd') {
      setUsers(prev => prev.filter(u => u.name !== userName));
    }
    audioEngine.pause();
    setRole(null);
    setUserName('');
    setPage('landing');
  };

  const toggleRole = () => {
    setRole(prev => prev === 'host' ? 'crowd' : 'host');
  };

  // Landing, Auth, Join screens
  if (page === 'landing') return <LandingPage onNavigate={setPage} />;
  if (page === 'auth') return <AuthScreen onNavigate={setPage} onLogin={handleLogin} />;
  if (page === 'join') return <JoinScreen onNavigate={setPage} onJoin={handleJoin} />;

  // Main app shell
  return (
    <div className="min-h-screen bg-gradient-club">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-club-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Disc3 size={22} className="text-neon-purple animate-spin-slow" />
            <h1 className="text-xl font-black bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent" style={{ fontFamily: 'Outfit' }}>
              mcDJ
            </h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              role === 'host'
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                : 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
            }`}>
              {role === 'host' ? '🎤 Host' : '🎧 Crowd'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-visualizer"
              onClick={() => setShowVisualizer(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
                showVisualizer
                  ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple'
                  : 'bg-club-card border-club-border hover:border-neon-purple/50 text-club-text'
              }`}
              title="ML Beat Visualizer"
            >
              <Brain size={12} />
              <span className="hidden sm:inline">Visualize</span>
            </button>
            <button
              id="btn-switch-role"
              onClick={() => { setShowVisualizer(false); toggleRole(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-club-card border border-club-border hover:border-neon-purple/50 transition-colors text-xs font-medium text-club-text"
              title="Switch view"
            >
              <ArrowLeftRight size={12} />
              Switch
            </button>
            <button
              id="btn-logout"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-club-card border border-club-border hover:border-red-500/50 hover:text-red-400 transition-colors text-xs font-medium text-club-muted"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {showVisualizer ? (
          <BeatVisualizer audioEngine={audioEngine} isPlaying={audioEngine.isPlaying} currentSong={currentSong} />
        ) : role === 'host' ? (
          <MainStage
            queue={queue}
            setQueue={setQueue}
            currentSong={currentSong}
            setCurrentSong={setCurrentSong}
            users={users}
            vipCode={VIP_CODE}
            vibeLevel={vibeLevel}
            audioEngine={audioEngine}
          />
        ) : (
          <CrowdView
            queue={queue}
            setQueue={setQueue}
            users={users}
            userName={userName}
            onVote={handleVote}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-club-border/30 mt-8">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-club-muted/40 flex items-center justify-center gap-2">
            <Radio size={10} />
            Built by Chandramouli S, Dharnish B M & Monesh S · SEPM Project
            <Radio size={10} />
          </p>
        </div>
      </footer>
    </div>
  );
}
