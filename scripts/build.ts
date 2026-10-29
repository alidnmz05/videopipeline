import fs from 'node:fs';
import type {Scene, SceneElement, Story} from '../src/types';
import {estimateWords} from './timing';
import {StoryPlanSchema, type StoryPlan} from './schema';
import {CANVAS, loadProject, parseCli, runCli, writeJson} from './lib/project';

// Step 2 of 3: plan.json -> story.json. Deterministic and free; rerun after editing a plan.

const SCENE_TAIL = 0.35; // silence after the last word; short keeps cuts snappy
const MAX_GAP = 1.5; // seconds without any on-screen change before we warn

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const toScene = (plan: StoryPlan['scenes'][number], i: number, W: number, H: number): Scene => {
  const {words, end} = estimateWords(plan.narration);
  if (words.length === 0) throw new Error(`Scene ${i + 1} has empty narration`);
  const wordIdx = (n: number) => clamp(Math.round(n), 0, words.length - 1);
  const wordAt = (n: number) => words[wordIdx(n)].start;

  const punchIdx = [...new Set(plan.punchWords.map(wordIdx))].sort((a, b) => a - b);
  for (const k of punchIdx) words[k].emph = true;

  const elements: SceneElement[] = plan.elements.map((e) => {
    const base = {
      x: clamp(e.x, 0, W),
      y: clamp(e.y, 0, H),
      scale: clamp(e.scale, 0.3, 3),
      at: wordAt(e.atWord),
      exitAt: e.exitWord !== null && e.exitWord > e.atWord ? wordAt(e.exitWord) : undefined,
      enter: e.enter,
      loop: e.loop,
    };
    if (e.type === 'character') {
      return {
        ...base,
        type: 'character',
        mood: e.mood ?? 'happy',
        talking: e.talking ?? false,
        color: e.color ?? undefined,
        gesture: e.gesture ?? undefined,
        gestureAt: e.gestureAtWord !== null ? wordAt(e.gestureAtWord) : undefined,
      };
    }
    if (e.type === 'prop') {
      if (!e.asset) throw new Error(`Scene ${i + 1}: prop without asset`);
      return {...base, type: 'prop', asset: e.asset};
    }
    return {...base, type: 'text', text: e.text ?? '', color: e.color ?? undefined, size: e.size ?? undefined};
  });

  return {
    id: `s${i + 1}`,
    duration: Math.round((end + SCENE_TAIL) * 100) / 100,
    background: plan.background,
    transition: plan.transition,
    punches: punchIdx.map((k) => words[k].start),
    elements,
    words,
  };
};

// Every on-screen change counts as an event: the scene's own entrance, element
// entrances and exits, gesture starts and camera punches.
const density = (s: Scene) => {
  const ev = [0, ...(s.punches ?? [])];
  for (const e of s.elements) {
    ev.push(e.at);
    if (e.exitAt !== undefined) ev.push(e.exitAt);
    if (e.type === 'character' && e.gestureAt !== undefined) ev.push(e.gestureAt);
  }
  const times = [...new Set(ev.map((x) => Math.round(x * 100) / 100))].sort((a, b) => a - b);
  times.push(s.duration);
  let gap = 0;
  for (let k = 1; k < times.length; k++) gap = Math.max(gap, times[k] - times[k - 1]);
  return {events: times.length - 1, gap};
};

runCli(() => {
  const {slug} = parseCli(process.argv.slice(2), 'npm run build -- <project>');
  const {paths, config} = loadProject(slug);
  if (!fs.existsSync(paths.plan)) throw new Error(`${paths.plan} not found. Create it with: npm run plan -- ${slug}`);
  const plan = StoryPlanSchema.parse(JSON.parse(fs.readFileSync(paths.plan, 'utf8')));
  const {w: W, h: H} = CANVAS[config.format];

  const story: Story = {fps: 30, width: W, height: H, scenes: plan.scenes.map((s, i) => toScene(s, i, W, H))};
  writeJson(paths.story, story);

  const total = story.scenes.reduce((a, s) => a + s.duration, 0);
  let events = 0;
  let worst = 0;
  for (const s of story.scenes) {
    const d = density(s);
    events += d.events;
    worst = Math.max(worst, d.gap);
    const flag = d.gap > MAX_GAP ? '  <- dead air' : '';
    console.log(`  ${s.id.padEnd(4)}${s.duration.toFixed(2)}s  ${String(d.events).padStart(2)} events  longest gap ${d.gap.toFixed(2)}s${flag}`);
  }
  console.log(`"${plan.title}": ${story.scenes.length} scenes, ${total.toFixed(1)}s, ${W}x${H}, ${(events / total).toFixed(2)} events/s, longest gap ${worst.toFixed(2)}s -> ${paths.story}. Next: npm run render -- ${slug}`);
});
