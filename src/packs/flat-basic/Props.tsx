import React, {useId} from 'react';

const INK = '#3b3b58';

const Moon: React.FC = () => {
  const id = `moon-${useId().replace(/:/g, '')}`;
  return (
    <g>
      <mask id={id}>
        <rect x={-120} y={-120} width={240} height={240} fill="#fff" />
        <circle cx={38} cy={-22} r={68} fill="#000" />
      </mask>
      <circle r={85} fill="#ffe27a" mask={`url(#${id})`} />
    </g>
  );
};

// `t` is scene time in seconds, for props with built-in motion (clock hands, phone glow, zzz).
// Names must match catalog.ts; build validates plans against the catalog.
export const Prop: React.FC<{asset: string; draw: number; t: number}> = ({asset, draw, t}) => {
  switch (asset) {
    case 'coin':
      return (
        <g>
          <circle r={70} fill="#ffcf3f" stroke="#b8860b" strokeWidth={8} />
          <text textAnchor="middle" y={26} fontSize={80} fontWeight={800} fill="#b8860b" fontFamily="sans-serif">$</text>
        </g>
      );
    case 'bulb':
      return (
        <g>
          <circle r={65} fill="#fff3a0" stroke="#c9a400" strokeWidth={8} />
          <rect x={-28} y={60} width={56} height={40} rx={8} fill="#999" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={0} y1={-100} x2={0} y2={-130} stroke="#ffd400" strokeWidth={8} strokeLinecap="round" transform={`rotate(${-75 + i * 30})`} opacity={0.6 + 0.4 * Math.sin(t * 8 + i)} />
          ))}
        </g>
      );
    case 'warning':
      return (
        <g>
          <path d="M0 -80 L80 60 L-80 60Z" fill="#ff5252" stroke="#8b0000" strokeWidth={8} strokeLinejoin="round" />
          <text textAnchor="middle" y={44} fontSize={80} fontWeight={800} fill="#fff" fontFamily="sans-serif">!</text>
        </g>
      );
    case 'chart': {
      const len = 520;
      return (
        <g>
          <rect x={-200} y={-140} width={400} height={280} rx={16} fill="#fff" stroke={INK} strokeWidth={6} />
          <path d="M-160 100 L-80 40 L-10 70 L70 -30 L160 -100" fill="none" stroke="#2fa84f" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        </g>
      );
    }
    case 'phone':
      return (
        <g>
          <circle r={190} fill="#7fd3ff" opacity={0.12 + 0.06 * Math.sin(t * 9)} />
          <rect x={-78} y={-145} width={156} height={290} rx={26} fill="#1d1d2b" />
          <rect x={-64} y={-122} width={128} height={230} rx={12} fill="#7fd3ff" opacity={0.88 + 0.12 * Math.sin(t * 17)} />
          {[0, 1, 2, 3].map((i) => {
            const y = -100 + ((i * 55 + t * 120) % 220);
            return <rect key={i} x={-50} y={y} width={100} height={34} rx={6} fill="#fff" opacity={0.75} />;
          })}
          <circle cx={66} cy={-136} r={18} fill="#ff4d4d" stroke="#fff" strokeWidth={4} transform={`translate(66 -136) scale(${1 + 0.15 * Math.sin(t * 10)}) translate(-66 136)`} />
        </g>
      );
    case 'clock':
      return (
        <g>
          <circle r={100} fill="#fff" stroke={INK} strokeWidth={10} />
          {Array.from({length: 12}).map((_, i) => (
            <line key={i} y1={-82} y2={-70} stroke={INK} strokeWidth={6} strokeLinecap="round" transform={`rotate(${i * 30})`} />
          ))}
          <line y2={-45} stroke={INK} strokeWidth={10} strokeLinecap="round" transform={`rotate(${t * 40})`} />
          <line y2={-70} stroke="#ff5252" strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 360})`} />
          <circle r={9} fill={INK} />
        </g>
      );
    case 'moon':
      return <Moon />;
    case 'zzz':
      return (
        <g fontFamily="Arial Black, sans-serif" fontWeight={900} fill="#fff" stroke={INK} strokeWidth={5} paintOrder="stroke">
          {[0, 1, 2].map((i) => {
            const phase = (t * 0.8 + i / 3) % 1;
            return (
              <text key={i} x={-40 + i * 40 + Math.sin(phase * 6) * 10} y={60 - phase * 140} fontSize={50 + i * 18} opacity={Math.sin(phase * Math.PI)}>Z</text>
            );
          })}
        </g>
      );
    case 'arrowUp':
      return <path d="M0 -120 L90 0 L35 0 L35 110 L-35 110 L-35 0 L-90 0Z" fill="#2fa84f" stroke={INK} strokeWidth={8} strokeLinejoin="round" />;
    case 'check': {
      const len = 130;
      return (
        <g>
          <circle r={90} fill="#2fa84f" stroke={INK} strokeWidth={6} />
          <path d="M-42 2 L-12 32 L45 -30" fill="none" stroke="#fff" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        </g>
      );
    }
    case 'cross':
      return (
        <g>
          <circle r={90} fill="#ff5252" stroke={INK} strokeWidth={6} />
          <path d="M-36 -36 L36 36 M36 -36 L-36 36" stroke="#fff" strokeWidth={20} strokeLinecap="round" />
        </g>
      );
    case 'heart':
      return <path d="M0 80 C-130 -5 -90 -120 0 -60 C90 -120 130 -5 0 80Z" fill="#ff4d6d" stroke={INK} strokeWidth={7} strokeLinejoin="round" />;
    case 'brain':
      return (
        <g>
          <ellipse cx={-45} rx={72} ry={82} fill="#ff9bb3" stroke="#a8466a" strokeWidth={7} />
          <ellipse cx={45} rx={72} ry={82} fill="#ff9bb3" stroke="#a8466a" strokeWidth={7} />
          <path d="M-75 -25 Q-48 -48 -24 -18 M-82 25 Q-50 8 -22 36 M75 -25 Q48 -48 24 -18 M82 25 Q50 8 22 36 M0 -70 L0 70" stroke="#a8466a" strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'robot': {
      const blink = (t * 1.3) % 3 < 0.12;
      const glow = 0.7 + 0.3 * Math.sin(t * 6);
      return (
        <g>
          <line x1={0} y1={-150} x2={0} y2={-115} stroke={INK} strokeWidth={8} />
          <circle cy={-158} r={14} fill="#ff5252" opacity={glow} />
          <rect x={-95} y={-115} width={190} height={140} rx={30} fill="#c9d3e3" stroke={INK} strokeWidth={8} />
          <rect x={-70} y={-90} width={140} height={80} rx={18} fill="#1d1d2b" />
          <rect x={-48} y={-68} width={30} height={blink ? 4 : 30} rx={8} fill="#5dfcff" opacity={glow} />
          <rect x={18} y={-68} width={30} height={blink ? 4 : 30} rx={8} fill="#5dfcff" opacity={glow} />
          <rect x={-70} y={40} width={140} height={120} rx={22} fill="#c9d3e3" stroke={INK} strokeWidth={8} />
          <circle cx={0} cy={95} r={18} fill="#5dfcff" opacity={glow} stroke={INK} strokeWidth={5} />
          <rect x={-112} y={50} width={30} height={90} rx={15} fill="#9aa7bd" stroke={INK} strokeWidth={6} transform={`rotate(${Math.sin(t * 5) * 12} -97 55)`} />
          <rect x={82} y={50} width={30} height={90} rx={15} fill="#9aa7bd" stroke={INK} strokeWidth={6} transform={`rotate(${-Math.sin(t * 5) * 12} 97 55)`} />
        </g>
      );
    }
    case 'briefcase':
      return (
        <g>
          <path d="M-45 -70 L-45 -95 Q-45 -110 -30 -110 L30 -110 Q45 -110 45 -95 L45 -70" fill="none" stroke={INK} strokeWidth={12} />
          <rect x={-130} y={-75} width={260} height={170} rx={20} fill="#a0612f" stroke={INK} strokeWidth={8} />
          <line x1={-130} y1={-5} x2={130} y2={-5} stroke={INK} strokeWidth={6} />
          <rect x={-22} y={-20} width={44} height={30} rx={6} fill="#ffcf3f" stroke={INK} strokeWidth={5} />
        </g>
      );
    default:
      return null;
  }
};
