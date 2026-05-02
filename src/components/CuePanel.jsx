const CUE_DEFS = [
  { key: 'intro',     label: 'INTRO',     color: '#64748b', emoji: '🎬' },
  { key: 'buildup',   label: 'BUILD',     color: '#eab308', emoji: '⬆️' },
  { key: 'drop',      label: 'DROP',      color: '#ef4444', emoji: '💥' },
  { key: 'breakdown', label: 'BREAK',     color: '#a855f7', emoji: '🌀' },
  { key: 'outro',     label: 'OUTRO',     color: '#06b6d4', emoji: '🌙' },
];

function fmt(s) {
  if (!s && s !== 0) return '--';
  if (!isFinite(s)) return '--';
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

export default function CuePanel({ cuePoints = null, currentTime = 0, onJump }) {
  if (!cuePoints) return null;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {CUE_DEFS.map(({ key, label, color, emoji }) => {
        const time = cuePoints[key];
        const isNear = time != null && Math.abs(currentTime - time) < 3;
        return (
          <button
            key={key}
            onClick={() => time != null && onJump?.(time)}
            disabled={time == null}
            className="flex flex-col items-center px-2 py-1.5 rounded-lg border transition-all"
            style={{
              background: isNear ? color + '22' : 'rgba(18,18,26,0.8)',
              borderColor: isNear ? color : 'rgba(42,42,62,0.6)',
              minWidth: 54,
              boxShadow: isNear ? `0 0 10px ${color}44` : 'none',
              cursor: time != null ? 'pointer' : 'default',
              opacity: time != null ? 1 : 0.35,
            }}
          >
            <span style={{ fontSize: 12 }}>{emoji}</span>
            <span style={{ fontSize: 8, color, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
            <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>{fmt(time)}</span>
          </button>
        );
      })}
    </div>
  );
}
