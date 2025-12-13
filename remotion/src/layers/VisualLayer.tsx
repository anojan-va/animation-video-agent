import { AbsoluteFill, Sequence, useVideoConfig, useCurrentFrame, spring, Img, staticFile } from "remotion";
import { LAYOUTS } from "../config/Layouts";
import { ENTRANCES, IDLES } from "../config/Animations";
import { Scene, Element } from "../types";

// Helper Component for Physics
const AnimatedAsset = ({ src, style, anim, idleAnim, delayFrames }: {
  src: string;
  style: React.CSSProperties;
  anim: string;
  idleAnim: string;
  delayFrames: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Apply delay
  const delayedFrame = Math.max(0, frame - delayFrames);
  
  // Physics Spring
  const spr = spring({ frame: delayedFrame, fps, config: { damping: 12, stiffness: 150 } });
  
  // Math Transforms
  const getEnter = ENTRANCES[anim as keyof typeof ENTRANCES] || ENTRANCES.pop;
  const getIdle = IDLES[idleAnim as keyof typeof IDLES] || IDLES.breathe;

  return (
    <div style={{
      ...style,
      transform: `${style.transform || ''} ${getEnter(spr)} ${getIdle(frame)}`,
      transformOrigin: anim === "drop_down" ? "top center" : "bottom center",
      opacity: spr
    }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

interface VisualLayerProps {
  scenes: Scene[];
}

export const VisualLayer: React.FC<VisualLayerProps> = ({ scenes }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {scenes.map((scene: Scene, sceneIndex: number) => {
        const layout = LAYOUTS[scene.layout];
        
        // Skip if no valid layout
        if (!layout) {
          return null;
        }
        
        return (
          <Sequence key={scene.id} from={scene.start * fps} durationInFrames={scene.duration * fps}>
            {/* Render avatar if layout has avatar position */}
            {layout.avatar && scene.elements
              .filter(el => el.role === 'avatar')
              .map((element, i) => {
                const rawPath = element.local_path || "";
                const cleanPath = rawPath.replace(/^\//, '').replace(/^public\//, '');
                const finalSrc = staticFile(cleanPath);
                
                return (
                  <AnimatedAsset
                    key={`${element.id}-avatar`}
                    src={finalSrc}
                    style={{ ...layout.avatar }}
                    anim={element.anim_enter || "pop"}
                    idleAnim={element.anim_idle || "breathe"}
                    delayFrames={0}
                  />
                );
              })}
            
            {/* Render props if layout has prop position */}
            {layout.prop && scene.elements
              .filter((el: Element) => el.role === 'prop')
              .slice(0, 1) // First prop uses primary position
              .map((element: Element, i: number) => {
                const rawPath = element.local_path || "";
                const cleanPath = rawPath.replace(/^\//, '').replace(/^public\//, '');
                const finalSrc = staticFile(cleanPath);
                
                return (
                  <AnimatedAsset
                    key={`${element.id}-prop`}
                    src={finalSrc}
                    style={{ ...layout.prop }}
                    anim={element.anim_enter || "pop"}
                    idleAnim={element.anim_idle || "breathe"}
                    delayFrames={0}
                  />
                );
              })}
            
            {/* Render secondary props if layout has prop_secondary position */}
            {layout.prop_secondary && scene.elements
              .filter((el: Element) => el.role === 'prop')
              .slice(1, 2) // Second prop uses secondary position
              .map((element: Element, i: number) => {
                const rawPath = element.local_path || "";
                const cleanPath = rawPath.replace(/^\//, '').replace(/^public\//, '');
                const finalSrc = staticFile(cleanPath);
                
                return (
                  <AnimatedAsset
                    key={`${element.id}-prop-secondary`}
                    src={finalSrc}
                    style={{ ...layout.prop_secondary }}
                    anim={element.anim_enter || "pop"}
                    idleAnim={element.anim_idle || "breathe"}
                    delayFrames={0}
                  />
                );
              })}
            
            {/* Render tertiary props if layout has prop_tertiary position */}
            {layout.prop_tertiary && scene.elements
              .filter((el: Element) => el.role === 'prop')
              .slice(2, 3) // Third prop uses tertiary position
              .map((element: Element, i: number) => {
                const rawPath = element.local_path || "";
                const cleanPath = rawPath.replace(/^\//, '').replace(/^public\//, '');
                const finalSrc = staticFile(cleanPath);
                
                return (
                  <AnimatedAsset
                    key={`${element.id}-prop-tertiary`}
                    src={finalSrc}
                    style={{ ...layout.prop_tertiary }}
                    anim={element.anim_enter || "pop"}
                    idleAnim={element.anim_idle || "breathe"}
                    delayFrames={0}
                  />
                );
              })}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
