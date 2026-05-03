import { useState } from 'react';
import { ArrowLeft, LogIn, Headphones, Sparkles } from 'lucide-react';

export default function AuthScreen({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) onLogin({ email, password });
  };

  return (
    <div className="page-bg flex items-center justify-center min-h-screen">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="container-narrow w-full animate-slide-up relative z-10">
        <button onClick={() => onNavigate('landing')} className="btn btn-ghost btn-sm mb-6">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="card-elevated p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Headphones size={28} className="text-accent-light" />
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Host Login</h2>
            <p className="text-text-muted text-sm mt-1 flex items-center justify-center gap-1"><Sparkles size={12} className="text-accent/50" /> Start an AI DJ session</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-2 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="input" required />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-2 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input" required />
            </div>
            <button type="submit" className="btn btn-primary w-full py-3">
              <LogIn size={16} /> Sign In
            </button>
          </form>
          <p className="text-center text-xs text-text-muted mt-5">Demo — enter any email & password to continue</p>
        </div>
      </div>
    </div>
  );
}
