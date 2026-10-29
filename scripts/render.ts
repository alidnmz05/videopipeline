import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {writeProjectIndex} from './lib/project-index';
import {loadProject, parseCli, runCli} from './lib/project';

// Step 3 of 3: story.json -> video.mp4. Each project is its own Remotion composition.

runCli(() => {
  const {slug} = parseCli(process.argv.slice(2), 'npm run render -- <project>');
  const {paths} = loadProject(slug);
  if (!fs.existsSync(paths.story)) throw new Error(`${paths.story} not found. Create it with: npm run build -- ${slug}`);
  writeProjectIndex();
  execFileSync('npx', ['remotion', 'render', 'src/index.ts', slug, paths.video], {stdio: 'inherit'});
});
