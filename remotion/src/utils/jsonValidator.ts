// JSON Schema Validator for the new video generation format

export interface VideoConfig {
  project_settings: {
    fps: number;
    width: number;
    height: number;
  };
  scenes: Scene[];
  subtitles: SubtitleItem[];
  audio_path: string;
}

export interface Scene {
  id: string;
  start: number;
  duration: number;
  elements: SceneElement[];
}

export interface SceneElement {
  type: 'image' | 'text';
  role: 'avatar' | 'prop' | 'background';
  id: string;
  prompt: string;
  layout: string;
  anim_enter: string;
  anim_idle: string;
  local_path?: string;
}

export interface SubtitleItem {
  id: string;
  mode: 'composed_stack' | 'vertical_list';
  container_end: number;
  layout_align?: string;
  style?: string;
  lines?: SubtitleLine[];
  items?: SubtitleItem[];
}

export interface SubtitleLine {
  style: string;
  words: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export interface SubtitleItem {
  text: string;
  start: number;
}

export function validateVideoConfig(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required top-level fields
  if (!data.project_settings) {
    errors.push("Missing project_settings");
  } else {
    if (typeof data.project_settings.fps !== 'number') {
      errors.push("project_settings.fps must be a number");
    }
    if (typeof data.project_settings.width !== 'number') {
      errors.push("project_settings.width must be a number");
    }
    if (typeof data.project_settings.height !== 'number') {
      errors.push("project_settings.height must be a number");
    }
  }

  // Check scenes
  if (!Array.isArray(data.scenes)) {
    errors.push("scenes must be an array");
  } else {
    data.scenes.forEach((scene: any, index: number) => {
      if (!scene.id) errors.push(`scenes[${index}].id is required`);
      if (typeof scene.start !== 'number') errors.push(`scenes[${index}].start must be a number`);
      if (typeof scene.duration !== 'number') errors.push(`scenes[${index}].duration must be a number`);
      if (!Array.isArray(scene.elements)) errors.push(`scenes[${index}].elements must be an array`);
    });
  }

  // Check subtitles
  if (!Array.isArray(data.subtitles)) {
    errors.push("subtitles must be an array");
  } else {
    data.subtitles.forEach((subtitle: any, index: number) => {
      if (!subtitle.id) errors.push(`subtitles[${index}].id is required`);
      if (!['composed_stack', 'vertical_list'].includes(subtitle.mode)) {
        errors.push(`subtitles[${index}].mode must be 'composed_stack' or 'vertical_list'`);
      }
      if (typeof subtitle.container_end !== 'number') {
        errors.push(`subtitles[${index}].container_end must be a number`);
      }
    });
  }

  // Check audio_path
  if (typeof data.audio_path !== 'string') {
    errors.push("audio_path must be a string");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateAndParse(jsonString: string): { valid: boolean; data?: VideoConfig; errors: string[] } {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateVideoConfig(data);
    
    return {
      valid: validation.valid,
      data: validation.valid ? data as VideoConfig : undefined,
      errors: validation.errors
    };
  } catch (e) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`]
    };
  }
}
