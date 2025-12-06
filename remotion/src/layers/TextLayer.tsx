import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { MOTION_PRESETS } from '../config/MotionPresets';

interface TextTrackItem {
  text: string;
  start: number;
  end: number;
  style: string;
}

interface TextLayerProps {
  textTrack: TextTrackItem[];
  fps: number;
}

const TextWord: React.FC<{
  text: string;
  startFrame: number;
  endFrame: number;
  style: string;
}> = ({ text, startFrame, endFrame, style }) => {
  const frame = useCurrentFrame();
  const isVisible = frame >= startFrame && frame <= endFrame;

  if (!isVisible) return null;

  const progress = (frame - startFrame) / (endFrame - startFrame);
  const preset = MOTION_PRESETS[style] || MOTION_PRESETS.default;

  const transform = preset.getTransform(progress);
  const opacity = preset.getOpacity(progress);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100px',
        left: '50%',
        transform: `translateX(-50%) ${transform}`,
        opacity,
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#ffffff',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

export const TextLayer: React.FC<TextLayerProps> = ({ textTrack, fps }) => {
  return (
    <AbsoluteFill>
      {textTrack.map((item, idx) => {
        const startFrame = Math.floor(item.start * fps);
        const endFrame = Math.floor(item.end * fps);

        return (
          <Sequence
            key={idx}
            from={startFrame}
            durationInFrames={endFrame - startFrame}
          >
            <TextWord
              text={item.text}
              startFrame={startFrame}
              endFrame={endFrame}
              style={item.style}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
