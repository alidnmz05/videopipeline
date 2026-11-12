import * as THREE from 'three';

// Bakes animation clips from a Mixamo-rigged source (Xbot, T-pose rest) onto a target with
// the same bone names but a different rest pose (Ready Player Me avatar, A-pose rest).
//
// For each bone: targetWorld(t) = sourceDelta(t) * align * targetRestWorld, where
// sourceDelta is the source bone's world rotation relative to its own rest, and `align`
// rotates the target's rest bone direction onto the source's, so a T-pose delta lands on
// an A-pose body correctly. Sampled once at load; playback is then plain keyframes.

const strip = (name: string) => name.replace(/^mixamorig:?/, '');

const primaryChild = (b: THREE.Object3D) => {
  const bones = b.children.filter((c) => (c as THREE.Bone).isBone);
  return bones.find((c) => /Spine|Neck|HandMiddle1/.test(c.name)) ?? bones[0];
};

const restDirection = (b: THREE.Object3D) => {
  const child = primaryChild(b);
  if (!child) return null;
  const from = b.getWorldPosition(new THREE.Vector3());
  return child.getWorldPosition(new THREE.Vector3()).sub(from).normalize();
};

type BoneInfo = {
  bone: THREE.Bone;
  restLocal: THREE.Quaternion;
  restWorld: THREE.Quaternion;
  align: THREE.Quaternion;
  src?: THREE.Bone;
  srcRestWorldInv?: THREE.Quaternion;
};

export const retargetClips = (target: THREE.Object3D, source: THREE.Object3D, clips: THREE.AnimationClip[], fps = 30) => {
  target.updateMatrixWorld(true);
  source.updateMatrixWorld(true);

  const srcBones = new Map<string, THREE.Bone>();
  source.traverse((o) => {
    if ((o as THREE.Bone).isBone) srcBones.set(strip(o.name), o as THREE.Bone);
  });

  // traverse() visits parents before children, which the world-rotation pass below relies on.
  const infos: BoneInfo[] = [];
  target.traverse((o) => {
    if (!(o as THREE.Bone).isBone) return;
    const bone = o as THREE.Bone;
    const src = srcBones.get(bone.name);
    const align = new THREE.Quaternion();
    if (src) {
      const dt = restDirection(bone);
      const ds = restDirection(src);
      if (dt && ds) align.setFromUnitVectors(dt, ds);
    }
    infos.push({
      bone,
      restLocal: bone.quaternion.clone(),
      restWorld: bone.getWorldQuaternion(new THREE.Quaternion()),
      align,
      src,
      srcRestWorldInv: src?.getWorldQuaternion(new THREE.Quaternion()).invert(),
    });
  });

  const mixer = new THREE.AnimationMixer(source);
  const out = clips.map((clip) => {
    const action = mixer.clipAction(clip);
    action.play();
    const n = Math.max(2, Math.ceil(clip.duration * fps) + 1);
    const times = new Float32Array(n);
    const values = infos.map(() => new Float32Array(n * 4));
    const world = new Map<THREE.Object3D, THREE.Quaternion>();
    const tmp = new THREE.Quaternion();

    for (let i = 0; i < n; i++) {
      const t = Math.min(clip.duration, i / fps);
      times[i] = t;
      mixer.setTime(t);
      source.updateMatrixWorld(true);
      world.clear();
      infos.forEach((info, k) => {
        const parent = info.bone.parent!;
        const parentWorld = world.get(parent) ?? parent.getWorldQuaternion(new THREE.Quaternion());
        let w: THREE.Quaternion;
        if (info.src && info.srcRestWorldInv) {
          w = info.src.getWorldQuaternion(tmp).clone().multiply(info.srcRestWorldInv).multiply(info.align).multiply(info.restWorld);
        } else {
          w = parentWorld.clone().multiply(info.restLocal);
        }
        world.set(info.bone, w);
        const local = parentWorld.clone().invert().multiply(w);
        values[k].set([local.x, local.y, local.z, local.w], i * 4);
      });
    }
    action.stop();
    mixer.uncacheAction(clip);

    const tracks = infos.map((info, k) => new THREE.QuaternionKeyframeTrack(`${info.bone.name}.quaternion`, times, values[k]));
    return new THREE.AnimationClip(clip.name, clip.duration, tracks);
  });
  mixer.uncacheRoot(source);
  return out;
};
