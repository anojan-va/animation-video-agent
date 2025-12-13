import { Composition } from 'remotion';
import { Video, VideoProps } from './Video';
import * as renderData from '../props.json';

export const RemotionRoot: React.FC = () => {
  // Calculate duration from scenes
  const fps = 30;
  const scenes = (renderData as any).scenes || [];
  const durationInSeconds = scenes.reduce((acc: number, scene: any) => acc + (scene.duration || 0), 0);
  // Default to 18s (540 frames) if no scenes or 0 duration
  const durationInFrames = Math.max(1, Math.ceil(durationInSeconds * fps)) || 540;

  return (
    <>
      <Composition
        id="Video"
        component={Video}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{
          videoData: renderData as any
        }}
      />
    </>
  );
};