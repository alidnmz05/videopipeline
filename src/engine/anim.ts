import {interpolate, spring} from 'remotion';
import type {AnimName, LoopName} from './types';

type Out = {opacity: number; tx: number; ty: number; s: number; rot: number; draw: number};

const HIDDEN: Out = {opacity: 0, tx: 0, ty: 0, s: 1, rot: 0, draw: 0};
const SHOWN: Out = {opacity: 1, tx: 0, ty: 0, s: 1, rot: 0, draw: 1};

export const enterAnim = (name: AnimName | undefined, frame: number, fps: number, atFrame: number): Out => {
  const f = frame - atFrame;
  if (f < 0) return HIDDEN;
  const p = spring({frame: f, fps, config: {damping: 12, stiffness: 170}});
  const lin = Math.min(1, f / (fps * 0.2));
  switch (name) {
    case 'pop': return {...SHOWN, opacity: Math.min(1, p * 2), s: p, rot: (1 - p) * -20};
    case 'slideLeft': return {...SHOWN, opacity: lin, tx: (1 - p) * -500};
    case 'slideRight': return {...SHOWN, opacity: lin, tx: (1 - p) * 500};
    case 'slideUp': return {...SHOWN, opacity: lin, ty: (1 - p) * 600};
    case 'drop': return {...SHOWN, opacity: lin, ty: (1 - p) * -700};
    case 'fadeUp': return {...SHOWN, opacity: lin, ty: (1 - p) * 80};
    case 'draw': return {...SHOWN, draw: interpolate(f, [0, fps * 0.8], [0, 1], {extrapolateRight: 'clamp'})};
    default: return SHOWN;
  }
};

// Quick overshoot-then-shrink pop-out.
export const exitAnim = (frame: number, fps: number, exitFrame: number | undefined) => {
  if (exitFrame === undefined || frame < exitFrame) return {opacity: 1, s: 1, gone: false};
  const p = Math.min(1, (frame - exitFrame) / (fps * 0.18));
  return {opacity: 1 - p, s: 1 - p * p + 0.15 * Math.sin(p * Math.PI), gone: p >= 1};
};

export const loopAnim = (name: LoopName | undefined, frame: number, fps: number) => {
  const t = frame / fps;
  switch (name) {
    case 'float': return {ty: Math.sin(t * 2.2) * 12, rot: 0, s: 1};
    case 'wiggle': return {ty: 0, rot: Math.sin(t * 6) * 4, s: 1};
    case 'pulse': return {ty: 0, rot: 0, s: 1 + Math.sin(t * 5) * 0.05};
    case 'bounce': return {ty: -Math.abs(Math.sin(t * 5)) * 18, rot: 0, s: 1};
    default: return {ty: 0, rot: 0, s: 1};
  }
};
