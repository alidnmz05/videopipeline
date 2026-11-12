import React from 'react';

// The tenant's living room, built from primitives in a flat explainer palette.
// Back wall at z = -2 with a window (x -1.55..-0.45) and the front door (x 0.45..1.35);
// a hallway lies behind the door. Units are meters; the room opens toward +z (the camera).

const WALL = '#f1e3c6';
const WALL_SIDE = '#e6d2ac';
const TRIM = '#ffffff';
const FLOOR = '#c99b6d';
const SEAM = '#b5865a';

const WALL_Z = -2;
const WALL_T = 0.1;
const H = 2.8;
const DOOR = {x0: 0.45, x1: 1.35, top: 2.1};
const WIN = {x0: -1.55, x1: -0.45, y0: 0.9, y1: 2.1};

const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; c: string; shadow?: boolean; emissive?: string}> = ({p, s, c, shadow = true, emissive}) => (
  <mesh position={p} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={0.85} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.6 : 0} />
  </mesh>
);

// A wall slab spanning [x0,x1] x [y0,y1] on the back wall plane.
const WallPart: React.FC<{x0: number; x1: number; y0: number; y1: number}> = ({x0, x1, y0, y1}) => (
  <Box p={[(x0 + x1) / 2, (y0 + y1) / 2, WALL_Z]} s={[x1 - x0, y1 - y0, WALL_T]} c={WALL} />
);

const BackWall: React.FC = () => (
  <group>
    <WallPart x0={-3} x1={WIN.x0} y0={0} y1={H} />
    <WallPart x0={WIN.x0} x1={WIN.x1} y0={0} y1={WIN.y0} />
    <WallPart x0={WIN.x0} x1={WIN.x1} y0={WIN.y1} y1={H} />
    <WallPart x0={WIN.x1} x1={DOOR.x0} y0={0} y1={H} />
    <WallPart x0={DOOR.x0} x1={DOOR.x1} y0={DOOR.top} y1={H} />
    <WallPart x0={DOOR.x1} x1={3} y0={0} y1={H} />
    {/* baseboards */}
    <Box p={[(-3 + DOOR.x0) / 2, 0.06, WALL_Z + 0.06]} s={[DOOR.x0 + 3, 0.12, 0.03]} c={TRIM} />
    <Box p={[(DOOR.x1 + 3) / 2, 0.06, WALL_Z + 0.06]} s={[3 - DOOR.x1, 0.12, 0.03]} c={TRIM} />
  </group>
);

