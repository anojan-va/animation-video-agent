import React from 'react';
import { AbsoluteFill, Img, Sequence } from 'remotion';
import { LAYOUTS } from '../config/Layouts';

interface Asset {
  id: string;
  local_path: string;
}

interface Scene {
  id: string;
  layout: string;
  assets: Record<string, Asset>;
}

interface VisualLayerProps {
  visualTrack: Scene[];
  fps: number;
}

export const VisualLayer: React.FC<VisualLayerProps> = ({ visualTrack, fps }) => {
  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {visualTrack.map((scene, idx) => {
        const sceneDuration = 60; // 2 seconds at 30fps
        const sceneStart = currentFrame;
        currentFrame += sceneDuration;

        const layout = LAYOUTS[scene.layout] || LAYOUTS.default;

        return (
          <Sequence key={scene.id} from={sceneStart} durationInFrames={sceneDuration}>
            <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
              {/* Avatar */}
              {scene.assets.avatar && (
                <Img
                  src={scene.assets.avatar.local_path}
                  style={{
                    position: 'absolute',
                    ...layout.avatar,
                    objectFit: 'contain',
                  }}
                />
              )}

              {/* Prop */}
              {scene.assets.prop && (
                <Img
                  src={scene.assets.prop.local_path}
                  style={{
                    position: 'absolute',
                    ...layout.prop,
                    objectFit: 'contain',
                  }}
                />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
