import {z} from 'zod';
import {ENTERS, GESTURES, LOOPS, MOODS, TRANSITIONS} from '../src/engine/motion';
import type {PackCatalog} from '../src/engine/pack';

const names = (r: Record<string, string>) => {
  const keys = Object.keys(r);
  if (keys.length === 0) throw new Error('Pack catalog has an empty asset list');
  return keys as [string, ...string[]];
};

// Built per pack, so the model can only pick assets and backgrounds the project's pack draws.
// Flat element shape: structured outputs handle this more reliably than a discriminated union.
// Fields that do not apply to a given `type` are null.
export const planSchema = (catalog: PackCatalog) => {
  const ElementSchema = z.object({
    type: z.enum(['character', 'prop', 'text']),
    mood: z.enum(MOODS).nullable(),
    gesture: z.enum(GESTURES).nullable(),
    gestureAtWord: z.number().nullable(),
    asset: z.enum(names(catalog.props)).nullable(),
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

  const SceneSchema = z.object({
    background: z.enum(names(catalog.backgrounds)),
    transition: z.enum(TRANSITIONS),
    narration: z.string(),
    punchWords: z.array(z.number()),
    elements: z.array(ElementSchema),
  });

  return z.object({
    title: z.string(),
    scenes: z.array(SceneSchema),
  });
};

export type StoryPlan = z.infer<ReturnType<typeof planSchema>>;
