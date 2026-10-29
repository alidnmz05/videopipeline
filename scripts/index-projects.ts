import {writeProjectIndex} from './lib/project-index';
import {runCli} from './lib/project';

runCli(() => {
  const slugs = writeProjectIndex();
  console.log(`Indexed ${slugs.length} project(s): ${slugs.join(', ') || '(none with a story.json yet)'}`);
});
