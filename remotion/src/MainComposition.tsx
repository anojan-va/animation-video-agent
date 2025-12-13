import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile } from "remotion";
import { VisualLayer } from "./layers/VisualLayer";
import { TextLayer } from "./layers/TextLayer";
import videoData from "../props.json";
import { VideoData } from "./types";
import { validateLayoutsOrThrow } from "./validation/LayoutValidator";

export const MainComposition = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Validate data structure - only support new schema
  const data = videoData as VideoData;
  
  // Validate layouts against available options
  try {
    validateLayoutsOrThrow(data);
  } catch (error) {
    console.error('LAYOUT VALIDATION ERROR:', error);
    // Return error display instead of crashing
    return (
      <AbsoluteFill style={{ 
        backgroundColor: "#ff4444", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "40px"
      }}>
        <div style={{ 
          color: "white", 
          fontFamily: "Arial, sans-serif",
          fontSize: "24px",
          textAlign: "center",
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: "20px",
          borderRadius: "10px"
        }}>
          <h2>Layout Validation Error</h2>
          <p>{error instanceof Error ? error.message : 'Invalid layout found in props.json'}</p>
          <p style={{ fontSize: "16px", marginTop: "20px" }}>
            Please check your props.json file and use only the available layouts.
          </p>
        </div>
      </AbsoluteFill>
    );
  }
  
  if (!data || !data.scenes || !data.subtitles) {
    console.error('Invalid props.json structure. Expected new schema with scenes and subtitles.');
    return (
      <AbsoluteFill style={{ backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 24, color: "#333", textAlign: "center" }}>
          Error: Invalid configuration file<br />
          Expected new JSON schema with 'scenes' and 'subtitles'<br />
          Please upload a valid JSON file
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#f0f0f0" }}>
      {/* Visual Assets Layer */}
      <VisualLayer scenes={data.scenes} />
      
      {/* Text/Kinetic Typography Layer */}
      <TextLayer subtitles={data.subtitles} scenes={data.scenes} />
      
      {/* Audio Layer */}
      {data.audio_path && (
        <Audio src={staticFile(data.audio_path)} />
      )}
    </AbsoluteFill>
  );
};
