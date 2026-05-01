import { useState } from 'react';
import { ArrowLeft, User, Hash, Headphones, Sparkles, Disc3 } from 'lucide-react';

export default function JoinScreen({ onNavigate, onJoin }) {
  const [vibeName, setVibeName] = useState('');
  const [vipCode, setVipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (!vibeName.trim()) {
      setError('Pick a vibe name first!');
      return;
    }
    if (!vipCode.trim()) {
      setError('Need a VIP code to enter');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      onJoin({ name: vibeName, code: vipCode });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-club flex items-center justify-center relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-neon-cyan/8 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-neon-purple/8 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Back */}
        <button
          id="btn-back-join"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-club-muted hover:text-neon-cyan transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Lobby</span>
        </button>

        {/* Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Headphones size={28} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Enter the Club
            </h2>
            <p className="text-club-muted text-sm flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-neon-cyan" />
              Join the crowd and drop your requests
              <Sparkles size={12} className="text-neon-cyan" />
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm text-club-muted mb-2 font-medium">Vibe Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-club-muted" />
                <input
                  id="input-vibe-name"
                  type="text"
                  value={vibeName}
                  onChange={(e) => { setVibeName(e.target.value); setError(''); }}
                  placeholder="DJ_Shadow, BeatDropper, etc."
                  className="input-club pl-11"
                  maxLength={20}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-club-muted mb-2 font-medium">VIP Code</label>
              <div className="relative">
                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-club-muted" />
                <input
                  id="input-vip-code"
                  type="text"
                  value={vipCode}
                  onChange={(e) => { setVipCode(e.target.value.toUpperCase()); setError(''); }}
                  placeholder="Enter room code"
                  className="input-club pl-11 uppercase tracking-widest"
                  maxLength={8}
                />
              </div>
            </div>

            <button
              id="btn-join-club"
              type="submit"
              disabled={loading}
              className="btn-neon btn-cyan w-full flex items-center justify-center gap-2 text-base py-3.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Disc3 size={16} />
                  Join the Vibe
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
