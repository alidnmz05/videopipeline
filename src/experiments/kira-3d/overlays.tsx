import React from 'react';
import {spring} from 'remotion';
import type {TextCue} from './script';

// Headline text cues, timed on beat-local word starts.
export const TextLayer: React.FC<{texts: TextCue[]; tb: number; fps: number; wordAt: (i: number) => number}> = ({texts, tb, fps, wordAt}) => (
  <>
    {texts.map((tx, i) => {
      const at = wordAt(tx.word);
      if (tb < at) return null;
      if (tx.exitWord !== undefined && tb >= wordAt(tx.exitWord)) return null;
      const p = spring({frame: (tb - at) * fps, fps, config: {damping: 12, stiffness: 200}});
      const size = tx.size ?? 96;
      const light = tx.color === '#ffffff' || tx.color === '#ffe14a';
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: (tx.y ?? 380) - size * 0.6,
            width: '100%',
            textAlign: 'center',
            fontFamily: 'Arial Black, sans-serif',
            fontSize: size,
            fontWeight: 900,
            color: tx.color ?? '#1b1b2f',
            WebkitTextStroke: `${size > 50 ? 14 : 6}px ${light ? '#1b1b2f' : '#ffffff'}`,
            paintOrder: 'stroke fill',
            transform: `scale(${p}) rotate(${(1 - p) * -8}deg)`,
          }}
        >
          {tx.text}
        </div>
      );
    })}
  </>
);
