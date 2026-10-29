// Single source of truth for everything the renderer can draw.
// Both the render types (src/types.ts) and the LLM schema (scripts/schema.ts) derive from these.

export const BACKGROUNDS = ['office', 'sky', 'night', 'bedroom', 'studio'] as const;
export const MOODS = ['happy', 'surprised', 'sad'] as const;
export const GESTURES = ['idle', 'wave', 'point', 'shrug', 'cheer', 'facepalm'] as const;
export const PROP_ASSETS = ['coin', 'chart', 'bulb', 'warning', 'phone', 'clock', 'moon', 'zzz', 'arrowUp', 'check', 'cross', 'heart', 'brain', 'robot', 'briefcase'] as const;
export const ENTERS = ['pop', 'slideLeft', 'slideRight', 'slideUp', 'drop', 'fadeUp', 'draw'] as const;
export const LOOPS = ['float', 'wiggle', 'pulse', 'bounce', 'none'] as const;
export const TRANSITIONS = ['cut', 'slide', 'whip', 'zoom'] as const;

export type Background = (typeof BACKGROUNDS)[number];
export type Mood = (typeof MOODS)[number];
export type Gesture = (typeof GESTURES)[number];
export type PropAsset = (typeof PROP_ASSETS)[number];
export type AnimName = (typeof ENTERS)[number] | 'none';
export type LoopName = (typeof LOOPS)[number];
export type Transition = (typeof TRANSITIONS)[number];
