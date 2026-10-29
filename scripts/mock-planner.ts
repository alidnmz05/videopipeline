import type {StoryPlan} from './schema';
import {CANVAS, type Format} from './lib/project';
import type {Gesture, Transition} from '../src/engine/motion';
import type {PackCatalog} from '../src/engine/pack';

type PlanScene = StoryPlan['scenes'][number];
type PlanElement = PlanScene['elements'][number];

// Offline stand-in for the LLM call: same output shape (StoryPlan), heuristic decisions.
// Used to exercise the whole pipeline without an API key. Its keyword table speaks
// flat-basic asset names; entries a pack does not have are skipped.

const MAX_WORDS = 8;
const BACKGROUNDS = ['studio', 'office', 'sky', 'bedroom'];
const TRANSITIONS: Transition[] = ['zoom', 'slide', 'whip', 'slide'];
const GESTURES: Gesture[] = ['point', 'shrug', 'wave', 'cheer'];

const PROPS: {re: RegExp; asset: NonNullable<PlanElement['asset']>; enter: PlanElement['enter']; loop: PlanElement['loop']}[] = [
  {re: /robot|yapay|zeka|makine/iu, asset: 'robot', enter: 'drop', loop: 'wiggle'},
  {re: /^iş[,.!?]*$|^işin|^işini|meslek|kariyer/iu, asset: 'briefcase', enter: 'pop', loop: 'none'},
  {re: /telefon|ekran|sosyal/iu, asset: 'phone', enter: 'pop', loop: 'wiggle'},
  {re: /para|maaş|cüzdan|lira|harcama|kahve/iu, asset: 'coin', enter: 'pop', loop: 'float'},
  {re: /saat|dakika|zaman|hafta/iu, asset: 'clock', enter: 'pop', loop: 'none'},
  {re: /gece|ay\b|uyku|uyu/iu, asset: 'moon', enter: 'drop', loop: 'float'},
  {re: /yorgun|uykusuz/iu, asset: 'zzz', enter: 'pop', loop: 'float'},
  {re: /beyin|zihin|düşün|odak/iu, asset: 'brain', enter: 'pop', loop: 'pulse'},
  {re: /büyür|birikir|artar|yüksel/iu, asset: 'arrowUp', enter: 'drop', loop: 'bounce'},
  {re: /iyi haber|fikir|çözüm|başla/iu, asset: 'bulb', enter: 'pop', loop: 'pulse'},
  {re: /şaşır|risk|tehlike|boşal|sessizce|geç/iu, asset: 'warning', enter: 'pop', loop: 'pulse'},
  {re: /bırak|yapma|dur/iu, asset: 'cross', enter: 'pop', loop: 'none'},
];

const splitScenes = (script: string): string[] => {
  const sentences = script.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/gu)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const scenes: string[] = [];
  for (const s of sentences) {
    const words = s.split(' ');
    for (let i = 0; i < words.length; i += MAX_WORDS) scenes.push(words.slice(i, i + MAX_WORDS).join(' '));
  }
  return scenes;
};

const el = (p: Partial<PlanElement> & Pick<PlanElement, 'type' | 'x' | 'y' | 'atWord'>): PlanElement => ({
  mood: null, gesture: null, gestureAtWord: null, asset: null, text: null, size: null, color: null, talking: null,
  scale: 1, exitWord: null, enter: 'pop', loop: 'none', ...p,
});

export const mockPlan = (script: string, format: Format, catalog: PackCatalog): StoryPlan => {
  const {w} = CANVAS[format];
  const vertical = format === 'vertical';
  const props = PROPS.filter((p) => p.asset in catalog.props);
  const known = BACKGROUNDS.filter((b) => b in catalog.backgrounds);
  const backgrounds = known.length > 0 ? known : Object.keys(catalog.backgrounds);
  const scenes = splitScenes(script).map((narration, i): PlanScene => {
    const words = narration.split(/\s+/);
    const left = i % 2 === 0;
    const background = backgrounds[i % backgrounds.length];
    const dark = catalog.darkBackgrounds.includes(background);
    const charX = vertical ? (left ? 300 : 780) : left ? 520 : 1400;
    const propX = vertical ? (left ? 780 : 300) : left ? 1300 : 560;
    const charY = vertical ? 860 : 520;
    const mood: NonNullable<PlanElement['mood']> = /\?|şaşır|boşal/iu.test(narration) ? 'surprised' : /yorgun|risk|sorun|kaybet|geç/iu.test(narration) ? 'sad' : 'happy';

    const elements: PlanElement[] = [
      el({
        type: 'character', x: charX, y: charY, scale: vertical ? 1.5 : 1.6, mood, talking: true,
        color: ['#ff8a5c', '#5c9bff', '#8a6cff'][i % 3], atWord: 0, enter: left ? 'slideLeft' : 'slideRight',
        gesture: GESTURES[i % GESTURES.length], gestureAtWord: Math.min(2, words.length - 1),
      }),
    ];
    // Up to two keyword props, swapped in place so the frame keeps changing.
    const hits = props.map((p) => ({p, at: words.findIndex((wd) => p.re.test(wd))})).filter((x) => x.at >= 0).sort((a, b) => a.at - b.at).slice(0, 2);
    hits.forEach(({p, at}, k) => {
      const next = hits[k + 1];
      elements.push(el({
        type: 'prop', asset: p.asset, x: propX, y: vertical ? 760 : 470, scale: 1.2,
        atWord: Math.max(at, 1), exitWord: next ? Math.max(next.at, 1) : null, enter: p.enter, loop: p.loop,
      }));
    });
    if (i === 0 || words.length >= 6) {
      const head = words.slice(0, 2).join(' ').replace(/[,.;:!?]+$/u, '').toLocaleUpperCase('tr-TR');
      elements.push(el({type: 'text', text: head, color: dark ? '#ffffff' : null, x: w / 2, y: vertical ? 380 : 220, atWord: 0, enter: 'fadeUp'}));
    }
    const punch = hits[0]?.at ?? Math.floor(words.length / 2);
    return {background, transition: TRANSITIONS[i % TRANSITIONS.length], narration, punchWords: [Math.max(punch, 0)], elements};
  });
  return {title: 'Mock plan', scenes};
};
