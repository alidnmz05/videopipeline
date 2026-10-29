import Anthropic from '@anthropic-ai/sdk';
import {zodOutputFormat} from '@anthropic-ai/sdk/helpers/zod';
import fs from 'node:fs';
import {planSchema, type StoryPlan} from './schema';
import {systemPrompt} from './prompt';
import {mockPlan} from './mock-planner';
import {loadProject, parseCli, runCli, writeJson, type Format} from './lib/project';
import type {PackCatalog} from '../src/engine/pack';

// Step 1 of 3: script.txt -> plan.json. This is the only step that calls the model (and costs money).

const MODEL = 'claude-opus-5-5';

const planWithClaude = async (script: string, format: Format, catalog: PackCatalog): Promise<StoryPlan> => {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: systemPrompt(format, catalog),
    messages: [{role: 'user', content: `Script:\n\n${script}`}],
    output_config: {format: zodOutputFormat(planSchema(catalog))},
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

runCli(async () => {
  const {slug, flags} = parseCli(process.argv.slice(2), 'npm run plan -- <project> [--mock] [--force]');
  const project = loadProject(slug);
  const {paths, config, catalog} = project;

  // Plans are often hand-tuned after generation; never discard one silently.
  if (fs.existsSync(paths.plan) && !flags.has('force')) {
    throw new Error(`${paths.plan} already exists. Rerun with --force to replace it, or edit it and run: npm run build -- ${slug}`);
  }
  const script = fs.existsSync(paths.script) ? fs.readFileSync(paths.script, 'utf8').trim() : '';
  if (!script) throw new Error(`${paths.script} is empty`);

  const mock = flags.has('mock');
  let plan: StoryPlan;
  try {
    plan = mock ? mockPlan(script, config.format, catalog) : await planWithClaude(script, config.format, catalog);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error('Auth failed: set ANTHROPIC_API_KEY or run `ant auth login`.');
    if (err instanceof Anthropic.RateLimitError) throw new Error('Rate limited; retry shortly.');
    throw err;
  }
  warnIfNarrationDrifted(script, plan);
  writeJson(paths.plan, plan);
  console.log(`"${plan.title}": ${plan.scenes.length} scenes -> ${paths.plan} (${mock ? 'mock' : MODEL}). Next: npm run build -- ${slug}`);
});
