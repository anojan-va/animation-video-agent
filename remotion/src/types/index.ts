export interface Element {
  type: "image";
  role: string;
  id: string;
  prompt: string;
  layout: string;
  anim_enter: string;
  anim_idle: string;
  local_path: string;
}

export interface Scene {
  id: string;
  start: number;
  duration: number;
  elements: Element[];
  layout: string;
}

export interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

export interface SubtitleLine {
  style: string;
  words: SubtitleWord[];
}

export interface Subtitle {
  id: string;
  mode: "composed_stack" | "vertical_list" | "word_by_word";
  container_end: number;
  layout_align?: "left" | "center" | "right";
  lines?: SubtitleLine[];
  items?: Array<{ text: string; start: number }>;
  words?: SubtitleWord[];
  style?: string;
}

export interface VideoData {
  project_settings?: { fps: number; width?: number; height?: number };
  scenes: Scene[];
  subtitles: Subtitle[];
  audio_path?: string;
}
