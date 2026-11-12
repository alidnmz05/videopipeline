import React from 'react';
import {AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Captions} from '../../engine/Captions';
import {enterAnim, exitAnim, loopAnim} from '../../engine/anim';
import type {Word} from '../../engine/types';
import {getPack} from '../../packs/registry';
import {estimateWords} from '../../../scripts/timing';
import {Actors, poseCast, smooth, useRigs} from './actors';
import {BEATS, type Beat} from './script';

const BEAT_GAP = 0.2;
const TRANSITION_FRAMES = 7;

const timeline = (() => {
  let offset = 0;
  const beats = BEATS.map((b) => {
    const {words, end} = estimateWords(b.text);
    const local: Word[] = words.map((w, i) => (b.emph.includes(i) ? {...w, emph: true} : w));
    // Captions read the absolute frame, so they get absolute word times.
    const captionWords = local.map((w) => ({...w, start: w.start + offset, end: w.end + offset}));
    const beat = {...b, start: offset, duration: end + BEAT_GAP, words: local, captionWords};
    offset += beat.duration;
    return beat;
  });
  return {beats, duration: offset + 0.3};
})();
type TimedBeat = (typeof timeline.beats)[number];

export const KIRA_3D_SECONDS = timeline.duration;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const wordAt = (b: TimedBeat, i: number) => b.words[clamp(i, 0, b.words.length - 1)].start;

const beatAt = (t: number) => {
  let k = 0;
  while (k + 1 < timeline.beats.length && t >= timeline.beats[k + 1].start) k++;
  return timeline.beats[k];
};

// Hard cut to each beat's shot, then a slow push-in; stressed words punch in with a short shake.
const CameraRig: React.FC<{beat: TimedBeat; tb: number}> = ({beat, tb}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const {pos, look, fov: baseFov = 30} = beat.shot;
  const push = 1 - 0.05 * smooth(tb / beat.duration);
  let fov = baseFov;
  let sx = 0;
  let sy = 0;
  for (const w of beat.words) {
    if (!w.emph) continue;
    const d = tb - w.start;
    if (d < 0 || d > 1) continue;
    fov -= 3.5 * Math.exp(-d * 5) * Math.min(1, d * 25);
    const amp = 0.025 * Math.exp(-d * 12);
    sx += Math.sin(d * 95) * amp;
    sy += Math.cos(d * 83) * amp;
  }
  camera.position.set(look[0] + (pos[0] - look[0]) * push + sx, look[1] + (pos[1] - look[1]) * push + sy, look[2] + (pos[2] - look[2]) * push);
  camera.lookAt(look[0], look[1], look[2]);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  return null;
};

// ---------- 2D overlays ----------

const PropLayer: React.FC<{beat: TimedBeat; tb: number; fps: number; w: number; h: number}> = ({beat, tb, fps, w, h}) => {
  const {Prop} = getPack('flat-basic');
  const f = tb * fps;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute'}}>
      {(beat.props ?? []).map((p, i) => {
        const out = exitAnim(f, fps, p.exitWord === undefined ? undefined : Math.round(wordAt(beat, p.exitWord) * fps));
        if (out.gone) return null;
        const e = enterAnim(p.enter ?? 'pop', f, fps, Math.round(wordAt(beat, p.word) * fps));
        const l = loopAnim(p.loop, f, fps);
        const s = (p.scale ?? 1) * e.s * l.s * out.s;
        return (
          <g key={i} transform={`translate(${p.x + e.tx} ${p.y + e.ty + l.ty}) rotate(${l.rot + e.rot}) scale(${s})`} opacity={e.opacity * out.opacity}>
            <Prop asset={p.asset} draw={e.draw} t={tb} />
          </g>
        );
      })}
    </svg>
  );
};

const TextLayer: React.FC<{beat: TimedBeat; tb: number; fps: number}> = ({beat, tb, fps}) => (
  <>
    {(beat.texts ?? []).map((tx, i) => {
      const at = wordAt(beat, tx.word);
      if (tb < at) return null;
      if (tx.exitWord !== undefined && tb >= wordAt(beat, tx.exitWord)) return null;
      const p = spring({frame: (tb - at) * fps, fps, config: {damping: 12, stiffness: 200}});
      const light = tx.color === '#ffffff' || tx.color === '#ffe14a';
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: (tx.y ?? 380) - (tx.size ?? 96) * 0.6,
            width: '100%',
            textAlign: 'center',
            fontFamily: 'Arial Black, sans-serif',
            fontSize: tx.size ?? 96,
            fontWeight: 900,
            color: tx.color ?? '#1b1b2f',
            WebkitTextStroke: `${(tx.size ?? 96) > 50 ? 14 : 6}px ${light ? '#1b1b2f' : '#ffffff'}`,
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

// ---------- composition ----------

export const Kira3D: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const beat = beatAt(t);
  const tb = t - beat.start;

  const rigs = useRigs();
  if (rigs) poseCast(rigs, beat.actors, tb, (i) => wordAt(beat, i), beat.start);

  const {Background} = getPack('flat-basic');
  const k = 1 - Easing.out(Easing.cubic)(Math.min(1, (tb * fps) / TRANSITION_FRAMES));
  const tr: Record<Beat['transition'], string> = {
    cut: '',
    zoom: `scale(${1 + k * 0.35})`,
    whip: `translateY(${-k * height * 0.4}px) rotate(${-k * 6}deg)`,
    slide: `translateX(${k * width}px)`,
  };

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{transform: tr[beat.transition] || undefined, filter: k > 0.05 && beat.transition !== 'cut' ? `blur(${k * 14}px)` : undefined}}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute'}}>
          <Background kind={beat.bg} w={width} h={height} t={t} />
        </svg>
        {/* Mount the canvas only once the rigs exist: ThreeCanvas draws on frame changes, so objects added
            after its first draw would not appear in a single-frame render. */}
        {rigs && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 30, position: [0, 1.3, 6]}} gl={{antialias: true, alpha: true}}>
          <CameraRig beat={beat} tb={tb} />
          <hemisphereLight args={['#ffffff', '#b98a5a', 1.5]} />
          <directionalLight position={[2.5, 5, 4]} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-1} />
          <directionalLight position={[-3, 2, -2]} intensity={0.6} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <shadowMaterial opacity={0.28} />
          </mesh>
          <Actors rigs={rigs} />
        </ThreeCanvas>
        )}
        <PropLayer beat={beat} tb={tb} fps={fps} w={width} h={height} />
      </AbsoluteFill>
      <TextLayer beat={beat} tb={tb} fps={fps} />
      <Captions words={beat.captionWords} vertical />
    </AbsoluteFill>
  );
};
