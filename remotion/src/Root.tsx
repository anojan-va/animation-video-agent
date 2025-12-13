import { Composition } from 'remotion';
import { Video, VideoProps } from './Video';
import * as renderData from '../props.json';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Video"
        component={Video}
        durationInFrames={540} // Will be overridden by --frames flag
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoData: renderData
        }}
      />
    </>
  );
};