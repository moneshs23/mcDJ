import { Disc3, Radio, ArrowRight, Music, Zap, Users } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="page-bg flex flex-col min-h-screen">
      {/* Animated orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Center content */}
      <main className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center animate-slide-up px-6">
          {/* EQ Bars */}
          <div className="eq-bars justify-center mb-8 mx-auto" style={{ height: 40 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="eq-bar" style={{ width: 4 }} />)}
          </div>

          {/* Big centered logo */}
          <h1 className="hero-logo animate-title-glow mb-4">mcDJ</h1>
          
          <p className="text-text-secondary text-lg mb-2" style={{ fontFamily: 'Outfit' }}>
            AI-Powered Music Mixing
          </p>
          <p className="text-text-muted text-sm mb-10 max-w-md mx-auto leading-relaxed">
            Intelligent beat-matching, automatic BPM sync, harmonic key detection, 
            and crowd voting — all powered by machine learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <button onClick={() => onNavigate('auth')} className="btn btn-primary btn-lg">
              <Radio size={18} /> Host a Session
            </button>
            <button onClick={() => onNavigate('join')} className="btn btn-secondary btn-lg">
              Join as Crowd <ArrowRight size={18} />
            </button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Music, label: 'Smart Auto-Mix', desc: 'AI analyzes BPM, key & energy to create seamless transitions between songs', color: '#8b5cf6' },
              { icon: Users, label: 'Crowd Voting', desc: 'Audience requests and upvotes songs in real-time to shape the playlist', color: '#22c55e' },
              { icon: Zap, label: 'ML Engine', desc: 'Beat detection, spectral analysis, phrase alignment & harmonic mixing', color: '#3b82f6' },
            ].map((f, i) => (
              <div key={i} className="card p-5 text-center">
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: f.color + '18' }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">{f.label}</p>
                <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center relative z-10">
        <p className="text-xs text-text-muted/50">
          Built by Chandramouli S, Dharnish B M & Monesh S · SEPM Project
        </p>
      </footer>
    </div>
  );
}
