import {z} from 'zod';
import {BACKGROUNDS, ENTERS, GESTURES, LOOPS, MOODS, PROP_ASSETS, TRANSITIONS} from '../src/catalog';

// Flat element shape: structured outputs handle this more reliably than a discriminated union.
// Fields that do not apply to a given `type` are null.
export const ElementSchema = z.object({
  type: z.enum(['character', 'prop', 'text']),
  mood: z.enum(MOODS).nullable(),
  gesture: z.enum(GESTURES).nullable(),
  gestureAtWord: z.number().nullable(),
  asset: z.enum(PROP_ASSETS).nullable(),
  text: z.string().nullable(),
  size: z.number().nullable(),
  color: z.string().nullable(),
  talking: z.boolean().nullable(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  atWord: z.number(),
  exitWord: z.number().nullable(),
  enter: z.enum(ENTERS),
  loop: z.enum(LOOPS),
});

export const SceneSchema = z.object({
  background: z.enum(BACKGROUNDS),
  transition: z.enum(TRANSITIONS),
  narration: z.string(),
  punchWords: z.array(z.number()),
  elements: z.array(ElementSchema),
});

export const StoryPlanSchema = z.object({
  title: z.string(),
  scenes: z.array(SceneSchema),
});

export type StoryPlan = z.infer<typeof StoryPlanSchema>;
