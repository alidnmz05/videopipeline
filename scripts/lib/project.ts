import fs from 'node:fs';
import path from 'node:path';

export type Format = 'vertical' | 'horizontal';

export const CANVAS: Record<Format, {w: number; h: number}> = {
  vertical: {w: 1080, h: 1920},
  horizontal: {w: 1920, h: 1080},
};

export const PROJECTS_DIR = 'projects';

// Slugs double as Remotion composition ids, which only allow [a-zA-Z0-9-].
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export type ProjectConfig = {format: Format; pack: string};

export type Project = {
  slug: string;
  dir: string;
  config: ProjectConfig;
  paths: {config: string; script: string; plan: string; story: string; video: string};
};

export const projectPaths = (slug: string) => {
  const dir = path.join(PROJECTS_DIR, slug);
  return {
    dir,
    paths: {
      config: path.join(dir, 'project.json'),
      script: path.join(dir, 'script.txt'),
      plan: path.join(dir, 'plan.json'),
      story: path.join(dir, 'story.json'),
      video: path.join(dir, 'video.mp4'),
    },
  };
};

export const assertSlug = (slug: string) => {
  if (!SLUG.test(slug)) throw new Error(`Invalid project name "${slug}": use lowercase letters, digits and dashes (e.g. yapay-zeka).`);
};

export const loadProject = (slug: string): Project => {
  assertSlug(slug);
  const {dir, paths} = projectPaths(slug);
  if (!fs.existsSync(paths.config)) throw new Error(`No project "${slug}" (missing ${paths.config}). Create it with: npm run new -- ${slug}`);
  const raw = JSON.parse(fs.readFileSync(paths.config, 'utf8'));
  if (raw.format !== 'vertical' && raw.format !== 'horizontal') throw new Error(`${paths.config}: format must be "vertical" or "horizontal"`);
  if (typeof raw.pack !== 'string' || !raw.pack) throw new Error(`${paths.config}: pack is required`);
  return {slug, dir, config: {format: raw.format, pack: raw.pack}, paths};
};

// Splits CLI args into the project slug (first positional) and flags.
export const parseCli = (argv: string[], usage: string) => {
  const flags = new Set<string>();
  const options: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--') && ['--format', '--pack'].includes(a)) {
        options[a.slice(2)] = next;
        i++;
      } else flags.add(a.slice(2));
    } else positional.push(a);
  }
  const slug = positional[0];
  if (!slug) throw new Error(`Usage: ${usage}`);
  return {slug, flags, options};
};

export const writeJson = (file: string, data: unknown) => {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};

// Shared error reporter for the CLI entry points.
export const runCli = (main: () => Promise<void> | void) => {
  Promise.resolve()
    .then(main)
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
};
