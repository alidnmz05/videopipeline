import type {AnimName, Gesture, LoopName, Mood, Transition} from './motion';

export type {AnimName, LoopName};

export type ElementBase = {
  x: number; // canvas px
  y: number;
  scale?: number;
  at: number; // seconds, scene-relative
  exitAt?: number; // seconds; element pops out and is removed
  enter?: AnimName;
  loop?: LoopName;
};

// `asset` and `background` are names from the story's pack catalog.
export type SceneElement =
  | (ElementBase & {type: 'character'; mood: Mood; talking?: boolean; color?: string; gesture?: Gesture; gestureAt?: number; facing?: 'left' | 'right'})
  | (ElementBase & {type: 'prop'; asset: string})
  | (ElementBase & {type: 'text'; text: string; size?: number; color?: string});

export type Word = {w: string; start: number; end: number; emph?: boolean};

export type Scene = {
  id: string;
  duration: number; // seconds
  background: string;
  transition?: Transition;
  camera?: {from: number; to: number; originX?: number; originY?: number};
  punches?: number[]; // seconds: camera punch-in + shake
  elements: SceneElement[];
  words: Word[];
};

export type Story = {
  fps: number;
  width: number;
  height: number;
  pack: string;
  scenes: Scene[];
};
