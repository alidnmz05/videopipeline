import React from 'react';

// Every background has some ambient motion so no frame is ever fully static.
// Names must match catalog.ts; anything else falls through to sky.
export const Background: React.FC<{kind: string; w: number; h: number; t: number}> = ({kind, w, h, t}) => {
  const vertical = h > w;
  const floorY = vertical ? h * 0.68 : h * 0.76;
  // In vertical the headline sits at y 330-430, so wall decor moves below it.
  const decorY = vertical ? h * 0.26 : h * 0.12;

  if (kind === 'office')
    return (
      <g>
        <rect width={w} height={h} fill="#f4ead5" />
        <rect y={floorY} width={w} height={h - floorY} fill="#d9c7a0" />
        <rect x={w * 0.62} y={decorY} width={w * 0.3} height={w * 0.22} rx={16} fill="#bfe3f2" stroke="#8a7a5a" strokeWidth={10} />
        <line x1={w * 0.77} y1={decorY} x2={w * 0.77} y2={decorY + w * 0.22} stroke="#8a7a5a" strokeWidth={8} />
        <rect x={w * 0.08} y={decorY - h * 0.02} width={w * 0.2} height={w * 0.13} rx={10} fill="#fff" stroke="#8a7a5a" strokeWidth={8} />
      </g>
    );

  if (kind === 'night' || kind === 'bedroom') {
    const night = kind === 'night';
    return (
      <g>
        <rect width={w} height={h} fill={night ? '#14183a' : '#2b3566'} />
        {night &&
          Array.from({length: 50}).map((_, i) => (
            <circle key={i} cx={(i * 211) % w} cy={(i * 97) % floorY} r={2 + (i % 3)} fill="#fff" opacity={0.4 + 0.4 * Math.abs(Math.sin(t * 2 + i))} />
          ))}
        {!night && (
          <g>
            <rect x={w * 0.08} y={decorY - h * 0.02} width={w * 0.3} height={w * 0.3} rx={12} fill="#14183a" stroke="#4a5590" strokeWidth={10} />
            {Array.from({length: 8}).map((_, i) => (
              <circle key={i} cx={w * 0.1 + ((i * 53) % (w * 0.26))} cy={decorY - h * 0.01 + ((i * 37) % (w * 0.28))} r={3} fill="#fff" opacity={0.4 + 0.5 * Math.abs(Math.sin(t * 2.5 + i))} />
            ))}
            <rect x={w * 0.04} y={floorY - h * 0.07} width={w * 0.55} height={h * 0.09} rx={20} fill="#6b4f9e" />
            <rect x={w * 0.06} y={floorY - h * 0.1} width={w * 0.16} height={h * 0.05} rx={18} fill="#e8e2ff" />
          </g>
        )}
        <rect y={floorY} width={w} height={h - floorY} fill={night ? '#0b0e24' : '#1e2547'} />
      </g>
    );
  }

  if (kind === 'studio') {
    const cx = w / 2;
    const cy = h * 0.42;
    const r = Math.hypot(w, h);
    const rays = 18;
    return (
      <g>
        <rect width={w} height={h} fill="#ffb84a" />
        <g transform={`translate(${cx} ${cy}) rotate(${t * 12})`}>
          {Array.from({length: rays}).map((_, i) => {
            const a0 = (i * 2 * Math.PI) / rays;
            const a1 = a0 + Math.PI / rays;
            return <path key={i} d={`M0 0 L${Math.cos(a0) * r} ${Math.sin(a0) * r} L${Math.cos(a1) * r} ${Math.sin(a1) * r}Z`} fill="#ffcd70" />;
          })}
        </g>
      </g>
    );
  }

  // sky
  return (
    <g>
      <rect width={w} height={h} fill="#9fd8f5" />
      <circle cx={w - 110} cy={110} r={80} fill="#ffe27a" />
      {[0, 1, 2].map((i) => {
        const span = w + 500;
        const x = ((i * span) / 3 + t * (30 + i * 12)) % span - 250;
        return (
          <g key={i} transform={`translate(${x} ${h * (0.08 + i * 0.09)})`} opacity={0.9}>
            <ellipse rx={110} ry={42} fill="#fff" />
            <ellipse cx={-60} cy={10} rx={70} ry={32} fill="#fff" />
            <ellipse cx={70} cy={12} rx={80} ry={30} fill="#fff" />
          </g>
        );
      })}
      <rect y={floorY} width={w} height={h - floorY} fill="#8fd18a" />
    </g>
  );
};
