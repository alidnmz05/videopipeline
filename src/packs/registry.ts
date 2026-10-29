import type {Pack} from '../engine/pack';
import {flatBasic} from './flat-basic';

// Component registry used by the renderer. Keep in sync with catalogs.ts.
export const PACKS: Record<string, Pack> = {
  [flatBasic.catalog.id]: flatBasic,
};

export const getPack = (id: string): Pack => {
  const p = PACKS[id];
  if (!p) throw new Error(`Unknown pack "${id}". Available: ${Object.keys(PACKS).join(', ')}`);
  return p;
};
