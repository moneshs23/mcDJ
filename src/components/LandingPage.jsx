import { useState } from 'react';
import { Music, Headphones, Mic2, Zap, Disc3, Sparkles, Radio } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const [hoveredBtn, setHoveredBtn] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-club flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-pink/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
        
        {/* Floating music notes */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-neon-purple/20 animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.5}s`,
              fontSize: `${20 + i * 4}px`
            }}
          >
            ♪
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl animate-slide-up">
        {/* Logo / Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-purple via-neon-pink to-neon-cyan flex items-center justify-center animate-spin-slow">
              <Disc3 size={48} className="text-white" />
            </div>
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-neon-purple via-neon-pink to-neon-cyan blur-xl opacity-40 animate-pulse-glow" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <span className="bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan bg-clip-text text-transparent">
            mcDJ
          </span>
        </h1>

        {/* Slogan */}
        <p className="text-xl md:text-2xl text-club-muted font-light mb-2 tracking-wide">
          Control the aux. Drop the beat.
        </p>
        <p className="text-sm text-club-muted/60 mb-12 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-neon-purple" />
          A Social Music Sequencer
          <Sparkles size={14} className="text-neon-cyan" />
        </p>

        {/* Equalizer visualization */}
        <div className="flex items-end justify-center gap-1 mb-12 h-6">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="eq-bar"
              style={{
                animationDelay: `${i * 0.1}s`,
                background: i < 7 ? '#a855f7' : i < 14 ? '#ec4899' : '#06b6d4'
              }}
            />
          ))}
        </div>

        {/* Entry Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <button
            id="btn-host"
            className="btn-neon btn-purple flex items-center justify-center gap-3 text-lg px-8 py-4 rounded-xl glow-purple"
            onClick={() => onNavigate('auth')}
            onMouseEnter={() => setHoveredBtn('host')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Mic2 size={22} className={hoveredBtn === 'host' ? 'animate-vibe-pulse' : ''} />
            Host the Main Stage
          </button>

          <button
            id="btn-join"
            className="btn-neon btn-cyan flex items-center justify-center gap-3 text-lg px-8 py-4 rounded-xl glow-cyan"
            onClick={() => onNavigate('join')}
            onMouseEnter={() => setHoveredBtn('join')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Headphones size={22} className={hoveredBtn === 'join' ? 'animate-vibe-pulse' : ''} />
            Enter the Club
          </button>
        </div>

        {/* Team Credit */}
        <div className="mt-16 flex items-center justify-center gap-2 text-xs text-club-muted/40">
          <Radio size={12} />
          <span>Built by Chandramouli S, Dharnish B M & Monesh S</span>
          <Radio size={12} />
        </div>
      </div>
    </div>
  );
}
