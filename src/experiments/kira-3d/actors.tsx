import React, {useEffect, useMemo, useState} from 'react';
import {cancelRender, continueRender, delayRender, Easing, staticFile} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {retargetClips} from './retarget';
import type {ActorCue, Move, Who} from './script';

// Shared 3D cast for the kira experiments: one Ready Player Me avatar, cloned per character,
// animated with Xbot (Mixamo) clips retargeted onto it.

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const smooth = (x: number) => Easing.inOut(Easing.cubic)(clamp(x, 0, 1));

export const useGltf = (url: string) => {
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

type Look = {top: string; bottom: string; shoes: string; beard: boolean; hat: boolean; scale: number};
const LOOKS: Record<Who, Look> = {
  kiraci: {top: '#4f8df5', bottom: '#2f3550', shoes: '#f2f2f2', beard: false, hat: false, scale: 1},
  evsahibi: {top: '#c0392b', bottom: '#2b2b2b', shoes: '#3a2416', beard: true, hat: true, scale: 1.03},
  oglu: {top: '#2fa84f', bottom: '#2f3550', shoes: '#f2f2f2', beard: false, hat: false, scale: 0.96},
};

const ADDITIVE: Move[] = ['agree', 'headShake', 'sad_pose', 'sneak_pose'];
const POSES: Move[] = ['sad_pose', 'sneak_pose']; // held poses rather than one-shot gestures

export type Rig = {
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Record<string, THREE.AnimationAction>;
  mouths: {mesh: THREE.Mesh; open: number; smile: number}[];
};
export type Rigs = Record<Who, Rig>;

const makeRig = (template: THREE.Object3D, clips: THREE.AnimationClip[], look: Look): Rig => {
  const body = cloneSkinned(template);
  const mouths: Rig['mouths'] = [];
  body.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.frustumCulled = false; // skinned bounds go stale once bones move
    const mat = (m.material as THREE.MeshStandardMaterial).clone();
    m.material = mat;
    // Flat outfit colours read as "explainer" style and tell the characters apart.
    if (mat.name === 'Wolf3D_Outfit_Top') (mat.map = null), mat.color.set(look.top);
    if (mat.name === 'Wolf3D_Outfit_Bottom') (mat.map = null), mat.color.set(look.bottom);
    if (mat.name === 'Wolf3D_Outfit_Footwear') (mat.map = null), mat.color.set(look.shoes);
    if (mat.name === 'Wolf3D_Beard') m.visible = look.beard;
    if (mat.name === 'Wolf3D_Headwear') m.visible = look.hat;
    const dict = m.morphTargetDictionary;
    if (dict && 'mouthOpen' in dict) mouths.push({mesh: m, open: dict.mouthOpen, smile: dict.mouthSmile});
  });
  const root = new THREE.Group();
  root.add(body);
  root.scale.setScalar(look.scale);

  const mixer = new THREE.AnimationMixer(body);
  const actions: Rig['actions'] = {};
  for (const src of clips) {
    let clip = src.clone();
    if (ADDITIVE.includes(clip.name as Move)) {
      THREE.AnimationUtils.makeClipAdditive(clip);
      if (POSES.includes(clip.name as Move)) clip = THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30);
    }
    const a = mixer.clipAction(clip);
    a.play();
    a.setEffectiveWeight(0);
    actions[clip.name] = a;
  }
  return {root, mixer, actions, mouths};
};

// Loads both models and builds every character once. Returns null until ready.
export const useRigs = (): Rigs | null => {
  const avatar = useGltf(staticFile('models/rpm-avatar/avatar.glb'));
  const xbot = useGltf(staticFile('models/xbot/Xbot.glb'));
  return useMemo(() => {
    if (!avatar || !xbot) return null;
    const clips = retargetClips(avatar.scene, xbot.scene, xbot.animations);
    return {
      kiraci: makeRig(avatar.scene, clips, LOOKS.kiraci),
      evsahibi: makeRig(avatar.scene, clips, LOOKS.evsahibi),
      oglu: makeRig(avatar.scene, clips, LOOKS.oglu),
    };
  }, [avatar, xbot]);
};

// Poses one character at beat-local time `tb`. `wordAt(i)` gives the beat-local start of word i;
// `phase` offsets the idle loop so consecutive shots do not restart it in sync.
export const poseActor = (rig: Rig, cue: ActorCue, tb: number, wordAt: (i: number) => number, phase = 0) => {
  const {actions, root} = rig;
  for (const a of Object.values(actions)) a.setEffectiveWeight(0);

  // Walk-in: move along a straight line, facing the direction of travel, then turn to `rot`.
  let x = cue.at[0];
  let z = cue.at[1];
  let rot = cue.rot;
  let walkW = 0;
  if (cue.from) {
    const t0 = wordAt(cue.walkWord ?? 0);
    const dur = cue.walkDur ?? 1;
    const p = clamp((tb - t0) / dur, 0, 1);
    x = cue.from[0] + (cue.at[0] - cue.from[0]) * p;
    z = cue.from[1] + (cue.at[1] - cue.from[1]) * p;
    const heading = Math.atan2(cue.at[0] - cue.from[0], cue.at[1] - cue.from[1]);
    const settle = smooth((tb - (t0 + dur)) / 0.35);
    rot = heading + (cue.rot - heading) * settle;
    walkW = tb < t0 ? 0 : Math.max(0, Math.min(1, (tb - t0) / 0.15, (t0 + dur - tb) / 0.2));
    actions.walk.time = Math.max(0, tb - t0) % actions.walk.getClip().duration;
  }
  root.position.set(x, 0, z);
  root.rotation.set(0, rot, 0);

  const idle = actions.idle;
  idle.time = (tb + phase) % idle.getClip().duration;
  idle.setEffectiveWeight(1 - walkW);
  actions.walk.setEffectiveWeight(walkW);

  for (const m of cue.moves ?? []) {
    const a = actions[m.clip];
    const at = wordAt(m.word);
    const dur = a.getClip().duration;
    if (tb < at) continue;
    if (POSES.includes(m.clip)) {
      a.time = 0;
      a.setEffectiveWeight(smooth((tb - at) / 0.4));
    } else if (tb <= at + dur) {
      a.time = tb - at;
      a.setEffectiveWeight(Math.min(1, (tb - at) / 0.15, (at + dur - tb) / 0.25));
    }
  }
  rig.mixer.update(0);

  let open = 0;
  if (cue.talkFrom !== undefined && tb >= wordAt(cue.talkFrom)) open = 0.15 + 0.55 * Math.abs(Math.sin(tb * 13));
  if (cue.shockFrom !== undefined && tb >= wordAt(cue.shockFrom)) open = Math.max(open, 0.45 * smooth((tb - wordAt(cue.shockFrom)) / 0.2));
  for (const {mesh, open: oi} of rig.mouths) mesh.morphTargetInfluences![oi] = open;
};

// Posed outside the R3F tree: errors there are swallowed by the canvas, here they fail the render loudly.
export const poseCast = (rigs: Rigs, cues: ActorCue[], tb: number, wordAt: (i: number) => number, phase = 0) => {
  for (const who of Object.keys(rigs) as Who[]) rigs[who].root.visible = false;
  for (const cue of cues) {
    const rig = rigs[cue.who];
    rig.root.visible = true;
    poseActor(rig, cue, tb, wordAt, phase);
  }
};

export const Actors: React.FC<{rigs: Rigs}> = ({rigs}) => (
  <>
    {(Object.keys(rigs) as Who[]).map((who) => (
      <primitive key={who} object={rigs[who].root} />
    ))}
  </>
);
