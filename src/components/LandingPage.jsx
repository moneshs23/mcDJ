import { Disc3, Radio, ArrowRight } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="page-bg flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Disc3 size={20} className="text-accent animate-spin-slow" />
          <span className="text-lg font-bold" style={{ fontFamily: 'Outfit' }}>mcDJ</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container-narrow text-center animate-slide-up">
          {/* EQ Bars */}
          <div className="eq-bars justify-center mb-6 mx-auto">
            {[...Array(5)].map((_, i) => <div key={i} className="eq-bar" />)}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight" style={{ fontFamily: 'Outfit' }}>
            AI-Powered
            <br />
            <span className="text-accent">Music Mixing</span>
          </h1>

          <p className="text-text-secondary text-base mb-8 max-w-sm mx-auto leading-relaxed">
            Smart beat-matching, automatic transitions, and crowd voting — all powered by AI. No DJ needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate('auth')} className="btn btn-primary text-base px-8 py-3">
              <Radio size={16} /> Host a Session
            </button>
            <button onClick={() => onNavigate('join')} className="btn btn-secondary text-base px-8 py-3">
              Join as Crowd <ArrowRight size={16} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            {[
              { emoji: '🎵', label: 'Auto Mixing', desc: 'Beat-matched transitions' },
              { emoji: '🗳️', label: 'Crowd Voting', desc: 'Request & upvote songs' },
              { emoji: '🤖', label: 'AI Engine', desc: 'Smart tempo & key sync' },
            ].map((f, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-surface-2/50 border border-border/50">
                <span className="text-2xl">{f.emoji}</span>
                <p className="text-xs font-semibold text-text-primary mt-2">{f.label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-text-muted">
          Built by Chandramouli S, Dharnish B M & Monesh S · SEPM Project
        </p>
      </footer>
    </div>
  );
}
