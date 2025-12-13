# JSON Schema Validator for the new video generation format

def validate_new_schema(data):
    """Validate the new JSON schema for video generation"""
    errors = []
    
    # Check required top-level fields
    if not data.get('project_settings'):
        errors.append("Missing project_settings")
    else:
        settings = data['project_settings']
        if not isinstance(settings.get('fps'), (int, float)):
            errors.append("project_settings.fps must be a number")
        if not isinstance(settings.get('width'), (int, float)):
            errors.append("project_settings.width must be a number")
        if not isinstance(settings.get('height'), (int, float)):
            errors.append("project_settings.height must be a number")
    
    # Check scenes
    if not isinstance(data.get('scenes'), list):
        errors.append("scenes must be an array")
    else:
        for index, scene in enumerate(data['scenes']):
            if not scene.get('id'):
                errors.append(f"scenes[{index}].id is required")
            if not isinstance(scene.get('start'), (int, float)):
                errors.append(f"scenes[{index}].start must be a number")
            if not isinstance(scene.get('duration'), (int, float)):
                errors.append(f"scenes[{index}].duration must be a number")
            if not isinstance(scene.get('elements'), list):
                errors.append(f"scenes[{index}].elements must be an array")
            else:
                # Validate elements
                for elem_index, element in enumerate(scene['elements']):
                    if not element.get('type'):
                        errors.append(f"scenes[{index}].elements[{elem_index}].type is required")
                    if not element.get('role'):
                        errors.append(f"scenes[{index}].elements[{elem_index}].role is required")
                    if not element.get('id'):
                        errors.append(f"scenes[{index}].elements[{elem_index}].id is required")
                    if not element.get('prompt'):
                        errors.append(f"scenes[{index}].elements[{elem_index}].prompt is required")
                    if not element.get('layout'):
                        errors.append(f"scenes[{index}].elements[{elem_index}].layout is required")
                    if not element.get('anim_enter'):
                        errors.append(f"scenes[{index}].elements[{elem_index}].anim_enter is required")
                    if not element.get('anim_idle'):
                        errors.append(f"scenes[{index}].elements[{elem_index}].anim_idle is required")
    
    # Check subtitles
    if not isinstance(data.get('subtitles'), list):
        errors.append("subtitles must be an array")
    else:
        for index, subtitle in enumerate(data['subtitles']):
            if not subtitle.get('id'):
                errors.append(f"subtitles[{index}].id is required")
            if subtitle.get('mode') not in ['composed_stack', 'vertical_list']:
                errors.append(f"subtitles[{index}].mode must be 'composed_stack' or 'vertical_list'")
            if not isinstance(subtitle.get('container_end'), (int, float)):
                errors.append(f"subtitles[{index}].container_end must be a number")
            
            # Validate composed_stack
            if subtitle.get('mode') == 'composed_stack':
                if not isinstance(subtitle.get('lines'), list):
                    errors.append(f"subtitles[{index}].lines must be an array for composed_stack mode")
                else:
                    for line_index, line in enumerate(subtitle['lines']):
                        if not line.get('style'):
                            errors.append(f"subtitles[{index}].lines[{line_index}].style is required")
                        if not isinstance(line.get('words'), list):
                            errors.append(f"subtitles[{index}].lines[{line_index}].words must be an array")
                        else:
                            for word_index, word in enumerate(line['words']):
                                if not word.get('text'):
                                    errors.append(f"subtitles[{index}].lines[{line_index}].words[{word_index}].text is required")
                                if not isinstance(word.get('start'), (int, float)):
                                    errors.append(f"subtitles[{index}].lines[{line_index}].words[{word_index}].start must be a number")
                                if not isinstance(word.get('end'), (int, float)):
                                    errors.append(f"subtitles[{index}].lines[{line_index}].words[{word_index}].end must be a number")
            
            # Validate vertical_list
            elif subtitle.get('mode') == 'vertical_list':
                if not isinstance(subtitle.get('items'), list):
                    errors.append(f"subtitles[{index}].items must be an array for vertical_list mode")
                else:
                    for item_index, item in enumerate(subtitle['items']):
                        if not item.get('text'):
                            errors.append(f"subtitles[{index}].items[{item_index}].text is required")
                        if not isinstance(item.get('start'), (int, float)):
                            errors.append(f"subtitles[{index}].items[{item_index}].start must be a number")
    
    # Check audio_path
    if not isinstance(data.get('audio_path'), str):
        errors.append("audio_path must be a string")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }
