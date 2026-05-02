import { useState } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function AuthScreen({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onLogin({ email, password });
    }
  };

  return (
    <div className="page-bg flex items-center justify-center min-h-screen">
      <div className="container-narrow w-full animate-slide-up">
        <button onClick={() => onNavigate('landing')} className="btn btn-ghost btn-sm mb-6">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="card-elevated p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Host Login</h2>
            <p className="text-text-muted text-sm mt-1">Start an AI DJ session</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="input" required />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input" required />
            </div>
            <button type="submit" className="btn btn-primary w-full py-3">
              <LogIn size={16} /> Sign In
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-4">
            Demo — enter any email & password to continue
          </p>
        </div>
      </div>
    </div>
  );
}
