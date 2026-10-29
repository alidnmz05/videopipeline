import type {PackCatalog} from '../engine/pack';
import {catalog as flatBasic} from './flat-basic/catalog';

// Data-only view of the packs, safe to import from Node scripts (no React components).
// Adding a pack: register its catalog here and its components in registry.ts.
export const CATALOGS: Record<string, PackCatalog> = {
  [flatBasic.id]: flatBasic,
};

export const getCatalog = (id: string): PackCatalog => {
  const c = CATALOGS[id];
  if (!c) throw new Error(`Unknown pack "${id}". Available: ${Object.keys(CATALOGS).join(', ')}`);
  return c;
};
