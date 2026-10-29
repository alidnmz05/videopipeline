import fs from 'node:fs';
import {assertSlug, parseCli, projectPaths, runCli, writeJson, type Format} from './lib/project';

runCli(() => {
  const {slug, options} = parseCli(process.argv.slice(2), 'npm run new -- <name> [--format vertical|horizontal] [--pack flat-basic]');
  assertSlug(slug);
  const format = (options.format ?? 'vertical') as Format;
  if (format !== 'vertical' && format !== 'horizontal') throw new Error('--format must be vertical or horizontal');
  const {dir, paths} = projectPaths(slug);
  if (fs.existsSync(dir)) throw new Error(`${dir} already exists`);

  writeJson(paths.config, {format, pack: options.pack ?? 'flat-basic'});
  fs.writeFileSync(paths.script, '');
  console.log(`Created ${dir}. Write the narration into ${paths.script}, then: npm run plan -- ${slug}`);
});
