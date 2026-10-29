import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from './types';

// Short-form style: 3 words at a time, each pops in as it is spoken; punch words go green.
// Unspoken words in the group are laid out but invisible, so the line never reflows.
export const Captions: React.FC<{words: Word[]; vertical: boolean}> = ({words, vertical}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (words.length === 0 || t < words[0].start) return null;

  const group = vertical ? 3 : 4;
  let idx = words.findIndex((w) => t >= w.start && t < w.end);
  if (idx < 0) idx = words.findIndex((w) => w.start > t) - 1;
  if (idx < 0) idx = words.length - 1;
  const g0 = Math.floor(idx / group) * group;

  return (
    <div
      style={{
        position: 'absolute',
        ...(vertical ? {top: '71%'} : {bottom: 80}),
        left: '5%',
        width: '90%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        fontFamily: 'Arial Black, sans-serif',
        fontSize: vertical ? 100 : 80,
        lineHeight: 1.15,
      }}
    >
      {words.slice(g0, g0 + group).map((w, i) => {
        const k = g0 + i;
        const spoken = t >= w.start;
        const p = spoken ? spring({frame: (t - w.start) * fps, fps, config: {damping: 10, stiffness: 260}}) : 0;
        const color = w.emph ? '#5dff8a' : k === idx ? '#ffe14a' : '#fff';
        return (
          <span
            key={k}
            style={{
              display: 'inline-block',
              margin: '0 14px',
              color,
              opacity: spoken ? 1 : 0,
              // Emphasis grows the font (takes layout space) rather than scaling, so it never overlaps neighbours.
              fontSize: w.emph ? '1.18em' : undefined,
              transform: `scale(${0.5 + 0.5 * p}) rotate(${w.emph ? -3 : 0}deg)`,
              WebkitTextStroke: '10px #1b1b2f',
              paintOrder: 'stroke fill',
              textShadow: '0 8px 0 rgba(0,0,0,0.35)',
            }}
          >
            {w.w.toLocaleUpperCase('tr-TR')}
          </span>
        );
      })}
    </div>
  );
};
