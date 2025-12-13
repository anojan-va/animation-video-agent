import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { MainComposition } from './MainComposition';
import * as renderData from '../props.json';

export const RemotionVideo = () => {
  // Calculate duration from scenes
  const fps = 30;
  const scenes = (renderData as any).scenes || [];
  const durationInSeconds = scenes.reduce((acc: number, scene: any) => acc + (scene.duration || 0), 0);
  // Default to 20s (600 frames) if no scenes or 0 duration
  const durationInFrames = Math.max(1, Math.ceil(durationInSeconds * fps)) || 600;

  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionVideo);