import { useState } from 'react';
import { ArrowLeft, UserPlus, Users, Sparkles } from 'lucide-react';

export default function JoinScreen({ onNavigate, onJoin }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onJoin({ name, code });
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
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,211,238,0.1))', border: '1px solid rgba(34,197,94,0.2)' }}>
              <Users size={28} className="text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', background: 'linear-gradient(135deg, #4ade80, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Join Session</h2>
            <p className="text-text-muted text-sm mt-1 flex items-center justify-center gap-1"><Sparkles size={12} className="text-neon-green/50" /> Vote on songs & feel the vibe</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-2 block">Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VibeKing" className="input" required />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-2 block">Room Code (optional)</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. MCDJ42" className="input" />
            </div>
            <button type="submit" className="btn btn-primary w-full py-3" style={{ background: 'linear-gradient(135deg, #22c55e, #059669)' }}>
              <UserPlus size={16} /> Join the Crowd
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
