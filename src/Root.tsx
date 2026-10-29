import React from 'react';
import {Composition} from 'remotion';
import {projects} from './projects.generated';
import {Story, totalFrames} from './engine/Story';

// One composition per project folder that has a story.json; the composition id is the project name.
export const Root: React.FC = () => (
  <>
    {projects.map(({id, story}) => (
      <Composition
        key={id}
        id={id}
        component={Story}
        durationInFrames={totalFrames(story)}
        fps={story.fps}
        width={story.width}
        height={story.height}
        defaultProps={{story}}
      />
    ))}
  </>
);
