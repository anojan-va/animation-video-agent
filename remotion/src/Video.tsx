import * as React from 'react';
import { AbsoluteFill, Audio, useVideoConfig } from 'remotion';
import { VisualLayer } from './layers/VisualLayer';
import { TextLayer } from './layers/TextLayer';
import { VideoConfig, validateVideoConfig } from './utils/jsonValidator';

interface VideoProps {
  videoData: {
    project_settings: { fps: number; width: number; height: number };
    scenes: Array<{
      id: string;
      start: number;
      duration: number;
      elements: Array<{
        type: string;
        role: string;
        id: string;
        prompt: string;
        layout: string;
        anim_enter: string;
        anim_idle: string;
        local_path?: string;
      }>;
    }>;
    subtitles: Array<{
      id: string;
      mode: string;
      container_end: number;
      layout_align?: string;
      style?: string;
      lines?: Array<{
        style: string;
        words: Array<{ text: string; start: number; end: number }>;
      }>;
      items?: Array<{ text: string; start: number }>;
    }>;
    audio_path: string;
  };
}

export const Video: React.FC<VideoProps> = ({ videoData }: VideoProps) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Visual Layer - Convert new format to old format for compatibility */}
      <VisualLayer scenes={videoData.scenes.map(scene => ({
        id: scene.id,
        start: scene.start,
        duration: scene.duration,
        layout: "default",
        assets: scene.elements.reduce((acc, element) => {
          if (element.type === 'image') {
            acc[element.role] = {
              id: element.id,
              prompt: element.prompt,
              local_path: element.local_path || '',
              enter: element.anim_enter,
              idle: element.anim_idle
            };
          }
          return acc;
        }, {} as any)
      }))} />

      {/* Text Layer */}
      <TextLayer subtitles={videoData.subtitles || []} />

      {/* Audio - properly encoded for spaces */}
      {videoData.audio_path && (
        <Audio src={videoData.audio_path.replace(/ /g, '%20')} />
      )}
    </AbsoluteFill>
  );
};
