import React from 'react';
import { AbsoluteFill, Audio, useVideoConfig } from 'remotion';
import { VisualLayer } from './layers/VisualLayer';
import { TextLayer } from './layers/TextLayer';

interface VideoProps {
  videoData: {
    project_settings: { fps: number };
    visual_track: Array<{
      id: string;
      layout: string;
      assets: Record<string, { id: string; local_path: string }>;
    }>;
    text_track: Array<{
      text: string;
      start: number;
      end: number;
      style: string;
    }>;
    audio_path: string;
  };
}

export const Video: React.FC<VideoProps> = ({ videoData }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Visual Layer */}
      <VisualLayer visualTrack={videoData.visual_track} fps={fps} />

      {/* Text Layer */}
      <TextLayer textTrack={videoData.text_track} fps={fps} />

      {/* Audio */}
      {videoData.audio_path && (
        <Audio src={videoData.audio_path} />
      )}
    </AbsoluteFill>
  );
};
