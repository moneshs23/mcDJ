import { useRef, useEffect } from 'react';

// Rotary EQ Knob — canvas-based with neon glow
// value: -12 to 12 (dB), or 0-100 for generic
// min/max configurable
export default function EQKnob({ value = 0, min = -12, max = 12, label = '', color = '#a855f7', size = 52, onChange }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const valToAngle = (v) => {
    const frac = (v - min) / (max - min);
    return -140 + frac * 280; // -140° to +140°
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    const angle = valToAngle(value);
    const rad = (angle - 90) * (Math.PI / 180);

    ctx.clearRect(0, 0, size, size);

    // Track arc
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, (-140 - 90) * Math.PI / 180, (140 - 90) * Math.PI / 180);
    ctx.strokeStyle = 'rgba(42,42,62,0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc
    const startRad = (-140 - 90) * Math.PI / 180;
    const endRad = rad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, startRad, endRad);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Knob body
    const knobGrad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, r - 7);
    knobGrad.addColorStop(0, '#2a2a3e');
    knobGrad.addColorStop(1, '#12121a');
    ctx.beginPath();
    ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(42,42,62,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Indicator line
    const ix = cx + Math.cos(rad) * (r - 12);
    const iy = cy + Math.sin(rad) * (r - 12);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ix, iy);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [value, color, size, min, max]);

  // Drag to rotate
  const handleMouseDown = (e) => {
    dragRef.current = { startY: e.clientY, startVal: value };
    const onMove = (me) => {
      const dy = dragRef.current.startY - me.clientY;
      const range = max - min;
      const newVal = Math.max(min, Math.min(max, dragRef.current.startVal + (dy / 100) * range));
      onChange?.(Math.round(newVal * 10) / 10);
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const step = (max - min) / 24;
    const newVal = Math.max(min, Math.min(max, value - Math.sign(e.deltaY) * step));
    onChange?.(Math.round(newVal * 10) / 10);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, cursor: 'ns-resize', display: 'block' }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      />
      <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>
        {value > 0 ? '+' : ''}{typeof value === 'number' ? value.toFixed(0) : value}{min < 0 ? 'dB' : '%'}
      </span>
    </div>
  );
}
