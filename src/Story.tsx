import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import type {Story as StoryData} from './types';
import {SceneView} from './components/SceneView';

export const Story: React.FC<{story: StoryData}> = ({story}) => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Series>
      {story.scenes.map((s) => (
        <Series.Sequence key={s.id} durationInFrames={Math.round(s.duration * story.fps)}>
          <SceneView scene={s} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

export const totalFrames = (story: StoryData) =>
  story.scenes.reduce((a, s) => a + Math.round(s.duration * story.fps), 0);