const Window: React.FC = () => {
  const cx = (WIN.x0 + WIN.x1) / 2;
  const cy = (WIN.y0 + WIN.y1) / 2;
  const w = WIN.x1 - WIN.x0;
  const h = WIN.y1 - WIN.y0;
  return (
    <group>
      {/* frame */}
      <Box p={[cx, WIN.y0, WALL_Z + 0.06]} s={[w + 0.1, 0.07, 0.14]} c={TRIM} />
      <Box p={[cx, WIN.y1, WALL_Z + 0.06]} s={[w + 0.1, 0.07, 0.14]} c={TRIM} />
      <Box p={[WIN.x0, cy, WALL_Z + 0.06]} s={[0.07, h, 0.14]} c={TRIM} />
      <Box p={[WIN.x1, cy, WALL_Z + 0.06]} s={[0.07, h, 0.14]} c={TRIM} />
      <Box p={[cx, cy, WALL_Z + 0.02]} s={[0.04, h, 0.06]} c={TRIM} shadow={false} />
      <Box p={[cx, cy, WALL_Z + 0.02]} s={[w, 0.04, 0.06]} c={TRIM} shadow={false} />
      {/* curtains */}
      <Box p={[WIN.x0 - 0.12, cy + 0.15, WALL_Z + 0.12]} s={[0.22, h + 0.5, 0.06]} c="#2a9d8f" />
      <Box p={[WIN.x1 + 0.12, cy + 0.15, WALL_Z + 0.12]} s={[0.22, h + 0.5, 0.06]} c="#2a9d8f" />
      {/* the view outside: sky and a few buildings */}
      <mesh position={[cx, cy, WALL_Z - 1.5]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial color="#bfe6ff" />
      </mesh>
      <Box p={[cx - 0.6, 0.9, WALL_Z - 1.3]} s={[0.6, 1.9, 0.2]} c="#9fb4c8" shadow={false} />
      <Box p={[cx + 0.3, 0.7, WALL_Z - 1.35]} s={[0.7, 1.6, 0.2]} c="#b7c7d6" shadow={false} />
    </group>
  );
};

// The door hinges on its right jamb and swings into the room as `open` goes 0 -> 1.
const Door: React.FC<{open: number}> = ({open}) => {
  const w = DOOR.x1 - DOOR.x0;
  return (
    <group>
      <Box p={[DOOR.x0 - 0.04, DOOR.top / 2, WALL_Z + 0.04]} s={[0.08, DOOR.top + 0.08, 0.16]} c={TRIM} />
      <Box p={[DOOR.x1 + 0.04, DOOR.top / 2, WALL_Z + 0.04]} s={[0.08, DOOR.top + 0.08, 0.16]} c={TRIM} />
      <Box p={[(DOOR.x0 + DOOR.x1) / 2, DOOR.top + 0.04, WALL_Z + 0.04]} s={[w + 0.16, 0.08, 0.16]} c={TRIM} />
      <group position={[DOOR.x1 - 0.02, 0, WALL_Z + 0.02]} rotation={[0, open * 1.7, 0]}>
        <Box p={[-w / 2, DOOR.top / 2, 0]} s={[w - 0.04, DOOR.top - 0.02, 0.05]} c="#8d5b3a" />
        <Box p={[-w / 2, DOOR.top * 0.72, 0.03]} s={[w - 0.3, 0.6, 0.01]} c="#7a4d30" shadow={false} />
        <Box p={[-w / 2, DOOR.top * 0.32, 0.03]} s={[w - 0.3, 0.6, 0.01]} c="#7a4d30" shadow={false} />
        <mesh position={[-w + 0.12, 1.0, 0.06]} castShadow>
          <sphereGeometry args={[0.035, 16, 12]} />
          <meshStandardMaterial color="#e9c46a" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

// Darker, cooler corridor behind the front door, so the doorway reads as "outside the flat".
const Hallway: React.FC = () => (
  <group>
    <Box p={[0.9, 1.4, -3.6]} s={[3, 2.8, 0.1]} c="#7c8aa5" />
    <Box p={[-0.3, 1.4, -2.8]} s={[0.1, 2.8, 1.6]} c="#8d9ab3" />
    <Box p={[2.1, 1.4, -2.8]} s={[0.1, 2.8, 1.6]} c="#8d9ab3" />
    <Box p={[0.9, -0.01, -2.8]} s={[2.4, 0.02, 1.6]} c="#6b6f7a" />
    <Box p={[1.4, 1.5, -3.54]} s={[0.4, 0.5, 0.02]} c="#c9d2e3" shadow={false} />
  </group>
);

const Sofa: React.FC = () => (
  <group position={[-1.05, 0, -1.55]}>
    <Box p={[0, 0.23, 0]} s={[1.8, 0.4, 0.8]} c="#3d5a80" />
    <Box p={[0, 0.65, -0.32]} s={[1.8, 0.5, 0.18]} c="#3d5a80" />
    <Box p={[-0.95, 0.4, 0]} s={[0.16, 0.5, 0.8]} c="#34506f" />
    <Box p={[0.95, 0.4, 0]} s={[0.16, 0.5, 0.8]} c="#34506f" />
    <Box p={[-0.45, 0.5, 0.05]} s={[0.8, 0.14, 0.62]} c="#4d6d96" />
    <Box p={[0.45, 0.5, 0.05]} s={[0.8, 0.14, 0.62]} c="#4d6d96" />
    <Box p={[-0.55, 0.72, -0.18]} s={[0.36, 0.32, 0.12]} c="#ffd166" />
  </group>
);

const Plant: React.FC = () => (
  <group position={[1.9, 0, -1.6]}>
    <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.2, 0.15, 0.44, 24]} />
      <meshStandardMaterial color="#f2f2f2" roughness={0.6} />
    </mesh>
    {[
      [0, 0.75, 0, 0.28],
      [-0.15, 0.95, 0.05, 0.2],
      [0.14, 1.0, -0.04, 0.22],
      [0.02, 1.2, 0.02, 0.18],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow>
        <sphereGeometry args={[r, 18, 14]} />
        <meshStandardMaterial color={i % 2 ? '#2f7d4f' : '#3a8d5c'} roughness={0.8} />
      </mesh>
    ))}
  </group>
);

