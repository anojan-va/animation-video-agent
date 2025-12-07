import { Composition } from 'remotion';
import { Video } from './Video';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Video"
        component={Video}
        durationInFrames={3600}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoData: {
            project_settings: { fps: 30 },
            visual_track: [],
            text_track: [],
            audio_path: '/public/audio/sample voice.wav'
          }
        }}
      />
    </>
  );
};