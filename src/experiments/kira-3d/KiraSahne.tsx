import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import type * as THREE from 'three';
import {Captions} from '../../engine/Captions';
import type {Word} from '../../engine/types';
import {estimateWords} from '../../../scripts/timing';
import {Actors, poseCast, smooth, useRigs} from './actors';
import {TextLayer} from './overlays';
import {Apartment, ApartmentLights} from './sets/Apartment';
import type {ActorCue, Shot, TextCue} from './script';

// 10-second set test: the opening two lines played inside a real 3D living room
// instead of 3D characters over a 2D backdrop. Shots cut hard, like a filmed scene.

type SetBeat = {text: string; shot: Shot; actors: ActorCue[]; texts?: TextCue[]; emph: number[]; door?: {open: number; word?: number}};

// Tenant on the rug, landlord stopping just inside the front door.
const TENANT: [number, number] = [-0.25, 0.5];
const LANDLORD: [number, number] = [0.85, -1.15];
const face = (from: [number, number], to: [number, number]) => Math.atan2(to[0] - from[0], to[1] - from[1]);

const BEATS: SetBeat[] = [
  {
    // Over the tenant's shoulder: the door swings open and the landlord walks in from the hallway.
    text: 'Ev sahibin kapıda: Oğlum evleniyor, evi boşalt!',
    shot: {pos: [-1.2, 1.7, 3.4], look: [0.75, 1.3, -1.15], fov: 32},
    emph: [6],
    door: {open: 1, word: 0},
    actors: [
      {who: 'kiraci', at: TENANT, rot: face(TENANT, LANDLORD), shockFrom: 5},
      {who: 'evsahibi', at: LANDLORD, rot: face(LANDLORD, TENANT), from: [0.9, -3.1], walkWord: 1, walkDur: 1.3, talkFrom: 3, moves: [{clip: 'agree', word: 6}]},
    ],
    texts: [{text: 'EVİ BOŞALT!', word: 5, color: '#ffe14a', size: 110}],
  },
  {
    // The tenant turns to us; the camera sits so the landlord stays visible in the doorway behind them.
    text: 'Sakin ol. Bu cümle tek başına seni evden çıkaramaz.',
    shot: {pos: [-1.6, 1.65, 3.3], look: [-0.05, 1.47, -0.2], fov: 30},
    emph: [8],
    door: {open: 1},
    actors: [
      {who: 'kiraci', at: TENANT, rot: face(TENANT, [-1.6, 3.3]), moves: [{clip: 'headShake', word: 6}]},
      {who: 'evsahibi', at: LANDLORD, rot: face(LANDLORD, TENANT)},
    ],
    texts: [{text: 'PANİK YOK', word: 0}],
  },
];

const BEAT_GAP = 0.2;
const timeline = (() => {
  let offset = 0;
  const beats = BEATS.map((b) => {
    const {words, end} = estimateWords(b.text);
    const local: Word[] = words.map((w, i) => (b.emph.includes(i) ? {...w, emph: true} : w));
    const captionWords = local.map((w) => ({...w, start: w.start + offset, end: w.end + offset}));
    const beat = {...b, start: offset, duration: end + BEAT_GAP, words: local, captionWords};
    offset += beat.duration;
    return beat;
  });
  return {beats, duration: offset + 0.3};
})();
type TimedBeat = (typeof timeline.beats)[number];

export const KIRA_SAHNE_SECONDS = timeline.duration;

const beatAt = (t: number) => {
  let k = 0;
  while (k + 1 < timeline.beats.length && t >= timeline.beats[k + 1].start) k++;
  return timeline.beats[k];
};
const wordAt = (b: TimedBeat, i: number) => b.words[Math.min(Math.max(i, 0), b.words.length - 1)].start;

const doorOpenAt = (beat: TimedBeat, tb: number) => {
  if (!beat.door) return 0;
  if (beat.door.word === undefined) return beat.door.open;
  return beat.door.open * smooth((tb - wordAt(beat, beat.door.word)) / 0.7);
};

const CameraRig: React.FC<{beat: TimedBeat; tb: number}> = ({beat, tb}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const {pos, look, fov: baseFov = 32} = beat.shot;
  const push = 1 - 0.06 * smooth(tb / beat.duration);
  let fov = baseFov;
  let sx = 0;
  let sy = 0;
  for (const w of beat.words) {
    if (!w.emph) continue;
    const d = tb - w.start;
    if (d < 0 || d > 1) continue;
    fov -= 3 * Math.exp(-d * 5) * Math.min(1, d * 25);
    const amp = 0.02 * Math.exp(-d * 12);
    sx += Math.sin(d * 95) * amp;
    sy += Math.cos(d * 83) * amp;
  }
  camera.position.set(look[0] + (pos[0] - look[0]) * push + sx, look[1] + (pos[1] - look[1]) * push + sy, look[2] + (pos[2] - look[2]) * push);
  camera.lookAt(look[0], look[1], look[2]);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  return null;
};

export const KiraSahne: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const beat = beatAt(t);
  const tb = t - beat.start;
  const at = (i: number) => wordAt(beat, i);

  const rigs = useRigs();
  if (rigs) poseCast(rigs, beat.actors, tb, at, beat.start);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* Mounted only once the rigs exist: ThreeCanvas draws on frame changes, so objects added
          after its first draw would not appear in a single-frame render. */}
      {rigs && (
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 32, position: [0, 1.5, 4]}} gl={{antialias: true}}>
          <color attach="background" args={['#bfe6ff']} />
          <CameraRig beat={beat} tb={tb} />
          <ApartmentLights />
          <Apartment doorOpen={doorOpenAt(beat, tb)} />
          <Actors rigs={rigs} />
        </ThreeCanvas>
      )}
      <TextLayer texts={beat.texts ?? []} tb={tb} fps={fps} wordAt={at} />
      <Captions words={beat.captionWords} vertical />
    </AbsoluteFill>
  );
};
