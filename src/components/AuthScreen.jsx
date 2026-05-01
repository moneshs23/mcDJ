import { useState } from 'react';
import { Mail, Lock, ArrowLeft, Disc3, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function AuthScreen({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => {
      onLogin({ email, role: 'host' });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-club flex items-center justify-center relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-neon-purple/8 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-neon-pink/8 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Back button */}
        <button
          id="btn-back-auth"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-club-muted hover:text-neon-purple transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Lobby</span>
        </button>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                <Disc3 size={28} className="text-white animate-spin-slow" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome Back
            </h2>
            <p className="text-club-muted text-sm flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-neon-purple" />
              Sign in to host the main stage
              <Sparkles size={12} className="text-neon-purple" />
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-club-muted mb-2 font-medium">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-club-muted" />
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dj@mcdj.live"
                  className="input-club pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-club-muted mb-2 font-medium">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-club-muted" />
                <input
                  id="input-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-club pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-club-muted hover:text-neon-purple transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="btn-neon btn-purple w-full flex items-center justify-center gap-2 text-base py-3.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  Take the Stage
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-club-border text-center">
            <p className="text-sm text-club-muted">
              Don't have an account?{' '}
              <span className="text-neon-purple hover:text-neon-pink cursor-pointer transition-colors font-medium">
                Sign up
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
