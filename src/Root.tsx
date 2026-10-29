import React from 'react';
import {Composition} from 'remotion';
import storyJson from '../data/story.json';
import type {Story as StoryData} from './types';
import {Story, totalFrames} from './Story';

const story = storyJson as StoryData;

export const Root: React.FC = () => (
  <Composition
    id="Story"
    component={Story}
    durationInFrames={totalFrames(story)}
    fps={story.fps}
    width={story.width}
    height={story.height}
    defaultProps={{story}}
  />
);
