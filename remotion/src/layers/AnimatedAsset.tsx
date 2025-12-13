import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ENTRANCES, IDLES } from "../config/Animations";

interface AnimatedAssetProps {
  src: string;
  style: React.CSSProperties;
  delayFrames?: number;
  anim?: string;
  idleAnim?: string;
}

export const AnimatedAsset = ({ src, style, delayFrames = 0, anim = "pop", idleAnim = "breathe" }: AnimatedAssetProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. PHYSICS SPRING - Only animate if frame is past delay
  const adjustedFrame = Math.max(0, frame - delayFrames);
  const spr = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 12, stiffness: 150 } // Snappy
  });

  // 2. GET STYLES - Validate animation exists
  const entryFunc = ENTRANCES[anim as keyof typeof ENTRANCES] || ENTRANCES.pop;
  const idleFunc = IDLES[idleAnim as keyof typeof IDLES] || IDLES.breathe;

  const entryStyle = entryFunc(spr);
  const idleStyle = idleFunc(frame);

  // 3. RENDER - Only show if animation has started
  const isVisible = frame >= delayFrames;
  
  if (!isVisible) {
    return null;
  }
  return (
    <div style={{
      ...style,
      // Combine transforms. Note transformOrigin "bottom" for grounded feel.
      transform: `${style.transform || ""} ${entryStyle.transform} ${idleStyle.transform}`,
      transformOrigin: "bottom center",
      opacity: spr
    }}>
      <img 
        src={src} 
        style={{ width: "100%", height: "100%", objectFit: "contain" }} 
        alt={anim}
        onError={(e) => console.error(`Failed to load image: ${src}`, e)}
      />
    </div>
  );
};
