import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { TEXT_STYLES } from "../config/TextStyles";
import { LAYOUTS } from "../config/Layouts";
import { Subtitle, Scene, Element } from "../types";

interface TextLayerProps {
  subtitles: Subtitle[];
  scenes: Scene[];
}

export const TextLayer: React.FC<TextLayerProps> = ({ subtitles, scenes }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Guard against undefined subtitles
  if (!subtitles || !Array.isArray(subtitles)) {
    return null;
  }

  return (
    <AbsoluteFill>
      {subtitles.map((subtitle: Subtitle, index) => {
        // Find which Visual Scene is active for this subtitle
        const currentScene = scenes.find(
          (s) => subtitle.lines?.[0]?.words?.[0] && 
                 subtitle.lines[0].words[0].start >= s.start && 
                 subtitle.lines[0].words[0].start < (s.start + s.duration)
        );

        // Get the layout for that scene
        const layoutName = currentScene?.layout;
        
        // Skip if no valid layout name
        if (!layoutName) {
          return null;
        }
        
        const layoutRules = LAYOUTS[layoutName];
        const textZoneStyle = layoutRules?.textZone;

        // Calculate timing
        const firstWordStart = subtitle.lines?.[0]?.words?.[0]?.start || 0;
        const startFrame = firstWordStart * fps;
        const durationFrames = (subtitle.container_end - firstWordStart) * fps;

        // Animation
        const spr = spring({
          frame: frame - startFrame,
          fps,
          config: { stiffness: 200, damping: 10 }
        });

        // Style logic
        const isTextOnly = layoutName === "text_full_center";
        const baseSize = isTextOnly ? 150 : 80;

        // Skip if no valid layout or text zone is hidden
        if (!layoutRules || !textZoneStyle || textZoneStyle.display === "none") {
          return null;
        }

        return (
          <Sequence 
            key={subtitle.id} 
            from={startFrame} 
            durationInFrames={durationFrames}
          >
            <div style={textZoneStyle}>
              {subtitle.lines?.map((line, lineIndex) => (
                <div key={lineIndex} style={{ marginBottom: isTextOnly ? 20 : 10 }}>
                  {line.words.map((word, wordIndex) => {
                    const isHighlight = line.style.includes("highlight");
                    let color = "#333";
                    if (line.style === "highlight_red") color = "#d92323";
                    if (line.style === "highlight_green") color = "#23d923";
                    if (line.style === "highlight_yellow") color = "#d9d923";
                    
                    return (
                      <span
                        key={wordIndex}
                        style={{
                          fontFamily: 'Arial Black, sans-serif',
                          fontSize: isHighlight ? baseSize + 20 : baseSize,
                          color: color,
                          textTransform: 'uppercase',
                          textShadow: '4px 4px 0px white',
                          transform: `scale(${spr})`,
                          margin: '0 5px',
                          display: 'inline-block',
                          lineHeight: 1.1
                        }}
                      >
                        {word.text}
                      </span>
                    );
                  })}
                </div>
              ))}
              
              {/* Handle word_by_word mode */}
              {subtitle.mode === "word_by_word" && subtitle.words?.map((word, wordIndex) => {
                const isHighlight = subtitle.style?.includes("highlight");
                let color = "#333";
                if (subtitle.style === "highlight_red") color = "#d92323";
                if (subtitle.style === "highlight_green") color = "#23d923";
                if (subtitle.style === "highlight_yellow") color = "#d9d923";
                
                // Calculate individual word timing
                const wordStartFrame = word.start * fps;
                const wordDurationFrames = (word.end - word.start) * fps;
                
                // Individual animation for each word
                const wordSpr = spring({
                  frame: frame - wordStartFrame,
                  fps,
                  config: { stiffness: 200, damping: 10 }
                });
                
                return (
                  <Sequence 
                    key={wordIndex}
                    from={wordStartFrame}
                    durationInFrames={wordDurationFrames}
                  >
                    <div
                      style={{
                        fontFamily: 'Arial Black, sans-serif',
                        fontSize: isHighlight ? baseSize + 20 : baseSize,
                        color: color,
                        textTransform: 'uppercase',
                        textShadow: '4px 4px 0px white',
                        transform: `scale(${wordSpr})`,
                        margin: '10px',
                        lineHeight: 1.1
                      }}
                    >
                      {word.text}
                    </div>
                  </Sequence>
                );
              })}
              
              {/* Handle items for vertical_list mode */}
              {subtitle.mode === "vertical_list" && subtitle.items?.map((item, itemIndex) => {
                const isHighlight = subtitle.style?.includes("highlight");
                let color = "#333";
                if (subtitle.style === "highlight_red") color = "#d92323";
                if (subtitle.style === "highlight_green") color = "#23d923";
                if (subtitle.style === "highlight_yellow") color = "#d9d923";
                
                // Calculate individual item timing
                const itemStartFrame = item.start * fps;
                const itemDurationFrames = (subtitle.container_end - item.start) * fps;
                
                // Individual animation for each item
                const itemSpr = spring({
                  frame: frame - itemStartFrame,
                  fps,
                  config: { stiffness: 200, damping: 10 }
                });
                
                return (
                  <Sequence 
                    key={itemIndex}
                    from={itemStartFrame}
                    durationInFrames={itemDurationFrames}
                  >
                    <div
                      style={{
                        fontFamily: 'Arial Black, sans-serif',
                        fontSize: isHighlight ? baseSize + 20 : baseSize,
                        color: color,
                        textTransform: 'uppercase',
                        textShadow: '4px 4px 0px white',
                        transform: `scale(${itemSpr})`,
                        margin: '10px 0',
                        lineHeight: 1.1
                      }}
                    >
                      {item.text}
                    </div>
                  </Sequence>
                );
              })}
            </div>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
