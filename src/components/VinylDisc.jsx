import { useRef, useEffect } from 'react';

export default function VinylDisc({ isPlaying, energy = 0, beatFlash = false, accentColor = '#a855f7', size = 120 }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;

    const hex2rgb = (hex) => {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `${r},${g},${b}`;
    };
    const rgb = hex2rgb(accentColor);

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRef.current);

      // Outer vinyl ring
      const vinylGrad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
      vinylGrad.addColorStop(0, '#1a1a1a');
      vinylGrad.addColorStop(0.3, '#0d0d0d');
      vinylGrad.addColorStop(0.7, '#111');
      vinylGrad.addColorStop(1, '#222');
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = vinylGrad;
      ctx.fill();

      // Groove rings
      for (let i = 0; i < 8; i++) {
        const gr = r * (0.35 + i * 0.08);
        ctx.beginPath();
        ctx.arc(0, 0, gr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb}, 0.08)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Label circle
      const labelGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.28);
      labelGrad.addColorStop(0, accentColor);
      labelGrad.addColorStop(0.6, accentColor + '99');
      labelGrad.addColorStop(1, accentColor + '44');
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = labelGrad;
      ctx.fill();

      // Center hole
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();

      ctx.restore();

      // Energy ring (outer glow — does NOT rotate)
      const energyAlpha = 0.2 + energy * 0.6;
      const energyR = r + 4 + energy * 6;
      const glowGrad = ctx.createRadialGradient(cx, cy, r, cx, cy, energyR + 6);
      glowGrad.addColorStop(0, `rgba(${rgb}, ${energyAlpha})`);
      glowGrad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, energyR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb}, ${energyAlpha})`;
      ctx.lineWidth = beatFlash ? 4 : 2;
      ctx.stroke();

      if (beatFlash) {
        ctx.beginPath();
        ctx.arc(cx, cy, energyR + 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb}, 0.4)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (isPlaying) {
        angleRef.current += 0.015 + energy * 0.01;
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, energy, beatFlash, accentColor, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block', borderRadius: '50%' }}
    />
  );
}
