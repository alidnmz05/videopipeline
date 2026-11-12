import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Captions} from '../../engine/Captions';
import type {Word} from '../../engine/types';
import {getPack} from '../../packs/registry';
import {estimateWords} from '../../../scripts/timing';

// Experiment: a rigged 3D character inside the existing 2D engine (background, captions,
// word timing). One continuous 3D shot; the camera moves between beats instead of cutting.

type Beat = {
  text: string;
  clip: string; // one-shot animation from the GLB, layered over Idle
  clipWord: number;
  emph: number[];
  headline: string;
  prop?: 'briefcase' | 'coin';
  propWord?: number;
  face?: 'Surprised' | 'Sad' | 'Angry';
  faceWord?: number;
  cam: [number, number, number];
};

const BEATS: Beat[] = [
  {text: 'Merhaba, ben yapay zeka.', clip: 'Wave', clipWord: 0, emph: [3], headline: 'MERHABA!', cam: [0, 3.2, 25]},
  {text: 'Senin işini yapabilirim.', clip: 'ThumbsUp', clipWord: 1, emph: [1], headline: 'İŞİNİ YAPARIM', prop: 'briefcase', propWord: 1, cam: [7, 1.8, 21]},
  {text: 'Ama maaş istemem.', clip: 'No', clipWord: 2, emph: [1], headline: 'MAAŞ: 0 TL', prop: 'coin', propWord: 1, face: 'Surprised', faceWord: 1, cam: [-6, 5, 19]},
];

const BEAT_GAP = 0.25;

const timeline = (() => {
  let offset = 0;
  const words: Word[] = [];
  const beats = BEATS.map((b) => {
    const {words: w, end} = estimateWords(b.text);
    const shifted = w.map((x, i) => ({...x, start: x.start + offset, end: x.end + offset, ...(b.emph.includes(i) ? {emph: true} : {})}));
    words.push(...shifted);
    const beat = {...b, start: offset, words: shifted};
    offset += end + BEAT_GAP;
    return beat;
  });
  return {beats, words, duration: offset + 0.4};
})();

export const DENEME_3D_SECONDS = timeline.duration;

const currentBeat = (t: number) => [...timeline.beats].reverse().find((b) => t >= b.start) ?? timeline.beats[0];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const smooth = (x: number) => Easing.inOut(Easing.cubic)(clamp(x, 0, 1));

// Remotion renders frames out of order across tabs, so the GLB load has to block rendering.
const useGltf = (url: string) => {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [handle] = useState(() => delayRender(`Loading ${url}`));
  useEffect(() => {
    new GLTFLoader().load(
      url,
      (g) => {
        setGltf(g);
        continueRender(handle);
      },
      undefined,
      (err) => cancelRender(err),
    );
  }, [url, handle]);
  return gltf;
};

// Weight of a one-shot clip at time t: quick fade in, hold, fade out at its end.
const shotWeight = (at: number, dur: number, t: number) => {
  if (t < at || t > at + dur) return 0;
  return Math.min(1, (t - at) / 0.2, (at + dur - t) / 0.3);
};

const Robot: React.FC<{gltf: GLTF; t: number}> = ({gltf, t}) => {
  const rig = useMemo(() => {
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const actions: Record<string, THREE.AnimationAction> = {};
    for (const clip of gltf.animations) {
      const a = mixer.clipAction(clip);
      a.play();
      a.setEffectiveWeight(0);
      actions[clip.name] = a;
    }
    let head: THREE.Mesh | undefined;
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      if (m.morphTargetDictionary && 'Surprised' in m.morphTargetDictionary) head = m;
    });
    return {mixer, actions, head};
  }, [gltf]);

  // Pose is a pure function of t: set every action's time and weight, then apply once.
  const {mixer, actions, head} = rig;
  const shots = timeline.beats.map((b) => {
    const a = actions[b.clip];
    const dur = a.getClip().duration;
    const at = b.words[b.clipWord].start;
    return {a, at, dur, w: shotWeight(at, dur, t)};
  });
  const sum = shots.reduce((s, x) => s + x.w, 0);
  for (const a of Object.values(actions)) a.setEffectiveWeight(0);
  const idle = actions.Idle;
  idle.time = t % idle.getClip().duration;
  idle.setEffectiveWeight(Math.max(0, 1 - sum));
  for (const {a, at, dur, w} of shots) {
    if (w <= 0) continue;
    a.time = clamp(t - at, 0, dur);
    a.setEffectiveWeight(w / Math.max(1, sum));
  }
  mixer.update(0);

  if (head?.morphTargetDictionary && head.morphTargetInfluences) {
    for (const k of Object.values(head.morphTargetDictionary)) head.morphTargetInfluences[k] = 0;
    for (const b of timeline.beats) {
      if (!b.face || b.faceWord === undefined) continue;
      const at = b.words[b.faceWord].start;
      const end = b.start + (b.words.at(-1)!.end - b.start) + BEAT_GAP;
      head.morphTargetInfluences[head.morphTargetDictionary[b.face]] = Math.min(smooth((t - at) / 0.25), smooth((end - t) / 0.2));
    }
  }

  return <primitive object={gltf.scene} rotation={[0, 0.2, 0]} />;
};

