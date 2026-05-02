import { useRef, useEffect, useCallback } from 'react';

// Props: peaks (array 0-1), progress (0-100), beatGrid (seconds[]), 
//        cuePoints ({intro,buildup,drop,breakdown,outro}), sections ({intro,buildup,drop,breakdown,outro}),
//        duration (s), accentColor, isPlaying, height, transitionZone (bool)
export default function DualWaveform({
  peaks = [], progress = 0, beatGrid = [], cuePoints = null,
  duration = 0, accentColor = '#a855f7', accentRgb = '168,85,247',
  isPlaying = false, height = 110, transitionZone = false, onSeek
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== canvas.offsetWidth * dpr) {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(10,10,15,0.95)';
    ctx.fillRect(0, 0, w, h);

    const progressFrac = progressRef.current / 100;
    const centerIdx = Math.floor(progressFrac * peaks.length);
    const peaksInView = Math.min(peaks.length || 300, 300);
    const halfView = Math.floor(peaksInView / 2);
    const startIdx = Math.max(0, centerIdx - halfView);
    const endIdx = Math.min(peaks.length, startIdx + peaksInView);
    const barWidth = w / peaksInView;

    // Section zone backgrounds (before waveform bars)
    if (duration > 0 && cuePoints) {
      const timeToX = (t) => {
        const fraction = t / duration;
        const peakIdx = Math.floor(fraction * peaks.length);
        const relIdx = peakIdx - startIdx;
        return (relIdx / peaksInView) * w;
      };
      const sections = [
        { from: cuePoints.intro || 0, to: cuePoints.buildup || duration * 0.2, color: 'rgba(100,116,139,0.08)' },
        { from: cuePoints.buildup || duration * 0.2, to: cuePoints.drop || duration * 0.4, color: 'rgba(234,179,8,0.06)' },
        { from: cuePoints.drop || duration * 0.4, to: cuePoints.breakdown || duration * 0.65, color: 'rgba(239,68,68,0.08)' },
        { from: cuePoints.breakdown || duration * 0.65, to: cuePoints.outro || duration * 0.85, color: 'rgba(168,85,247,0.06)' },
        { from: cuePoints.outro || duration * 0.85, to: duration, color: 'rgba(100,116,139,0.05)' },
      ];
      sections.forEach(({ from, to, color }) => {
        const x1 = timeToX(from), x2 = timeToX(to);
        if (x2 > 0 && x1 < w) {
          ctx.fillStyle = color;
          ctx.fillRect(Math.max(0, x1), 0, Math.min(w, x2) - Math.max(0, x1), h);
        }
      });
    }

    // Beat grid lines (only show visible ones)
    if (duration > 0 && beatGrid.length > 0) {
      const startTime = (startIdx / peaks.length) * duration;
      const endTime = (endIdx / peaks.length) * duration;
      beatGrid.forEach((beatTime, bi) => {
        if (beatTime < startTime || beatTime > endTime) return;
        const fraction = beatTime / duration;
        const peakIdx = Math.floor(fraction * peaks.length);
        const x = ((peakIdx - startIdx) / peaksInView) * w;
        const isPhrase = bi % 16 === 0;
        const is8 = bi % 8 === 0;
        ctx.strokeStyle = isPhrase
          ? `rgba(${accentRgb},0.5)` : is8
          ? `rgba(${accentRgb},0.25)` : `rgba(${accentRgb},0.12)`;
        ctx.lineWidth = isPhrase ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      });
    }

    // Waveform bars
    if (peaks.length > 0) {
      for (let i = startIdx; i < endIdx; i++) {
        const x = (i - startIdx) * barWidth;
        const val = peaks[i] || 0;
        const barH = val * (h * 0.42);
        const isPast = i < centerIdx;
        const isCurrent = Math.abs(i - centerIdx) < 2;

        if (isCurrent) {
          ctx.fillStyle = '#ffffff';
        } else if (isPast) {
          ctx.fillStyle = `rgba(${accentRgb},0.3)`;
        } else {
          ctx.fillStyle = `rgba(${accentRgb},0.75)`;
        }
        // Top half
        ctx.fillRect(x, h / 2 - barH, Math.max(1, barWidth - 0.5), barH);
        // Bottom mirror
        ctx.fillStyle = isPast ? `rgba(${accentRgb},0.12)` : `rgba(${accentRgb},0.3)`;
        ctx.fillRect(x, h / 2, Math.max(1, barWidth - 0.5), barH * 0.6);
      }
    } else {
      // Placeholder sine wave
      ctx.strokeStyle = `rgba(${accentRgb},0.2)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x / 20) * h * 0.2;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Center line
    ctx.strokeStyle = `rgba(${accentRgb},0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

    // Playhead (center)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    ctx.shadowBlur = 0;

    // Cue point triangles
    if (duration > 0 && cuePoints) {
      const cueStyles = {
        intro: { color: '#64748b', label: 'I' },
        buildup: { color: '#eab308', label: 'B' },
        drop: { color: '#ef4444', label: 'D' },
        breakdown: { color: '#a855f7', label: 'X' },
        outro: { color: '#06b6d4', label: 'O' },
      };
      Object.entries(cuePoints).forEach(([key, time]) => {
        if (!time || time <= 0) return;
        const style = cueStyles[key];
        if (!style) return;
        const fraction = time / duration;
        const peakIdx = Math.floor(fraction * peaks.length);
        const x = ((peakIdx - startIdx) / peaksInView) * w;
        if (x < 0 || x > w) return;
        // Triangle marker
        ctx.fillStyle = style.color;
        ctx.beginPath();
        ctx.moveTo(x, 2); ctx.lineTo(x - 6, 14); ctx.lineTo(x + 6, 14);
        ctx.closePath(); ctx.fill();
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(style.label, x, 12);
      });
    }

    // Transition zone overlay
    if (transitionZone) {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(6,182,212,0)');
      grad.addColorStop(0.7, 'rgba(6,182,212,0)');
      grad.addColorStop(1, 'rgba(6,182,212,0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [peaks, beatGrid, cuePoints, duration, accentColor, accentRgb, transitionZone]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const handleClick = (e) => {
    if (!onSeek) return;
    const r = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - r.left) / r.width;
    // Convert click position to actual track position
    const progressFrac = progressRef.current / 100;
    const centerIdx = Math.floor(progressFrac * (peaks.length || 1));
    const peaksInView = Math.min(peaks.length || 300, 300);
    const startIdx = Math.max(0, centerIdx - Math.floor(peaksInView / 2));
    const clickPeakIdx = startIdx + Math.floor(frac * peaksInView);
    const seekFrac = Math.max(0, Math.min(1, clickPeakIdx / (peaks.length || 1)));
    onSeek(seekFrac);
  };

  return (
    <div
      style={{ width: '100%', height, borderRadius: 10, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
