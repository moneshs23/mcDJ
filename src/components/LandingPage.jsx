import { Disc3, Radio, ArrowRight, Music, Zap, Users, Headphones, Sparkles, Volume2 } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="page-bg flex flex-col min-h-screen">
      {/* Animated orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 4, height: 4 + Math.random() * 4,
              left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`,
              background: ['#8b5cf6','#ec4899','#22d3ee','#34d399','#a78bfa','#fbbf24'][i],
              opacity: 0.3, filter: 'blur(1px)',
              animation: `float ${3 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`
            }} />
        ))}
      </div>

      {/* Center content */}
      <main className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center animate-slide-up px-6 w-full max-w-4xl mx-auto">
          {/* Animated Disc */}
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Headphones size={32} className="text-accent-light animate-float" />
              <div className="absolute inset-0 rounded-full" style={{ animation: 'ripple 2s ease-out infinite', border: '1px solid rgba(139,92,246,0.3)' }} />
              <div className="absolute inset-0 rounded-full" style={{ animation: 'ripple 2s ease-out infinite 0.6s', border: '1px solid rgba(139,92,246,0.2)' }} />
            </div>
          </div>

          {/* EQ Bars */}
          <div className="eq-bars justify-center mb-6 mx-auto" style={{ height: 44 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="eq-bar" style={{ width: 5 }} />)}
          </div>

          {/* Big centered logo */}
          <h1 className="hero-logo animate-title-glow mb-5">mcDJ</h1>

          <p className="text-text-secondary text-xl mb-2 font-medium" style={{ fontFamily: 'Outfit' }}>
            <Sparkles size={16} className="inline text-accent-light mr-2" />
            AI-Powered Music Mixing
            <Sparkles size={16} className="inline text-neon-pink ml-2" />
          </p>
          <p className="text-text-muted text-sm mb-12 max-w-lg mx-auto leading-relaxed">
            Intelligent beat-matching, automatic BPM sync, harmonic key detection,
            and crowd voting — all powered by machine learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button onClick={() => onNavigate('auth')} className="btn btn-primary btn-lg group">
              <Radio size={18} /> Host a Session
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => onNavigate('join')} className="btn btn-secondary btn-lg group">
              <Users size={18} /> Join as Crowd
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Feature cards — full width */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl mx-auto">
            {[
              { icon: Music, label: 'Smart Auto-Mix', desc: 'AI analyzes BPM, key & energy for seamless transitions', color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
              { icon: Users, label: 'Crowd Voting', desc: 'Audience upvotes songs in real-time to shape the playlist', color: '#22c55e', glow: 'rgba(34,197,94,0.15)' },
              { icon: Zap, label: 'ML Engine', desc: 'Beat detection, spectral analysis & harmonic mixing', color: '#22d3ee', glow: 'rgba(34,211,238,0.15)' },
            ].map((f, i) => (
              <div key={i} className="card p-6 text-center group hover:scale-[1.03] transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${f.glow}, transparent)`, border: `1px solid ${f.color}30` }}>
                  <f.icon size={24} style={{ color: f.color }} />
                </div>
                <p className="text-sm font-bold text-text-primary mb-2" style={{ fontFamily: 'Outfit' }}>{f.label}</p>
                <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center relative z-10">
        <p className="text-xs text-text-muted/40 flex items-center justify-center gap-2">
          <Volume2 size={10} className="text-accent/40" />
          Built by Chandramouli S, Dharnish B M & Monesh S · SEPM Project
          <Volume2 size={10} className="text-accent/40" />
        </p>
      </footer>
    </div>
  );
}