const Briefcase: React.FC = () => (
  <group>
    <mesh castShadow>
      <boxGeometry args={[1.5, 1.0, 0.4]} />
      <meshStandardMaterial color="#a0612f" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.62, 0]} castShadow>
      <torusGeometry args={[0.25, 0.06, 12, 24, Math.PI]} />
      <meshStandardMaterial color="#3b3b58" />
    </mesh>
    <mesh position={[0, 0.05, 0.21]}>
      <boxGeometry args={[0.3, 0.2, 0.05]} />
      <meshStandardMaterial color="#ffcf3f" metalness={0.6} roughness={0.3} />
    </mesh>
  </group>
);

const Coin: React.FC<{spin: number}> = ({spin}) => (
  <mesh rotation={[Math.PI / 2, 0, spin]} castShadow>
    <cylinderGeometry args={[0.6, 0.6, 0.12, 48]} />
    <meshStandardMaterial color="#ffcf3f" metalness={0.7} roughness={0.25} emissive="#7a5200" emissiveIntensity={0.25} />
  </mesh>
);

const Props3D: React.FC<{t: number; fps: number}> = ({t, fps}) => (
  <>
    {timeline.beats.map((b, i) => {
      if (!b.prop || b.propWord === undefined) return null;
      const at = b.words[b.propWord].start;
      const next = timeline.beats[i + 1]?.start ?? Infinity;
      if (t < at || t >= next) return null;
      const p = spring({frame: (t - at) * fps, fps, config: {damping: 11, stiffness: 140}});
      const bob = Math.sin(t * 2.4) * 0.12;
      if (b.prop === 'coin') {
        return (
          <group key={i} position={[1.3, 6.4 + (1 - p) * 5 + bob, 0.8]} scale={0.6 + 0.4 * p}>
            <Coin spin={t * 6} />
          </group>
        );
      }
      return (
        <group key={i} position={[2.6, 5.2 + bob, 0.8]} rotation={[0.1, -0.5 + Math.sin(t * 1.5) * 0.15, 0]} scale={p * 0.9}>
          <Briefcase />
        </group>
      );
    })}
  </>
);

// Camera: glides between per-beat positions, punches in (narrower FOV + shake) on stressed words.
const CameraRig: React.FC<{t: number}> = ({t}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const {beats} = timeline;
  let k = 0;
  while (k + 1 < beats.length && t >= beats[k + 1].start) k++;
  const from = beats[Math.max(0, k - 1)].cam;
  const to = beats[k].cam;
  const blend = k === 0 ? 1 : smooth((t - beats[k].start) / 0.6);
  const pos = from.map((v, i) => v + (to[i] - v) * blend) as [number, number, number];
  // Opening dolly-in from further back.
  const intro = 1 - smooth(t / 1.2);
  pos[2] += intro * 9;

  let fov = 30;
  let shakeX = 0;
  let shakeY = 0;
  for (const w of timeline.words) {
    if (!w.emph) continue;
    const d = t - w.start;
    if (d < 0 || d > 1) continue;
    fov -= 4 * Math.exp(-d * 5) * Math.min(1, d * 25);
    const amp = 0.1 * Math.exp(-d * 12);
    shakeX += Math.sin(d * 95) * amp;
    shakeY += Math.cos(d * 83) * amp;
  }
  camera.position.set(pos[0] + shakeX, pos[1] + shakeY, pos[2]);
  camera.lookAt(0.4, 3.2, 0);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  return null;
};

const Headline: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const beat = [...timeline.beats].reverse().find((b) => t >= b.words[b.emph[0]].start);
  if (!beat) return null;
  const at = beat.words[beat.emph[0]].start;
  const p = spring({frame: (t - at) * fps, fps, config: {damping: 12, stiffness: 200}});
  return (
    <div
      style={{
        position: 'absolute',
        top: 300,
        width: '100%',
        textAlign: 'center',
        fontFamily: 'Arial Black, sans-serif',
        fontSize: 96,
        fontWeight: 900,
        color: '#1b1b2f',
        WebkitTextStroke: '14px #fff',
        paintOrder: 'stroke fill',
        transform: `scale(${p}) rotate(${(1 - p) * -10}deg)`,
      }}
    >
      {beat.headline}
    </div>
  );
};

export const Deneme3D: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const gltf = useGltf(staticFile('models/robot-expressive/RobotExpressive.glb'));
  const {Background} = getPack('flat-basic');

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute'}}>
        <Background kind="studio" w={width} h={height} t={t} />
      </svg>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 32, position: [0, 2.6, 21]}} gl={{antialias: true, alpha: true}}>
        <CameraRig t={t} />
        <hemisphereLight args={['#ffffff', '#c98a3a', 1.6]} />
        <directionalLight position={[4, 9, 7]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={8} shadow-camera-bottom={-2} />
        {/* Shadow catcher: only the shadow is drawn, landing on the 2D background. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
        {gltf && <Robot gltf={gltf} t={t} />}
        <Props3D t={t} fps={fps} />
      </ThreeCanvas>
      <Headline t={t} fps={fps} />
      {/* One beat at a time, so a caption group never reserves space for the next beat's words. */}
      <Captions words={currentBeat(t).words} vertical />
    </AbsoluteFill>
  );
};
