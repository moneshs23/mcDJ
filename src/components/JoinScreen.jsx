import { useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function JoinScreen({ onNavigate, onJoin }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onJoin({ name, code });
  };

  return (
    <div className="page-bg flex items-center justify-center min-h-screen">
      <div className="container-narrow w-full animate-slide-up">
        <button onClick={() => onNavigate('landing')} className="btn btn-ghost btn-sm mb-6">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="card-elevated p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Join Session</h2>
            <p className="text-text-muted text-sm mt-1">Vote on songs & feel the vibe</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VibeKing" className="input" required />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Room Code (optional)</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. MCDJ42" className="input" />
            </div>
            <button type="submit" className="btn btn-primary w-full py-3">
              <UserPlus size={16} /> Join the Crowd
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
