import { VideoData } from '../types';
import { LAYOUTS } from '../config/Layouts';

// List of all available layout names
const AVAILABLE_LAYOUTS = Object.keys(LAYOUTS);

export interface ValidationError {
  type: 'INVALID_LAYOUT';
  sceneId: string;
  layoutName: string;
  message: string;
}

/**
 * Validates that all scenes use only available layouts
 * @param data - Video data to validate
 * @returns Array of validation errors
 */
export function validateLayouts(data: VideoData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.scenes || !Array.isArray(data.scenes)) {
    return [{
      type: 'INVALID_LAYOUT',
      sceneId: 'unknown',
      layoutName: 'unknown',
      message: 'No scenes found in data'
    }];
  }

  // Check each scene's layout
  data.scenes.forEach((scene, index) => {
    if (!scene.layout) {
      errors.push({
        type: 'INVALID_LAYOUT',
        sceneId: scene.id || `scene_${index}`,
        layoutName: 'undefined',
        message: `Scene "${scene.id || `scene_${index}`}" has no layout specified`
      });
      return;
    }

    if (!AVAILABLE_LAYOUTS.includes(scene.layout)) {
      errors.push({
        type: 'INVALID_LAYOUT',
        sceneId: scene.id || `scene_${index}`,
        layoutName: scene.layout,
        message: `Scene "${scene.id || `scene_${index}`}" uses invalid layout "${scene.layout}". Available layouts: ${AVAILABLE_LAYOUTS.join(', ')}`
      });
    }
  });

  return errors;
}

/**
 * Gets a formatted error message for display
 * @param errors - Array of validation errors
 * @returns Formatted error string
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  const errorMessages = errors.map(error => error.message);
  return `Layout Validation Errors:\n${errorMessages.join('\n')}`;
}

/**
 * Validates layouts and throws an error if any issues found
 * @param data - Video data to validate
 * @throws Error with formatted message if validation fails
 */
export function validateLayoutsOrThrow(data: VideoData): void {
  const errors = validateLayouts(data);
  
  if (errors.length > 0) {
    throw new Error(formatValidationErrors(errors));
  }
}

/**
 * Get list of available layouts for user reference
 * @returns Array of available layout names with descriptions
 */
export function getAvailableLayouts(): Array<{name: string; description: string}> {
  return [
    { name: 'avatar_full_center', description: 'Avatar center full screen - no text/props' },
    { name: 'prop_full_center', description: 'Prop center full screen - no text/avatar' },
    { name: 'text_full_center', description: 'Text center with 15% margins - no avatar/props' },
    { name: 'avatar_right_text_left', description: 'Avatar 30% right, text 65% left with 5% margin' },
    { name: 'prop_right_text_left', description: 'Prop 30% right, text 65% left with 5% margin' },
    { name: 'avatar_left_text_right', description: 'Avatar 30% left, text 65% right with 5% margin' },
    { name: 'prop_left_text_right', description: 'Prop 30% left, text 65% right with 5% margin' },
    { name: 'avatar_middle_text_sides', description: 'Avatar 30% center, text on sides' },
    { name: 'text_top_avatar_bottom', description: 'Text 35% top, avatar 55% bottom with 5% margin' },
    { name: 'text_top_prop_bottom', description: 'Text 35% top, prop 55% bottom with 5% margin' },
    { name: 'avatar_center_props_sides', description: 'Avatar 40% center, props on sides with 5% margins' },
    { name: 'props_triple_row', description: 'Three props left, center, right with 5% margins' },
    { name: 'avatar_right_prop_left', description: 'Avatar 50% right, prop 40% left with 10% margin' },
    { name: 'avatar_left_prop_right', description: 'Avatar 50% left, prop 40% right with 10% margin' }
  ];
}