const Pictures: React.FC = () => (
  <group>
    <Box p={[0, 1.65, WALL_Z + 0.07]} s={[0.46, 0.6, 0.03]} c="#2b2b2b" />
    <Box p={[0, 1.65, WALL_Z + 0.09]} s={[0.38, 0.52, 0.01]} c="#e9c46a" shadow={false} />
    <mesh position={[0, 1.72, WALL_Z + 0.1]}>
      <circleGeometry args={[0.08, 24]} />
      <meshBasicMaterial color="#e76f51" />
    </mesh>
    <Box p={[-2.35, 1.6, WALL_Z + 0.07]} s={[0.5, 0.4, 0.03]} c="#2b2b2b" />
    <Box p={[-2.35, 1.6, WALL_Z + 0.09]} s={[0.42, 0.32, 0.01]} c="#8ecae6" shadow={false} />
  </group>
);

const FloorLamp: React.FC = () => (
  <group position={[-2.25, 0, -1.55]}>
    <Box p={[0, 0.02, 0]} s={[0.3, 0.04, 0.3]} c="#2b2b2b" />
    <Box p={[0, 0.8, 0]} s={[0.04, 1.6, 0.04]} c="#2b2b2b" />
    <mesh position={[0, 1.68, 0]}>
      <cylinderGeometry args={[0.16, 0.25, 0.3, 24, 1, true]} />
      <meshStandardMaterial color="#fff1c9" emissive="#ffd98a" emissiveIntensity={0.8} side={2} />
    </mesh>
  </group>
);

const Floor: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color={FLOOR} roughness={0.9} />
    </mesh>
    {Array.from({length: 24}).map((_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-3 + i * 0.25, 0.001, 0]} receiveShadow>
        <planeGeometry args={[0.012, 8]} />
        <meshStandardMaterial color={SEAM} />
      </mesh>
    ))}
    {/* rug */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.25, 0.004, 0.35]} receiveShadow>
      <circleGeometry args={[1.05, 48]} />
      <meshStandardMaterial color="#e76f51" roughness={1} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.25, 0.006, 0.35]} receiveShadow>
      <ringGeometry args={[0.7, 0.82, 48]} />
      <meshStandardMaterial color="#f4a261" roughness={1} />
    </mesh>
  </group>
);

export const Apartment: React.FC<{doorOpen: number}> = ({doorOpen}) => (
  <group>
    <Floor />
    <BackWall />
    <Box p={[-3, H / 2, 0]} s={[0.1, H, 4]} c={WALL_SIDE} />
    <Window />
    <Door open={doorOpen} />
    <Hallway />
    <Sofa />
    <Plant />
    <Pictures />
    <FloorLamp />
  </group>
);

// Interior lighting: sun through the window (its shadow cut by the wall leaves a light patch on the
// floor), a soft sky fill, and a fill from the camera side so faces are never in full shadow.
export const ApartmentLights: React.FC = () => (
  <>
    <hemisphereLight args={['#fff4e0', '#8a6a4a', 1.1]} />
    <directionalLight
      position={[-3.2, 4.2, -5]}
      intensity={2.4}
      color="#fff1d6"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-4}
      shadow-camera-right={4}
      shadow-camera-top={4}
      shadow-camera-bottom={-4}
      shadow-camera-far={20}
      shadow-bias={-0.0005}
    />
    <directionalLight position={[2, 3, 6]} intensity={1.1} />
    <pointLight position={[0.9, 2.4, -2.9]} intensity={3} distance={4} color="#ffd9a0" />
  </>
);
