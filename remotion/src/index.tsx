import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { MainComposition } from './MainComposition';

export const RemotionVideo = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={600} // 20 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionVideo);