import type React from 'react';
import type {Gesture, Mood} from './motion';

// The contract every visual pack implements. The engine owns timing, camera, captions,
// transitions and enter/exit/loop motion; a pack only decides how things look.

export type PackCatalog = {
  id: string;
  // Planner notes on the character design: proportions, what `color` changes, variety tips.
  // Characters are anchored at the head center with the feet ~340px below at scale 1,
  // so the planner's layout rules hold for every pack.
  character: string;
  backgrounds: Record<string, string>; // name -> when to use it (shown to the planner)
  darkBackgrounds: readonly string[]; // headline text should be light on these
  props: Record<string, string>; // name -> meaning and hints (shown to the planner)
};

export type CharacterProps = {
  mood: Mood;
  talking?: boolean;
  color?: string;
  gesture?: Gesture;
  gestureT?: number; // seconds since the gesture started; negative = not started
  flip?: boolean;
};

export type Pack = {
  catalog: PackCatalog;
  Background: React.FC<{kind: string; w: number; h: number; t: number}>;
  Character: React.FC<CharacterProps>;
  // `t` is scene time in seconds, for props with built-in motion.
  Prop: React.FC<{asset: string; draw: number; t: number}>;
};
