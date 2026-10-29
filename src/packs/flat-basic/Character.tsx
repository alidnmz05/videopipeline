import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Gesture} from '../../engine/motion';
import type {CharacterProps} from '../../engine/pack';

// Arm angles in degrees; 0 = hanging straight down, negative swings the right arm outward/up.
// The left arm mirrors with positive angles.
const pose = (g: Gesture, gt: number, t: number) => {
  const s = Math.max(gt, 0);
  switch (g) {
    case 'wave': return {R: -150 + Math.sin(s * 12) * 22, L: 10, hop: 0};
    case 'point': return {R: -92 + Math.sin(s * 3) * 3, L: 12, hop: 0};
    case 'shrug': return {R: -118 + Math.sin(s * 6) * 5, L: 118 - Math.sin(s * 6) * 5, hop: -Math.abs(Math.sin(s * 6)) * 6};
    case 'cheer': return {R: -140 + Math.sin(s * 10) * 10, L: 140 - Math.sin(s * 10) * 10, hop: -Math.abs(Math.sin(s * 9)) * 26};
    case 'facepalm': return {R: 153, L: 10, hop: 0};
    default: return {R: -8 + Math.sin(t * 2) * 4, L: 8 - Math.sin(t * 2) * 4, hop: 0};
  }
};

const Arm: React.FC<{x: number; angle: number; color: string}> = ({x, angle, color}) => (
  <g transform={`translate(${x} 115) rotate(${angle})`}>
    <rect x={-15} y={-10} width={30} height={115} rx={15} fill={color} stroke="#3b3b58" strokeWidth={5} />
    <circle cy={110} r={20} fill="#ffd9b5" stroke="#3b3b58" strokeWidth={5} />
  </g>
);

export const Character: React.FC<CharacterProps> = ({mood, talking, color = '#ff8a5c', gesture = 'idle', gestureT = -1, flip = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const blink = Math.floor(t * 3.3) % 9 === 0 && (t * 3.3) % 1 < 0.25;
  const mouthOpen = talking ? Math.abs(Math.sin(t * 14)) : 0;
  const eyeH = blink ? 2 : mood === 'surprised' ? 26 : 18;

  const idle = pose('idle', 0, t);
  const target = pose(gesture, gestureT, t);
  const blend = gestureT < 0 ? 0 : Math.min(1, gestureT / 0.2);
  const R = idle.R + (target.R - idle.R) * blend;
  const L = idle.L + (target.L - idle.L) * blend;
  const breathe = 1 + Math.sin(t * 2.5) * 0.012;

  return (
    <g transform={`scale(${flip ? -1 : 1} 1) translate(0 ${target.hop * blend})`}>
      <rect x={-50} y={250} width={34} height={90} rx={12} fill="#3b3b58" />
      <rect x={16} y={250} width={34} height={90} rx={12} fill="#3b3b58" />
      <g transform={`translate(0 260) scale(1 ${breathe}) translate(0 -260)`}>
        <rect x={-60} y={90} width={120} height={170} rx={40} fill={color} />
        <circle r={90} fill="#ffd9b5" stroke="#3b3b58" strokeWidth={6} />
        <ellipse cx={-32} cy={-10} rx={10} ry={eyeH / 2} fill="#222" />
        <ellipse cx={32} cy={-10} rx={10} ry={eyeH / 2} fill="#222" />
        {mood === 'sad' && <path d="M-50 -42 L-18 -34 M50 -42 L18 -34" stroke="#222" strokeWidth={6} strokeLinecap="round" />}
        {mood === 'surprised' && <path d="M-50 -48 Q-32 -64 -14 -48 M14 -48 Q32 -64 50 -48" stroke="#222" strokeWidth={6} fill="none" strokeLinecap="round" />}
        {talking || mood === 'surprised' ? (
          <ellipse cx={0} cy={44} rx={20} ry={6 + (talking ? mouthOpen * 18 : 16)} fill="#7a2a2a" />
        ) : (
          <path d={mood === 'sad' ? 'M-24 56 Q0 36 24 56' : 'M-24 40 Q0 66 24 40'} stroke="#222" strokeWidth={6} fill="none" strokeLinecap="round" />
        )}
        <path d="M-90 -10 Q-80 -110 0 -105 Q80 -110 90 -10 Q50 -70 0 -66 Q-50 -70 -90 -10Z" fill="#4a3426" />
        <Arm x={-52} angle={L} color={color} />
        <Arm x={52} angle={R} color={color} />
      </g>
    </g>
  );
};
