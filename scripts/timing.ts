import type {Word} from '../src/types';

// Placeholder timing until real TTS + forced alignment replaces it.
// Roughly 3 words/sec for Turkish narration, with longer pauses at punctuation.
const PUNCT_PAUSE: Record<string, number> = {',': 0.15, ';': 0.2, ':': 0.2, '.': 0.35, '?': 0.35, '!': 0.35};

export const estimateWords = (narration: string, leadIn = 0.25): {words: Word[]; end: number} => {
  const words: Word[] = [];
  let t = leadIn;
  for (const raw of narration.split(/\s+/).filter(Boolean)) {
    const letters = raw.replace(/[^\p{L}\p{N}]/gu, '');
    const dur = 0.1 + 0.045 * letters.length;
    words.push({w: raw.replace(/[,.;:!?]+$/u, ''), start: round(t), end: round(t + dur)});
    t += dur + (PUNCT_PAUSE[raw.at(-1) ?? ''] ?? 0.04);
  }
  return {words, end: round(t)};
};

const round = (n: number) => Math.round(n * 100) / 100;
