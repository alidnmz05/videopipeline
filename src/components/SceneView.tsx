import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene, SceneElement} from '../types';
import {enterAnim, exitAnim, loopAnim} from '../anim';
import {Background} from '../assets/Background';
import {Character} from '../assets/Character';
import {Prop} from '../assets/Props';
import {Captions} from './Captions';

const TRANSITION_FRAMES = 8;

const isLight = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

const Element: React.FC<{el: SceneElement; canvasW: number; vertical: boolean}> = ({el, canvasW, vertical}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const out = exitAnim(frame, fps, el.exitAt === undefined ? undefined : Math.round(el.exitAt * fps));
  if (out.gone) return null;
  const e = enterAnim(el.enter ?? 'pop', frame, fps, Math.round(el.at * fps));
  const l = loopAnim(el.loop, frame, fps);
  const sc = (el.scale ?? 1) * e.s * l.s * out.s;
  return (
    <g transform={`translate(${el.x + e.tx} ${el.y + e.ty + l.ty}) rotate(${l.rot + e.rot}) scale(${sc})`} opacity={e.opacity * out.opacity}>
      {el.type === 'character' && (
        <Character
          mood={el.mood}
          talking={el.talking}
          color={el.color}
          gesture={el.gesture}
          gestureT={el.gesture ? t - (el.gestureAt ?? el.at) : -1}
          flip={(el.facing ?? (el.x > canvasW / 2 ? 'left' : 'right')) === 'left'}
        />
      )}
      {el.type === 'prop' && <Prop asset={el.asset} draw={e.draw} t={t} />}
      {el.type === 'text' && (
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={el.size ?? (vertical ? 96 : 90)}
          fontWeight={900}
          fill={el.color ?? '#1b1b2f'}
          stroke={isLight(el.color ?? '#1b1b2f') ? '#1b1b2f' : '#fff'}
          strokeWidth={12}
          paintOrder="stroke"
          fontFamily="Arial Black, sans-serif"
        >
          {el.text}
        </text>
      )}
    </g>
  );
};

export const SceneView: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const t = frame / fps;
  const vertical = H > W;

  // Camera: slow drift across the scene plus a punch-in with a short shake on each punch.
  const cam = scene.camera ?? {from: 1, to: 1.06};
  let zoom = interpolate(frame, [0, scene.duration * fps], [cam.from, cam.to], {extrapolateRight: 'clamp'});
  let sx = 0;
  let sy = 0;
  for (const pt of scene.punches ?? []) {
    const d = t - pt;
    if (d < 0 || d > 1) continue;
    zoom += 0.1 * Math.exp(-d * 5) * Math.min(1, d * 25);
    const amp = 16 * Math.exp(-d * 12);
    sx += Math.sin(d * 95) * amp;
    sy += Math.cos(d * 83) * amp;
  }
  const ox = (cam.originX ?? 0.5) * W;
  const oy = (cam.originY ?? 0.45) * H;

  // Entrance transition: the incoming scene moves in fast with motion blur.
  const k = 1 - Easing.out(Easing.cubic)(Math.min(1, frame / TRANSITION_FRAMES));
  let tr = '';
  let blur = 0;
  let opacity = 1;
  switch (scene.transition ?? 'cut') {
    case 'slide': tr = `translateX(${k * W}px)`; blur = k * 14; break;
    case 'whip': tr = `translateY(${-k * H * 0.5}px) rotate(${-k * 8}deg)`; blur = k * 18; break;
    case 'zoom': tr = `scale(${1 + k * 0.5})`; blur = k * 10; opacity = 0.3 + 0.7 * (1 - k); break;
  }

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{transform: tr || undefined, filter: blur > 0.5 ? `blur(${blur}px)` : undefined, opacity}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <g transform={`translate(${sx} ${sy}) translate(${ox} ${oy}) scale(${zoom}) translate(${-ox} ${-oy})`}>
            <Background kind={scene.background} w={W} h={H} t={t} />
            {scene.elements.map((el, i) => <Element key={i} el={el} canvasW={W} vertical={vertical} />)}
          </g>
        </svg>
      </AbsoluteFill>
      <Captions words={scene.words} vertical={vertical} />
    </AbsoluteFill>
  );
};
