import React from 'react';
import {Composition} from 'remotion';
import {projects} from './projects.generated';
import {Story, totalFrames} from './engine/Story';
import {Deneme3D, DENEME_3D_SECONDS} from './experiments/deneme-3d/Deneme3D';
import {Kira3D, KIRA_3D_SECONDS} from './experiments/kira-3d/Kira3D';
import {KiraSahne, KIRA_SAHNE_SECONDS} from './experiments/kira-3d/KiraSahne';

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
    <Composition id="deneme-3d" component={Deneme3D} durationInFrames={Math.round(DENEME_3D_SECONDS * 30)} fps={30} width={1080} height={1920} />
    <Composition id="kira-3d" component={Kira3D} durationInFrames={Math.round(KIRA_3D_SECONDS * 30)} fps={30} width={1080} height={1920} />
    <Composition id="kira-sahne" component={KiraSahne} durationInFrames={Math.round(KIRA_SAHNE_SECONDS * 30)} fps={30} width={1080} height={1920} />
  </>
);
