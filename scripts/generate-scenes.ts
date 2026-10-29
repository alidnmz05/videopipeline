import Anthropic from '@anthropic-ai/sdk';
import {zodOutputFormat} from '@anthropic-ai/sdk/helpers/zod';
import fs from 'node:fs';
import path from 'node:path';
import type {Scene, SceneElement, Story} from '../src/types';
import {estimateWords} from './timing';
import {StoryPlanSchema, type StoryPlan} from './schema';
import {CANVAS, systemPrompt, type Format} from './prompt';
import {mockPlan} from './mock-planner';

const MODEL = 'claude-opus-5-5';
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

const planWithClaude = async (script: string, format: Format): Promise<StoryPlan> => {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: systemPrompt(format),
    messages: [{role: 'user', content: `Script:\n\n${script}`}],
    output_config: {format: zodOutputFormat(StoryPlanSchema)},
  });

  if (response.stop_reason === 'refusal') throw new Error(`Model refused: ${response.stop_details?.category ?? 'unknown'}`);
  if (response.stop_reason === 'max_tokens') throw new Error('Output truncated at max_tokens; shorten the script or split it.');
  if (!response.parsed_output) throw new Error('Model output did not match the scene schema.');
  return response.parsed_output;
};

// The planner must keep narration verbatim; a drift means captions no longer match the script.
const warnIfNarrationDrifted = (script: string, plan: StoryPlan) => {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  if (norm(plan.scenes.map((s) => s.narration).join(' ')) !== norm(script)) {
    console.warn('Warning: scene narration does not match the script verbatim.');
  }
};

const parseArgs = (argv: string[]) => {
  const flags: {mock: boolean; plan?: string; format: Format} = {mock: false, format: 'vertical'};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mock') flags.mock = true;
    else if (a === '--plan') flags.plan = argv[++i];
    else if (a === '--format') {
      const f = argv[++i];
      if (f !== 'vertical' && f !== 'horizontal') throw new Error('--format must be vertical or horizontal');
      flags.format = f;
    } else positional.push(a);
  }
  if (argv.includes('--plan') && !flags.plan) throw new Error('--plan needs a file path');
  return {...flags, positional};
};

const main = async () => {
  const {mock, plan: planPath, format, positional} = parseArgs(process.argv.slice(2));
  const {w: W, h: H} = CANVAS[format];

  let plan: StoryPlan;
  let outPath: string;
  let source: string;
  if (planPath) {
    // A hand-written (or previously saved) plan: skips the planner, same validation and conversion.
    plan = StoryPlanSchema.parse(JSON.parse(fs.readFileSync(planPath, 'utf8')));
    outPath = positional[0] ?? 'data/story.json';
    source = 'plan file';
  } else {
    const scriptPath = positional[0] ?? 'data/script.txt';
    outPath = positional[1] ?? 'data/story.json';
    const script = fs.readFileSync(scriptPath, 'utf8').trim();
    if (!script) throw new Error(`${scriptPath} is empty`);
    plan = mock ? mockPlan(script, format) : await planWithClaude(script, format);
    source = mock ? 'mock' : MODEL;
    warnIfNarrationDrifted(script, plan);
  }

  const story: Story = {fps: 30, width: W, height: H, scenes: plan.scenes.map((s, i) => toScene(s, i, W, H))};
  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, JSON.stringify(story, null, 2) + '\n');

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
  console.log(`"${plan.title}": ${story.scenes.length} scenes, ${total.toFixed(1)}s, ${W}x${H}, ${(events / total).toFixed(2)} events/s, longest gap ${worst.toFixed(2)}s -> ${outPath} (${source})`);
};

main().catch((err) => {
  if (err instanceof Anthropic.AuthenticationError) console.error('Auth failed: set ANTHROPIC_API_KEY or run `ant auth login`.');
  else if (err instanceof Anthropic.RateLimitError) console.error('Rate limited; retry shortly.');
  else console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
